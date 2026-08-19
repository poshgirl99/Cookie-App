"use client";
import {useEffect} from "react";

function hideStandaloneTextButton(){
  const buttons=[...document.querySelectorAll("button") ] as HTMLButtonElement[];
  for(const button of buttons){
    if(button.closest(".csc-text-modal")) continue;
    const text=(button.innerText||button.textContent||"").replace(/\s+/g," ").trim();
    const compact=text.replace(/\s+/g,"").toLowerCase();
    const isStandalone = compact==="aatext" || compact==="textaa" || (text.toLowerCase()==="text" && /aa/i.test(button.innerHTML));
    if(isStandalone){
      button.style.setProperty("display","none","important");
      button.setAttribute("aria-hidden","true");
      button.tabIndex=-1;
    }
  }
}

export default function CookieHideAaText(){
  useEffect(()=>{
    hideStandaloneTextButton();
    const observer=new MutationObserver(hideStandaloneTextButton);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    const timer=window.setInterval(hideStandaloneTextButton,500);
    return()=>{observer.disconnect();window.clearInterval(timer)};
  },[]);
  return null;
}
