"use client";
import {useEffect,useMemo,useRef} from "react";
import {createClient} from "@/lib/supabase";

export default function CookieBestFriendsRefresh(){
 const supabase=useMemo(()=>createClient(),[]);const timer=useRef<number|undefined>(undefined);const last=useRef(0);
 useEffect(()=>{let alive=true;let channel:any=null;
   const refresh=async(force=false)=>{if(!alive)return;const now=Date.now();if(!force&&now-last.current<60000)return;last.current=now;const {data:{user}}=await supabase.auth.getUser();if(!user)return;await supabase.rpc("refresh_my_best_friends")};
   const schedule=()=>{window.clearTimeout(timer.current);timer.current=window.setTimeout(()=>void refresh(),3500)};
   void refresh(true);
   supabase.auth.getUser().then(({data})=>{if(!data.user||!alive)return;channel=supabase.channel(`cookie-bf-${data.user.id}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},schedule).on("postgres_changes",{event:"INSERT",schema:"public",table:"crumb_likes"},schedule).on("postgres_changes",{event:"INSERT",schema:"public",table:"crumb_comments"},schedule).subscribe()});
   const interval=window.setInterval(()=>void refresh(),15*60*1000);
   const onVisible=()=>{if(document.visibilityState==="visible")void refresh()};document.addEventListener("visibilitychange",onVisible);
   return()=>{alive=false;window.clearTimeout(timer.current);window.clearInterval(interval);document.removeEventListener("visibilitychange",onVisible);if(channel)void supabase.removeChannel(channel)}
 },[supabase]);
 return null;
}
