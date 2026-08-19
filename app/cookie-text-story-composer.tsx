"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase";

const EMOJIS=["😂","😭","🥹","😍","🥰","😮","😎","🥳","🤍","❤️","💕","🔥","✨","💯","🙏🏾","🙌🏾","👏🏾","👀","🤭","😴","😤","🤯","💀","🍪","🎉","🎶","🌸","☀️","🌙","💜"];

function visible(el:HTMLElement){const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=="none"&&s.visibility!=="hidden"}
function looksPurple(el:HTMLElement){const s=getComputedStyle(el);const bg=`${s.background} ${s.backgroundColor} ${s.backgroundImage}`.toLowerCase();return bg.includes("rgb(126")||bg.includes("rgb(139")||bg.includes("rgb(147")||bg.includes("purple")||bg.includes("linear-gradient")}
function findTextStoryTarget(){
  const all=[...document.querySelectorAll("body *")] as HTMLElement[];
  const label=all.find(el=>{const t=(el.textContent||"").trim().replace(/…/g,"...");return visible(el)&&t==="Type your Story...";});
  if(!label)return null;
  let p:HTMLElement|null=label;
  for(let i=0;i<7&&p&&p!==document.body;i++,p=p.parentElement){const r=p.getBoundingClientRect();if(r.width>=260&&r.height>=280&&(looksPurple(p)||r.height>500))return p}
  return label.parentElement||label;
}

export default function CookieTextStoryComposer(){
  const supabase=useMemo(()=>createClient(),[]);
  const [target,setTarget]=useState<DOMRect|null>(null);
  const [text,setText]=useState("");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const ta=useRef<HTMLTextAreaElement|null>(null);

  useEffect(()=>{
    let last="";
    const update=()=>{const el=findTextStoryTarget();if(!el){if(last){last="";setTarget(null)}return}const r=el.getBoundingClientRect();const sig=`${Math.round(r.left)}:${Math.round(r.top)}:${Math.round(r.width)}:${Math.round(r.height)}`;if(sig!==last){last=sig;setTarget(r)}};
    update();const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true,attributes:true});const timer=setInterval(update,350);window.addEventListener("resize",update);window.addEventListener("scroll",update,true);
    return()=>{observer.disconnect();clearInterval(timer);window.removeEventListener("resize",update);window.removeEventListener("scroll",update,true)};
  },[]);

  async function post(){
    const value=text.trim();if(!value||busy)return;
    setBusy(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please sign in again.");
      const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Could not create Story.");
      const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,"#6327d9");g.addColorStop(1,"#a855f7");ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 78px system-ui, -apple-system, Segoe UI, sans-serif";
      const max=820,words=value.split(/\s+/),lines:string[]=[];let line="";for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>max&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);const lh=102,start=960-((lines.length-1)*lh)/2;lines.slice(0,10).forEach((l,i)=>ctx.fillText(l,540,start+i*lh));
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not prepare Story.")),"image/png",.95));const path=`${user.id}/${crypto.randomUUID()}.png`;
      const up=await supabase.storage.from("story-media").upload(path,blob,{contentType:"image/png",upsert:false});if(up.error)throw up.error;
      const ins=await supabase.from("story_posts").insert({author_id:user.id,media_path:path,media_type:"image",caption:""});if(ins.error)throw ins.error;
      setSent(true);setText("");setEmojiOpen(false);setTimeout(()=>window.location.reload(),700);
    }catch(e:any){alert(e?.message||"Could not post Story.")}finally{setBusy(false)}
  }

  if(!target)return null;
  return <div className="cts-wrap" style={{top:target.top,left:target.left,width:target.width,height:target.height}}>
    <textarea ref={ta} value={text} maxLength={240} placeholder="Type your Story…" onChange={e=>setText(e.target.value)} onClick={()=>ta.current?.focus()} />
    <div className="cts-actions"><button className="cts-emoji" type="button" onClick={()=>setEmojiOpen(v=>!v)} aria-label="Open emoji tray">☺</button><span>{text.length}/240</span><button className="cts-post" type="button" disabled={!text.trim()||busy} onClick={post}>{busy?"Posting…":"Post Story"}</button></div>
    {emojiOpen&&<div className="cts-tray">{EMOJIS.map(e=><button key={e} type="button" onClick={()=>{setText(v=>v+e);requestAnimationFrame(()=>ta.current?.focus())}}>{e}</button>)}</div>}
    {sent&&<div className="cts-sent">Story posted ✓</div>}
    <style jsx global>{`.cts-wrap{position:fixed;z-index:2147482000;box-sizing:border-box;pointer-events:none;border-radius:30px;overflow:visible}.cts-wrap textarea{pointer-events:auto;position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;resize:none;border:0;outline:0;background:transparent;color:#fff;text-align:center;padding:38% 9% 110px;font:700 clamp(30px,4vw,56px)/1.18 system-ui,-apple-system,Segoe UI,sans-serif;caret-color:#fff;border-radius:inherit}.cts-wrap textarea::placeholder{color:rgba(255,255,255,.92)}.cts-actions{pointer-events:auto;position:absolute;left:18px;right:18px;bottom:18px;display:flex;align-items:center;gap:10px;background:rgba(33,16,62,.34);backdrop-filter:blur(10px);padding:9px 10px;border-radius:18px}.cts-actions span{font:600 11px system-ui;color:rgba(255,255,255,.8);margin-left:auto}.cts-actions button{border:0;cursor:pointer}.cts-emoji{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:22px}.cts-post{border-radius:14px;padding:11px 15px;background:#fff;color:#4d1f78;font-weight:800}.cts-post:disabled{opacity:.45}.cts-tray{pointer-events:auto;position:absolute;left:18px;right:18px;bottom:78px;display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:10px;background:#fffaf4;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.22);max-height:180px;overflow:auto}.cts-tray button{border:0;background:transparent;font-size:24px;padding:6px;cursor:pointer}.cts-sent{position:absolute;left:50%;top:18px;transform:translateX(-50%);background:#fff;color:#4d1f78;padding:9px 14px;border-radius:999px;font:800 12px system-ui;box-shadow:0 8px 22px rgba(0,0,0,.18)}@media(max-width:600px){.cts-wrap textarea{padding:40% 7% 100px;font-size:32px}.cts-actions{left:10px;right:10px;bottom:10px}.cts-tray{left:10px;right:10px;bottom:70px}}`}</style>
  </div>;
}
