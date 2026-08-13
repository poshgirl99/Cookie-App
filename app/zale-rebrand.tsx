"use client";

import { useEffect } from "react";

const replacements: Array<[RegExp, string]> = [
  [/Welcome to Cookie/g, "Welcome to Zale"],
  [/Opening Cookie…/g, "Opening Zale…"],
  [/New to Cookie\?/g, "New to Zale?"],
  [/Cookie circle/g, "Zale circle"],
  [/Cookie Group/g, "Zale Group"],
  [/Cookie Friend/g, "Zale Friend"],
  [/Cookie account/g, "Zale account"],
  [/Cookie user/g, "Zale user"],
  [/on Cookie/g, "on Zale"],
  [/Cookie Energy/g, "Vibes"],
  [/Cookie energy/g, "Vibes"],
  [/Crumbs/g, "Feed"],
  [/Crumb/g, "Post"],
  [/crumbs/g, "posts"],
  [/crumb/g, "post"],
  [/Baking your space…/g, "Getting your space ready…"],
  [/Baking account…/g, "Creating account…"],
  [/Create my Cookie 🍪/g, "Create my Zale"],
  [/Next crumb →/g, "Next →"],
  [/Follow the crumb trail/g, "Your people. Your space."],
  [/Your secret recipe/g, "Your password"],
  [/Create your secret recipe/g, "Create your account"],
  [/Cookie password/g, "Password"],
  [/Pick your flavour/g, "Your vibe"],
  [/Choose your Cookie colour/g, "Personalise your space"],
  [/Last crumb/g, "Almost there"],
];

function replaceText(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest("script,style")) continue;
    let value = textNode.nodeValue || "";
    for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
    if (value !== textNode.nodeValue) textNode.nodeValue = value;
  }
}

export default function ZaleRebrand() {
  useEffect(() => {
    document.body.classList.add("zale-brand");
    replaceText(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => replaceText(node));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
