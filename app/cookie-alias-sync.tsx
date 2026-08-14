"use client";

import { useEffect } from "react";

type AliasMap = Record<string,{alias:string;original:string}>;

function readAliases(): AliasMap {
  try { return JSON.parse(localStorage.getItem("zale-friend-aliases") || "{}"); }
  catch { return {}; }
}

function applyAliases() {
  const aliases = readAliases();
  const entries = Object.values(aliases);
  if (!entries.length) return;
  const selectors = ".friend-profile-identity h2,.chat-list b,.chat-profile-trigger b,.profile-peek-button b,.person b";
  document.querySelectorAll<HTMLElement>(selectors).forEach((node) => {
    const visible = node.textContent?.trim() || "";
    const original = node.dataset.cookieOriginal || node.dataset.zaleOriginal || visible;
    if (!node.dataset.cookieOriginal) node.dataset.cookieOriginal = original;
    const hit = entries.find((item) => item.original === original || item.alias === visible);
    if (hit && visible !== hit.alias) node.textContent = hit.alias;
  });
}

export default function CookieAliasSync(){
  useEffect(() => {
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyAliases);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("storage",sync);
    window.addEventListener("focus",sync);
    document.addEventListener("click",sync,true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("storage",sync);
      window.removeEventListener("focus",sync);
      document.removeEventListener("click",sync,true);
    };
  },[]);
  return null;
}
