"use client";

import { useMemo, useState } from "react";

const verses = [
  ["Psalm 55:22", "Give your burdens to God and trust Him to sustain you."],
  ["Isaiah 41:10", "Do not fear. God is with you, strengthens you and helps you."],
  ["Philippians 4:6–7", "Bring everything to God in prayer and let His peace guard your heart."],
  ["Proverbs 3:5–6", "Trust God wholeheartedly and let Him direct your path."],
] as const;

export default function FaithPage() {
  const [request, setRequest] = useState("");
  const [shared, setShared] = useState(false);
  const verse = useMemo(() => verses[new Date().getDate() % verses.length], []);

  return (
    <main className="faith-shell">
      <header className="faith-head">
        <a href="/" className="faith-brand"><span>Z</span><b>Zale</b></a>
        <a href="/" className="faith-back">Back to Zale</a>
      </header>

      <section className="faith-hero">
        <span className="faith-kicker">FAITH SPACE</span>
        <h1>A quieter place for what matters.</h1>
        <p>Scripture, prayer and encouragement with your people. Completely optional.</p>
      </section>

      <section className="faith-grid">
        <article className="faith-card verse-card">
          <span className="faith-kicker">VERSE FOR TODAY</span>
          <p>“{verse[1]}”</p>
          <b>{verse[0]}</b>
          <button type="button" onClick={() => navigator.clipboard?.writeText(`${verse[1]} — ${verse[0]}`)}>Copy verse</button>
        </article>

        <article className="faith-card prayer-card">
          <span className="faith-kicker">PRAYER CIRCLE</span>
          <h2>What can your people pray with you about?</h2>
          <textarea value={request} onChange={(e) => setRequest(e.target.value)} maxLength={240} placeholder="You can keep it simple…" />
          <div className="faith-actions">
            <small>Nothing is shared until you choose to share it.</small>
            <button type="button" disabled={!request.trim()} onClick={() => { setShared(true); setRequest(""); }}>Share with my circle</button>
          </div>
          {shared && <p className="faith-success">♡ Prayer request ready. Friends will be able to respond “Praying for you”.</p>}
        </article>
      </section>

      <section className="faith-coming">
        <h2>Coming into Faith Space</h2>
        <div className="faith-chips"><span>Praying for you 🤍</span><span>Faith interests</span><span>Scripture cards</span><span>Prayer groups</span><span>Devotionals</span></div>
      </section>

      <style jsx>{`
        .faith-shell{min-height:100vh;background:linear-gradient(180deg,#fbfaff,#f2edff);color:#241443;font-family:Inter,Segoe UI,Arial,sans-serif;padding-bottom:60px}.faith-head{height:72px;padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #ebe5f7;position:sticky;top:0}.faith-brand{display:flex;align-items:center;gap:10px;color:#241443;text-decoration:none;font-size:24px}.faith-brand span{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(145deg,#8f59ff,#642dd7);color:#fff;font-weight:1000}.faith-back{color:#6d3fd7;text-decoration:none;font-weight:800}.faith-hero{max-width:900px;margin:70px auto 35px;padding:0 24px;text-align:center}.faith-kicker{font-size:12px;letter-spacing:2px;font-weight:900;color:#7a4ce2}.faith-hero h1{font-size:clamp(42px,7vw,76px);line-height:.98;letter-spacing:-3px;margin:14px 0;color:#1d123f}.faith-hero p{font-size:18px;color:#756a90}.faith-grid{max-width:1050px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:22px}.faith-card{background:#fff;border:1px solid #e5def6;border-radius:28px;padding:28px;box-shadow:0 18px 50px #4e337015}.verse-card p{font-size:27px;line-height:1.35;margin:28px 0 16px}.verse-card b{display:block;font-size:16px;margin-bottom:28px}.faith-card button{border:0;border-radius:14px;background:#6d3fd7;color:#fff;font-weight:900;padding:12px 17px;cursor:pointer}.prayer-card h2{font-size:28px;line-height:1.1;margin:18px 0}.prayer-card textarea{width:100%;min-height:150px;border:1px solid #ded6f0;border-radius:18px;padding:16px;font:inherit;resize:vertical;outline:none}.prayer-card textarea:focus{border-color:#7b4bea;box-shadow:0 0 0 4px #7b4bea15}.faith-actions{margin-top:14px;display:flex;gap:14px;align-items:center;justify-content:space-between}.faith-actions small{color:#7a718e}.faith-actions button:disabled{opacity:.4}.faith-success{margin-top:16px;background:#f1ecff;padding:12px 14px;border-radius:14px;font-weight:700;color:#5b36ba}.faith-coming{max-width:1050px;margin:30px auto 0;padding:0 24px}.faith-coming h2{font-size:24px}.faith-chips{display:flex;flex-wrap:wrap;gap:10px}.faith-chips span{background:#fff;border:1px solid #e2daf4;border-radius:999px;padding:10px 14px;font-weight:800;color:#5e45a4}@media(max-width:760px){.faith-head{height:64px;padding:0 16px}.faith-brand b{font-size:20px}.faith-back{font-size:13px}.faith-hero{margin-top:45px}.faith-grid{grid-template-columns:1fr}.faith-actions{align-items:flex-start;flex-direction:column}.faith-actions button{width:100%}}
      `}</style>
    </main>
  );
}
