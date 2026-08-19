"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase";

const EMOJIS=["😂","😭","🥹","😍","🥰","😮","😎","🥳","🤍","❤️","💕","🔥","✨","💯","🙏🏾","🙌🏾","👏🏾","👀","🤭","😴","😤","🤯","💀","🍪","🎉","🎶","🌸","☀️","🌙","💜"];
const BACKGROUNDS=[
  {name:"Purple",css:"linear-gradient(145deg,#6327d9,#a855f7)",stops:["#6327d9","#a855f7"],text:"#ffffff"},
  {name:"Sunset",css:"linear-gradient(145deg,#f97316,#ec4899)",stops:["#f97316","#ec4899"],text:"#ffffff"},
  {name:"Burgundy",css:"linear-gradient(145deg,#5f1126,#9f2948)",stops:["#5f1126","#9f2948"],text:"#ffffff"},
  {name:"Ocean",css:"linear-gradient(145deg,#0f4c81,#168aad)",stops:["#0f4c81","#168aad"],text:"#ffffff"},
  {name:"Night",css:"linear-gradient(145deg,#111827,#312e81)",stops:["#111827","#312e81"],text:"#ffffff"},
  {name:"Rose",css:"linear-gradient(145deg,#be185d,#fb7185)",stops:["#be185d","#fb7185"],text:"#ffffff"},
  {name:"Forest",css:"linear-gradient(145deg,#14532d,#16a34a)",stops:["#14532d","#16a34a"],text:"#ffffff"},
  {name:"Cream",css:"linear-gradient(145deg,#fff7ed,#fde7c7)",stops:["#fff7ed","#fde7c7"],text:"#3b2418"},
  {name:"Black",css:"linear-gradient(145deg,#09090b,#27272a)",stops:["#09090b","#27272a"],text:"#ffffff"},
];
const FONTS=[
  {name:"Bold",css:"system-ui,-apple-system,Segoe UI,sans-serif",canvas:"system-ui, -apple-system, Segoe UI, sans-serif",weight:800},
  {name:"Classic",css:"Georgia,Times New Roman,serif",canvas:"Georgia, Times New Roman, serif",weight:700},
  {name:"Rounded",css:"Trebuchet MS,Arial,sans-serif",canvas:"Trebuchet MS, Arial, sans-serif",weight:700},
  {name:"Typewriter",css:"Courier New,monospace",canvas:"Courier New, monospace",weight:700},
  {name:"Poster",css:"Impact,Arial Black,sans-serif",canvas:"Impact, Arial Black, sans-serif",weight:400},
  {name:"Casual",css:"Comic Sans MS,cursive",canvas:"Comic Sans MS, cursive",weight:700},
];

type Mode="choose"|"text"|null;

export default function CookieTextStoryComposer(){
  const supabase=useMemo(()=>createClient(),[]);
  const [mode,setMode]=useState<Mode>(null);
  const [text,setText]=useState("");
  const [emojiOpen,setEmojiOpen]=useState(false);
  const [backgroundOpen,setBackgroundOpen]=useState(false);
  const [fontOpen,setFontOpen]=useState(false);
  const [backgroundIndex,setBackgroundIndex]=useState(0);
  const [fontIndex,setFontIndex]=useState(0);
  const [busy,setBusy]=useState(false);
  const ta=useRef<HTMLTextAreaElement|null>(null);
  const allowMediaClick=useRef(false);
  const bg=BACKGROUNDS[backgroundIndex];
  const font=FONTS[fontIndex];

  useEffect(()=>{
    const bind=()=>{
      const add=document.querySelector(".story-add") as HTMLElement|null;
      if(!add||add.dataset.cookieStoryChooser==="1")return;
      add.dataset.cookieStoryChooser="1";
      const handler=(e:Event)=>{
        if(allowMediaClick.current){allowMediaClick.current=false;return;}
        e.preventDefault();e.stopPropagation();setMode("choose");
      };
      add.addEventListener("click",handler,true);
    };
    bind();const o=new MutationObserver(bind);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect();
  },[]);

  function closeTools(){setEmojiOpen(false);setBackgroundOpen(false);setFontOpen(false)}
  function openMedia(){const input=document.querySelector(".story-add input[type='file']") as HTMLInputElement|null;if(!input)return;setMode(null);allowMediaClick.current=true;input.click()}

  async function postText(){
    const value=text.trim();if(!value||busy)return;setBusy(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please sign in again.");
      const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Could not create Story.");
      const g=ctx.createLinearGradient(0,0,1080,1920);g.addColorStop(0,bg.stops[0]);g.addColorStop(1,bg.stops[1]);ctx.fillStyle=g;ctx.fillRect(0,0,1080,1920);
      ctx.fillStyle=bg.text;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`${font.weight} 78px ${font.canvas}`;
      const max=820,words=value.split(/\s+/),lines:string[]=[];let line="";
      for(const w of words){const test=line?`${line} ${w}`:w;if(ctx.measureText(test).width>max&&line){lines.push(line);line=w}else line=test}if(line)lines.push(line);
      const lh=104,start=960-((lines.length-1)*lh)/2;lines.slice(0,10).forEach((l,i)=>ctx.fillText(l,540,start+i*lh));
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not prepare Story.")),"image/png",.95));
      const path=`${user.id}/${crypto.randomUUID()}.png`;const up=await supabase.storage.from("story-media").upload(path,blob,{contentType:"image/png",upsert:false});if(up.error)throw up.error;
      const ins=await supabase.from("story_posts").insert({author_id:user.id,media_path:path,media_type:"image",caption:""});if(ins.error)throw ins.error;
      setText("");closeTools();setBackgroundIndex(0);setFontIndex(0);setMode(null);setTimeout(()=>window.location.reload(),500);
    }catch(e:any){alert(e?.message||"Could not post Story.")}finally{setBusy(false)}
  }

  if(!mode)return null;
  return <div className="csc-backdrop" onClick={()=>setMode(null)}>
    {mode==="choose"&&<section className="csc-sheet" onClick={e=>e.stopPropagation()}>
      <div className="csc-handle"/><h2>Add Story</h2><p>What would you like to share?</p>
      <button className="csc-option" onClick={()=>setMode("text")}><span>✎</span><div><b>Text Story</b><small>Type, choose a background and font, and add emojis</small></div><i>›</i></button>
      <button className="csc-option" onClick={openMedia}><span>▧</span><div><b>Photo / Video</b><small>Choose media from your device</small></div><i>›</i></button>
      <button className="csc-cancel" onClick={()=>setMode(null)}>Cancel</button>
    </section>}
    {mode==="text"&&<section className="csc-text-modal" onClick={e=>e.stopPropagation()}>
      <header><div><small>TEXT STORY</small><h2>Say it your way.</h2></div><button onClick={()=>setMode(null)}>×</button></header>
      <div className="csc-canvas" style={{background:bg.css}}>
        <textarea ref={ta} autoFocus value={text} maxLength={240} placeholder="Type your Story…" onChange={e=>setText(e.target.value)} style={{color:bg.text,fontFamily:font.css,fontWeight:font.weight}}/>
        {emojiOpen&&<div className="csc-emoji-tray">{EMOJIS.map(e=><button key={e} onClick={()=>{setText(v=>v+e);requestAnimationFrame(()=>ta.current?.focus())}}>{e}</button>)}</div>}
        {backgroundOpen&&<div className="csc-style-tray csc-bg-tray"><strong>Background</strong><div>{BACKGROUNDS.map((item,i)=><button key={item.name} className={i===backgroundIndex?"selected":""} onClick={()=>{setBackgroundIndex(i);requestAnimationFrame(()=>ta.current?.focus())}} title={item.name} aria-label={item.name}><i style={{background:item.css}}/></button>)}</div></div>}
        {fontOpen&&<div className="csc-style-tray csc-font-tray"><strong>Font</strong><div>{FONTS.map((item,i)=><button key={item.name} className={i===fontIndex?"selected":""} onClick={()=>{setFontIndex(i);requestAnimationFrame(()=>ta.current?.focus())}} style={{fontFamily:item.css,fontWeight:item.weight}}>{item.name}</button>)}</div></div>}
        <div className="csc-canvas-actions">
          <button onClick={()=>{setEmojiOpen(v=>!v);setBackgroundOpen(false);setFontOpen(false)}} aria-label="Open emoji tray">☺</button>
          <button onClick={()=>{setBackgroundOpen(v=>!v);setEmojiOpen(false);setFontOpen(false)}} aria-label="Change Story background">◐</button>
          <button className="csc-font-button" onClick={()=>{setFontOpen(v=>!v);setEmojiOpen(false);setBackgroundOpen(false)}} aria-label="Change Story font">Aa</button>
          <span>{text.length}/240</span>
        </div>
      </div>
      <div className="csc-selected-style"><span>Background: <b>{bg.name}</b></span><span>Font: <b>{font.name}</b></span></div>
      <div className="csc-footer"><button className="csc-back" onClick={()=>{closeTools();setMode("choose")}}>Back</button><button className="csc-post" disabled={!text.trim()||busy} onClick={postText}>{busy?"Posting…":"Post Story"}</button></div>
    </section>}
    <style jsx global>{`.csc-backdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(28,20,35,.46);display:flex;align-items:flex-end;justify-content:center;padding:18px;box-sizing:border-box;backdrop-filter:blur(3px)}.csc-sheet{width:min(430px,100%);background:#fffaf4;color:#382317;border-radius:26px;padding:14px 18px 18px;box-shadow:0 24px 70px rgba(0,0,0,.24)}.csc-handle{width:42px;height:5px;border-radius:999px;background:#d8c8b8;margin:0 auto 16px}.csc-sheet h2{margin:0 0 4px;font-size:24px}.csc-sheet>p{margin:0 0 16px;opacity:.62}.csc-option{width:100%;display:grid;grid-template-columns:48px 1fr 18px;gap:12px;align-items:center;border:1px solid #eadfce;background:#fff;border-radius:18px;padding:13px;text-align:left;color:inherit;margin-top:10px}.csc-option>span{width:46px;height:46px;border-radius:14px;background:#f3e6d4;display:grid;place-items:center;font-size:23px}.csc-option div{display:flex;flex-direction:column;gap:3px}.csc-option small{opacity:.58}.csc-option i{font-style:normal;opacity:.4}.csc-cancel{width:100%;margin-top:14px;border:0;background:transparent;padding:10px;color:#6b5648;font-weight:700}.csc-text-modal{width:min(660px,100%);max-height:94vh;background:#fff;border-radius:28px;padding:24px;box-sizing:border-box;color:#28154a;overflow:auto;box-shadow:0 24px 80px rgba(0,0,0,.28)}.csc-text-modal header{display:flex;justify-content:space-between;align-items:flex-start}.csc-text-modal header small{font-size:12px;letter-spacing:.12em;color:#7b42e8;font-weight:800}.csc-text-modal header h2{font-size:34px;margin:8px 0 18px}.csc-text-modal header button{border:0;width:46px;height:46px;border-radius:50%;background:#f4effb;font-size:25px;color:#382317}.csc-canvas{position:relative;min-height:560px;border-radius:28px;overflow:hidden;transition:background .2s ease}.csc-canvas textarea{position:absolute;inset:0;width:100%;height:100%;box-sizing:border-box;border:0;outline:0;resize:none;background:transparent;text-align:center;padding:38% 9% 92px;font-size:clamp(32px,5vw,58px);line-height:1.16;caret-color:currentColor}.csc-canvas textarea::placeholder{color:currentColor;opacity:.72}.csc-canvas-actions{position:absolute;left:15px;right:15px;bottom:15px;display:flex;align-items:center;gap:8px;background:rgba(20,14,28,.32);padding:8px 10px;border-radius:17px;backdrop-filter:blur(9px)}.csc-canvas-actions button{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.22);color:#fff;font-size:22px}.csc-canvas-actions .csc-font-button{font-size:15px;font-weight:900}.csc-canvas-actions span{margin-left:auto;color:rgba(255,255,255,.82);font-size:11px;font-weight:700}.csc-emoji-tray,.csc-style-tray{position:absolute;left:14px;right:14px;bottom:75px;background:#fffaf4;padding:10px;border-radius:17px;max-height:190px;overflow:auto;box-shadow:0 14px 35px rgba(0,0,0,.22);z-index:3}.csc-emoji-tray{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.csc-emoji-tray button{border:0;background:transparent;font-size:24px;padding:6px}.csc-style-tray strong{display:block;color:#382317;font:800 12px system-ui;margin:2px 4px 9px}.csc-bg-tray>div{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.csc-bg-tray button{border:2px solid transparent;background:transparent;border-radius:14px;padding:3px}.csc-bg-tray button.selected{border-color:#4b2d1c}.csc-bg-tray i{display:block;width:100%;aspect-ratio:1;border-radius:10px}.csc-font-tray>div{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.csc-font-tray button{border:1px solid #e8ddcf;background:#fff;color:#382317;border-radius:12px;padding:10px 8px;font-size:14px}.csc-font-tray button.selected{border:2px solid #4b2d1c;background:#f7ecde}.csc-selected-style{display:flex;gap:14px;justify-content:center;padding-top:10px;color:#786858;font-size:11px}.csc-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}.csc-footer button{border:0;border-radius:14px;padding:12px 18px;font-weight:800}.csc-back{background:#f1e5d5;color:#4b2d1c}.csc-post{background:#4b2d1c;color:white}.csc-post:disabled{opacity:.42}@media(max-width:600px){.csc-backdrop{padding:0;align-items:flex-end}.csc-sheet{border-radius:26px 26px 0 0}.csc-text-modal{height:100%;max-height:100%;border-radius:0;padding:18px}.csc-text-modal header h2{font-size:28px}.csc-canvas{min-height:66vh;border-radius:24px}.csc-canvas textarea{padding:40% 7% 86px;font-size:36px}.csc-footer{padding-bottom:env(safe-area-inset-bottom)}.csc-selected-style{padding-top:8px}.csc-bg-tray>div{grid-template-columns:repeat(5,1fr)}}`}</style>
  </div>;
}
