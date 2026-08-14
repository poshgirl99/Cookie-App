"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ZeeMessage = { role: "zee" | "user"; text: string };
type ZeePrefs = { name?: string; voice?: string; permissions?: { chats: boolean; friends: boolean; stories: boolean; media: boolean; activity: boolean }; onboarded?: boolean };
type SpeechRecognitionCtor = new () => { continuous: boolean; interimResults: boolean; lang: string; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; };
declare global { interface Window { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor; } }

const START: ZeeMessage[] = [{ role: "zee", text: "Hey 👋 I’m Zee. I’m your AI inside Zale. What should I call you?" }];
const voices = ["Warm", "Bright", "Calm", "Deep"];

export default function ZeeAI() {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false), [listening, setListening] = useState(false), [thinking, setThinking] = useState(false);
  const [input, setInput] = useState(""); const [messages, setMessages] = useState<ZeeMessage[]>(START); const [prefs, setPrefs] = useState<ZeePrefs>({});
  const holdTimer = useRef<number | null>(null); const recognition = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => { const saved = localStorage.getItem("zale-zee-messages"); if (saved) try { setMessages(JSON.parse(saved)); } catch {} const p = localStorage.getItem("zale-zee-prefs"); if (p) try { setPrefs(JSON.parse(p)); } catch {} const openZee = () => setOpen(true); window.addEventListener("zale:open-zee", openZee); return () => window.removeEventListener("zale:open-zee", openZee); }, []);
  useEffect(() => { localStorage.setItem("zale-zee-messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("zale-zee-prefs", JSON.stringify(prefs)); }, [prefs]);

  async function ask(text: string) {
    const clean = text.trim(); if (!clean || thinking) return;
    setMessages((m) => [...m, { role: "user", text: clean }]); setInput("");
    if (!prefs.name) { setPrefs((p) => ({ ...p, name: clean })); setMessages((m) => [...m, { role: "zee", text: `Nice to meet you, ${clean}. Pick the voice you want me to use.` }]); return; }
    if (!prefs.voice) { const match = voices.find((v) => v.toLowerCase() === clean.toLowerCase()) || clean; setPrefs((p) => ({ ...p, voice: match })); setMessages((m) => [...m, { role: "zee", text: "Perfect. Last setup bit: choose what I’m allowed to understand inside Zale. You can change this later." }]); return; }
    if (!prefs.permissions) { const allowAll = /all|everything|yes|allow/i.test(clean); setPrefs((p) => ({ ...p, permissions: { chats: allowAll, friends: true, stories: allowAll, media: allowAll, activity: true }, onboarded: true })); setMessages((m) => [...m, { role: "zee", text: "Done. I’ll only use the access you’ve allowed, and I’ll still confirm important actions before doing them. What do you want to do?" }]); return; }
    setThinking(true);
    try { const response = await fetch("/api/zee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, history: messages.slice(-12), preferences: prefs }) }); const data = await response.json(); setMessages((m) => [...m, { role: "zee", text: data.reply || "I’m here. Try that again for me?" }]); }
    catch { setMessages((m) => [...m, { role: "zee", text: "I couldn’t reach my brain just then. Try me again in a moment." }]); } finally { setThinking(false); }
  }

  function startListening() { const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition; setOpen(true); if (!Ctor) { setMessages((m) => [...m, { role: "zee", text: "Voice listening isn’t supported by this browser yet, but you can type to me." }]); return; } recognition.current?.stop(); const r = new Ctor(); r.continuous = false; r.interimResults = false; r.lang = "en"; r.onresult = (event) => { const text = event.results[0]?.[0]?.transcript || ""; setInput(text); void ask(text); }; r.onend = () => setListening(false); recognition.current = r; setListening(true); r.start(); }
  function submit(e: FormEvent) { e.preventDefault(); void ask(input); }

  return <><button className="zee-quick" aria-label="Open Zee AI" title="Hold to talk to Zee" onClick={() => setOpen(true)} onPointerDown={() => { holdTimer.current = window.setTimeout(startListening, 500); }} onPointerUp={() => { if (holdTimer.current) window.clearTimeout(holdTimer.current); }}><span className="zee-z">Z</span></button>
  {open && <div className={`zee-shell ${expanded ? "expanded" : ""}`} role="dialog" aria-label="Zee AI"><header><div className={`zee-orb ${listening ? "listening" : thinking ? "thinking" : ""}`}><b>Z</b></div><div><strong>Zee AI</strong><small>{listening ? "Listening…" : thinking ? "Thinking…" : "Your Zale assistant"}</small></div><span className="zee-spacer"/><button onClick={() => setExpanded(!expanded)} aria-label="Expand Zee">{expanded ? "↙" : "↗"}</button><button onClick={() => setOpen(false)} aria-label="Close Zee">×</button></header>
  <main>{messages.map((m,i) => <div key={i} className={`zee-message ${m.role}`}>{m.text}</div>)}{prefs.name && !prefs.voice && <div className="zee-choice-row">{voices.map(v => <button key={v} onClick={()=>void ask(v)}>{v}</button>)}</div>}{prefs.voice && !prefs.permissions && <div className="zee-permissions"><button onClick={()=>void ask("Allow all")}>Allow suggested access</button><button onClick={()=>void ask("Limited")}>Use limited access</button><small>Suggested: friends + activity always; chats, Stories and media only with your permission.</small></div>}{thinking && <div className="zee-message zee zee-dots">•••</div>}</main>
  <form onSubmit={submit}><button type="button" className={listening ? "active" : ""} onClick={startListening} aria-label="Talk to Zee">◉</button><input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask Zee anything…"/><button type="submit" aria-label="Send to Zee">↑</button></form><footer>AI can make mistakes. You control what Zee can access.</footer></div>}</>;
}
