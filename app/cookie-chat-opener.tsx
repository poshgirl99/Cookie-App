"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";

export default function CookieChatOpener(){
  const supabase=useMemo(()=>createClient(),[]);
  useEffect(()=>{
    const open=async(event:Event)=>{
      const conversationId=(event as CustomEvent<{conversationId?:string}>).detail?.conversationId;
      if(!conversationId)return;
      const {data:{user}}=await supabase.auth.getUser();if(!user)return;
      const {data:members}=await supabase.from("conversation_members").select("user_id").eq("conversation_id",conversationId).neq("user_id",user.id);
      const otherId=members?.[0]?.user_id;if(!otherId)return;
      const {data:person}=await supabase.from("profiles").select("username,display_name").eq("id",otherId).maybeSingle();if(!person)return;
      const tryOpen=()=>{
        const candidates=Array.from(document.querySelectorAll<HTMLElement>(".chat-list button,.chat-list [role=button],.chat-sidebar button,.chat-row"));
        const target=candidates.find(node=>{
          const text=(node.textContent||"").toLowerCase();
          return text.includes(`@${person.username}`.toLowerCase())||text.includes((person.display_name||"").toLowerCase());
        });
        if(target){target.click();return true;}return false;
      };
      if(tryOpen())return;
      const chatsButton=Array.from(document.querySelectorAll<HTMLButtonElement>("nav button,button")).find(b=>/^chats$/i.test((b.textContent||"").trim()));
      chatsButton?.click();
      let attempts=0;const timer=window.setInterval(()=>{attempts++;if(tryOpen()||attempts>20)window.clearInterval(timer);},100);
    };
    window.addEventListener("cookie:open-conversation",open as EventListener);
    return()=>window.removeEventListener("cookie:open-conversation",open as EventListener);
  },[supabase]);
  return null;
}
