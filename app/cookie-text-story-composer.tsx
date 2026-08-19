"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase";

const EMOJIS=["😂","😭","🥹","😍","🥰","😮","😎","🥳","🤍","❤️","💕","🔥","✨","💯","🙏🏾","🙌🏾","👏🏾","👀","🤭","😴","😤","🤯","💀","🍪","🎉","🎶","🌸","☀️","🌙","💜"];

type Mode="choose"|"text"|null;

export default function CookieTextStoryComposer(){
  const supabase=useMemo(()=>createClient(),[]);
  const [mode,setMode]=useState<Mode>(null);
  const [text,setText]=useState("");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const ta=useRef<HTMLTextAreaElement|null>(null);
  const allowMediaClick=useRef(false);

  useEffect(()=>{
    const bind=()=>{
      const add=document.querySelector(".story-add") as HTMLElement|null;
      if(!add||add.dataset.cookieStoryChooser==="1")return;
      add.dataset.cookieStoryChooser="1";
      const handler=(e:Event)=>{
        if(allowMediaClick.current){allowMediaClick.current=false;return;}
        e.preventDefault();e.stopPropagation();
        setMode("choose");
      };
      add.addEventListener("click",handler,true);
    };
    bind();
    const o=new MutationObserver(bind);o.observe(document.body,{childList:true,subtree:true});
    return()=>o.disconnect();
  },[]);

  function openMedia(){
    const input=document.querySelector(".story-add input[type='file']") as HTMLInputElement|null;
    if(!input)return;
    setMode(null);
    allowMediaClick.current=true;
    input.click();
  }

  async function postText(){
    const value=text.trim();if(!value||busy)return;
    setBusy(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please sign in again.");
      const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Could not create Story.");
      const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,"#6327d9");g.addColorStop(1,"#a855f7");ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 78px system-ui,-apple-system,Segoe UI,sans-serif";
      const max=820,words=value.split(/\s+/),lines:string[]=[];let line="";
      for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>max&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);
      const lh=102,start=960-((lines.length-1)*lh)/2;lines.slice(0,10).forEach((l,i)=>ctx.fillText(l,540,start+i*lh));
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not prepare Story.")),"image/png",.95));
      const path=`${user.id}/${crypto.randomUUID()}.png`;
      const up=await supabase.storage.from("story-media").upload(path,blob,{contentType:"image/png",upsert:false});if(up.error)throw up.error;
      const ins=await supabase.from("story_posts").insert({author_id:user.id,media_path:path,media_type:"image",caption:""});if(ins.error)throw ins.error;
      setText("");setEmojiOpen(false);setMode(null);setTimeout(()=>window.location.reload(),500);
    }catch(e:any){alert(e?.message||"Could not post Story.")}finally{setBusy(false)}
  }

  if(!mode)return null;
  return <div className="csc-backdrop" onClick={()=>setMode(null)}>
    {mode==="choose"&&<section className="csc-sheet" onClick={e=>e.stopPropagation()}>
      <div className="csc-handle" />
      <h2>Add Story</h2>
      <p>What would you like to share?</p>
      <button className="csc-option" onClick={()=>setMode("text")}><span>✎</span><div><b>Text Story</b><small>Type on a coloured background and add emojis</small></div><i>›</i></button>
      <button className="csc-option" onClick={openMedia}><span>▧</span><div><b>Photo / Video</b><small>Choose media from your device</small></div><i>›</i></button>
      <button className="csc-cancel" onClick={()=>setMode(null)}>Cancel</button>
    </section>}
    {mode==="text"&&<section className="csc-text-modal" onClick={e=>e.stopPropagation()}>
      <header><div><small>TEXT STORY</small><h2>Say it your way.</h2></div><button onClick={()=>setMode(null)}>×</button></header>
      <div className="csc-canvas">
        <textarea ref={ta} autoFocus value={text} maxLength={240} placeholder="Type your Story…" onChange={e=>setText(e.target.value)} />
        {emojiOpen&&<div className="csc-emoji-tray">{EMOJIS.map(e=><button key={e} onClick={()=>{setText(v=>v+e);requestAnimationFrame(()=>ta.current?.focus())}}>{e}</button>)}</div>}
        <div className="csc-canvas-actions"><button onClick={()=>setEmojiOpen(v=>!v)} aria-label="Open emoji tray">☺</button><span>{text.length}/240</span></div>
      </div>
      <div className="csc-footer"><button className="csc-back" onClick={()=>{setEmojiOpen(false);setMode("choose")}}>Back</button><button className="csc-post" disabled={!text.trim()||busy} onClick={postText}>{busy?"Posting…":"Post Story"}</button></div>
    </section>}
    <style jsx global>{`.csc-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(28,20,35,.46);display:flex;align-items:flex-end;justify-content:center;padding:18px;box-sizing:border-box;backdrop-filter:blur(3px)}.csc-sheet{width:min(430px,100%);background:#fffaf4;color:#382317;border-radius:26px;padding:14px 18px 18px;box-shadow:0 24px 70px rgba(0,0,0,.24)}.csc-handle{width:42px;height:5px;border-radius:999px;background:#d8c8b8;margin:0 auto 16px}.csc-sheet h2{margin:0 0 4px;font-size:24px}.csc-sheet>p{margin:0 0 16px;opacity:.62}.csc-option{width:100%;display:grid;grid-template-columns:48px 1fr 18px;gap:12px;align-items:center;border:1px solid #eadfce;background:#fff;border-radius:18px;padding:13px;text-align:left;color:inherit;margin-top:10px}.csc-option>span{width:46px;height:46px;border-radius:14px;background:#f3e6d4;display:grid;place-items:center;font-size:23px}.csc-option div{display:flex;flex-direction:column;gap:3px}.csc-option small{opacity:.58}.csc-option i{font-style:normal;opacity:.4}.csc-cancel{width:100%;margin-top:14px;border:0;background:transparent;padding:10px;color:#6b5648;font-weight:700}.csc-text-modal{width:min(660px,100%);max-height:94vh;background:#fff;border-radius:28px;padding:24px;box-sizing:border-box;color:#28154a;overflow:auto;box-shadow:0 24px 80px rgba(0,0,0,.28)}.csc-text-modal header{display:flex;justify-content:space-between;align-items:flex-start}.csc-text-modal header small{font-size:12px;letter-spacing:.12em;color:#7b42e8;font-weight:800}.csc-text-modal header h2{font-size:34px;margin:8px 0 18px}.csc-text-modal header button{border:0;width:46px;height:46px;border-radius:50%;background:#f4effb;font-size:25px;color:#382317}.csc-canvas{position:relative;min-height:560px;border-radius:28px;overflow:hidden;background:linear-gradient(145deg,#6327d9,#a855f7)}.csc-canvas textarea{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:0;outline:0;resize:none;background:transparent;color:white;text-align:center;padding:38% 9% 92px;font:700 clamp(32px,5vw,58px)/1.16 system-ui,-apple-system,Segoe UI,sans-serif;caret-color:white}.csc-canvas textarea::placeholder{color:rgba(255,255,255,.9)}.csc-canvas-actions{position:absolute;left:15px;right:15px;bottom:15px;display:flex;align-items:center;gap:10px;background:rgba(39,19,66,.28);padding:8px 10px;border-radius:17px;backdrop-filter:blur(9px)}.csc-canvas-actions button{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:22px}.csc-canvas-actions span{margin-left:auto;color:rgba(255,255,255,.78);font-size:11px;font-weight:700}.csc-emoji-tray{position:absolute;left:14px;right:14px;bottom:75px;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;background:#fffaf4;padding:10px;border-radius:17px;max-height:180px;overflow:auto;box-shadow:0 14px 35px rgba(0,0,0,.22)}.csc-emoji-tray button{border:0;background:transparent;font-size:24px;padding:6px}.csc-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}.csc-footer button{border:0;border-radius:14px;padding:12px 18px;font-weight:800}.csc-back{background:#f1e5d5;color:#4b2d1c}.csc-post{background:#4b2d1c;color:white}.csc-post:disabled{opacity:.42}@media(max-width:600px){.csc-backdrop{padding:0;align-items:flex-end}.csc-sheet{border-radius:26px 26px 0 0}.csc-text-modal{height:100%;max-height:100%;border-radius:0;padding:18px}.csc-text-modal header h2{font-size:28px}.csc-canvas{min-height:66vh;border-radius:24px}.csc-canvas textarea{padding:40% 7% 86px;font-size:36px}.csc-footer{padding-bottom:env(safe-area-inset-bottom)}}`}</style>
  </div>;
}
