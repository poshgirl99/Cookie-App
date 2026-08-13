"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase";

type AliasMap = Record<string,{alias:string;original:string}>;
type AliasTarget = {username:string;original:string}|null;

const backgrounds = [["#5a2bc5","#b86cff"],["#1c1234","#7749e6"],["#6f2cff","#ef80d5"],["#22203a","#5e48ff"],["#4b1d69","#d65dcc"],["#2c2258","#8b5cf6"]] as const;
const aliasEmojis=["😂","😭","💜","❤️","🩷","🔥","✨","🥹","😌","😈","🤍","🫶","🥰","😎","🤭","👀","🤝","🫂","🌸","⭐","💫","🙄","😴","🤍","🦋","🌙","☀️","👑","💀","🤎"];

export default function ZaleSocialEnhancements(){
  const supabase=useMemo(()=>createClient(),[]);
  const [storyHost,setStoryHost]=useState<Element|null>(null);
  const [composer,setComposer]=useState(false);
  const [text,setText]=useState("");
  const [bg,setBg]=useState(0);
  const [posting,setPosting]=useState(false);
  const [posted,setPosted]=useState(false);
  const [aliasTarget,setAliasTarget]=useState<AliasTarget>(null);
  const [aliasDraft,setAliasDraft]=useState("");

  function readAliases():AliasMap{try{return JSON.parse(localStorage.getItem("zale-friend-aliases")||"{}");}catch{return {};}}
  function applyAliases(){
    const aliases=readAliases();
    const nodes=Array.from(document.querySelectorAll<HTMLElement>(".friend-profile-identity h2,.chat-list b,.chat-profile-trigger b,.profile-peek-button b,.person b"));
    nodes.forEach((node)=>{
      const current=node.dataset.zaleOriginal||node.textContent?.trim()||"";
      if(!node.dataset.zaleOriginal)node.dataset.zaleOriginal=current;
      const hit=Object.values(aliases).find((item)=>item.original===current);
      if(hit)node.textContent=hit.alias;
    });
    const h2=document.querySelector(".friend-profile-identity h2") as HTMLElement|null;
    if(h2)h2.title="Tap to edit the name you see for this friend";
  }
  function saveAlias(){
    if(!aliasTarget)return;
    const clean=aliasDraft.trim().slice(0,40);
    if(!clean)return;
    const aliases=readAliases();
    aliases[aliasTarget.username]={alias:clean,original:aliasTarget.original};
    localStorage.setItem("zale-friend-aliases",JSON.stringify(aliases));
    setAliasTarget(null);setAliasDraft("");
    window.requestAnimationFrame(applyAliases);
  }

  useEffect(()=>{
    const sync=()=>window.requestAnimationFrame(()=>{setStoryHost(document.querySelector(".stories-head"));applyAliases();});
    const click=(event:MouseEvent)=>{
      const target=event.target as HTMLElement|null;
      const name=target?.closest(".friend-profile-identity h2") as HTMLElement|null;
      if(name){
        event.preventDefault();event.stopPropagation();
        const identity=name.closest(".friend-profile-identity");
        const username=(identity?.querySelector("p")?.textContent||"").replace(/^@/,"").trim();
        const original=name.dataset.zaleOriginal||name.textContent?.trim()||"";
        const aliases=readAliases();
        setAliasTarget({username,original});
        setAliasDraft(aliases[username]?.alias||name.textContent?.trim()||original);
        return;
      }
      sync();
    };
    document.addEventListener("click",click,true);sync();
    const reopen=sessionStorage.getItem("zale-reopen-stories");
    if(reopen){sessionStorage.removeItem("zale-reopen-stories");window.setTimeout(()=>{const storiesBtn=Array.from(document.querySelectorAll("nav button")).find((b)=>b.textContent?.includes("Stories")) as HTMLButtonElement|undefined;storiesBtn?.click();sync();},700);}
    return()=>document.removeEventListener("click",click,true);
  },[]);

  async function postTextStory(){
    const clean=text.trim();if(!clean||posting)return;setPosting(true);setPosted(false);
    const {data:{user}}=await supabase.auth.getUser();if(!user){setPosting(false);return;}
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");if(!ctx){setPosting(false);return;}
    const gradient=ctx.createLinearGradient(0,0,1080,1920);gradient.addColorStop(0,backgrounds[bg][0]);gradient.addColorStop(1,backgrounds[bg][1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
    ctx.fillStyle="rgba(255,255,255,.08)";ctx.beginPath();ctx.arc(920,260,210,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(150,1690,260,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="800 76px Arial, sans-serif";const max=820;const words=clean.split(/\s+/);const lines:string[]=[];let line="";
    for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>max&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
    const lineHeight=98;const start=960-((lines.length-1)*lineHeight)/2;lines.slice(0,10).forEach((l,i)=>ctx.fillText(l,540,start+i*lineHeight));ctx.font="700 34px Arial, sans-serif";ctx.globalAlpha=.8;ctx.fillText("Zale",540,1780);ctx.globalAlpha=1;
    const blob=await new Promise<Blob|null>((resolve)=>canvas.toBlob(resolve,"image/png",.94));if(!blob){setPosting(false);return;}
    const path=`${user.id}/text-story-${Date.now()}.png`;const {error:uploadError}=await supabase.storage.from("story-media").upload(path,blob,{contentType:"image/png",upsert:false});
    if(uploadError){alert(uploadError.message);setPosting(false);return;}
    const {error}=await supabase.from("story_posts").insert({author_id:user.id,media_path:path,media_type:"image",caption:""});
    if(error){await supabase.storage.from("story-media").remove([path]);alert("Your text Story could not be posted.");setPosting(false);return;}
    setPosting(false);setPosted(true);setText("");window.setTimeout(()=>{sessionStorage.setItem("zale-reopen-stories","1");window.location.reload();},1100);
  }

  return <>
    {storyHost&&createPortal(<button type="button" className="zale-text-story-button" onClick={()=>setComposer(true)}><b>Aa</b><small>Text</small></button>,storyHost)}
    {aliasTarget&&<div className="zale-alias-modal" role="dialog" aria-modal="true"><div className="zale-alias-card"><button className="zale-alias-close" onClick={()=>setAliasTarget(null)}>×</button><p>DISPLAY NAME</p><h2>Edit name</h2><small>Only you will see this name.</small><input value={aliasDraft} onChange={(e)=>setAliasDraft(e.target.value)} maxLength={40} autoFocus placeholder="Friend name"/><div className="zale-emoji-tray">{aliasEmojis.map((emoji,i)=><button type="button" key={`${emoji}-${i}`} onClick={()=>setAliasDraft((v)=>(v+emoji).slice(0,40))}>{emoji}</button>)}</div><div className="zale-alias-actions"><button type="button" className="quiet" onClick={()=>setAliasTarget(null)}>Cancel</button><button type="button" className="save" disabled={!aliasDraft.trim()} onClick={saveAlias}>Save name</button></div></div></div>}
    {composer&&<div className="zale-text-story-modal" role="dialog" aria-modal="true"><div className="zale-text-story-card"><button className="zale-text-story-close" onClick={()=>setComposer(false)}>×</button><p>TEXT STORY</p><h2>Say it your way.</h2><div className="zale-text-preview" style={{background:`linear-gradient(145deg,${backgrounds[bg][0]},${backgrounds[bg][1]})`}}><span>{text||"Type your Story…"}</span></div><textarea value={text} onChange={(e)=>setText(e.target.value)} maxLength={220} placeholder="Type your Story…" autoFocus/><div className="zale-bg-row">{backgrounds.map((pair,i)=><button key={i} aria-label={`Background ${i+1}`} className={bg===i?"selected":""} style={{background:`linear-gradient(145deg,${pair[0]},${pair[1]})`}} onClick={()=>setBg(i)}/>)}</div><button className="zale-post-text-story" disabled={!text.trim()||posting} onClick={()=>void postTextStory()}>{posted?"Posted ✓":posting?"Posting…":"Post Story"}</button></div></div>}
    <style jsx global>{`
      .friend-profile-identity h2{cursor:pointer;position:relative}.friend-profile-identity h2:after{content:'  ✎';font-size:16px;color:#7a4ce2;opacity:.7}.zale-alias-modal,.zale-text-story-modal{position:fixed;inset:0;background:rgba(20,12,35,.58);backdrop-filter:blur(8px);z-index:2147483000;display:grid;place-items:center;padding:20px}.zale-alias-card,.zale-text-story-card{width:min(520px,94vw);background:#fff;border-radius:28px;padding:26px;position:relative;box-shadow:0 30px 90px rgba(28,14,52,.35)}.zale-alias-close,.zale-text-story-close{position:absolute;right:18px;top:16px;border:0!important;background:#f4f0fb!important;width:38px!important;height:38px!important;border-radius:50%!important;font-size:24px!important}.zale-alias-card>p,.zale-text-story-card>p{font-size:11px;letter-spacing:2px;font-weight:900;color:#7a4ce2}.zale-alias-card h2,.zale-text-story-card h2{margin:4px 0 6px;color:#241443;font-size:30px}.zale-alias-card>small{display:block;color:#7b7092;margin-bottom:16px}.zale-alias-card input{width:100%;box-sizing:border-box;border:1px solid #ddd3f4;border-radius:16px;padding:14px 15px;font:inherit;font-size:18px;outline:none}.zale-alias-card input:focus{border-color:#8151ea;box-shadow:0 0 0 4px #8151ea18}.zale-emoji-tray{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin:14px 0;max-height:150px;overflow:auto}.zale-emoji-tray button{border:0!important;background:#f7f4fd!important;border-radius:10px!important;padding:8px!important;font-size:21px!important;min-width:0!important}.zale-alias-actions{display:flex;justify-content:flex-end;gap:10px}.zale-alias-actions button{border-radius:13px!important;padding:11px 16px!important;font-weight:900!important}.zale-alias-actions .quiet{background:#f5f1fb!important;color:#4f4268!important;border:0!important}.zale-alias-actions .save{background:#6d3fd7!important;color:#fff!important;border:0!important}.zale-text-story-button{margin-left:auto;margin-right:12px;border:1px solid #d8cdf5!important;background:#fff!important;color:#3e246c!important;border-radius:18px!important;padding:9px 14px!important;display:flex!important;align-items:center!important;gap:6px!important;min-height:46px!important;box-shadow:0 8px 24px #4b287314!important}.zale-text-story-button b{font-size:19px}.zale-text-story-button small{font-weight:800}.zale-text-preview{aspect-ratio:9/12;border-radius:24px;display:grid;place-items:center;padding:30px;margin:16px 0;overflow:hidden}.zale-text-preview span{color:#fff;font-size:clamp(28px,5vw,48px);font-weight:900;line-height:1.12;text-align:center;word-break:break-word}.zale-text-story-card textarea{width:100%;box-sizing:border-box;min-height:100px;border:1px solid #ddd3f4;border-radius:16px;padding:14px;font:inherit;resize:none;outline:none}.zale-text-story-card textarea:focus{border-color:#8151ea;box-shadow:0 0 0 4px #8151ea18}.zale-bg-row{display:flex;gap:10px;margin:14px 0 18px}.zale-bg-row button{width:34px!important;height:34px!important;border-radius:50%!important;border:3px solid transparent!important;padding:0!important}.zale-bg-row button.selected{border-color:#fff!important;box-shadow:0 0 0 3px #6f3ed9!important}.zale-post-text-story{width:100%!important;border:0!important;border-radius:15px!important;background:#6d3fd7!important;color:white!important;font-weight:900!important;padding:14px!important}.zale-post-text-story:disabled{opacity:.45}.cookie-logo,.zale-brand .cookie-logo,.zale-brand .faith-brand span,.zale-brand .desktop-chat-empty:before{background-size:142%!important;background-position:center!important;border-radius:22%!important;box-shadow:0 8px 20px rgba(52,25,89,.22)!important}.cookie-logo{outline:1px solid rgba(255,255,255,.22)!important}@media(max-width:760px){.zale-text-story-button{padding:8px 11px!important;margin-right:4px!important}.zale-text-story-button small{display:none}.zale-alias-card,.zale-text-story-card{padding:20px}.zale-text-preview{aspect-ratio:9/11}.zale-emoji-tray{grid-template-columns:repeat(6,1fr)}}
    `}</style>
  </>;
}
