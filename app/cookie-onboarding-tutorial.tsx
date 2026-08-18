"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase";
const steps=[
 {title:"Welcome to Cookie 🍪",text:"New here? Take a quick tour and see how everything works.",welcome:true},
 {title:"Your Chats",text:"This is where your conversations live. New and unread chats will appear here.",target:"chats"},
 {title:"Find What You Need",text:"Use All, Unread, Groups, Best Friends and Unreplied to quickly find the conversations that need your attention.",target:"filters"},
 {title:"Find Your People",text:"Use Add Friends to search by username and connect with people on Cookie.",target:"friends"},
 {title:"Stay in the Loop",text:"Notifications keep you updated. More gives you friendships, saved messages, your QR code, settings and help.",target:"top"},
 {title:"Stories",text:"Share moments with friends for 24 hours, see what they’re up to and reply directly to their Stories.",target:"stories"},
 {title:"Crumbs",text:"Discover posts in For You and Following. Like, comment and repost the Crumbs you enjoy.",target:"crumbs"},
 {title:"Your Profile",text:"Make Cookie yours. Add your photo, bio, Cookie Energy and Interests so friends can get to know you.",target:"profile"},
 {title:"A Few Things to Know",text:"Save messages you want to keep, manage your Best Friends, use your QR code to connect quickly, and visit Help whenever you need support."},
 {title:"You’re all set 🍪",text:"Cookie is yours. Start chatting, sharing and connecting.",finish:true}
];
function visible(el:HTMLElement){const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0}
function findTarget(t?:string){
 if(!t)return null;
 if(t==="filters"){
   const direct=document.querySelector("[data-chat-filters]") as HTMLElement|null;
   if(direct&&visible(direct))return direct;
   const labels=new Set(["all","unread","groups","best friends","unreplied"]);
   const buttons=([...document.querySelectorAll("button")] as HTMLElement[]).filter(b=>labels.has((b.textContent||"").trim().toLowerCase())&&visible(b));
   if(buttons.length>=3){
     let p:HTMLElement|null=buttons[0].parentElement;
     while(p&&p!==document.body){const text=(p.textContent||"").toLowerCase();if([...labels].every(x=>text.includes(x)))return p;p=p.parentElement}
     return buttons[0].parentElement||buttons[0];
   }
   return null;
 }
 const qs:string[] = t==="chats"?["[data-tab='chats']","button[aria-label*='Chat']","nav button:first-child"]:t==="friends"?["button[aria-label*='friend' i]"]:t==="top"?["button[aria-label='More']","button[aria-label*='notification' i]"]:t==="stories"?["[data-tab='stories']","button[aria-label*='Stories' i]"]:t==="crumbs"?["[data-tab='crumbs']","button[aria-label*='Crumbs' i]"]:t==="profile"?["[data-tab='profile']","button[aria-label*='Profile' i]"]:[];
 for(const q of qs){const all=[...document.querySelectorAll(q)] as HTMLElement[];const el=all.find(visible);if(el)return el}return null
}
export default function CookieOnboardingTutorial(){const supabase=useMemo(()=>createClient(),[]);const [uid,setUid]=useState("");const [open,setOpen]=useState(false);const [step,setStep]=useState(0);const [box,setBox]=useState<DOMRect|null>(null);
 useEffect(()=>{void init();const replay=()=>{setStep(0);setOpen(true);void persist(0,"in_progress",true)};window.addEventListener("cookie:replay-tutorial",replay);return()=>window.removeEventListener("cookie:replay-tutorial",replay)},[]);
 useEffect(()=>{if(!open)return;const update=()=>setBox(findTarget(steps[step]?.target)?.getBoundingClientRect()||null);update();const id=setTimeout(update,250);window.addEventListener("resize",update);return()=>{clearTimeout(id);window.removeEventListener("resize",update)}},[open,step]);
 async function init(){const {data:{user}}=await supabase.auth.getUser();if(!user)return;setUid(user.id);const {data}=await supabase.from("onboarding_tutorial_progress").select("status,current_step").eq("user_id",user.id).maybeSingle();if(!data){await supabase.from("onboarding_tutorial_progress").insert({user_id:user.id,status:"not_started",current_step:0});setStep(0);setTimeout(()=>setOpen(true),900)}else if(data.status==="not_started"||data.status==="in_progress"){setStep(Math.min(Number(data.current_step)||0,9));setTimeout(()=>setOpen(true),900)}}
 async function persist(s:number,status:string,forceUid=false){const id=uid||(forceUid?(await supabase.auth.getUser()).data.user?.id:"");if(!id)return;await supabase.from("onboarding_tutorial_progress").upsert({user_id:id,status,current_step:s,started_at:status==="in_progress"?new Date().toISOString():undefined,completed_at:status==="completed"?new Date().toISOString():undefined,updated_at:new Date().toISOString()})}
 async function next(){if(step===9){await persist(10,"completed");setOpen(false);return}const n=step+1;setStep(n);await persist(n,"in_progress")}
 async function back(){const n=Math.max(0,step-1);setStep(n);await persist(n,"in_progress")}
 async function skip(){await persist(step,"skipped");setOpen(false)}
 if(!open)return null;const s=steps[step];const hasSpot=!!(box&&s.target);return <div className={`cot-overlay ${hasSpot?"cot-overlay-spot":"cot-overlay-dim"}`}>{hasSpot&&<div className="cot-spot" style={{left:box!.left-8,top:box!.top-8,width:box!.width+16,height:box!.height+16}}/>}<section className={`cot-card ${s.welcome||s.finish?"cot-center":""}`}><div className="cot-progress"><span>Cookie Tour</span><b>{step+1} of {steps.length}</b></div><div className="cot-bar"><i style={{width:`${((step+1)/steps.length)*100}%`}}/></div><h2>{s.title}</h2><p>{s.text}</p>{s.welcome?<div className="cot-actions"><button className="cot-ghost" onClick={skip}>Skip</button><button className="cot-primary" onClick={async()=>{setStep(1);await persist(1,"in_progress")}}>Start Tour</button></div>:s.finish?<div className="cot-actions"><button className="cot-primary cot-full" onClick={next}>Start using Cookie</button></div>:<><div className="cot-actions"><button className="cot-ghost" onClick={back}>Back</button><button className="cot-primary" onClick={next}>Next</button></div><button className="cot-skip" onClick={skip}>Skip Tour</button></>}</section><style jsx global>{`.cot-overlay{position:fixed;inset:0;z-index:2147483600;animation:cotFade .25s ease both}.cot-overlay-dim{background:rgba(25,17,12,.62)}.cot-overlay-spot{background:transparent}.cot-spot{position:fixed;border-radius:18px;background:transparent;box-shadow:0 0 0 9999px rgba(25,17,12,.62),0 0 0 2px rgba(255,255,255,.92);pointer-events:none;transition:all .3s ease}.cot-card{position:fixed;z-index:2;right:24px;bottom:24px;width:min(380px,calc(100vw - 32px));box-sizing:border-box;background:#fffaf3;color:#382317;border:1px solid rgba(117,77,48,.14);border-radius:24px;padding:22px;box-shadow:0 24px 70px rgba(28,17,10,.28);animation:cotRise .3s cubic-bezier(.2,.8,.2,1) both}.cot-center{left:50%;top:50%;right:auto;bottom:auto;transform:translate(-50%,-50%);animation:cotCenter .3s ease both}.cot-progress{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.03em;text-transform:uppercase;opacity:.6}.cot-bar{height:4px;background:#eadfce;border-radius:10px;margin:9px 0 20px;overflow:hidden}.cot-bar i{display:block;height:100%;background:#5a3421;border-radius:10px;transition:width .25s ease}.cot-card h2{font-size:24px;letter-spacing:-.025em;margin:0 0 9px}.cot-card p{font-size:14px;line-height:1.55;margin:0 0 22px;opacity:.78}.cot-actions{display:flex;gap:10px;justify-content:flex-end}.cot-actions button{border:0;border-radius:13px;padding:11px 16px;font-weight:750;cursor:pointer}.cot-primary{background:#4b2d1c;color:white}.cot-ghost{background:#f2e5d4;color:#4b2d1c}.cot-full{width:100%}.cot-skip{display:block;margin:13px auto 0;border:0;background:transparent;color:#6d5849;font-size:12px;text-decoration:underline;cursor:pointer}@keyframes cotFade{from{opacity:0}to{opacity:1}}@keyframes cotRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes cotCenter{from{opacity:0;transform:translate(-50%,-47%)}to{opacity:1;transform:translate(-50%,-50%)}}@media(max-width:600px){.cot-card:not(.cot-center){right:16px;bottom:18px}.cot-card{border-radius:21px;padding:19px}.cot-card h2{font-size:21px}}`}</style></div>}
