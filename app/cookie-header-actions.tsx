"use client";

import { useEffect } from "react";

export default function CookieHeaderActions(){
  useEffect(()=>{
    let frame=0;
    const apply=()=>{
      const bell=document.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement|null;
      if(!bell)return;

      bell.classList.add("cookie-header-bell");
      bell.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>';

      let more=document.querySelector('button[aria-label="More"]') as HTMLButtonElement|null;
      if(!more){
        more=document.createElement("button");
        more.type="button";
        more.setAttribute("aria-label","More");
        more.className="cookie-header-more";
        more.innerHTML='<span aria-hidden="true">•••</span>';
        bell.insertAdjacentElement("afterend",more);
      }

      const parent=bell.parentElement;
      if(parent){
        parent.classList.add("cookie-header-actions-wrap");
      }
    };
    const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(apply);};
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[]);

  return <style jsx global>{`
    .cookie-header-actions-wrap{display:flex!important;align-items:center!important;gap:7px!important}
    .cookie-header-bell,.cookie-header-more{width:44px!important;height:44px!important;min-width:44px!important;border-radius:999px!important;background:#fff3df!important;border:0!important;display:grid!important;place-items:center!important;color:#5a3421!important;padding:0!important;box-shadow:none!important}
    .cookie-header-bell svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .cookie-header-more span{font-size:18px;line-height:1;letter-spacing:1px;transform:translateY(-2px)}
    .cookie-header-more{margin-right:5px!important}
    @media(max-width:700px){.cookie-header-bell,.cookie-header-more{width:40px!important;height:40px!important;min-width:40px!important}.cookie-header-actions-wrap{gap:5px!important}}
  `}</style>;
}
