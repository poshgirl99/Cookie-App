"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

type Profile = { id: string; username: string; display_name: string; profile_colour: string };
type FriendRequest = { id: string; requester_id: string; recipient_id: string; status: string; requester?: Profile };
type AuthMode = "signin" | "signup";
type AppView = "chats" | "friends" | "crumbs" | "stories" | "profile";

const interests = ["Music", "Comedy", "Fashion", "Food", "Gaming", "Sports", "Art", "Travel", "Books", "Dance", "Tech", "Faith"];
const colours = ["#e76f51", "#8b5cf6", "#2a9d8f", "#e9a23b", "#e84a8a", "#457b9d"];
const flavours = [
  ["🍫", "Choc Chip", "Warm & easy-going"],
  ["🌈", "Funfetti", "Loud & playful"],
  ["🍯", "Caramel", "Sweet & thoughtful"],
  ["🌶️", "Ginger Snap", "Bold & spontaneous"],
];

function CookieLogo({ small = false }: { small?: boolean }) {
  return <span className={`cookie-logo ${small ? "small" : ""}`}><img src="/cookie-logo-deeper-bite.png" alt="Cookie" width={180} height={180} /></span>;
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [signupStep, setSignupStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [flavour, setFlavour] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [colour, setColour] = useState(colours[0]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<AppView>("chats");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const searchSequence = useRef(0);

  const loadAccount = useCallback(async (account: User | null) => {
    setUser(account);
    if (!account) { setProfile(null); setRequests([]); setFriends([]); return; }
    const { data } = await supabase.from("profiles").select("id,username,display_name,profile_colour").eq("id", account.id).maybeSingle();
    let currentProfile = data as Profile | null;
    if (!currentProfile) {
      const emailName = account.email?.split("@")[0] || "cookie";
      const base = String(account.user_metadata?.username || emailName).toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 18) || "cookie";
      const fallback = {
        id: account.id,
        username: `${base}_${account.id.slice(0, 6)}`,
        display_name: String(account.user_metadata?.display_name || emailName),
        profile_colour: colours[0],
      };
      const { data: created } = await supabase.from("profiles").upsert(fallback).select("id,username,display_name,profile_colour").single();
      currentProfile = (created as Profile | null) ?? fallback;
    }
    setProfile(currentProfile);

    const { data: incoming } = await supabase
      .from("friend_requests")
      .select("id,requester_id,recipient_id,status,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour)")
      .eq("recipient_id", account.id).eq("status", "pending");
    setRequests((incoming ?? []).map((item: Record<string, unknown>) => ({ ...item, requester: Array.isArray(item.requester) ? item.requester[0] : item.requester })) as FriendRequest[]);

    const { data: accepted } = await supabase
      .from("friend_requests")
      .select("requester_id,recipient_id,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour),recipient:profiles!friend_requests_recipient_id_fkey(id,username,display_name,profile_colour)")
      .eq("status", "accepted").or(`requester_id.eq.${account.id},recipient_id.eq.${account.id}`);
    const list = (accepted ?? []).map((row: Record<string, unknown>) => {
      const value = row.requester_id === account.id ? row.recipient : row.requester;
      return (Array.isArray(value) ? value[0] : value) as Profile;
    }).filter(Boolean);
    setFriends(list);
  }, [supabase]);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowSplash(false), 5000);
    supabase.auth.getUser().then(({ data }) => loadAccount(data.user)).catch(() => loadAccount(null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => loadAccount(session?.user ?? null));
    return () => { window.clearTimeout(splashTimer); listener.subscription.unsubscribe(); };
  }, [loadAccount, supabase]);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); setNotice(error ? error.message : "Welcome back! 🍪");
  }

  async function createAccount() {
    setBusy(true); setNotice("");
    const clean = username.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._]/g, "");
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", clean).maybeSingle();
    if (taken) { setBusy(false); setSignupStep(1); setNotice("That username has already been taken. Try another crumb!"); return; }
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: clean, display_name: displayName, flavour, interests: selectedInterests, profile_colour: colour } },
    });
    setBusy(false);
    setNotice(error ? error.message : "Account created! Check your email to confirm it, then sign in. 🍪");
    if (!error) { setAuthMode("signin"); setSignupStep(0); }
  }

  async function googleSignIn() {
    setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) setNotice(error.message);
  }

  async function searchPeople(value: string) {
    setSearch(value);
    const sequence = ++searchSequence.current;
    const term = value.trim().toLowerCase().replace(/^@/, "");
    if (!term || !user) { setResults([]); setNotice(""); return; }
    const { data, error } = await supabase.from("profiles").select("id,username,display_name,profile_colour").ilike("username", `${term}%`).limit(20);
    if (sequence !== searchSequence.current) return;
    if (error) { setResults([]); setNotice(`Search failed: ${error.message}`); return; }
    const matches = (data ?? []).filter(person => person.id !== user.id);
    setResults(matches);
    setNotice(matches.length ? "" : `No Cookie user found for @${term}.`);
  }

  async function addFriend(person: Profile) {
    if (!user) return;
    setNotice("");
    const { error } = await supabase.from("friend_requests").insert({ requester_id: user.id, recipient_id: person.id });
    setNotice(error ? (error.code === "23505" ? "A friend request already exists between you." : error.message) : `Friend request sent to @${person.username}!`);
  }

  async function answerRequest(request: FriendRequest, status: "accepted" | "declined" | "blocked") {
    const { error } = await supabase.from("friend_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", request.id);
    if (error) { setNotice(error.message); return; }
    setRequests(current => current.filter(item => item.id !== request.id));
    if (status === "accepted" && request.requester) setFriends(current => [...current, request.requester!]);
  }

  if (showSplash) return <main className="splash"><div className="splash-bite"><CookieLogo /></div><h1>Cookie</h1><p>Baking your space…</p><div className="progress"><i /></div><div className="falling-crumbs"><i /><i /><i /></div></main>;

  if (!user) return <main className="auth-shell">
    <section className="auth-art"><div className="crumb c1"/><div className="crumb c2"/><CookieLogo /><p className="kicker">Your people. Your moments.</p><h1>Welcome to Cookie</h1><p>A warmer way to chat, share and stay close.</p></section>
    <section className="auth-panel">
      <div className="mobile-brand"><CookieLogo small /><b>Cookie</b></div>
      {authMode === "signin" ? <form className="auth-card" onSubmit={signIn}>
        <p className="kicker">Follow the crumb trail</p><h2>Sign in</h2><p>Welcome back. Your Cookie circle is waiting.</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your secret recipe" minLength={8} required /></label>
        <button className="primary" disabled={busy}>{busy ? "Opening Cookie…" : "Sign in →"}</button>
        <div className="or"><span/>or<span/></div><button type="button" className="google" onClick={googleSignIn}><b>G</b> Continue with Google</button>
        {notice && <p className="notice">{notice}</p>}
        <p className="switch">New to Cookie? <button type="button" onClick={() => { setAuthMode("signup"); setNotice(""); }}>Create your account</button></p>
      </form> : <div className="poll-card" key={signupStep}>
        <div className="poll-top"><button onClick={() => signupStep ? setSignupStep(signupStep - 1) : setAuthMode("signin")}>←</button><span>{signupStep + 1} of 5</span></div>
        <div className="poll-progress">{[0,1,2,3,4].map(i => <i key={i} className={i <= signupStep ? "done" : ""}/>)}</div>
        {signupStep === 0 && <><span className="poll-emoji">🔐</span><p className="kicker">Create your secret recipe</p><h2>How will you sign in?</h2><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Cookie password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label></>}
        {signupStep === 1 && <><span className="poll-emoji">👋🏾</span><p className="kicker">Your first crumb</p><h2>What should we call you?</h2><label>Your name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="e.g. Xanthe"/></label><label>Unique username<div className="username"><span>@</span><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname"/></div></label></>}
        {signupStep === 2 && <><span className="poll-emoji">🍪</span><p className="kicker">Pick your flavour</p><h2>What’s your social energy?</h2><div className="choices">{flavours.map(([emoji,title,copy])=><button key={title} className={flavour===title?"selected":""} onClick={()=>setFlavour(title)}><span>{emoji}</span><b>{title}</b><small>{copy}</small></button>)}</div></>}
        {signupStep === 3 && <><span className="poll-emoji">✨</span><p className="kicker">Your feed, your vibe</p><h2>What are you into?</h2><div className="interest-list">{interests.map(item=><button key={item} className={selectedInterests.includes(item)?"selected":""} onClick={()=>setSelectedInterests(current=>current.includes(item)?current.filter(x=>x!==item):[...current,item])}>{item}</button>)}</div></>}
        {signupStep === 4 && <><span className="poll-emoji">🎨</span><p className="kicker">Last crumb</p><h2>Choose your Cookie colour</h2><div className="profile-preview"><Avatar person={{ id:"", username, display_name:displayName||"Cookie Friend", profile_colour:colour }}/><div><b>{displayName||"Cookie Friend"}</b><small>@{username||"yourname"}</small></div></div><div className="colours">{colours.map(item=><button aria-label={`Choose ${item}`} key={item} className={colour===item?"selected":""} style={{background:item}} onClick={()=>setColour(item)}/>)}</div></>}
        {notice && <p className="notice">{notice}</p>}
        <button className="primary next" disabled={busy || (signupStep===0&&(!email||password.length<8)) || (signupStep===1&&(!displayName||username.replace(/^@/,"").length<3)) || (signupStep===2&&!flavour) || (signupStep===3&&!selectedInterests.length)} onClick={()=>signupStep===4?createAccount():setSignupStep(signupStep+1)}>{signupStep===4?(busy?"Baking account…":"Create my Cookie 🍪"):"Next crumb →"}</button>
      </div>}
    </section>
  </main>;

  return <main className="app-shell"><div className="app-frame">
    <header><button className="brand" onClick={()=>setView("chats")}><CookieLogo small/><b>Cookie</b></button><div><button aria-label="Notifications">♢{requests.length>0&&<i/>}</button><button className="mini-avatar" onClick={()=>setView("profile")} style={{background:profile?.profile_colour}}>{profile?.display_name?.[0]||"C"}</button></div></header>
    <section className="app-screen">
      {view === "chats" && <div className="page"><div className="title-row"><div><p className="kicker">Welcome, {profile?.display_name.split(" ")[0]}</p><h1>Your chats</h1></div><button className="round" onClick={()=>setView("friends")}>＋</button></div><div className="search-box">⌕ <input placeholder="Search messages, people and files"/></div><div className="folder-row"><button className="active">All</button><button>Friends</button><button>Family</button><button>School</button><button>Groups</button></div>{requests.length>0&&<button className="request-banner" onClick={()=>setView("friends")}><span>✉</span><div><b>Friend requests</b><small>{requests.length} waiting for you</small></div><strong>{requests.length}</strong><i>›</i></button>}<EmptyState title="No conversations yet" copy="Add friends to start chatting. Your real conversations will appear here." action="Find friends" onAction={()=>setView("friends")}/></div>}
      {view === "friends" && <div className="page"><div className="title-row"><div><p className="kicker">Grow your circle</p><h1>Find friends</h1></div></div><div className="search-box">@ <input value={search} onChange={e=>searchPeople(e.target.value)} placeholder="Search a unique username" autoFocus/></div>{notice&&<p className="notice inline">{notice}</p>}{results.length>0&&<div className="people-list"><h3>People</h3>{results.map(person=><div className="person" key={person.id}><Avatar person={person}/><div><b>{person.display_name}</b><small>@{person.username}</small></div><button onClick={()=>addFriend(person)}>Add friend</button></div>)}</div>}{requests.length>0&&<div className="people-list"><h3>Requests</h3>{requests.map(request=><div className="person request" key={request.id}>{request.requester&&<Avatar person={request.requester}/>}<div><b>{request.requester?.display_name}</b><small>@{request.requester?.username}</small></div><button onClick={()=>answerRequest(request,"accepted")}>Accept</button><button className="quiet" onClick={()=>answerRequest(request,"declined")}>Decline</button></div>)}</div>}{friends.length>0&&<div className="people-list"><h3>Your friends</h3>{friends.map(person=><div className="person" key={person.id}><Avatar person={person}/><div><b>{person.display_name}</b><small>@{person.username}</small></div><button>Message</button></div>)}</div>}{!search&&requests.length===0&&friends.length===0&&<EmptyState title="Your circle starts here" copy="Search for someone by their unique Cookie username."/>}</div>}
      {view === "crumbs" && <div className="coming"><span>🍪</span><h1>Crumbs</h1><p>Your full-screen For You and Following feeds are coming next.</p></div>}
      {view === "stories" && <div className="coming"><span>✨</span><h1>Stories</h1><p>Nothing here yet. Your friends’ stories will appear here.</p></div>}
      {view === "profile" && <div className="profile-page">{profile ? <><div className="profile-hero"><CookieLogo/><Avatar person={profile}/></div><h1>{profile.display_name}</h1><p>@{profile.username}</p><div className="stats"><div><b>{friends.length}</b><small>Friends</small></div><div><b>0</b><small>Followers</small></div><div><b>0</b><small>Following</small></div></div></> : <div className="coming"><span>🍪</span><h1>Loading your profile…</h1></div>}<button className="outline" onClick={()=>supabase.auth.signOut()}>Sign out</button></div>}
    </section>
    <nav>{([{id:"chats",icon:"◒",label:"Chats"},{id:"friends",icon:"＋",label:"Friends"},{id:"crumbs",icon:"●",label:"Crumbs"},{id:"stories",icon:"◉",label:"Stories"},{id:"profile",icon:"○",label:"Profile"}] as const).map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>setView(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
  </div></main>;
}

function Avatar({ person }: { person: Profile }) { return <span className="avatar" style={{background:person.profile_colour}}>{person.display_name?.[0]?.toUpperCase()||"C"}</span>; }
function EmptyState({ title, copy, action, onAction }: { title:string; copy:string; action?:string; onAction?:()=>void }) { return <div className="empty"><span>🍪</span><h2>{title}</h2><p>{copy}</p>{action&&<button onClick={onAction}>{action} →</button>}</div>; }
