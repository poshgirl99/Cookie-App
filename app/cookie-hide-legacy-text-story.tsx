"use client";
import {useEffect} from "react";

export default function CookieHideLegacyTextStory(){
  useEffect(()=>{
    const hide=()=>{
      const buttons=[...document.querySelectorAll("button")] as HTMLButtonElement[];
      for(const button of buttons){
        const text=(button.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
        if(text==="aa text"||text==="text aa"||text==="text"){
          if(!button.closest(".csc-text-modal")&&!button.closest(".csc-sheet")){
            const rect=button.getBoundingClientRect();
            if(rect.width>0&&rect.width<180&&rect.height>0&&rect.height<100){
              button.style.setProperty("display","none","important");
              button.setAttribute("aria-hidden","true");
              button.tabIndex=-1;
            }
          }
        }
      }
    };
    hide();
    const observer=new MutationObserver(hide);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    return()=>observer.disconnect();
  },[]);
  return null;
}
