"use client";

import { useEffect } from "react";

export default function ZeeChatList(){
  useEffect(()=>{
    const mount=()=>{
      const list=document.querySelector(".chat-list");
      if(!list) return;
      let row=list.querySelector(".zee-chat-row") as HTMLButtonElement | null;
      if(!row){
        row=document.createElement("button");
        row.className="zee-chat-row";
        row.type="button";
        row.innerHTML='<span class="zee-chat-avatar"><b>Z</b></span><span class="zee-chat-copy"><b>Zee AI <i>AI</i></b><small>Your Zale assistant</small></span>';
        row.addEventListener("click",()=>window.dispatchEvent(new CustomEvent("zale:open-zee",{detail:{expanded:true}})));
      }
      const last=Number(localStorage.getItem("zale-zee-last-active")||0);
      const recent=last && Date.now()-last < 15*60*1000;
      const buttons=Array.from(list.children).filter((el)=>el!==row);
      if(recent) list.prepend(row);
      else if(buttons.length>1) list.insertBefore(row,buttons[1]);
      else list.appendChild(row);
    };
    mount();
    const observer=new MutationObserver(mount);
    observer.observe(document.body,{childList:true,subtree:true});
    const timer=window.setInterval(mount,2000);
    return()=>{observer.disconnect();window.clearInterval(timer)};
  },[]);
  return null;
}
