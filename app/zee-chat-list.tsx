"use client";

import { useEffect } from "react";

export default function ZeeChatList(){
  useEffect(()=>{
    let scheduled=false;
    const mount=()=>{
      scheduled=false;
      const list=document.querySelector(".chat-list");
      if(!list) return;
      let row=list.querySelector(".zee-chat-row") as HTMLButtonElement|null;
      if(row) return;
      row=document.createElement("button"); row.className="zee-chat-row"; row.type="button";
      row.innerHTML='<span class="zee-chat-avatar"><img src="/cookie-logo-deeper-bite.png" alt=""></span><span class="zee-chat-copy"><b>Coco <i>AI</i></b><small>Your Cookie assistant</small></span>';
      row.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("zale:open-zee")));
      const buttons=Array.from(list.children); if(buttons.length>1) list.insertBefore(row,buttons[1]); else list.appendChild(row);
    };
    const schedule=()=>{if(scheduled)return;scheduled=true;window.requestAnimationFrame(mount)}; mount();
    const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});return()=>observer.disconnect();
  },[]);
  return null;
}
