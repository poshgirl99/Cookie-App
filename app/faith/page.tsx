"use client";

import { useEffect, useMemo, useState } from "react";

const verses = [
  ["Psalm 55:22", "Give your burdens to God and trust Him to sustain you."],
  ["Isaiah 41:10", "Do not fear. God is with you, strengthens you and helps you."],
  ["Philippians 4:6–7", "Bring everything to God in prayer and let His peace guard your heart."],
  ["Proverbs 3:5–6", "Trust God wholeheartedly and let Him direct your path."],
] as const;

type Reflection = { text: string; createdAt: string };

export default function FaithPage() {
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<Reflection[]>([]);
  const verse = useMemo(() => verses[new Date().getDate() % verses.length], []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zale-faith-reflections");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  function saveReflection() {
    const text = reflection.trim();
    if (!text) return;
    const next = [{ text, createdAt: new Date().toISOString() }, ...history].slice(0, 12);
    setHistory(next);
    setReflection("");
    setSaved(true);
    try { localStorage.setItem("zale-faith-reflections", JSON.stringify(next)); } catch {}
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="faith-shell">
      <header className="faith-head">
        <a href="/" className="faith-brand"><span>Z</span><b>Zale</b></a>
        <a href="/" className="faith-back">Back to Zale</a>
      </header>

      <section className="faith-hero">
        <span className="faith-kicker">FAITH SPACE</span>
        <h1>A quieter place for what matters.</h1>
        <p>Scripture and a private space to notice what God may be doing in your life.</p>
      </section>

      <section className="faith-grid">
        <article className="faith-card verse-card">
          <span className="faith-kicker">VERSE FOR TODAY</span>
          <p>“{verse[1]}”</p>
          <b>{verse[0]}</b>
          <button type="button" onClick={() => navigator.clipboard?.writeText(`${verse[1]} — ${verse[0]}`)}>Copy verse</button>
        </article>

        <article className="faith-card reflection-card">
          <span className="faith-kicker">MY REFLECTION</span>
          <h2>What has God been convicting you about lately?</h2>
          <p className="reflection-intro">Write what keeps returning to your heart — something to change, surrender, begin, stop, pray about or pay closer attention to.</p>
          <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} maxLength={600} placeholder="What keeps coming back to your heart?" />
          <div className="prompt-row"><span>What am I learning?</span><span>What am I being called to act on?</span><span>What do I need to surrender?</span></div>
          <div className="faith-actions">
            <small>🔒 Private to you. This is not posted to your Feed or shared with friends.</small>
            <button type="button" disabled={!reflection.trim()} onClick={saveReflection}>Save reflection</button>
          </div>
          {saved && <p className="faith-success">✓ Saved privately to your Faith Space.</p>}
        </article>
      </section>

      {history.length > 0 && <section className="faith-history">
        <span className="faith-kicker">MY JOURNEY</span>
        <h2>Things God has been placing on your heart</h2>
        <div className="history-list">{history.slice(0,4).map((item,index)=><article key={`${item.createdAt}-${index}`}><time>{new Date(item.createdAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}</time><p>{item.text}</p></article>)}</div>
      </section>}

      <section className="faith-coming">
        <h2>Faith Space can grow with you</h2>
        <div className="faith-chips"><span>Faith interests</span><span>Scripture cards</span><span>Reflection history</span><span>Devotionals</span></div>
      </section>

      <style jsx>{`
        .faith-shell{min-height:100vh;background:linear-gradient(180deg,#fbfaff,#f2edff);color:#241443;font-family:Inter,Segoe UI,Arial,sans-serif;padding-bottom:60px}.faith-head{height:72px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #ebe5f7;position:sticky;top:0;z-index:10}.faith-brand{display:flex;align-items:center;gap:10px;color:#241443;text-decoration:none;font-size:24px}.faith-brand span{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#8f59ff,#642dd7);color:#fff;font-weight:1000}.faith-back{color:#6d3fd7;text-decoration:none;font-weight:800}.faith-hero{max-width:900px;margin:70px auto 35px;padding:0 24px;text-align:center}.faith-kicker{font-size:12px;letter-spacing:2px;font-weight:900;color:#7a4ce2}.faith-hero h1{font-size:clamp(42px,7vw,76px);line-height:.98;letter-spacing:-3px;margin:14px 0;color:#1d123f}.faith-hero p{font-size:18px;color:#756a90}.faith-grid{max-width:1100px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:.8fr 1.2fr;gap:22px;align-items:start}.faith-card{background:#fff;border:1px solid #e5def6;border-radius:28px;padding:28px;box-shadow:0 18px 50px #4e337015}.verse-card p{font-size:27px;line-height:1.35;margin:28px 0 16px}.verse-card b{display:block;font-size:16px;margin-bottom:28px}.faith-card button{border:0;border-radius:14px;background:#6d3fd7;color:#fff;font-weight:900;padding:12px 17px;cursor:pointer}.reflection-card h2{font-size:30px;line-height:1.08;margin:18px 0 10px}.reflection-intro{color:#756a90;line-height:1.55}.reflection-card textarea{box-sizing:border-box;width:100%;min-height:170px;border:1px solid #ded6f0;border-radius:18px;padding:16px;font:inherit;resize:vertical;outline:none;margin-top:8px}.reflection-card textarea:focus{border-color:#7b4bea;box-shadow:0 0 0 4px #7b4bea15}.prompt-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.prompt-row span{font-size:12px;background:#f5f1ff;color:#67558f;padding:8px 10px;border-radius:999px}.faith-actions{margin-top:18px;display:flex;gap:14px;align-items:center;justify-content:space-between}.faith-actions small{color:#7a718e;max-width:60%}.faith-actions button:disabled{opacity:.4}.faith-success{margin-top:16px;background:#f1ecff;padding:12px 14px;border-radius:14px;font-weight:700;color:#5b36ba}.faith-history{max-width:1100px;margin:30px auto 0;padding:28px 24px}.faith-history h2{font-size:28px;margin:8px 0 18px}.history-list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.history-list article{background:#fff;border:1px solid #e5def6;border-radius:20px;padding:18px}.history-list time{font-size:12px;color:#806da7;font-weight:800}.history-list p{margin:9px 0 0;line-height:1.5}.faith-coming{max-width:1050px;margin:10px auto 0;padding:0 24px}.faith-coming h2{font-size:24px}.faith-chips{display:flex;flex-wrap:wrap;gap:10px}.faith-chips span{background:#fff;border:1px solid #e2daf4;border-radius:999px;padding:10px 14px;font-weight:800;color:#5e45a4}@media(max-width:760px){.faith-head{height:64px;padding:0 16px}.faith-brand b{font-size:20px}.faith-back{font-size:13px}.faith-hero{margin-top:45px}.faith-grid{grid-template-columns:1fr}.faith-actions{align-items:stretch;flex-direction:column}.faith-actions small{max-width:100%}.faith-actions button{width:100%}.history-list{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
