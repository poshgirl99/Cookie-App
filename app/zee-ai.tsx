"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ZeeMessage = { role: "zee" | "user"; text: string };
type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const START: ZeeMessage[] = [{ role: "zee", text: "Hey 👋 I’m Zee. I’m your AI inside Zale. What should I call you?" }];

export default function ZeeAI() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ZeeMessage[]>(START);
  const holdTimer = useRef<number | null>(null);
  const recognition = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("zale-zee-messages");
    if (saved) try { setMessages(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("zale-zee-messages", JSON.stringify(messages)); }, [messages]);

  async function ask(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    setMessages((m) => [...m, { role: "user", text: clean }]);
    setInput(""); setThinking(true);
    try {
      const response = await fetch("/api/zee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: clean, history: messages.slice(-12) }) });
      const data = await response.json();
      setMessages((m) => [...m, { role: "zee", text: data.reply || "I’m here. Try that again for me?" }]);
    } catch { setMessages((m) => [...m, { role: "zee", text: "I couldn’t reach my brain just then. Try me again in a moment." }]); }
    finally { setThinking(false); }
  }

  function startListening() {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setOpen(true);
    if (!Ctor) { setMessages((m) => [...m, { role: "zee", text: "Voice listening isn’t supported by this browser yet, but you can type to me." }]); return; }
    recognition.current?.stop();
    const r = new Ctor(); r.continuous = false; r.interimResults = false; r.lang = "en";
    r.onresult = (event) => { const text = event.results[0]?.[0]?.transcript || ""; setInput(text); void ask(text); };
    r.onend = () => setListening(false); recognition.current = r; setListening(true); r.start();
  }

  function submit(e: FormEvent) { e.preventDefault(); void ask(input); }

  return <>
    <button className="zee-quick" aria-label="Open Zee AI" title="Hold to talk to Zee"
      onClick={() => setOpen(true)}
      onPointerDown={() => { holdTimer.current = window.setTimeout(startListening, 500); }}
      onPointerUp={() => { if (holdTimer.current) window.clearTimeout(holdTimer.current); }}>
      <span className="zee-z">Z</span>
    </button>
    {open && <div className={`zee-shell ${expanded ? "expanded" : ""}`} role="dialog" aria-label="Zee AI">
      <header><div className={`zee-orb ${listening ? "listening" : thinking ? "thinking" : ""}`}><b>Z</b></div><div><strong>Zee AI</strong><small>{listening ? "Listening…" : thinking ? "Thinking…" : "Your Zale assistant"}</small></div><span className="zee-spacer"/><button onClick={() => setExpanded(!expanded)} aria-label="Expand Zee">{expanded ? "↙" : "↗"}</button><button onClick={() => setOpen(false)} aria-label="Close Zee">×</button></header>
      <main>{messages.map((m,i) => <div key={i} className={`zee-message ${m.role}`}>{m.text}</div>)}{thinking && <div className="zee-message zee zee-dots">•••</div>}</main>
      <form onSubmit={submit}><button type="button" className={listening ? "active" : ""} onClick={startListening} aria-label="Talk to Zee">◉</button><input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="Ask Zee anything…"/><button type="submit" aria-label="Send to Zee">↑</button></form>
      <footer>AI can make mistakes. You control what Zee can access.</footer>
    </div>}
  </>;
}
