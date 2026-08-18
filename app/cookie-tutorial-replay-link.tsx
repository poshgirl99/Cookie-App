"use client";
import {useEffect} from "react";
export default function CookieTutorialReplayLink(){
 useEffect(()=>{
  const wire=()=>{
   const help=document.querySelector('.cookie-help') as HTMLElement|null;
   if(!help||help.querySelector('.cookie-replay-tutorial'))return;
   const btn=document.createElement('button');
   btn.type='button';btn.className='cookie-replay-tutorial';btn.textContent='Replay Tutorial';
   btn.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('cookie:replay-tutorial'));});
   const form=help.querySelector('form');
   if(form)help.insertBefore(btn,form);else help.appendChild(btn);
  };
  wire();const o=new MutationObserver(wire);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect();
 },[]);
 return <style jsx global>{`.cookie-replay-tutorial{width:100%;margin:10px 0 12px;border:1px solid #e2cfb8;background:#fff7eb;color:#4b2d1c;border-radius:13px;padding:11px 14px;font-weight:750;cursor:pointer}.cookie-replay-tutorial:hover{background:#f8ead8}`}</style>
}
