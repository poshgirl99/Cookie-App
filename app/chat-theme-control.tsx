"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type ThemeName = "default" | "violet" | "midnight" | "blush" | "aqua" | "image";
type SavedTheme = { name: ThemeName; image?: string };

const presets: Array<{name:ThemeName;label:string;css:string}> = [
  {name:"default",label:"Zale",css:"linear-gradient(135deg,#faf9ff,#f1edff)"},
  {name:"violet",label:"Violet",css:"radial-gradient(circle at 20% 10%,#efe7ff,transparent 32%),linear-gradient(135deg,#f9f7ff,#dfd3ff)"},
  {name:"midnight",label:"Midnight",css:"linear-gradient(145deg,#171126,#2a1747 58%,#4b2681)"},
  {name:"blush",label:"Blush",css:"linear-gradient(145deg,#fff7fb,#f7dff0 56%,#e8d7ff)"},
  {name:"aqua",label:"Aqua",css:"linear-gradient(145deg,#f5ffff,#dff6f7 55%,#e8e1ff)"},
];

function getChatKey(){
  const trigger=document.querySelector(".chat-profile-trigger");
  const name=trigger?.querySelector("b")?.textContent?.trim();
  const username=trigger?.querySelector("small")?.textContent?.trim();
  return name ? `zale-chat-theme:${username||name}` : null;
}

function applyTheme(theme:SavedTheme){
  const stream=document.querySelector<HTMLElement>(".message-stream");
  if(!stream)return;
  const preset=presets.find(p=>p.name===theme.name);
  if(theme.name==="image"&&theme.image){
    stream.style.backgroundImage=`linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.12)),url(${theme.image})`;
    stream.style.backgroundSize="cover";
    stream.style.backgroundPosition="center";
    stream.style.backgroundAttachment="local";
  }else{
    stream.style.backgroundImage=preset?.css||presets[0].css;
    stream.style.backgroundSize="cover";
    stream.style.backgroundPosition="center";
    stream.style.backgroundAttachment="local";
  }
  stream.dataset.chatTheme=theme.name;
}

export default function ChatThemeControl(){
  const [open,setOpen]=useState(false);
  const [chatKey,setChatKey]=useState<string|null>(null);
  const [theme,setTheme]=useState<SavedTheme>({name:"default"});
  const [error,setError]=useState("");

  useEffect(()=>{
    const sync=()=>{
      const key=getChatKey();
      setChatKey(key);
      if(!key)return;
      let next:SavedTheme={name:"default"};
      try{const raw=localStorage.getItem(key);if(raw)next=JSON.parse(raw)}catch{}
      setTheme(next);
      requestAnimationFrame(()=>applyTheme(next));
    };
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  const save=(next:SavedTheme)=>{
    setTheme(next);applyTheme(next);
    if(chatKey){try{localStorage.setItem(chatKey,JSON.stringify(next))}catch{setError("This image is too large to save. Try a smaller one.")}}
  };

  const chooseImage=(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];if(!file)return;
    if(!file.type.startsWith("image/")){setError("Choose an image file.");return}
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d")?.drawImage(img,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL("image/jpeg",.82);
        setError("");save({name:"image",image:data});setOpen(false);
      };
      img.src=String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const style=useMemo(()=>`\n.zale-theme-btn{border:1px solid #e2daf4;background:#fff;color:#5d35bd;border-radius:12px;padding:8px 10px;font-weight:800;white-space:nowrap}.zale-theme-modal{position:fixed;z-index:9999;inset:0;background:#1a102b66;display:grid;place-items:center;padding:18px}.zale-theme-card{width:min(460px,100%);background:#fff;border:1px solid #e4ddf2;border-radius:24px;padding:20px;box-shadow:0 28px 80px #1f10374d}.zale-theme-card h3{margin:0 0 4px;font-size:24px}.zale-theme-card p{margin:0 0 16px;color:#776e8f}.zale-theme-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.zale-theme-choice{height:84px;border:2px solid transparent;border-radius:18px;font-weight:900;background-size:cover!important;background-position:center!important}.zale-theme-choice.active{border-color:#6f42dc;box-shadow:0 0 0 3px #6f42dc1a}.zale-theme-upload{display:grid;place-items:center;height:84px;border:1px dashed #a68ee4;border-radius:18px;background:#faf8ff;font-weight:900;cursor:pointer}.zale-theme-upload input{display:none}.zale-theme-close{width:100%;margin-top:14px;border:0;background:#281641;color:#fff;border-radius:14px;padding:12px;font-weight:900}.zale-theme-error{color:#a1261d!important;font-size:12px}.message-stream[data-chat-theme=midnight] .message-bubble{box-shadow:0 5px 18px #0003}@media(max-width:760px){.zale-theme-btn{font-size:0;width:38px;height:38px;padding:0}.zale-theme-btn:after{content:'◐';font-size:18px}}\n`,[]);

  useEffect(()=>{const tag=document.createElement("style");tag.textContent=style;document.head.appendChild(tag);return()=>tag.remove()},[style]);

  useEffect(()=>{
    const mount=()=>{
      const head=document.querySelector(".chat-head");
      if(!head||head.querySelector("[data-zale-theme-mount]"))return;
      const slot=document.createElement("span");slot.dataset.zaleThemeMount="1";slot.style.display="contents";head.appendChild(slot);
    };
    mount();const o=new MutationObserver(mount);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect();
  },[]);

  useEffect(()=>{
    const handler=(e:Event)=>{const t=e.target as HTMLElement;if(t.closest("[data-zale-theme-trigger]"))setOpen(true)};
    document.addEventListener("click",handler);return()=>document.removeEventListener("click",handler)
  },[]);

  useEffect(()=>{
    const inject=()=>{
      document.querySelectorAll("[data-zale-theme-trigger]").forEach(x=>x.remove());
      const head=document.querySelector(".chat-head");if(!head)return;
      const b=document.createElement("button");b.type="button";b.className="zale-theme-btn";b.dataset.zaleThemeTrigger="1";b.textContent="Theme";head.appendChild(b);
    };
    inject();const o=new MutationObserver(inject);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect();
  },[]);

  if(!open)return null;
  return <div className="zale-theme-modal" onClick={()=>setOpen(false)}><div className="zale-theme-card" onClick={e=>e.stopPropagation()}><h3>Chat theme</h3><p>Choose a look for this conversation.</p><div className="zale-theme-grid">{presets.map(p=><button key={p.name} className={`zale-theme-choice ${theme.name===p.name?"active":""}`} style={{background:p.css}} onClick={()=>{save({name:p.name});setOpen(false)}}>{p.label}</button>)}<label className="zale-theme-upload">Choose from device<input type="file" accept="image/*" onChange={chooseImage}/></label></div>{error&&<p className="zale-theme-error">{error}</p>}<button className="zale-theme-close" onClick={()=>setOpen(false)}>Done</button></div></div>;
}
