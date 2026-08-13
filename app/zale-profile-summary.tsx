"use client";
import { useEffect } from "react";

const vibeMap:Record<string,{energy:string;vibes:string[]}>= {
  "Choc Chip":{energy:"Calm",vibes:["Chill","Easygoing"]},
  "Funfetti":{energy:"Lively",vibes:["Social","Hyped"]},
  "Caramel":{energy:"Warm",vibes:["Warm","Thoughtful"]},
  "Ginger Snap":{energy:"Bold",vibes:["Bold","Adventurous"]}
};

export default function ZaleProfileSummary(){
  useEffect(()=>{
    const style=document.createElement("style");
    style.textContent=`.zale-profile-summary{width:min(720px,calc(100% - 30px));margin:22px auto 10px;display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left}.zale-profile-summary-card{background:#fff;border:1px solid #e4ddf2;border-radius:20px;padding:18px;box-shadow:0 10px 25px #41255f0e}.zale-profile-summary-card.wide{grid-column:1/-1}.zale-profile-summary-card small{display:block;color:#7d7294;font-weight:900;text-transform:uppercase;letter-spacing:1px;font-size:10px;margin-bottom:7px}.zale-profile-summary-card b{font-size:19px;color:#251543}.zale-profile-summary-pills{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.zale-profile-summary-pills span{padding:7px 11px;border-radius:999px;background:#eee8ff;color:#5e35bd;font-weight:800;font-size:12px}@media(max-width:760px){.zale-profile-summary{grid-template-columns:1fr}.zale-profile-summary-card.wide{grid-column:auto}}`;
    document.head.appendChild(style);return()=>style.remove();
  },[]);

  useEffect(()=>{
    const build=()=>{
      const page=document.querySelector(".profile-page");
      if(!page||page.querySelector(".zale-profile-summary"))return;
      const menuButton=page.querySelector<HTMLElement>(".profile-menu-button");
      if(!menuButton)return;
      menuButton.click();
      setTimeout(()=>{
        const settings=page.querySelector(".profile-settings");
        if(!settings){menuButton.click();return}
        const rows=[...settings.querySelectorAll(".profile-identity-setting")];
        const energyRow=rows.find(x=>x.textContent?.includes("Energy"));
        const interestRow=rows.find(x=>x.textContent?.includes("Interests"));
        const legacy=energyRow?.querySelector("b")?.textContent?.trim()||"";
        const interests=(interestRow?.querySelector("b")?.textContent||"").split(",").map(x=>x.trim()).filter(Boolean);
        const mapped=vibeMap[legacy]||{energy:"Balanced",vibes:["Chill","Social"]};
        const section=document.createElement("section");section.className="zale-profile-summary";
        section.innerHTML=`<div class="zale-profile-summary-card"><small>Energy</small><b>${mapped.energy}</b><div class="zale-profile-summary-pills"><span>${mapped.energy}</span></div></div><div class="zale-profile-summary-card"><small>Vibes</small><b>Your Zale mix</b><div class="zale-profile-summary-pills">${mapped.vibes.map(v=>`<span>${v}</span>`).join("")}</div></div><div class="zale-profile-summary-card wide"><small>Interests</small><div class="zale-profile-summary-pills">${interests.length?interests.map(v=>`<span>${v}</span>`).join(""):"<span>Add interests</span>"}</div></div>`;
        page.querySelector(".stats")?.insertAdjacentElement("afterend",section);
        menuButton.click();
      },120);
    };
    build();const o=new MutationObserver(build);o.observe(document.body,{childList:true,subtree:true});return()=>o.disconnect();
  },[]);
  return null;
}
