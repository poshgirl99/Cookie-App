"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase";

type Viewer={viewer_id:string;viewed_at:string;profile?:{id:string;display_name:string;username:string;avatar_url:string|null;profile_colour:string|null}|null};
type Story={id:string;author_id:string;media_path:string};

function mediaPathFromViewer(root:Element){
  const el=root.querySelector("img[src],video[src],source[src]") as HTMLImageElement|HTMLVideoElement|HTMLSourceElement|null;
  const src=el?.getAttribute("src")||"";
  if(!src)return "";
  const marker="/story-media/";
  const i=src.indexOf(marker);
  if(i<0)return "";
  return decodeURIComponent(src.slice(i+marker.length).split("?")[0]);
}
function ago(iso:string){const s=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(s<60)return "just now";if(s<3600)return `${Math.floor(s/60)}m ago`;if(s<86400)return `${Math.floor(s/3600)}h ago`;return `${Math.floor(s/86400)}d ago`}

export default function CookieStoryViewers(){
 const supabase=useMemo(()=>createClient(),[]);const [ownStory,setOwnStory]=useState<Story|null>(null);const [viewers,setViewers]=useState<Viewer[]>([]);const [open,setOpen]=useState(false);const lastKey=useRef("");
 useEffect(()=>{let stopped=false;let timer:number|undefined;
   const sync=async()=>{if(stopped)return;const root=document.querySelector(".story-viewer");if(!root){setOwnStory(null);setOpen(false);lastKey.current="";return}
     const path=mediaPathFromViewer(root);if(!path)return;
     const {data:{user}}=await supabase.auth.getUser();if(!user)return;
     const {data:story}=await supabase.from("story_posts").select("id,author_id,media_path").eq("media_path",path).maybeSingle();if(!story)return;
     const key=`${story.id}:${user.id}`;if(key===lastKey.current)return;lastKey.current=key;
     if(story.author_id!==user.id){await supabase.from("story_views").upsert({story_id:story.id,viewer_id:user.id,viewed_at:new Date().toISOString()},{onConflict:"story_id,viewer_id"});setOwnStory(null);return}
     setOwnStory(story as Story);await load(story.id);
   };
   const load=async(storyId:string)=>{const {data}=await supabase.from("story_views").select("viewer_id,viewed_at").eq("story_id",storyId).order("viewed_at",{ascending:false});const rows=(data||[]) as Viewer[];if(!rows.length){setViewers([]);return}const ids=rows.map(x=>x.viewer_id);const {data:ps}=await supabase.from("profiles").select("id,display_name,username,avatar_url,profile_colour").in("id",ids);const map=new Map((ps||[]).map((p:any)=>[p.id,p]));setViewers(rows.map(r=>({...r,profile:map.get(r.viewer_id)||null})))};
   const observer=new MutationObserver(()=>{window.clearTimeout(timer);timer=window.setTimeout(sync,120)});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});sync();
   const refresh=window.setInterval(()=>{if(ownStory)load(ownStory.id)},5000);
   return()=>{stopped=true;observer.disconnect();window.clearTimeout(timer);window.clearInterval(refresh)};
 },[supabase]);
 if(!ownStory)return null;
 return <><button className="csv-count" onClick={()=>setOpen(true)}>👁 {viewers.length} {viewers.length===1?"view":"views"}</button>{open&&<div className="csv-backdrop" onClick={()=>setOpen(false)}><section className="csv-panel" onClick={e=>e.stopPropagation()}><header><div><small>STORY ACTIVITY</small><h2>Viewed by</h2></div><button onClick={()=>setOpen(false)}>×</button></header><div className="csv-summary"><b>👁 {viewers.length}</b><span>{viewers.length===1?"person has":"people have"} viewed this Story</span></div><div className="csv-list">{viewers.length?viewers.map(v=><div className="csv-person" key={v.viewer_id}>{v.profile?.avatar_url?<img src={v.profile.avatar_url} alt=""/>:<span style={{background:v.profile?.profile_colour||"#e9dccb"}}>{(v.profile?.display_name||v.profile?.username||"?").slice(0,1).toUpperCase()}</span>}<div><b>{v.profile?.display_name||"Cookie user"}</b><small>@{v.profile?.username||"user"}</small></div><time>{ago(v.viewed_at)}</time></div>):<div className="csv-empty"><b>No views yet</b><span>When someone views this Story, they’ll appear here.</span></div>}</div><p className="csv-note">Screenshot activity is not shown because standard web browsers do not reliably report device screenshots.</p></section></div>}<style jsx global>{`.csv-count{position:fixed;z-index:2147482500;left:50%;bottom:max(88px,calc(72px + env(safe-area-inset-bottom)));transform:translateX(-50%);border:1px solid rgba(255,255,255,.35);background:rgba(22,15,12,.68);backdrop-filter:blur(12px);color:#fff;border-radius:999px;padding:10px 16px;font-weight:800;box-shadow:0 8px 30px #0004;cursor:pointer}.csv-backdrop{position:fixed;inset:0;z-index:2147483400;background:rgba(20,14,11,.55);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}.csv-panel{width:min(470px,100%);max-height:76vh;overflow:auto;background:#fffaf4;color:#3a261c;border-radius:26px 26px 0 0;padding:22px;box-sizing:border-box;box-shadow:0 -20px 60px #0004}.csv-panel header{display:flex;justify-content:space-between;align-items:flex-start}.csv-panel header small{letter-spacing:.12em;font-weight:900;color:#9b6a48}.csv-panel header h2{font-size:28px;margin:5px 0 15px}.csv-panel header button{width:42px;height:42px;border:0;border-radius:50%;background:#f1e5d7;font-size:24px}.csv-summary{display:flex;align-items:baseline;gap:9px;background:#f8eddf;border-radius:16px;padding:13px 15px;margin-bottom:10px}.csv-summary b{font-size:18px}.csv-summary span{font-size:13px;color:#7a6759}.csv-list{display:flex;flex-direction:column}.csv-person{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:11px;padding:11px 2px;border-bottom:1px solid #eee3d7}.csv-person>img,.csv-person>span{width:46px;height:46px;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-weight:900}.csv-person div{display:flex;flex-direction:column}.csv-person div b{font-size:14px}.csv-person div small{color:#877366;margin-top:2px}.csv-person time{font-size:11px;color:#9a887a}.csv-empty{text-align:center;padding:38px 10px;display:flex;flex-direction:column;gap:6px}.csv-empty span{font-size:13px;color:#887466}.csv-note{font-size:11px;line-height:1.4;color:#9b887a;margin:14px 0 0;text-align:center}@media(min-width:700px){.csv-backdrop{align-items:center;padding:20px}.csv-panel{border-radius:26px;max-height:70vh}}`}</style></>
}
