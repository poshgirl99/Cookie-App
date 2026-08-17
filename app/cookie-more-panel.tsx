"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

type Profile={id:string;username:string;display_name:string;avatar_url:string|null;profile_colour:string};
type FriendItem={profile:Profile;conversationId:string|null;lastChat:string|null;bestRank:number|null};
type SavedItem={id:string;conversation_id:string;body:string;created_at:string;personName:string;conversationId:string};
type View="menu"|"friends"|"saved"|"qr"|"settings"|"help";

function avatar(person:Profile){
  if(person.avatar_url)return <img src={person.avatar_url} alt=""/>;
  return <span style={{background:person.profile_colour||"#d9b98c"}}>{(person.display_name||person.username||"?").slice(0,1).toUpperCase()}</span>;
}

export default function CookieMorePanel(){
  const supabase=useMemo(()=>createClient(),[]);
  const [open,setOpen]=useState(false);
  const [view,setView]=useState<View>("menu");
  const [friends,setFriends]=useState<FriendItem[]>([]);
  const [saved,setSaved]=useState<SavedItem[]>([]);
  const [query,setQuery]=useState("");
  const [me,setMe]=useState<Profile|null>(null);
  const [helpText,setHelpText]=useState("");
  const [helpMessages,setHelpMessages]=useState<{from:"bot"|"user";text:string}[]>([{from:"bot",text:"Hi. How can I help you with Cookie today?"}]);

  useEffect(()=>{
    const handler=(event:Event)=>{event.preventDefault();event.stopPropagation();setOpen(true);setView("menu");};
    const bind=()=>{
      const button=document.querySelector('button[aria-label="More"]') as HTMLButtonElement|null;
      if(!button||button.dataset.cookieMorePanel)return;
      button.dataset.cookieMorePanel="1";
      button.addEventListener("click",handler,true);
    };
    bind();const observer=new MutationObserver(bind);observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();document.querySelector('button[aria-label="More"]')?.removeEventListener("click",handler,true);};
  },[]);

  useEffect(()=>{if(open)void loadEverything();},[open]);

  async function loadEverything(){
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {data:mine}=await supabase.from("profiles").select("id,username,display_name,avatar_url,profile_colour").eq("id",user.id).maybeSingle();
    if(mine)setMe(mine as Profile);

    const {data:reqs}=await supabase.from("friend_requests").select("requester_id,recipient_id").eq("status","accepted").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    const friendIds=(reqs||[]).map((r:any)=>r.requester_id===user.id?r.recipient_id:r.requester_id);
    if(friendIds.length){
      const {data:profiles}=await supabase.from("profiles").select("id,username,display_name,avatar_url,profile_colour").in("id",friendIds);
      const {data:ranks}=await supabase.from("best_friend_rankings").select("friend_id,rank").eq("user_id",user.id);
      const rankMap=new Map((ranks||[]).map((r:any)=>[r.friend_id,Number(r.rank)]));
      const {data:members}=await supabase.from("conversation_members").select("conversation_id,user_id").in("user_id",[user.id,...friendIds]);
      const myConvIds=new Set((members||[]).filter((m:any)=>m.user_id===user.id).map((m:any)=>m.conversation_id));
      const friendConv=new Map<string,string>();
      (members||[]).forEach((m:any)=>{if(m.user_id!==user.id&&myConvIds.has(m.conversation_id))friendConv.set(m.user_id,m.conversation_id);});
      const convIds=[...new Set(friendConv.values())];
      const {data:msgs}=convIds.length?await supabase.from("messages").select("conversation_id,created_at").in("conversation_id",convIds).order("created_at",{ascending:false}):{data:[] as any[]};
      const latest=new Map<string,string>();
      (msgs||[]).forEach((m:any)=>{if(!latest.has(m.conversation_id))latest.set(m.conversation_id,m.created_at);});
      const items=(profiles||[]).map((p:any)=>({profile:p as Profile,conversationId:friendConv.get(p.id)||null,lastChat:latest.get(friendConv.get(p.id)||"")||null,bestRank:rankMap.get(p.id)||null}));
      items.sort((a,b)=>{
        const ar=a.bestRank&&a.bestRank<=6?0:1, br=b.bestRank&&b.bestRank<=6?0:1;
        if(ar!==br)return ar-br;
        if(ar===0)return (a.bestRank||99)-(b.bestRank||99);
        return new Date(b.lastChat||0).getTime()-new Date(a.lastChat||0).getTime();
      });
      setFriends(items);
    } else setFriends([]);

    const {data:pins}=await supabase.from("message_pins").select("message_id,conversation_id").eq("pinned_by",user.id);
    const messageIds=(pins||[]).map((p:any)=>p.message_id);
    if(messageIds.length){
      const {data:messages}=await supabase.from("messages").select("id,conversation_id,body,created_at").in("id",messageIds).order("created_at",{ascending:false});
      const convIds=[...new Set((messages||[]).map((m:any)=>m.conversation_id))];
      const {data:members}=await supabase.from("conversation_members").select("conversation_id,user_id").in("conversation_id",convIds).neq("user_id",user.id);
      const personIds=[...new Set((members||[]).map((m:any)=>m.user_id))];
      const {data:people}=personIds.length?await supabase.from("profiles").select("id,display_name,username").in("id",personIds):{data:[] as any[]};
      const names=new Map((people||[]).map((p:any)=>[p.id,p.display_name||`@${p.username}`]));
      const personByConv=new Map((members||[]).map((m:any)=>[m.conversation_id,names.get(m.user_id)||"Chat"]));
      setSaved((messages||[]).map((m:any)=>({id:m.id,conversation_id:m.conversation_id,body:m.body,created_at:m.created_at,personName:personByConv.get(m.conversation_id)||"Chat",conversationId:m.conversation_id})));
    } else setSaved([]);
  }

  function openConversation(id:string|null){if(!id)return;setOpen(false);window.dispatchEvent(new CustomEvent("cookie:open-conversation",{detail:{conversationId:id}}));}
  function askHelp(){
    const text=helpText.trim(); if(!text)return;
    setHelpMessages(m=>[...m,{from:"user",text}]);setHelpText("");
    const q=text.toLowerCase();let answer="I can help with that. Tell me what you expected to happen and what happened instead.";
    if(q.includes("notification"))answer="Open Settings → Notifications and make sure Cookie notifications are enabled. If browser notifications are blocked, Cookie will still keep notifications in the in-app notification centre.";
    else if(q.includes("best friend"))answer="Best Friends are based on sustained two-way interaction over time. A burst of messages in one day is not enough. Your #1 Best Friend is marked with 💕.";
    else if(q.includes("password")||q.includes("login")||q.includes("sign in"))answer="If you created your Cookie account with Google, use Continue with Google. Password sign-in only works for accounts that have a Cookie password.";
    else if(q.includes("delete account"))answer="Go to Settings → Account → Delete account. Cookie will ask you to confirm before permanently removing the account.";
    else if(q.includes("saved"))answer="Saved Messages contains messages you saved from chats. Tap one to return to the original conversation.";
    window.setTimeout(()=>setHelpMessages(m=>[...m,{from:"bot",text:answer}]),250);
  }

  const filtered=friends.filter(f=>`${f.profile.display_name} ${f.profile.username}`.toLowerCase().includes(query.toLowerCase()));
  const best=filtered.filter(f=>f.bestRank&&f.bestRank<=6), rest=filtered.filter(f=>!f.bestRank||f.bestRank>6);
  const profileUrl=me?`${window.location.origin}/?profile=${encodeURIComponent(me.username)}`:"";

  if(!open)return null;
  return <div className="cookie-more-backdrop" onClick={()=>setOpen(false)}>
    <aside className="cookie-more-panel" onClick={e=>e.stopPropagation()}>
      <header><button onClick={()=>view==="menu"?setOpen(false):setView("menu")}>{view==="menu"?"×":"‹"}</button><b>{view==="menu"?"More":view==="friends"?"Manage Friendships":view==="saved"?"Saved Messages":view==="qr"?"My QR Code":view==="settings"?"Settings":"Help"}</b></header>
      {view==="menu"&&<nav className="cookie-more-menu">
        <button onClick={()=>setView("friends")}><span>👥</span><b>Manage Friendships</b><i>›</i></button>
        <button onClick={()=>setView("saved")}><span>★</span><b>Saved Messages</b><i>›</i></button>
        <button onClick={()=>setView("qr")}><span>▦</span><b>My QR Code</b><i>›</i></button>
        <button onClick={()=>setView("settings")}><span>⚙</span><b>Settings</b><i>›</i></button>
        <button onClick={()=>setView("help")}><span>?</span><b>Help</b><i>›</i></button>
      </nav>}
      {view==="friends"&&<div className="cookie-friends-view"><input placeholder="Search name or username" value={query} onChange={e=>setQuery(e.target.value)}/><h3>Best Friends</h3><div className="cookie-best-grid">{best.map(f=><button key={f.profile.id} onClick={()=>openConversation(f.conversationId)}><span className="cookie-person-avatar">{avatar(f.profile)}</span><b>{f.profile.display_name}</b><small>@{f.profile.username}</small>{f.bestRank===1&&<em>💕 #1 Best Friend</em>}</button>)}</div><h3>Friends</h3><div className="cookie-friend-list">{rest.map(f=><button key={f.profile.id} onClick={()=>openConversation(f.conversationId)}><span className="cookie-person-avatar">{avatar(f.profile)}</span><span><b>{f.profile.display_name}</b><small>@{f.profile.username}</small></span><i>›</i></button>)}</div></div>}
      {view==="saved"&&<div className="cookie-saved-list">{saved.length?saved.map(s=><button key={s.id} onClick={()=>openConversation(s.conversationId)}><b>{s.personName}</b><p>{s.body.startsWith("__audio__:")?"🎙 Voice note":s.body.startsWith("__media__:")?"📎 Attachment":s.body}</p><small>{new Date(s.created_at).toLocaleString()}</small></button>):<p className="cookie-empty">No saved messages yet.</p>}</div>}
      {view==="qr"&&<div className="cookie-qr-view">{me&&<><span className="cookie-qr-avatar cookie-person-avatar">{avatar(me)}</span><h2>{me.display_name}</h2><p>@{me.username}</p><img className="cookie-qr-image" alt="My Cookie QR code" src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(profileUrl)}`}/><small>Scan to open my Cookie profile</small></>}</div>}
      {view==="settings"&&<div className="cookie-settings-list">{["Account","Notifications","Appearance","Chat Settings","Profile Settings","Blocked Accounts"].map(x=><button key={x}><b>{x}</b><i>›</i></button>)}<button className="danger" onClick={async()=>{await supabase.auth.signOut();window.location.reload();}}><b>Log Out</b></button></div>}
      {view==="help"&&<div className="cookie-help"><div className="cookie-help-messages">{helpMessages.map((m,i)=><p key={i} className={m.from}>{m.text}</p>)}</div><form onSubmit={e=>{e.preventDefault();askHelp();}}><input value={helpText} onChange={e=>setHelpText(e.target.value)} placeholder="Ask about a problem…"/><button>Send</button></form></div>}
    </aside>
    <style jsx global>{`
      .cookie-more-backdrop{position:fixed;inset:0;background:rgba(42,28,18,.22);z-index:2147482500}.cookie-more-panel{position:absolute;right:0;top:0;height:100%;width:min(430px,94vw);background:#fffaf2;color:#3b2417;box-shadow:-18px 0 50px rgba(37,22,13,.18);padding:18px;overflow:auto;animation:cookieSlide .2s ease-out}@keyframes cookieSlide{from{transform:translateX(100%)}to{transform:none}}.cookie-more-panel header{display:flex;align-items:center;gap:12px;padding:4px 0 18px}.cookie-more-panel header button{width:38px;height:38px;border:0;border-radius:50%;background:#f5e8d6;font-size:24px;color:#553421}.cookie-more-panel header b{font-size:20px}.cookie-more-menu{display:grid;gap:8px}.cookie-more-menu button,.cookie-settings-list button{display:grid;grid-template-columns:34px 1fr 18px;align-items:center;gap:10px;width:100%;padding:15px 12px;border:0;border-bottom:1px solid #eee0d0;background:transparent;text-align:left;color:inherit}.cookie-more-menu button span{width:32px;height:32px;border-radius:10px;background:#f7e7d2;display:grid;place-items:center}.cookie-more-menu i,.cookie-settings-list i{font-style:normal;opacity:.45}.cookie-friends-view>input{width:100%;box-sizing:border-box;border:1px solid #ead8c3;background:white;border-radius:14px;padding:13px 14px;margin-bottom:16px;font:inherit}.cookie-friends-view h3{font-size:13px;text-transform:uppercase;letter-spacing:.8px;opacity:.55;margin:16px 2px 10px}.cookie-best-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.cookie-best-grid button{border:0;background:#fff1de;border-radius:18px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:3px;color:inherit}.cookie-person-avatar{width:52px;height:52px;border-radius:50%;overflow:hidden;display:grid;place-items:center}.cookie-person-avatar img,.cookie-person-avatar span{width:100%;height:100%;object-fit:cover;display:grid;place-items:center;color:white;font-weight:900}.cookie-best-grid b{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cookie-best-grid small{font-size:10px;opacity:.55;max-width:100%;overflow:hidden;text-overflow:ellipsis}.cookie-best-grid em{font-style:normal;font-size:10px;font-weight:800;color:#a04c72;margin-top:3px}.cookie-friend-list{display:grid}.cookie-friend-list button{display:grid;grid-template-columns:48px 1fr 16px;align-items:center;gap:10px;border:0;border-bottom:1px solid #eee0d0;background:transparent;padding:10px 2px;text-align:left;color:inherit}.cookie-friend-list .cookie-person-avatar{width:44px;height:44px}.cookie-friend-list span:nth-child(2){display:flex;flex-direction:column}.cookie-friend-list small{opacity:.55}.cookie-friend-list i{font-style:normal;opacity:.4}.cookie-saved-list{display:grid;gap:8px}.cookie-saved-list button{border:1px solid #eadbc8;background:white;border-radius:14px;padding:12px;text-align:left;color:inherit}.cookie-saved-list p{margin:5px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cookie-saved-list small{opacity:.5}.cookie-empty{text-align:center;opacity:.6;padding:40px}.cookie-qr-view{text-align:center;padding-top:30px}.cookie-qr-avatar{margin:0 auto 8px}.cookie-qr-view h2{margin:6px 0 2px}.cookie-qr-view p{margin:0 0 18px;opacity:.55}.cookie-qr-image{width:240px;height:240px;max-width:80vw;background:white;padding:10px;border-radius:18px;box-shadow:0 10px 30px rgba(50,30,18,.08)}.cookie-qr-view small{display:block;margin-top:12px;opacity:.6}.cookie-settings-list{display:grid}.cookie-settings-list button{grid-template-columns:1fr 18px}.cookie-settings-list .danger{color:#b13838;grid-template-columns:1fr}.cookie-help{height:calc(100vh - 90px);display:flex;flex-direction:column}.cookie-help-messages{flex:1;overflow:auto;padding:8px 2px}.cookie-help-messages p{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.35}.cookie-help-messages .bot{background:#f4e7d6}.cookie-help-messages .user{background:#5a3421;color:white;margin-left:auto}.cookie-help form{display:flex;gap:8px;padding-top:10px}.cookie-help input{flex:1;border:1px solid #e5d3bd;border-radius:14px;padding:12px;font:inherit}.cookie-help form button{border:0;border-radius:14px;background:#5a3421;color:white;padding:0 16px;font-weight:800}@media(max-width:520px){.cookie-best-grid{grid-template-columns:repeat(2,1fr)}}
    `}</style>
  </div>;
}
