"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Msg = { role: "coco" | "user"; text: string; createdAt?: number };
type Prefs = { name?: string; voice?: string; cocoDisplayName?: string; permissions?: { chats:boolean; friends:boolean; stories:boolean; media:boolean; activity:boolean }; onboarded?: boolean };
type SpeechRecognitionCtor = new () => { continuous:boolean; interimResults:boolean; lang:string; start():void; stop():void; onresult:((event:{results:ArrayLike<{0:{transcript:string}}>})=>void)|null; onend:(()=>void)|null; };
declare global { interface Window { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor; } }

const START: Msg[] = [{ role:"coco", text:"Hey 👋 I’m Coco, your Cookie assistant. What should I call you?", createdAt:Date.now() }];
const voices = ["Warm","Bright","Calm","Deep"];
const wait = (ms:number) => new Promise(resolve => window.setTimeout(resolve, ms));
const cleanAssistantName = (value?: string) => {
  const name=(value||"").trim();
  if(!name || /^(zee|zee ai)$/i.test(name)) return "Coco";
  return name;
};

export default function ZeeAI(){
  const [open,setOpen]=useState(false),[listening,setListening]=useState(false),[thinking,setThinking]=useState(false),[profileOpen,setProfileOpen]=useState(false),[regularChatOpen,setRegularChatOpen]=useState(false);
  const [input,setInput]=useState(""); const [messages,setMessages]=useState<Msg[]>(START); const [prefs,setPrefs]=useState<Prefs>({});
  const holdTimer=useRef<number|null>(null); const recognition=useRef<InstanceType<SpeechRecognitionCtor>|null>(null); const endRef=useRef<HTMLDivElement|null>(null);
  const cocoName=cleanAssistantName(prefs.cocoDisplayName);

  useEffect(()=>{
    const saved=localStorage.getItem("cookie-coco-messages")||localStorage.getItem("zale-zee-messages");
    if(saved){
      try{
        const parsed=JSON.parse(saved);
        setMessages(parsed.map((m:any)=>({
          ...m,
          role:m.role==="zee"?"coco":m.role,
          text:typeof m.text==="string"?m.text.replace(/\bZee AI\b/g,"Coco").replace(/\bZee\b/g,"Coco").replace(/\bZale\b/g,"Cookie"):m.text
        })));
      }catch{}
    }
    const p=localStorage.getItem("cookie-coco-prefs")||localStorage.getItem("zale-zee-prefs");
    if(p){
      try{
        const old=JSON.parse(p);
        const migratedName=cleanAssistantName(old.cocoDisplayName||old.zeeDisplayName);
        const migrated={...old,cocoDisplayName:migratedName};
        delete migrated.zeeDisplayName;
        setPrefs(migrated);
        localStorage.setItem("cookie-coco-prefs",JSON.stringify(migrated));
      }catch{}
    }
    const openCoco=()=>{setOpen(true);localStorage.setItem("cookie-coco-last-active",String(Date.now()));};
    window.addEventListener("zale:open-zee",openCoco); return()=>window.removeEventListener("zale:open-zee",openCoco);
  },[]);

  useEffect(()=>{
    const detect=()=>{ const compose=document.querySelector(".chat-compose,.compose-row"); const header=document.querySelector(".chat-head"); setRegularChatOpen(!!(compose&&header&&!document.querySelector(".zee-native-chat"))); };
    detect(); const observer=new MutationObserver(detect); observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["class","style"]}); return()=>observer.disconnect();
  },[open]);

  useEffect(()=>{localStorage.setItem("cookie-coco-messages",JSON.stringify(messages));endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,thinking]);
  useEffect(()=>{localStorage.setItem("cookie-coco-prefs",JSON.stringify({...prefs,cocoDisplayName:cleanAssistantName(prefs.cocoDisplayName)}));},[prefs]);

  async function replyNaturally(text:string,delay=1100){setThinking(true);await wait(delay);setMessages(m=>[...m,{role:"coco",text,createdAt:Date.now()}]);setThinking(false);}
  async function ask(text:string){
    const clean=text.trim(); if(!clean||thinking)return; localStorage.setItem("cookie-coco-last-active",String(Date.now())); setMessages(m=>[...m,{role:"user",text:clean,createdAt:Date.now()}]);setInput("");
    if(!prefs.name){setPrefs(p=>({...p,name:clean}));await replyNaturally(`Nice to meet you, ${clean}. Pick the voice you want me to use.`,1200);return;}
    if(!prefs.voice){const match=voices.find(v=>v.toLowerCase()===clean.toLowerCase())||clean;setPrefs(p=>({...p,voice:match}));await replyNaturally("Perfect. Last setup bit: choose what I’m allowed to understand inside Cookie. You can change this later.",1300);return;}
    if(!prefs.permissions){const all=/all|everything|yes|allow/i.test(clean);setPrefs(p=>({...p,permissions:{chats:all,friends:true,stories:all,media:all,activity:true},onboarded:true}));await replyNaturally("Done. I’ll only use the Cookie access you allow, and I’ll still confirm important actions before doing them. What do you want to do?",1400);return;}
    setThinking(true);try{const started=Date.now();const response=await fetch("/api/zee",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:clean,history:messages.slice(-12).map(m=>({...m,role:m.role==="coco"?"zee":m.role})),preferences:prefs})});const data=await response.json();const elapsed=Date.now()-started;if(elapsed<900)await wait(900-elapsed);setMessages(m=>[...m,{role:"coco",text:data.reply||"I’m here. Try that again for me?",createdAt:Date.now()}]);}catch{await wait(700);setMessages(m=>[...m,{role:"coco",text:"I couldn’t reach my brain just then. Try me again in a moment.",createdAt:Date.now()}]);}finally{setThinking(false);}
  }

  function startListening(){const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;setOpen(true);if(!Ctor){setMessages(m=>[...m,{role:"coco",text:"Voice listening isn’t supported by this browser yet, but you can type to me.",createdAt:Date.now()}]);return;}recognition.current?.stop();const r=new Ctor();r.continuous=false;r.interimResults=false;r.lang="en";r.onresult=e=>{const text=e.results[0]?.[0]?.transcript||"";setInput(text);void ask(text);};r.onend=()=>setListening(false);recognition.current=r;setListening(true);r.start();}
  function submit(e:FormEvent){e.preventDefault();void ask(input);} function changeDisplayName(){const next=window.prompt("Display name for Coco",cocoName);if(next?.trim())setPrefs(p=>({...p,cocoDisplayName:next.trim()}));}

  return <>
    {!regularChatOpen&&!open&&<button className="zee-quick" aria-label="Open Coco" title="Hold to talk to Coco" onClick={()=>setOpen(true)} onPointerDown={()=>{holdTimer.current=window.setTimeout(startListening,500)}} onPointerUp={()=>{if(holdTimer.current)window.clearTimeout(holdTimer.current)}}><img src="/cookie-logo-deeper-bite.png" alt=""/></button>}
    {open&&<div className="zee-native-chat chat-pane" role="dialog" aria-label="Coco chat">
      <div className="chat-head"><button className="chat-back" onClick={()=>{setOpen(false);setProfileOpen(false)}}>‹</button><button className="chat-profile-trigger" onClick={()=>setProfileOpen(true)}><span className="zee-native-avatar"><img src="/cookie-logo-deeper-bite.png" alt=""/></span><span><b>{cocoName} <i className="zee-ai-chip">AI</i></b><small className={thinking||listening?"live-activity":""}>{listening?"listening…":thinking?"typing…":"Your Cookie assistant"}</small></span></button><select aria-label="Automatic message deletion" defaultValue="never"><option value="after_viewing">After viewing</option><option value="24_hours">Within 24 hours</option><option value="2_days">Within 2 days</option><option value="never">Never delete</option></select></div>
      <div className="message-stream zee-native-stream">{messages.map((m,i)=><div key={i} className={`message-row ${m.role==="user"?"mine":"theirs"}`}><div className="message-bubble">{m.text}<small>{new Date(m.createdAt||Date.now()).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · {m.role==="user"?"Sent":"Received"}</small></div></div>)}{prefs.name&&!prefs.voice&&<div className="zee-native-actions">{voices.map(v=><button key={v} onClick={()=>void ask(v)}>{v}</button>)}</div>}{prefs.voice&&!prefs.permissions&&<div className="zee-native-actions"><button onClick={()=>void ask("Allow all")}>Allow suggested access</button><button onClick={()=>void ask("Limited")}>Use limited access</button></div>}{thinking&&<div className="message-row theirs"><div className="message-bubble zee-typing-dots">•••</div></div>}<div ref={endRef}/></div>
      <div className="chat-compose"><form className="compose-row" onSubmit={submit}><button type="button" title="Emoji">☺</button><button type="button" className="attach" title="More">＋</button><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Message..."/><button type="button" className={listening?"picker-active":""} onClick={startListening} title="Talk to Coco">🎙</button><button type="submit" title="Send">➤</button></form></div>
      {profileOpen&&<div className="zee-profile-backdrop" onClick={()=>setProfileOpen(false)}><div className="zee-profile-card" onClick={e=>e.stopPropagation()}><button className="zee-profile-close" onClick={()=>setProfileOpen(false)}>×</button><span className="zee-profile-avatar"><img src="/cookie-logo-deeper-bite.png" alt=""/></span><h2>{cocoName} <i className="zee-ai-chip">AI</i></h2><p>Your personal AI inside Cookie.</p><button onClick={changeDisplayName}>Change display name</button><button onClick={()=>{setProfileOpen(false);startListening()}}>Talk to Coco</button><small>Coco only uses the Cookie access you permit.</small></div></div>}
    </div>}
  </>;
}
