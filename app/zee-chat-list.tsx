"use client";

import { useEffect } from "react";

export default function ZeeChatList(){
  useEffect(()=>{
    const mount=()=>{
      const list=document.querySelector(".chat-list");
      if(!list || list.querySelector(".zee-chat-row")) return;
      const row=document.createElement("button");
      row.className="zee-chat-row";
      row.type="button";
      row.innerHTML='<span class="zee-chat-avatar">Z</span><span><b>Zee AI</b><small>Your Zale assistant</small></span>';
      row.addEventListener("click",()=>window.dispatchEvent(new Event("zale:open-zee")));
      list.appendChild(row);
    };
    mount();
    const observer=new MutationObserver(mount);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
