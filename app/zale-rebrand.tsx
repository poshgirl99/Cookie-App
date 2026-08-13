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
  [/Cookie/g, "Zale"],
  [/cookie/g, "Zale"],
];

const zaleTheme = `
body.zale-brand {
  --cream:#f7f5ff; --cream2:#eee9ff; --cocoa:#21143f; --muted:#756b8d;
  --caramel:#7450d8; --orange:#6d43d6; --line:#ddd5f5; --white:#ffffff;
  background:#f8f7fc; color:#21143f;
}
.zale-brand .app-shell,.zale-brand .app-frame,.zale-brand .page{background:#f8f7fc}
.zale-brand .app-frame header{background:#fff;border-color:#e8e3f5;box-shadow:0 1px 0 #ece8f5}
.zale-brand .app-frame nav{background:#fff;border-color:#e8e3f5}
.zale-brand .app-frame nav button{color:#817995}.zale-brand .app-frame nav button.active{color:#6d43d6}
.zale-brand .chat-sidebar.page{background:#fbfaff;border-color:#e8e3f5}
.zale-brand .chat-sidebar .kicker{color:#7447df}
.zale-brand .crumb-legend{background:#f0ecff;border:1px solid #e0d7ff;color:#71678b}
.zale-brand .crumb-status i{background:#9b8fb8}.zale-brand .crumb-status.read i{background:#7047da}
.zale-brand .search-box,.zale-brand .search-box input,.zale-brand input{background:#fff;border-color:#ded8ee}
.zale-brand input:focus{border-color:#7450d8!important;box-shadow:0 0 0 4px #7450d81c}
.zale-brand .folder-row button,.zale-brand .filter-row button{background:#fff;border-color:#ddd5f1;color:#2a194d}
.zale-brand .folder-row button.active,.zale-brand .filter-row button.active{background:#7047da;color:#fff;border-color:#7047da}
.zale-brand .chat-list>button,.zale-brand .chat-list>button:nth-child(even){background:#fff;border-color:#e3def0;box-shadow:0 5px 14px #4e34700c;border-radius:18px}
.zale-brand .chat-list>button:hover{border-color:#a58be7;box-shadow:0 7px 18px #5938a817}
.zale-brand .chat-avatar-wrap>.avatar{box-shadow:3px 3px 0 #d8cdf7}
.zale-brand .desktop-chat-stage{background:radial-gradient(circle at 78% 15%,#e9e0ff 0 10%,transparent 32%),linear-gradient(135deg,#f6f3ff,#eee9fb 58%,#e4dcf7)}
.zale-brand .desktop-chat-empty{background:#fff;border-color:#ded5f3;box-shadow:0 22px 60px #3b24621a}
.zale-brand .desktop-chat-empty>span{display:none}
.zale-brand .desktop-chat-empty:before{content:'Z';display:grid;place-items:center;width:68px;height:68px;margin:0 auto 20px;border-radius:22px;background:linear-gradient(145deg,#8558ea,#5b32bd);color:#fff;font-size:38px;font-weight:900;box-shadow:0 12px 28px #5d3ab52b}
.zale-brand .primary,.zale-brand .new-chat-button{background:#2b1245;color:#fff;box-shadow:0 9px 24px #35145025}
.zale-brand .primary:hover,.zale-brand .new-chat-button:hover{background:#7047da}
.zale-brand .profile-hero{background:linear-gradient(135deg,#e8e0ff,#cfc0f7)}
.zale-brand .profile-identity-setting,.zale-brand .photo-choice{background:#faf9ff;border-color:#e1dbf1}
.zale-brand .profile-inline-editor{background:#f0ecfb}
.zale-brand .energy-edit-grid>button.selected,.zale-brand .profile-interest-editor>button.selected{border-color:#7047da;background:#eee8ff;box-shadow:inset 0 0 0 1px #7047da}
.zale-brand .splash{background:radial-gradient(circle at 50% 44%,#faf8ff 0 18%,#e9e0ff 48%,#bda8ee)}
.zale-brand .splash p{color:#71658d}.zale-brand .progress{background:#d9cff4}.zale-brand .progress i{background:#7047da}
.zale-brand .auth-art{background:radial-gradient(circle at 50% 40%,#faf8ff,#e6ddff 55%,#bca5ee)}
.zale-brand .auth-panel{background:#fff}.zale-brand .kicker{color:#7047da}
.zale-brand .switch button{color:#7047da}
.zale-brand .notice{background:#f0ecff;border-color:#dcd2fa}
.zale-brand .falling-crumbs,.zale-brand .crumb,.zale-brand .falling-crumbs i{display:none!important}
`;

function replaceText(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const textNode = root as Text;
    const parent = textNode.parentElement;
    if (!parent || parent.closest("script,style")) return;
    let value = textNode.nodeValue || "";
    for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
    if (value !== textNode.nodeValue) textNode.nodeValue = value;
    return;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) replaceText(textNode);
}

export default function ZaleRebrand() {
  useEffect(() => {
    document.body.classList.add("zale-brand");
    const style = document.createElement("style");
    style.id = "zale-theme";
    style.textContent = zaleTheme;
    document.head.appendChild(style);
    replaceText(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") replaceText(mutation.target);
        mutation.addedNodes.forEach((node) => replaceText(node));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); style.remove(); };
  }, []);
  return null;
}
