"use client";
import { useEffect,useRef,useState } from "react";

const PRESETS={
  Zale:"linear-gradient(135deg,#faf9ff,#f1edff)",
  Violet:"linear-gradient(135deg,#f7f3ff,#ded2ff)",
  Midnight:"linear-gradient(145deg,#171126,#4b2681)",
  Blush:"linear-gradient(145deg,#fff7fb,#f2dff4)",
  Aqua:"linear-gradient(145deg,#f4ffff,#dff4f5)"
} as const;
type Preset=keyof typeof PRESETS;
type Saved={preset?:Preset,image?:string};

function key(){const n=document.querySelector('.chat-profile-trigger b')?.textContent?.trim();return n?`zale-theme-${n.toLowerCase()}`:null}
function load(k:string):Saved{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return {}}}
function paint(v:Saved){const s=document.querySelector<HTMLElement>('.message-stream');if(!s)return;s.style.backgroundImage=v.image?`url(${v.image})`:PRESETS[v.preset||'Zale'];s.style.backgroundSize='cover';s.style.backgroundPosition='center'}

export default function ChatThemeControlV2(){
  const [open,setOpen]=useState(false);const [saved,setSaved]=useState<Saved>({preset:'Zale'});const current=useRef<string|null>(null);
  useEffect(()=>{const tick=()=>{const k=key();if(k&&k!==current.current){current.current=k;const v=load(k);setSaved(v);paint(v)}};tick();const id=setInterval(tick,500);const openTheme=()=>setOpen(true);window.addEventListener('zale-open-theme',openTheme);return()=>{clearInterval(id);window.removeEventListener('zale-open-theme',openTheme)}},[]);
  useEffect(()=>{const st=document.createElement('style');st.textContent='.zale-theme-modal{position:fixed;z-index:99999;inset:0;background:#1a102b66;display:grid;place-items:center;padding:18px}.zale-theme-card{width:min(440px,100%);background:#fff;border-radius:24px;padding:20px;box-shadow:0 28px 80px #1f10374d}.zale-theme-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.zale-theme-choice,.zale-theme-upload{height:82px;border:1px solid #dfd6f5;border-radius:18px;display:grid;place-items:center;font-weight:900;background-size:cover!important}.zale-theme-upload{border-style:dashed;cursor:pointer}.zale-theme-upload input{display:none}.zale-theme-close{width:100%;margin-top:14px;border:0;background:#281641;color:#fff;border-radius:14px;padding:12px;font-weight:900}';document.head.appendChild(st);return()=>st.remove()},[]);
  const save=(v:Saved)=>{setSaved(v);paint(v);if(current.current)localStorage.setItem(current.current,JSON.stringify(v))};
  const image=(file?:File)=>{if(!file)return;const r=new FileReader();r.onload=()=>save({image:String(r.result)});r.readAsDataURL(file)};
  if(!open)return null;
  return <div className="zale-theme-modal" onClick={()=>setOpen(false)}><div className="zale-theme-card" onClick={e=>e.stopPropagation()}><h3>Chat theme</h3><p>Choose a look for this conversation.</p><div className="zale-theme-grid">{Object.entries(PRESETS).map(([n,css])=><button key={n} className="zale-theme-choice" style={{background:css}} onClick={()=>{save({preset:n as Preset});setOpen(false)}}>{n}</button>)}<label className="zale-theme-upload">Choose from device<input type="file" accept="image/*" onChange={e=>{image(e.target.files?.[0]);setOpen(false)}}/></label></div><button className="zale-theme-close" onClick={()=>setOpen(false)}>Done</button></div></div>
}
