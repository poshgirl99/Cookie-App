"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

type Profile = { id: string; username: string; display_name: string; profile_colour: string; avatar_url: string | null; cover_url: string | null };
type FriendRequest = { id: string; requester_id: string; recipient_id: string; status: string; introduction_message?: string | null; requester?: Profile };
type Conversation = { id: string; disappearing_mode: "after_viewing" | "24_hours" | "2_days" | "never"; person: Profile; person_last_read_at?: string | null; last_message?: string; last_message_at?: string };
type Reaction = { emoji: string; user_id: string };
type ChatMessage = { id: string; conversation_id: string; sender_id: string; body: string; reply_to_id: string | null; created_at: string; edited_at: string | null; deleted_for_everyone_at: string | null; expires_at: string | null; reactions?: Reaction[]; reply?: { id: string; body: string; sender_id: string } | null };
type AuthMode = "signin" | "signup";
type AppView = "chats" | "friends" | "crumbs" | "stories" | "profile";

const interests = ["Music", "Comedy", "Fashion", "Food", "Gaming", "Sports", "Art", "Travel", "Books", "Dance", "Tech", "Faith"];
const colours = ["#e76f51", "#8b5cf6", "#2a9d8f", "#e9a23b", "#e84a8a", "#457b9d"];
const publicAppUrl = "https://cookie-app-nicholasdeheer-8842s-projects.vercel.app";
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const searchSequence = useRef(0);
  const swipeStart = useRef<{x:number;y:number}|null>(null);

  const loadConversations = useCallback(async (accountId: string) => {
    const { data: ownMemberships } = await supabase.from("conversation_members").select("conversation_id").eq("user_id", accountId);
    const ids = (ownMemberships ?? []).map(item => item.conversation_id);
    if (!ids.length) { setConversations([]); return; }
    const [{ data: chatRows }, { data: members }, { data: recent }] = await Promise.all([
      supabase.from("conversations").select("id,disappearing_mode").in("id", ids),
      supabase.from("conversation_members").select("conversation_id,user_id,last_read_at,profile:profiles(id,username,display_name,profile_colour,avatar_url,cover_url)").in("conversation_id", ids).neq("user_id", accountId),
      supabase.from("messages").select("conversation_id,body,created_at,deleted_for_everyone_at").in("conversation_id", ids).order("created_at", { ascending:false }).limit(200),
    ]);
    const list = (chatRows ?? []).map(row => {
      const member = (members ?? []).find(item => item.conversation_id === row.id);
      const personValue = member?.profile;
      const person = (Array.isArray(personValue) ? personValue[0] : personValue) as Profile | undefined;
      const last = (recent ?? []).find(item => item.conversation_id === row.id);
      return person ? { id:row.id, disappearing_mode:row.disappearing_mode, person, person_last_read_at:member?.last_read_at, last_message:last?.deleted_for_everyone_at?"Message deleted":last?.body, last_message_at:last?.created_at } as Conversation : null;
    }).filter(Boolean) as Conversation[];
    setConversations(list.sort((a,b)=>(b.last_message_at||"").localeCompare(a.last_message_at||"")));
  }, [supabase]);

  const loadAccount = useCallback(async (account: User | null) => {
    setUser(account);
    if (!account) { setProfile(null); setRequests([]); setFriends([]); setSentRequestIds([]); setConversations([]); setActiveChat(null); return; }
    const { data } = await supabase.from("profiles").select("id,username,display_name,profile_colour,avatar_url,cover_url").eq("id", account.id).maybeSingle();
    let currentProfile = data as Profile | null;
    if (!currentProfile) {
      const emailName = account.email?.split("@")[0] || "cookie";
      const base = String(account.user_metadata?.username || emailName).toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 18) || "cookie";
      const fallback = {
        id: account.id,
        username: `${base}_${account.id.slice(0, 6)}`,
        display_name: String(account.user_metadata?.display_name || emailName),
        profile_colour: colours[0],
        avatar_url: null,
        cover_url: null,
      };
      const { data: created } = await supabase.from("profiles").upsert(fallback).select("id,username,display_name,profile_colour,avatar_url,cover_url").single();
      currentProfile = (created as Profile | null) ?? fallback;
    }
    setProfile(currentProfile);

    const { data: incoming } = await supabase
      .from("friend_requests")
      .select("id,requester_id,recipient_id,status,introduction_message,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url)")
      .eq("recipient_id", account.id).eq("status", "pending");
    setRequests((incoming ?? []).map((item: Record<string, unknown>) => ({ ...item, requester: Array.isArray(item.requester) ? item.requester[0] : item.requester })) as FriendRequest[]);

    const { data: outgoing } = await supabase
      .from("friend_requests")
      .select("recipient_id")
      .eq("requester_id", account.id).eq("status", "pending");
    setSentRequestIds((outgoing ?? []).map(item => item.recipient_id));

    const { data: accepted } = await supabase
      .from("friend_requests")
      .select("requester_id,recipient_id,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url),recipient:profiles!friend_requests_recipient_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url)")
      .eq("status", "accepted").or(`requester_id.eq.${account.id},recipient_id.eq.${account.id}`);
    const list = (accepted ?? []).map((row: Record<string, unknown>) => {
      const value = row.requester_id === account.id ? row.recipient : row.requester;
      return (Array.isArray(value) ? value[0] : value) as Profile;
    }).filter(Boolean);
    setFriends(list);
    await loadConversations(account.id);
  }, [loadConversations, supabase]);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowSplash(false), 1500);
    const initialiseAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { data: existing } = await supabase.auth.getSession();
        if (!existing.session) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !error.message.toLowerCase().includes("code verifier")) {
            setNotice(`Google sign-in failed: ${error.message}`);
          }
        }
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      const { data } = await supabase.auth.getUser();
      await loadAccount(data.user);
    };
    initialiseAuth().catch(error => { setNotice(`Sign-in failed: ${String(error)}`); loadAccount(null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { void loadAccount(session?.user ?? null); }, 0);
    });
    return () => { window.clearTimeout(splashTimer); listener.subscription.unsubscribe(); };
  }, [loadAccount, supabase]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    const [{ data: rows, error }, { data: hidden }, { data: pins }] = await Promise.all([
      supabase.from("messages").select("id,conversation_id,sender_id,body,reply_to_id,created_at,edited_at,deleted_for_everyone_at,expires_at,reactions:message_reactions(emoji,user_id)").eq("conversation_id", conversationId).order("created_at"),
      supabase.from("message_hidden_for").select("message_id").eq("user_id", user.id),
      supabase.from("message_pins").select("message_id").eq("conversation_id", conversationId),
    ]);
    if (error) { setNotice(`Messages could not load: ${error.message}`); return; }
    setNotice(current=>current.startsWith("Messages could not load:")?"":current);
    setHiddenMessageIds((hidden ?? []).map(item=>item.message_id));
    setPinnedMessageIds((pins ?? []).map(item=>item.message_id));
    const rawRows=(rows ?? []) as Array<Record<string, unknown>>;
    setMessages(rawRows.map(item=>{
      const repliedTo=item.reply_to_id ? rawRows.find(candidate=>candidate.id===item.reply_to_id) : null;
      return { ...item, reply:repliedTo ? { id:String(repliedTo.id), body:String(repliedTo.body||""), sender_id:String(repliedTo.sender_id) } : null } as ChatMessage;
    }));
    await supabase.from("conversation_members").update({ last_read_at:new Date().toISOString() }).eq("conversation_id",conversationId).eq("user_id",user.id);
  }, [supabase,user]);

  useEffect(()=>{
    if (!activeChat) return;
    void loadMessages(activeChat.id);
    const channel=supabase.channel(`cookie-chat-${activeChat.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:`conversation_id=eq.${activeChat.id}`},()=>void loadMessages(activeChat.id))
      .on("postgres_changes",{event:"*",schema:"public",table:"message_reactions"},()=>void loadMessages(activeChat.id))
      .subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[activeChat,loadMessages,supabase]);

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
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: publicAppUrl } });
    if (error) setNotice(error.message);
  }

  async function resendConfirmation() {
    if (!email) { setNotice("Enter your email first."); return; }
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: publicAppUrl },
    });
    setBusy(false);
    setNotice(error ? error.message : "Confirmation email resent. Check your inbox and spam folder. 🍪");
  }

  async function changeUsername() {
    if (!user || !profile) return;
    const clean = newUsername.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._]/g, "");
    if (clean.length < 3) { setNotice("Username must contain at least 3 characters."); return; }
    setBusy(true); setNotice("");
    const { data: taken } = await supabase.from("profiles").select("id").eq("username", clean).neq("id", user.id).maybeSingle();
    if (taken) { setBusy(false); setNotice("That username is already taken."); return; }
    const { error } = await supabase.from("profiles").update({ username: clean }).eq("id", user.id);
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setProfile({ ...profile, username: clean });
    setProfileMenuOpen(false);
    setNotice(`Your username is now @${clean}. 🍪`);
  }

  async function uploadProfileImage(kind: "avatar" | "cover", file?: File) {
    if (!file || !user || !profile) return;
    if (!file.type.startsWith("image/")) { setNotice("Please choose an image file."); return; }
    if (file.size > 8 * 1024 * 1024) { setNotice("Please choose an image smaller than 8 MB."); return; }
    setBusy(true); setNotice("");
    const extension = (file.name.split(".").pop() || file.type.split("/")[1] || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/${kind}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("profile-media").upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
    if (uploadError) { setBusy(false); setNotice(`Image upload failed: ${uploadError.message}`); return; }
    const { data: publicFile } = supabase.storage.from("profile-media").getPublicUrl(path);
    const field = kind === "avatar" ? "avatar_url" : "cover_url";
    const { error: profileError } = await supabase.from("profiles").update({ [field]: publicFile.publicUrl }).eq("id", user.id);
    setBusy(false);
    if (profileError) { setNotice(`Profile update failed: ${profileError.message}`); return; }
    setProfile({ ...profile, [field]: publicFile.publicUrl });
    setProfileMenuOpen(false);
    setNotice(kind === "avatar" ? "Profile picture updated! 🍪" : "Cover picture updated! 🍪");
  }

  async function deleteAccount() {
    if (!window.confirm("Permanently delete your Cookie account? This cannot be undone.")) return;
    setBusy(true); setNotice("");
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error) { setBusy(false); setNotice(`Account deletion failed: ${error.message}`); return; }
    await supabase.auth.signOut();
    setBusy(false);
    setUser(null);
  }

  async function searchPeople(value: string) {
    setSearch(value);
    const sequence = ++searchSequence.current;
    const term = value.trim().toLowerCase().replace(/^@/, "");
    if (!term || !user) { setResults([]); setNotice(""); return; }
    const { data, error } = await supabase.from("profiles").select("id,username,display_name,profile_colour,avatar_url,cover_url").limit(100);
    if (sequence !== searchSequence.current) return;
    if (error) { setResults([]); setNotice(`Search failed: ${error.message}`); return; }
    const matches = (data ?? []).filter(person => person.id !== user.id && (
      person.username.toLowerCase().includes(term) || person.display_name.toLowerCase().includes(term)
    )).slice(0, 20);
    setResults(matches);
    setNotice(matches.length ? "" : `No Cookie user found for @${term}.`);
  }

  async function addFriend(person: Profile) {
    if (!user) return;
    setNotice("");
    const introduction = window.prompt(`Add one introductory message for @${person.username}:`, "Hey! I'd like to add you on Cookie 🍪")?.trim();
    if (introduction === undefined) return;
    const { error } = await supabase.from("friend_requests").insert({ requester_id: user.id, recipient_id: person.id, introduction_message:introduction||null });
    if (error) {
      setNotice(error.code === "23505" ? "A friend request already exists between you." : error.message);
      if (error.code === "23505") setSentRequestIds(current => current.includes(person.id) ? current : [...current, person.id]);
      return;
    }
    setSentRequestIds(current => [...current, person.id]);
    setNotice(`Friend request sent to @${person.username}!`);
  }

  async function answerRequest(request: FriendRequest, status: "accepted" | "declined" | "blocked") {
    const { error } = await supabase.from("friend_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", request.id);
    if (error) { setNotice(error.message); return; }
    setRequests(current => current.filter(item => item.id !== request.id));
    if (status === "accepted" && request.requester) {
      setFriends(current => [...current, request.requester!]);
      if (request.introduction_message && window.confirm(`Include this introduction in your new chat?\n\n“${request.introduction_message}”`)) {
        const chat=await openChat(request.requester);
        if (chat) await sendMessage(`__intro__:${request.requester.display_name}:${request.introduction_message}`,chat,user?.id);
      }
    }
  }

  async function openChat(person: Profile) {
    if (!user) return null;
    const existing=conversations.find(item=>item.person.id===person.id);
    if (existing) { setActiveChat(existing); setView("chats"); return existing; }
    setBusy(true); setNotice("");
    const { data: created,error }=await supabase.from("conversations").insert({created_by:user.id}).select("id,disappearing_mode").single();
    if (error||!created) { setBusy(false); setNotice(error?.message||"Chat could not be created."); return null; }
    const { error:memberError }=await supabase.from("conversation_members").insert([{conversation_id:created.id,user_id:user.id},{conversation_id:created.id,user_id:person.id}]);
    setBusy(false);
    if (memberError) { setNotice(memberError.message); return null; }
    const chat:Conversation={...created,person};
    setConversations(current=>[chat,...current]); setActiveChat(chat); setView("chats"); return chat;
  }

  async function sendMessage(text=messageText,chat=activeChat,senderId=user?.id) {
    if (!chat||!senderId||!text.trim()) return;
    const clean=text.trim(); setMessageText("");
    const expiresAt=chat.disappearing_mode==="24_hours"?new Date(Date.now()+86400000).toISOString():chat.disappearing_mode==="2_days"?new Date(Date.now()+172800000).toISOString():null;
    const { error }=await supabase.from("messages").insert({conversation_id:chat.id,sender_id:senderId,body:clean,reply_to_id:replyingTo?.id||null,expires_at:expiresAt});
    setReplyingTo(null);
    if(error)setNotice(error.message); else {await loadMessages(chat.id); if(user)await loadConversations(user.id);}
  }

  async function reactToMessage(message:ChatMessage,emoji:string){
    if(!user)return;
    const exists=message.reactions?.some(item=>item.user_id===user.id&&item.emoji===emoji);
    const query=supabase.from("message_reactions");
    const {error}=exists?await query.delete().eq("message_id",message.id).eq("user_id",user.id).eq("emoji",emoji):await query.insert({message_id:message.id,user_id:user.id,emoji});
    if(error)setNotice(error.message); else if(activeChat)await loadMessages(activeChat.id);
  }

  async function editMessage(message:ChatMessage){
    const value=window.prompt("Edit message:",message.body)?.trim(); if(!value||value===message.body)return;
    const {error}=await supabase.from("messages").update({body:value,edited_at:new Date().toISOString()}).eq("id",message.id);
    if(error)setNotice(error.message); else if(activeChat)await loadMessages(activeChat.id); setSelectedMessage(null);
  }

  async function deleteMessage(message:ChatMessage,forEveryone:boolean){
    if(!user)return;
    if(forEveryone){
      if(!window.confirm("Delete this message for everyone?"))return;
      const {error}=await supabase.from("messages").update({deleted_for_everyone_at:new Date().toISOString()}).eq("id",message.id);
      if(error)setNotice(error.message);
    }else{
      const {error}=await supabase.from("message_hidden_for").insert({message_id:message.id,user_id:user.id}); if(error)setNotice(error.message);
    }
    setSelectedMessage(null); if(activeChat)await loadMessages(activeChat.id);
  }

  async function togglePin(message:ChatMessage){
    if(!user||!activeChat)return;
    const pinned=pinnedMessageIds.includes(message.id);
    const query=supabase.from("message_pins");
    const {error}=pinned?await query.delete().eq("conversation_id",activeChat.id).eq("message_id",message.id):await query.insert({conversation_id:activeChat.id,message_id:message.id,pinned_by:user.id});
    if(error)setNotice(error.message); else await loadMessages(activeChat.id); setSelectedMessage(null);
  }

  async function changeDisappearingMode(mode:Conversation["disappearing_mode"]){
    if(!activeChat||!profile)return;
    const {error}=await supabase.from("conversations").update({disappearing_mode:mode,updated_at:new Date().toISOString()}).eq("id",activeChat.id);
    if(error){setNotice(error.message);return;}
    const label={after_viewing:"after viewing","24_hours":"within 24 hours","2_days":"within 2 days",never:"never delete"}[mode];
    const updated={...activeChat,disappearing_mode:mode}; setActiveChat(updated); setConversations(current=>current.map(item=>item.id===updated.id?updated:item));
    await supabase.from("messages").insert({conversation_id:activeChat.id,sender_id:profile.id,body:`__system__:${profile.display_name} changed messages to ${label}.`});
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
        {notice.toLowerCase().includes("email not confirmed") && <button type="button" className="google" disabled={busy} onClick={resendConfirmation}>Resend confirmation email</button>}
        <p className="switch">New to Cookie? <button type="button" onClick={() => { setAuthMode("signup"); setNotice(""); }}>Create your account</button></p>
      </form> : <div className="poll-card" key={signupStep}>
        <div className="poll-top"><button onClick={() => signupStep ? setSignupStep(signupStep - 1) : setAuthMode("signin")}>←</button><span>{signupStep + 1} of 5</span></div>
        <div className="poll-progress">{[0,1,2,3,4].map(i => <i key={i} className={i <= signupStep ? "done" : ""}/>)}</div>
        {signupStep === 0 && <><span className="poll-emoji">🔐</span><p className="kicker">Create your secret recipe</p><h2>How will you sign in?</h2><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Cookie password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label></>}
        {signupStep === 1 && <><span className="poll-emoji">👋🏾</span><p className="kicker">Your first crumb</p><h2>What should we call you?</h2><label>Your name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="e.g. Xanthe"/></label><label>Unique username<div className="username"><span>@</span><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname"/></div></label></>}
        {signupStep === 2 && <><span className="poll-emoji">🍪</span><p className="kicker">Pick your flavour</p><h2>What’s your social energy?</h2><div className="choices">{flavours.map(([emoji,title,copy])=><button key={title} className={flavour===title?"selected":""} onClick={()=>setFlavour(title)}><span>{emoji}</span><b>{title}</b><small>{copy}</small></button>)}</div></>}
        {signupStep === 3 && <><span className="poll-emoji">✨</span><p className="kicker">Your feed, your vibe</p><h2>What are you into?</h2><div className="interest-list">{interests.map(item=><button key={item} className={selectedInterests.includes(item)?"selected":""} onClick={()=>setSelectedInterests(current=>current.includes(item)?current.filter(x=>x!==item):[...current,item])}>{item}</button>)}</div></>}
        {signupStep === 4 && <><span className="poll-emoji">🎨</span><p className="kicker">Last crumb</p><h2>Choose your Cookie colour</h2><div className="profile-preview"><Avatar person={{ id:"", username, display_name:displayName||"Cookie Friend", profile_colour:colour, avatar_url:null, cover_url:null }}/><div><b>{displayName||"Cookie Friend"}</b><small>@{username||"yourname"}</small></div></div><div className="colours">{colours.map(item=><button aria-label={`Choose ${item}`} key={item} className={colour===item?"selected":""} style={{background:item}} onClick={()=>setColour(item)}/>)}</div></>}
        {notice && <p className="notice">{notice}</p>}
        <button className="primary next" disabled={busy || (signupStep===0&&(!email||password.length<8)) || (signupStep===1&&(!displayName||username.replace(/^@/,"").length<3)) || (signupStep===2&&!flavour) || (signupStep===3&&!selectedInterests.length)} onClick={()=>signupStep===4?createAccount():setSignupStep(signupStep+1)}>{signupStep===4?(busy?"Baking account…":"Create my Cookie 🍪"):"Next crumb →"}</button>
      </div>}
    </section>
  </main>;

  return <main className="app-shell"><div className="app-frame">
    <header><button className="brand" onClick={()=>setView("chats")}><CookieLogo small/><b>Cookie</b></button><div><button aria-label="Notifications">♢{requests.length>0&&<i/>}</button><button className="mini-avatar" onClick={()=>setView("profile")} style={{background:profile?.profile_colour}}>{profile?.avatar_url?<img src={profile.avatar_url} alt="" />:profile?.display_name?.[0]||"C"}</button></div></header>
    <section className="app-screen">
      {view === "chats" && (activeChat?<div className="chat-pane">
        <div className="chat-head"><button className="chat-back" onClick={()=>{setActiveChat(null);setSelectedMessage(null)}}>‹</button><Avatar person={activeChat.person}/><div><b>{activeChat.person.display_name}</b><small>@{activeChat.person.username}</small></div><select aria-label="Automatic message deletion" value={activeChat.disappearing_mode} onChange={event=>changeDisappearingMode(event.target.value as Conversation["disappearing_mode"])}><option value="after_viewing">After viewing</option><option value="24_hours">Within 24 hours</option><option value="2_days">Within 2 days</option><option value="never">Never delete</option></select></div>
        {pinnedMessageIds.length>0&&<div className="pinned-strip">📌 {pinnedMessageIds.length} pinned message{pinnedMessageIds.length>1?"s":""}</div>}
        <div className="message-stream">{messages.filter(message=>!hiddenMessageIds.includes(message.id)&&(!message.expires_at||new Date(message.expires_at).getTime()>Date.now())).map(message=>{
          const mine=message.sender_id===user.id; const system=message.body.startsWith("__system__:"); const intro=message.body.startsWith("__intro__:");
          if(system)return <div className="system-message" key={message.id}>{message.body.replace("__system__:","")}</div>;
          const grouped=Object.entries((message.reactions||[]).reduce((map,item)=>({...map,[item.emoji]:(map[item.emoji]||0)+1}),{} as Record<string,number>));
          return <div className={`message-row ${mine?"mine":"theirs"}`} key={message.id} onTouchStart={event=>swipeStart.current={x:event.touches[0].clientX,y:event.touches[0].clientY}} onTouchEnd={event=>{if(swipeStart.current&&event.changedTouches[0].clientX-swipeStart.current.x>65)setReplyingTo(message);swipeStart.current=null}}>
            <button className={`message-bubble ${message.deleted_for_everyone_at?"deleted":""}`} onClick={()=>!message.deleted_for_everyone_at&&setSelectedMessage(selectedMessage?.id===message.id?null:message)}>
              {message.reply&&<span className="reply-preview"><b>{message.reply.sender_id===user.id?"You":activeChat.person.display_name}</b>{message.reply.body.slice(0,80)}</span>}
              {message.deleted_for_everyone_at?<em>{(mine?profile?.display_name:activeChat.person.display_name)?.toUpperCase()} DELETED THIS MESSAGE</em>:intro?<span className="intro-message">Friend request message<br/><b>{message.body.split(":").slice(2).join(":")}</b></span>:message.body}
              {!message.deleted_for_everyone_at&&<small>{message.edited_at&&"Edited · "}{new Date(message.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · {mine?<CrumbStatus delivered read={Boolean(activeChat.person_last_read_at&&activeChat.person_last_read_at>message.created_at)}/>:messages.some(later=>later.sender_id===user.id&&later.created_at>message.created_at)?"Delivered":"Received"}</small>}
            </button>
            {grouped.length>0&&<div className="reaction-counts">{grouped.map(([emoji,count])=><span key={emoji}>{emoji}{count>1&&count}</span>)}</div>}
            {selectedMessage?.id===message.id&&<div className="message-actions"><div className="quick-reactions">{["🍪","❤️","😂","😮","😢","👍"].map(emoji=><button key={emoji} onClick={()=>reactToMessage(message,emoji)}>{emoji}</button>)}<button onClick={()=>{const emoji=window.prompt("Choose an emoji");if(emoji)void reactToMessage(message,emoji)}}>＋</button></div><button onClick={()=>togglePin(message)}>{pinnedMessageIds.includes(message.id)?"Unpin":"Pin"}</button>{mine&&Date.now()-new Date(message.created_at).getTime()<900000&&<button onClick={()=>editMessage(message)}>Edit</button>}<button onClick={()=>deleteMessage(message,false)}>Delete for me</button>{mine&&<button onClick={()=>deleteMessage(message,true)}>Delete for everyone</button>}</div>}
          </div>})}</div>
        <div className="chat-compose">{replyingTo&&<div className="replying"><span>Replying to <b>{replyingTo.sender_id===user.id?"yourself":activeChat.person.display_name}</b><small>{replyingTo.body.slice(0,90)}</small></span><button onClick={()=>setReplyingTo(null)}>×</button></div>}<div className="compose-row"><button title="Emoji" onClick={()=>setMessageText(current=>current+"🍪")}>☺</button><button className="attach" title="Photos, files, voice, location, contacts, polls and events">＋</button><input value={messageText} onChange={event=>setMessageText(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();void sendMessage()}}} placeholder="Message…"/><button className="send" disabled={!messageText.trim()} onClick={()=>sendMessage()}>➤</button></div></div>
      </div>:<div className="page"><div className="title-row"><div><p className="kicker">Welcome, {profile?.display_name.split(" ")[0]}</p><h1>Your chats</h1></div><button className="round" onClick={()=>setView("friends")}>＋</button></div><div className="crumb-legend"><CrumbStatus/><span>Sent</span><CrumbStatus delivered/><span>Delivered</span><CrumbStatus read/><span>Read</span></div><div className="search-box">⌕ <input placeholder="Search messages, people and files"/></div><div className="folder-row"><button className="active">All</button><button>Friends</button><button>Family</button><button>School</button><button>Groups</button></div>{requests.length>0&&<button className="request-banner" onClick={()=>setView("friends")}><span>✉</span><div><b>Friend requests</b><small>{requests.length} waiting for you</small></div><strong>{requests.length}</strong><i>›</i></button>}{conversations.length>0?<div className="chat-list">{conversations.map(chat=><button key={chat.id} onClick={()=>setActiveChat(chat)}><Avatar person={chat.person}/><span><b>{chat.person.display_name}</b><small>{chat.last_message?.replace(/^__(system|intro)__:[^:]*:?/,"")||"Start chatting 🍪"}</small></span><i>›</i></button>)}</div>:<EmptyState title="No conversations yet" copy="Add friends to start chatting. Your real conversations will appear here." action="Find friends" onAction={()=>setView("friends")}/>}</div>)}
      {view === "friends" && <div className="page"><div className="title-row"><div><p className="kicker">Grow your circle</p><h1>Find friends</h1></div></div><div className="search-box">@ <input value={search} onChange={e=>searchPeople(e.target.value)} placeholder="Search a unique username" autoFocus/></div>{notice&&<p className="notice inline">{notice}</p>}{results.length>0&&<div className="people-list"><h3>People</h3>{results.map(person=><div className="person" key={person.id}><Avatar person={person}/><div><b>{person.display_name}</b><small>@{person.username}</small></div><button disabled={friends.some(friend=>friend.id===person.id)||sentRequestIds.includes(person.id)} onClick={()=>addFriend(person)}>{friends.some(friend=>friend.id===person.id)?"Friends":sentRequestIds.includes(person.id)?"Added":"Add friend"}</button></div>)}</div>}{requests.length>0&&<div className="people-list"><h3>Requests</h3>{requests.map(request=><div className="person request" key={request.id}>{request.requester&&<Avatar person={request.requester}/>}<div><b>{request.requester?.display_name}</b><small>@{request.requester?.username}</small>{request.introduction_message&&<em>“{request.introduction_message}”</em>}</div><button onClick={()=>answerRequest(request,"accepted")}>Accept</button><button className="quiet" onClick={()=>answerRequest(request,"declined")}>Decline</button></div>)}</div>}{friends.length>0&&<div className="people-list"><h3>Your friends</h3>{friends.map(person=><div className="person" key={person.id}><Avatar person={person}/><div><b>{person.display_name}</b><small>@{person.username}</small></div><button onClick={()=>openChat(person)}>Message</button></div>)}</div>}{!search&&requests.length===0&&friends.length===0&&<EmptyState title="Your circle starts here" copy="Search for someone by their unique Cookie username."/>}</div>}
      {view === "crumbs" && <div className="coming"><span>🍪</span><h1>Crumbs</h1><p>Your full-screen For You and Following feeds are coming next.</p></div>}
      {view === "stories" && <div className="coming"><span>✨</span><h1>Stories</h1><p>Nothing here yet. Your friends’ stories will appear here.</p></div>}
      {view === "profile" && <div className="profile-page"><button className="profile-menu-button" aria-label="Profile settings" onClick={()=>{setProfileMenuOpen(current=>!current);setNewUsername(profile?.username||"");}}>•••</button>{profileMenuOpen&&<div className="profile-settings"><h3>Profile settings</h3><div className="photo-actions"><label className="photo-choice"><span>Change profile picture</span><small>Shown beside your name</small><input type="file" accept="image/*" disabled={busy} onChange={event=>uploadProfileImage("avatar",event.target.files?.[0])}/></label><label className="photo-choice"><span>Change cover picture</span><small>Shown behind your profile</small><input type="file" accept="image/*" disabled={busy} onChange={event=>uploadProfileImage("cover",event.target.files?.[0])}/></label></div><label>Change username<div className="username"><span>@</span><input value={newUsername} onChange={event=>setNewUsername(event.target.value)} placeholder="your_username"/></div></label><button className="primary" disabled={busy} onClick={changeUsername}>{busy?"Saving…":"Save username"}</button><button className="danger-button" disabled={busy} onClick={deleteAccount}>Delete account</button></div>}{profile ? <><div className={`profile-hero ${profile.cover_url?"has-cover":""}`} style={profile.cover_url?{backgroundImage:`url("${profile.cover_url}")`}:undefined}><Avatar person={profile}/></div><h1>{profile.display_name}</h1><p>@{profile.username}</p><div className="stats"><div><b>{friends.length}</b><small>Friends</small></div><div><b>0</b><small>Followers</small></div><div><b>0</b><small>Following</small></div></div></> : <div className="coming"><span>🍪</span><h1>Loading your profile…</h1></div>}{notice&&<p className="notice inline">{notice}</p>}<button className="outline" onClick={()=>supabase.auth.signOut()}>Sign out</button></div>}
    </section>
    <nav>{([{id:"chats",icon:"◒",label:"Chats"},{id:"friends",icon:"＋",label:"Friends"},{id:"crumbs",icon:"●",label:"Crumbs"},{id:"stories",icon:"◉",label:"Stories"},{id:"profile",icon:"○",label:"Profile"}] as const).map(item=><button key={item.id} className={view===item.id?"active":""} onClick={()=>setView(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
  </div></main>;
}

function Avatar({ person }: { person: Profile }) { return <span className="avatar" style={{background:person.profile_colour}}>{person.avatar_url?<img src={person.avatar_url} alt={`${person.display_name} profile`}/>:person.display_name?.[0]?.toUpperCase()||"C"}</span>; }
function CrumbStatus({ delivered=false, read=false }: { delivered?:boolean; read?:boolean }) { return <span className={`crumb-status ${read?"read":""}`} aria-label={read?"Read":delivered?"Delivered":"Sent"}><i/>{(delivered||read)&&<i/>}</span>; }
function EmptyState({ title, copy, action, onAction }: { title:string; copy:string; action?:string; onAction?:()=>void }) { return <div className="empty"><span>🍪</span><h2>{title}</h2><p>{copy}</p>{action&&<button onClick={onAction}>{action} →</button>}</div>; }
