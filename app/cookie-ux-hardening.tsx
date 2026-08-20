"use client";
import {useEffect} from "react";

export default function CookieUxHardening(){
 useEffect(()=>{
  const handled=new WeakSet<Element>();
  const wire=()=>{
   document.querySelectorAll(".notice,.crumb-notice").forEach(el=>{
    if(handled.has(el))return;handled.add(el);const node=el as HTMLElement;node.style.transition="opacity .22s ease,transform .22s ease";window.setTimeout(()=>{node.style.opacity="0";node.style.transform="translateY(-4px)";node.style.pointerEvents="none"},1800);window.setTimeout(()=>{node.style.display="none"},2050);
   });
   const strip=document.querySelector('[aria-label="Friends’ Stories"]') as HTMLElement|null;
   if(strip&&!strip.dataset.cookieLabelled){strip.dataset.cookieLabelled="1";const label=document.createElement("div");label.className="cookie-stories-label";label.innerHTML='<b>Stories</b><span>Tap a friend to watch</span>';strip.parentElement?.insertBefore(label,strip)}
   const nav=[...document.querySelectorAll("nav button")].find(b=>b.textContent?.includes("Stories")) as HTMLButtonElement|undefined;
   if(nav&&strip&&!nav.dataset.cookieStoryHint){nav.dataset.cookieStoryHint="1";nav.classList.add("cookie-story-hint");const badge=document.createElement("i");badge.className="cookie-story-new";badge.textContent="NEW";nav.appendChild(badge);nav.addEventListener("click",()=>{nav.classList.remove("cookie-story-hint");badge.remove()},{once:true})}
  };
  wire();const obs=new MutationObserver(wire);obs.observe(document.body,{childList:true,subtree:true});return()=>obs.disconnect()
 },[]);
 return <style jsx global>{`.cookie-stories-label{display:flex;align-items:baseline;gap:8px;margin:10px 2px 7px;color:#4b2d1c}.cookie-stories-label b{font-size:14px}.cookie-stories-label span{font-size:11px;opacity:.58}.cookie-story-hint{position:relative}.cookie-story-new{position:absolute;top:4px;right:calc(50% - 28px);font-style:normal;font-size:7px;line-height:1;background:#9f3d25;color:#fff;padding:3px 4px;border-radius:999px;letter-spacing:.04em;font-weight:900;animation:cookieHintPulse 1.7s ease-in-out infinite}@keyframes cookieHintPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}`}</style>
}
