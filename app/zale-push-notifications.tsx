"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

const VAPID_PUBLIC_KEY = "BNwYPlHrlGEbgdKcvWavc1mRZD_vCjFSDyCZE3YeoS5xAJsdKwNDUSNoX27wqwNn0M33wkOmd8c9lyA6FehTK2Y";
function keyBytes(value:string){const pad="=".repeat((4-value.length%4)%4);const raw=atob((value+pad).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
export default function ZalePushNotifications(){
  const [showPrompt,setShowPrompt]=useState(false),[busy,setBusy]=useState(false);
  useEffect(()=>{if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))return;navigator.serviceWorker.register("/zale-sw.js").then(async reg=>{const sub=await reg.pushManager.getSubscription();const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(user&&!sub&&Notification.permission==="default")setShowPrompt(true);if(user&&sub)await saveSubscription(user.id,sub);}).catch(console.error);},[]);
  async function saveSubscription(userId:string,sub:PushSubscription){const json=sub.toJSON();if(!json.endpoint||!json.keys?.p256dh||!json.keys?.auth)return;const supabase=createClient();await supabase.from("push_subscriptions").upsert({user_id:userId,endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth,updated_at:new Date().toISOString()},{onConflict:"user_id,endpoint"});await supabase.from("notification_settings").upsert({user_id:userId,enabled:true},{onConflict:"user_id"});}
  async function enable(){setBusy(true);try{const permission=await Notification.requestPermission();if(permission!=="granted"){setShowPrompt(false);return;}const reg=await navigator.serviceWorker.ready;let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(VAPID_PUBLIC_KEY)});const supabase=createClient();const{data:{user}}=await supabase.auth.getUser();if(user)await saveSubscription(user.id,sub);setShowPrompt(false);}finally{setBusy(false);}}
  if(!showPrompt)return null;
  return <div style={{position:"fixed",left:"50%",bottom:86,transform:"translateX(-50%)",zIndex:99999,background:"#fff8ed",color:"#3a2417",padding:"12px 14px",borderRadius:16,boxShadow:"0 10px 30px rgba(0,0,0,.18)",display:"flex",alignItems:"center",gap:12,maxWidth:"calc(100vw - 28px)"}}><span style={{fontSize:13,fontWeight:700}}>Turn on Cookie notifications 🍪</span><button onClick={enable} disabled={busy} style={{border:0,borderRadius:999,padding:"8px 13px",background:"#c77a2a",color:"white",fontWeight:800,cursor:"pointer"}}>{busy?"Turning on…":"Turn on"}</button><button onClick={()=>setShowPrompt(false)} aria-label="Not now" style={{border:0,background:"transparent",fontSize:18,cursor:"pointer"}}>×</button></div>;
}
