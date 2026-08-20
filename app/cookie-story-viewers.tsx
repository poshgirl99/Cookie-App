"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase";

type Viewer={viewer_id:string;viewed_at:string;profile?:{id:string;display_name:string;username:string;avatar_url:string|null;profile_colour:string|null}|null};
type Story={id:string;author_id:string;media_path:string;created_at?:string};

function extractStoryPath(raw:string){
  if(!raw)return "";
  let src=raw;
  try{src=decodeURIComponent(src)}catch{}
  try{src=decodeURIComponent(src)}catch{}
  const markers=["/object/sign/story-media/","/object/public/story-media/","/story-media/"];
  for(const marker of markers){const i=src.indexOf(marker);if(i>=0)return src.slice(i+marker.length).split(/[?\"')]/)[0]}
  const m=src.match(/story-media(?:%2F|\/)([^?\"')]+)/i);
  return m?.[1]?m[1].replace(/%2F/gi,"/"):"";
}
function mediaPathFromViewer(root:Element){
  const media=[...root.querySelectorAll("img[src],video[src],source[src]")] as (HTMLImageElement|HTMLVideoElement|HTMLSourceElement)[];
  for(const el of media){const path=extractStoryPath(el.getAttribute("src")||"");if(path)return path}
  const styled=[root,...root.querySelectorAll<HTMLElement>("[style]")];
  for(const el of styled){const path=extractStoryPath(getComputedStyle(el as Element).backgroundImage||"");if(path)return path}
  return "";
}
function ago(iso:string){const s=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(s<60)return "just now";if(s<3600)return `${Math.floor(s/60)}m ago`;if(s<86400)return `${Math.floor(s/3600)}h ago`;return `${Math.floor(s/86400)}d ago`}

export default function CookieStoryViewers(){
 const supabase=useMemo(()=>createClient(),[]);
 const [ownStory,setOwnStory]=useState<Story|null>(null),[viewers,setViewers]=useState<Viewer[]>([]),[open,setOpen]=useState(false);
 const lastKey=useRef("");
 useEffect(()=>{let stopped=false;let debounce:number|undefined;
   const loadViewers=async(storyId:string)=>{const {data}=await supabase.from("story_views").select("viewer_id,viewed_at").eq("story_id",storyId).order("viewed_at",{ascending:false});const rows=(data||[]) as Viewer[];if(!rows.length){setViewers([]);return}const ids=[...new Set(rows.map(x=>x.viewer_id))];const {data:ps}=await supabase.from("profiles").select("id,display_name,username,avatar_url,profile_colour").in("id",ids);const map=new Map((ps||[]).map((p:any)=>[p.id,p]));setViewers(rows.map(r=>({...r,profile:map.get(r.viewer_id)||null})))};
   const latestOwn=async(uid:string)=>{const {data}=await supabase.from("story_posts").select("id,author_id,media_path,created_at").eq("author_id",uid).gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle();return data as Story|null};
   const sync=async()=>{if(stopped)return;const root=document.querySelector(".story-viewer");if(!root){setOwnStory(null);setViewers([]);setOpen(false);lastKey.current="";return}
     const {data:{user}}=await supabase.auth.getUser();if(!user)return;
     const isOwnViewer=!root.querySelector(".story-reply-area");
     const path=mediaPathFromViewer(root);
     let story:Story|null=null;
     if(path){const {data}=await supabase.from("story_posts").select("id,author_id,media_path,created_at").eq("media_path",path).maybeSingle();story=data as Story|null}
     if(!story&&isOwnViewer)story=await latestOwn(user.id);
     if(!story){setOwnStory(null);return}
     const key=`${story.id}:${user.id}`;
     if(story.author_id===user.id||isOwnViewer){setOwnStory(story);await loadViewers(story.id);lastKey.current=key;return}
     setOwnStory(null);setOpen(false);
     if(key!==lastKey.current){lastKey.current=key;await supabase.from("story_views").upsert({story_id:story.id,viewer_id:user.id,viewed_at:new Date().toISOString()},{onConflict:"story_id,viewer_id"})}
   };
   const observer=new MutationObserver(()=>{window.clearTimeout(debounce);debounce=window.setTimeout(sync,80)});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src","style","class"]});void sync();const refresh=window.setInterval(sync,1200);
   return()=>{stopped=true;observer.disconnect();window.clearTimeout(debounce);window.clearInterval(refresh)}
 },[supabase]);
 if(!ownStory)return null;
 return <><button className="csv-count" onClick={()=>setOpen(true)} aria-label="Story viewers">👁 {viewers.length} {viewers.length===1?"view":"views"}</button>{open&&<div className="csv-backdrop" onClick={()=>setOpen(false)}><section className="csv-panel" onClick={e=>e.stopPropagation()}><header><div><small>STORY ACTIVITY</small><h2>Viewed by</h2></div><button onClick={()=>setOpen(false)}>×</button></header><div className="csv-summary"><b>👁 {viewers.length}</b><span>{viewers.length===1?"person has":"people have"} viewed this Story</span></div><div className="csv-list">{viewers.length?viewers.map(v=><div className="csv-person" key={v.viewer_id}>{v.profile?.avatar_url?<img src={v.profile.avatar_url} alt=""/>:<span style={{background:v.profile?.profile_colour||"#e9dccb"}}>{(v.profile?.display_name||v.profile?.username||"?").slice(0,1).toUpperCase()}</span>}<div><b>{v.profile?.display_name||"Cookie user"}</b><small>@{v.profile?.username||"user"}</small></div><time>{ago(v.viewed_at)}</time></div>):<div className="csv-empty"><b>No views yet</b><span>When someone views this Story, they’ll appear here.</span></div>}</div><p className="csv-note">Cookie can reliably show Story views. Standard web browsers do not reliably expose device screenshots.</p></section></div>}<style jsx global>{`.csv-count{position:fixed;z-index:2147483640;left:50%;bottom:max(30px,calc(20px + env(safe-area-inset-bottom)));transform:translateX(-50%);border:1px solid rgba(255,255,255,.42);background:rgba(22,15,12,.84);backdrop-filter:blur(12px);color:#fff;border-radius:999px;padding:11px 18px;font-weight:800;box-shadow:0 8px 30px #0005;cursor:pointer}.csv-backdrop{position:fixed;inset:0;z-index:2147483642;background:rgba(20,14,11,.55);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}.csv-panel{width:min(470px,100%);max-height:76vh;overflow:auto;background:#fffaf4;color:#3a261c;border-radius:26px 26px 0 0;padding:22px;box-sizing:border-box;box-shadow:0 -20px 60px #0004}.csv-panel header{display:flex;justify-content:space-between;align-items:flex-start}.csv-panel header small{letter-spacing:.12em;font-weight:900;color:#9b6a48}.csv-panel header h2{font-size:28px;margin:5px 0 15px}.csv-panel header button{width:42px;height:42px;border:0;border-radius:50%;background:#f1e5d7;font-size:24px}.csv-summary{display:flex;align-items:baseline;gap:9px;background:#f8eddf;border-radius:16px;padding:13px 15px;margin-bottom:10px}.csv-summary span{font-size:13px;color:#7a6759}.csv-person{display:grid;grid-template-columns:48px 1fr auto;align-items:center;gap:11px;padding:11px 2px;border-bottom:1px solid #eee3d7}.csv-person>img,.csv-person>span{width:46px;height:46px;border-radius:50%;object-fit:cover;display:grid;place-items:center;font-weight:900}.csv-person div{display:flex;flex-direction:column}.csv-person small,.csv-person time{color:#877366;font-size:11px}.csv-empty{text-align:center;padding:38px 10px;display:flex;flex-direction:column;gap:6px}.csv-empty span{font-size:13px;color:#887466}.csv-note{font-size:11px;line-height:1.4;color:#9b887a;margin:14px 0 0;text-align:center}@media(min-width:700px){.csv-backdrop{align-items:center;padding:20px}.csv-panel{border-radius:26px;max-height:70vh}}`}</style></>
}
