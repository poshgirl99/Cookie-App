"use client";

import {useEffect} from "react";

export default function CookieStoryLiveToastTimeout(){
  useEffect(()=>{
    const timers=new WeakMap<Element,number>();
    const handle=()=>{
      const nodes=[...document.querySelectorAll("body *")];
      for(const el of nodes){
        if(!(el instanceof HTMLElement))continue;
        if(el.children.length>0)continue;
        const text=(el.textContent||"").trim();
        if(!text.includes("Your Story is live for 24 hours"))continue;
        const box=el.closest("div,section,aside") as HTMLElement|null;
        const target=box||el;
        if(timers.has(target))continue;
        target.style.transition="opacity .28s ease, transform .28s ease";
        const id=window.setTimeout(()=>{
          target.style.opacity="0";
          target.style.transform="translateY(-4px)";
          window.setTimeout(()=>{target.style.display="none"},300);
        },1700);
        timers.set(target,id);
      }
    };
    handle();
    const observer=new MutationObserver(handle);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
