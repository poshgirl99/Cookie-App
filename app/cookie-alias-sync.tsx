"use client";

import { useEffect } from "react";

type AliasMap = Record<string,{alias:string;original:string}>;

function readAliases(): AliasMap {
  try { return JSON.parse(localStorage.getItem("zale-friend-aliases") || "{}"); }
  catch { return {}; }
}

function getAlias(visible:string, original:string, entries:{alias:string;original:string}[]) {
  return entries.find(item => item.original === original || item.alias === visible);
}

function applyAliases() {
  const entries = Object.values(readAliases());
  if (!entries.length) return;

  const selectors = ".friend-profile-identity h2,.chat-list b,.chat-profile-trigger b,.profile-peek-button b,.person b";
  document.querySelectorAll<HTMLElement>(selectors).forEach(node => {
    // Do not touch Coco's AI badge/header text.
    if (node.closest(".zee-chat-row,.zee-native-chat")) return;

    const visible = (node.textContent || "").trim();
    const remembered = node.dataset.cookieOriginal || node.dataset.zaleOriginal || "";
    const original = remembered || visible;
    const hit = getAlias(visible, original, entries);
    if (!hit) return;

    if (!node.dataset.cookieOriginal) node.dataset.cookieOriginal = hit.original;
    node.dataset.cookieAlias = hit.alias;

    // Only write when React has restored another value. This prevents a mutation loop.
    if (visible !== hit.alias) node.textContent = hit.alias;
  });
}

export default function CookieAliasSync(){
  useEffect(() => {
    let frame = 0;
    let timer: number | undefined;
    let applying = false;

    const run = () => {
      if (applying) return;
      applying = true;
      applyAliases();
      applying = false;
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    };

    // React updates relative times/chat rows frequently. A short reconciliation timer
    // ensures the user's chosen display name remains the stable visible value.
    timer = window.setInterval(run, 120);
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("storage",sync);
    window.addEventListener("focus",sync);
    document.addEventListener("click",sync,true);
    document.addEventListener("visibilitychange",sync);

    return () => {
      cancelAnimationFrame(frame);
      if (timer) window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener("storage",sync);
      window.removeEventListener("focus",sync);
      document.removeEventListener("click",sync,true);
      document.removeEventListener("visibilitychange",sync);
    };
  },[]);
  return null;
}
