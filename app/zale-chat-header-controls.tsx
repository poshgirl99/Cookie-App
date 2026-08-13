"use client";
import { useEffect, useState } from "react";

export default function ZaleChatHeaderControls(){
  const [open,setOpen]=useState(false);
  const [note,setNote]=useState("");

  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=`
      .zale-header-tools{margin-left:auto;display:flex;gap:6px;align-items:center;position:relative;z-index:100}
      .zale-header-tools button{width:34px;height:34px;min-height:34px;border:0;border-radius:10px;background:#2d2d2d;color:#f4f4f4;font-weight:900;display:grid;place-items:center;touch-action:manipulation;cursor:pointer;padding:0}
      .zale-header-tools button:hover{background:#383838}
      .zale-call-icon{display:block;position:relative;width:18px;height:18px}
      .zale-video-icon:before{content:'';position:absolute;left:1px;top:4px;width:10px;height:8px;border-radius:2px;background:#e9e9e9}
      .zale-video-icon:after{content:'';position:absolute;right:1px;top:6px;border-left:5px solid #e9e9e9;border-top:3px solid transparent;border-bottom:3px solid transparent}
      .zale-phone-icon:before{content:'';position:absolute;left:5px;top:2px;width:7px;height:14px;border:3px solid #e9e9e9;border-top-color:transparent;border-right-color:transparent;border-radius:0 0 0 10px;transform:rotate(-42deg)}
      .zale-menu-icon{font-size:20px;line-height:1;letter-spacing:1px;color:#f4f4f4;margin-top:-4px}
      .zale-header-menu{position:fixed;right:18px;top:74px;width:190px;background:#fff;border:1px solid #e3dcf2;border-radius:16px;padding:7px;box-shadow:0 20px 55px #1e103a2b;z-index:99999;display:grid}
      .zale-header-menu button{border:0;background:transparent;text-align:left;padding:11px 12px;border-radius:10px;font-weight:800;color:#241443;touch-action:manipulation;cursor:pointer}
      .zale-header-menu button:hover{background:#f2edff}
      .zale-header-menu .danger{color:#a62a40}
      .zale-header-note{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:99999;background:#25133f;color:#fff;padding:10px 16px;border-radius:999px;font-weight:800}
      @media(max-width:760px){.zale-header-tools{gap:4px}.zale-header-tools button{width:32px;height:32px;min-height:32px}.zale-header-menu{right:10px;top:64px}}
    `;
    document.head.appendChild(style);
    return()=>style.remove();
  },[]);

  useEffect(()=>{
    const mount=()=>{
      const head=document.querySelector(".chat-head");
      if(!head || head.querySelector(".zale-header-tools")) return;
      const slot=document.createElement("div");
      slot.className="zale-header-tools";

      const video=document.createElement("button");
      video.type="button";
      video.title="Video call";
      video.setAttribute("aria-label","Video call");
      video.innerHTML='<span class="zale-call-icon zale-video-icon" aria-hidden="true"></span>';
      video.addEventListener("click",()=>{setNote("Video calling is coming to Zale.");window.setTimeout(()=>setNote(""),1800)});

      const voice=document.createElement("button");
      voice.type="button";
      voice.title="Voice call";
      voice.setAttribute("aria-label","Voice call");
      voice.innerHTML='<span class="zale-call-icon zale-phone-icon" aria-hidden="true"></span>';
      voice.addEventListener("click",()=>{setNote("Voice calling is coming to Zale.");window.setTimeout(()=>setNote(""),1800)});

      const menu=document.createElement("button");
      menu.type="button";
      menu.title="Chat options";
      menu.setAttribute("aria-label","Chat options");
      menu.innerHTML='<span class="zale-menu-icon" aria-hidden="true">•••</span>';
      menu.addEventListener("click",()=>setOpen(value=>!value));

      slot.append(video,voice,menu);
      head.appendChild(slot);
    };

    mount();
    const observer=new MutationObserver(()=>mount());
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  const theme=()=>{document.querySelector<HTMLElement>("[data-theme-btn]")?.click();setOpen(false)};
  const unadd=()=>{setOpen(false);(document.querySelector(".chat-profile-trigger") as HTMLElement|null)?.click();window.setTimeout(()=>{(document.querySelector(".unadd-friend-button") as HTMLElement|null)?.click()},180)};
  const block=()=>{setOpen(false);setNote("Block Friend is being connected to Zale.");window.setTimeout(()=>setNote(""),1800)};

  return <>{open&&<div className="zale-header-menu"><button onClick={theme}>Theme</button><button className="danger" onClick={block}>Block friend</button><button className="danger" onClick={unadd}>Unadd friend</button></div>}{note&&<div className="zale-header-note">{note}</div>}</>;
}
