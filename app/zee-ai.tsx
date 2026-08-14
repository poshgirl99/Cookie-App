"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ZeeMessage = { role: "zee" | "user"; text: string; createdAt?: number };
type ZeePrefs = { name?: string; voice?: string; zeeDisplayName?: string; permissions?: { chats: boolean; friends: boolean; stories: boolean; media: boolean; activity: boolean }; onboarded?: boolean };
type SpeechRecognitionCtor = new () => { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; };
declare global { interface Window { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor; } }

const START: ZeeMessage[] = [{ role: "zee", text: "Hey 👋 I’m Zee. I’m your AI inside Zale. What should I call you?", createdAt: Date.now() }];
const voices = ["Warm", "Bright", "Calm", "Deep"];
const wait = (ms:number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function ZeeAI() {
  const [open, setOpen] = useState(false), [listening, setListening] = useState(false), [thinking, setThinking] = useState(false), [profileOpen, setProfileOpen] = useState(false);
  const [input, setInput] = useState(""); const [messages, setMessages] = useState<ZeeMessage[]>(START); const [prefs, setPrefs] = useState<ZeePrefs>({});
  const holdTimer = useRef<number | null>(null); const recognition = useRef<InstanceType<SpeechRecognitionCtor> | null>(null); const endRef = useRef<HTMLDivElement | null>(null);
  const zeeName = prefs.zeeDisplayName?.trim() || "Zee AI";

  useEffect(() => {
    const saved = localStorage.getItem("zale-zee-messages"); if (saved) try { setMessages(JSON.parse(saved)); } catch {}
    const p = localStorage.getItem("zale-zee-prefs"); if (p) try { setPrefs(JSON.parse(p)); } catch {}
    const openZee = () => { setOpen(true); localStorage.setItem("zale-zee-last-active", String(Date.now())); };
    window.addEventListener("zale:open-zee", openZee);
    return () => window.removeEventListener("zale:open-zee", openZee);
  }, []);
  useEffect(() => { localStorage.setItem("zale-zee-messages", JSON.stringify(messages)); endRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);
  useEffect(() => { localStorage.setItem("zale-zee-prefs", JSON.stringify(prefs)); }, [prefs]);

  async function replyNaturally(text:string, delay=1100){ setThinking(true); await wait(delay); setMessages((m)=>[...m,{role:"zee",text,createdAt:Date.now()}]); setThinking(false); }

  async function ask(text: string) {
    const clean = text.trim(); if (!clean || thinking) return;
    localStorage.setItem("zale-zee-last-active", String(Date.now()));
    setMessages((m) => [...m, { role: "user", text: clean, createdAt: Date.now() }]); setInput("");
    if (!prefs.name) { setPrefs((p) => ({ ...p, name: clean })); await replyNaturally(`Nice to meet you, ${clean}. Pick the voice you want me to use.`, 1200); return; }
    if (!prefs.voice) { const match = voices.find((v) => v.toLowerCase() === clean.toLowerCase()) || clean; setPrefs((p) => ({ ...p, voice: match })); await replyNaturally("Perfect. Last setup bit: choose what I’m allowed to understand inside Zale. You can change this later.", 1300); return; }
    if (!prefs.permissions) { const allowAll = /all|everything|yes|allow/i.test(clean); setPrefs((p) => ({ ...p, permissions: { chats: allowAll, friends: true, stories: allowAll, media: allowAll, activity: true }, onboarded: true })); await replyNaturally("Done. I’ll only use the access you’ve allowed, and I’ll still confirm important actions before doing them. What do you want to do?", 1400); return; }
    setThinking(true);
    try {
      const started=Date.now();
      const response = await fetch("/api/zee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, history: messages.slice(-12), preferences: prefs }) });
      const data = await response.json();
      const elapsed=Date.now()-started; if(elapsed<900) await wait(900-elapsed);
      setMessages((m) => [...m, { role: "zee", text: data.reply || "I’m here. Try that again for me?", createdAt: Date.now() }]);
    }
    catch { await wait(700); setMessages((m) => [...m, { role: "zee", text: "I couldn’t reach my brain just then. Try me again in a moment.", createdAt: Date.now() }]); }
    finally { setThinking(false); }
  }

  function startListening() { const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition; setOpen(true); localStorage.setItem("zale-zee-last-active", String(Date.now())); if (!Ctor) { setMessages((m) => [...m, { role: "zee", text: "Voice listening isn’t supported by this browser yet, but you can type to me.", createdAt: Date.now() }]); return; } recognition.current?.stop(); const r = new Ctor(); r.continuous = false; r.interimResults = false; r.lang = "en"; r.onresult = (event) => { const text = event.results[0]?.[0]?.transcript || ""; setInput(text); void ask(text); }; r.onend = () => setListening(false); recognition.current = r; setListening(true); r.start(); }
  function submit(e: FormEvent) { e.preventDefault(); void ask(input); }
  function changeDisplayName(){ const next=window.prompt("Display name for Zee",zeeName); if(next?.trim()) setPrefs(p=>({...p,zeeDisplayName:next.trim()})); }

  return <>
    <button className="zee-quick" aria-label="Open Zee AI" title="Hold to talk to Zee" onClick={() => setOpen(true)} onPointerDown={() => { holdTimer.current = window.setTimeout(startListening, 500); }} onPointerUp={() => { if (holdTimer.current) window.clearTimeout(holdTimer.current); }}><span className="zee-z">Z</span></button>
    {open && <div className="zee-native-chat chat-pane" role="dialog" aria-label="Zee AI chat">
      <div className="chat-head">
        <button className="chat-back" onClick={()=>{setOpen(false);setProfileOpen(false)}}>‹</button>
        <button className="chat-profile-trigger" type="button" onClick={()=>setProfileOpen(true)} aria-label={`View ${zeeName} profile`}>
          <span className="zee-native-avatar">Z</span>
          <span><b>{zeeName} <i className="zee-ai-chip">AI</i></b><small className={thinking || listening ? "live-activity" : ""}>{listening ? "listening…" : thinking ? "typing…" : "Your Zale assistant"}</small></span>
        </button>
        <select aria-label="Automatic message deletion" defaultValue="never"><option value="after_viewing">After viewing</option><option value="24_hours">Within 24 hours</option><option value="2_days">Within 2 days</option><option value="never">Never delete</option></select>
      </div>
      <div className="message-stream zee-native-stream">
        {messages.map((m,i)=><div key={i} className={`message-row ${m.role === "user" ? "mine" : "theirs"}`}><div className="message-bubble">{m.text}<small>{new Date(m.createdAt || Date.now()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · {m.role === "user" ? "Sent" : "Received"}</small></div></div>)}
        {prefs.name && !prefs.voice && <div className="zee-native-actions">{voices.map(v=><button key={v} onClick={()=>void ask(v)}>{v}</button>)}</div>}
        {prefs.voice && !prefs.permissions && <div className="zee-native-actions"><button onClick={()=>void ask("Allow all")}>Allow suggested access</button><button onClick={()=>void ask("Limited")}>Use limited access</button></div>}
        {thinking && <div className="message-row theirs"><div className="message-bubble zee-typing-dots">•••</div></div>}
        <div ref={endRef}/>
      </div>
      <div className="chat-compose"><div className="compose-row"><button title="Emoji">☺</button><button className="attach" title="More">＋</button><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void ask(input)}}} placeholder="Message..."/><button className={listening?"picker-active":""} onClick={startListening} title="Talk to Zee">🎙</button><button onClick={()=>void ask(input)} title="Send">➤</button></div></div>
      {profileOpen && <div className="zee-profile-backdrop" onClick={()=>setProfileOpen(false)}><div className="zee-profile-card" onClick={e=>e.stopPropagation()}><button className="zee-profile-close" onClick={()=>setProfileOpen(false)}>×</button><span className="zee-profile-avatar">Z</span><h2>{zeeName} <i className="zee-ai-chip">AI</i></h2><p>Your personal AI inside Zale.</p><button onClick={changeDisplayName}>Change display name</button><button onClick={()=>{setProfileOpen(false);startListening()}}>Talk to Zee</button><small>Zee only uses the Zale access you permit.</small></div></div>}
    </div>}
  </>;
}
