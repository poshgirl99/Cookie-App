"use client";

import { useEffect } from "react";

const replacements: Array<[RegExp, string]> = [
  [/Chat Jar/g, "Chats"],
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
  [/🍪/g, ""],
];

const zaleTheme = `
body.zale-brand {
  --cream:#faf9ff; --cream2:#f1edff; --cocoa:#1d123f; --muted:#736a8f;
  --caramel:#7c4dff; --orange:#6e3de2; --line:#e5dff5; --white:#ffffff;
  background:#faf9ff; color:#1d123f; font-family:Inter,"Segoe UI",Arial,sans-serif;
}
.zale-brand .app-shell,.zale-brand .app-frame,.zale-brand .page{background:#faf9ff}
.zale-brand .app-frame{box-shadow:none}
.zale-brand .app-frame header{background:#fff;border-color:#ece8f6;box-shadow:0 1px 0 #ece8f6;height:72px}
.zale-brand .brand b{font-size:28px;letter-spacing:-1.5px;color:#1d123f}
.zale-brand .cookie-logo{background:linear-gradient(145deg,#915eff,#5d2bd1);border-radius:18px;box-shadow:0 10px 25px #7047d433}
.zale-brand .cookie-logo img{display:none!important}
.zale-brand .cookie-logo:before{content:'Z';color:#fff;font-weight:1000;font-size:30px;line-height:1}
.zale-brand .cookie-logo:after{content:'✦';position:absolute;right:-4px;top:-6px;color:#a977ff;font-size:12px}
.zale-brand .app-frame nav{background:rgba(255,255,255,.97);border-color:#ece8f6;box-shadow:0 -8px 28px #4c32700d}
.zale-brand .app-frame nav button{color:#847b9d}.zale-brand .app-frame nav button.active{color:#6c36df}
.zale-brand .chat-sidebar.page{background:#fcfbff;border-color:#ebe6f6;padding-top:34px}
.zale-brand .chat-sidebar .kicker{color:#8b5cf6;font-weight:800;letter-spacing:.3px;text-transform:none;font-size:14px}
.zale-brand .chat-sidebar .title-row h1{font-size:42px;letter-spacing:-2px;color:#1d123f}
.zale-brand .new-chat-button,.zale-brand .primary{background:linear-gradient(135deg,#7b45ec,#6029d2);color:#fff;border:0;box-shadow:0 10px 25px #5d31cd24}
.zale-brand .new-chat-button:hover,.zale-brand .primary:hover{background:linear-gradient(135deg,#8a5af2,#6d37dd)}
.zale-brand .crumb-legend{background:#f2efff;border:1px solid #e4ddfb;color:#746b8d}
.zale-brand .crumb-status i{background:#9c92b3}.zale-brand .crumb-status.read i{background:#7445e4}
.zale-brand .search-box,.zale-brand .search-box input,.zale-brand input{background:#fff;border-color:#e2dcef}
.zale-brand .search-box{box-shadow:0 5px 16px #44276f0d}
.zale-brand input:focus{border-color:#7b4bea!important;box-shadow:0 0 0 4px #7b4bea14}
.zale-brand .folder-row button,.zale-brand .filter-row button{background:#fff;border-color:#e3ddef;color:#2b1b51;border-radius:999px;box-shadow:none}
.zale-brand .folder-row button.active,.zale-brand .filter-row button.active{background:linear-gradient(135deg,#7742e7,#6531d8);color:#fff;border-color:transparent}
.zale-brand .chat-list{gap:12px}
.zale-brand .chat-list>button,.zale-brand .chat-list>button:nth-child(even){background:#fff;border-color:#e9e4f4;box-shadow:0 8px 22px #47306a10;border-radius:20px;min-height:84px}
.zale-brand .chat-list>button:hover{border-color:#c6b4ef;box-shadow:0 10px 26px #5b3c9a18;transform:translateY(-1px)}
.zale-brand .chat-avatar-wrap>.avatar{box-shadow:0 0 0 3px #efeaff;border-radius:50%}
.zale-brand .desktop-chat-stage{position:relative;overflow:hidden;background:radial-gradient(circle at 78% 75%,#e5d6ff 0 12%,transparent 30%),radial-gradient(circle at 48% 5%,#f1ebff 0 16%,transparent 38%),linear-gradient(135deg,#faf9ff,#f5f1ff 58%,#eee8ff)}
.zale-brand .desktop-chat-stage:before{content:'';position:absolute;inset:12% 14%;border:1px solid #d8c9fb;border-radius:50%;transform:rotate(-8deg);opacity:.55}
.zale-brand .desktop-chat-stage:after{content:'✦   ✧      ✦';position:absolute;left:18%;top:17%;right:15%;color:#9e72ee;font-size:26px;letter-spacing:180px;opacity:.75;pointer-events:none}
.zale-brand .desktop-chat-empty{position:relative;z-index:1;background:transparent!important;border:0!important;box-shadow:none!important;max-width:680px;padding:70px 40px;text-align:center}
.zale-brand .desktop-chat-empty>span,.zale-brand .desktop-chat-empty>div:first-child{display:none!important}
.zale-brand .desktop-chat-empty:before{content:'Z';display:grid;place-items:center;width:118px;height:118px;margin:0 auto 34px;border-radius:34px;background:linear-gradient(145deg,#8f59ff,#642dd7);color:#fff;font-size:62px;font-weight:1000;box-shadow:0 20px 48px #6030d53d;transform:rotate(-2deg)}
.zale-brand .desktop-chat-empty:after{content:'';position:absolute;width:180px;height:58px;left:50%;top:100px;transform:translateX(-50%) rotate(-9deg);border:3px solid #8c61ed;border-radius:50%;opacity:.65;pointer-events:none}
.zale-brand .desktop-chat-empty h1,.zale-brand .desktop-chat-empty h2{font-size:54px;line-height:1.04;letter-spacing:-2.5px;color:#1d123f;margin:0 auto 18px;max-width:650px}
.zale-brand .desktop-chat-empty p{font-size:20px;color:#746b8d;margin-bottom:28px}
.zale-brand .desktop-chat-empty button{border-radius:18px;padding:16px 28px;background:linear-gradient(135deg,#7742e7,#6531d8);color:#fff;border:0;font-size:18px;font-weight:800;box-shadow:0 12px 28px #5d31cd26}
.zale-brand .profile-hero{background:linear-gradient(135deg,#eee9ff,#d7c8fb)}
.zale-brand .profile-identity-setting,.zale-brand .photo-choice{background:#faf9ff;border-color:#e1dbf1}
.zale-brand .profile-inline-editor{background:#f1edfb}
.zale-brand .energy-edit-grid>button.selected,.zale-brand .profile-interest-editor>button.selected{border-color:#7047da;background:#eee8ff;box-shadow:inset 0 0 0 1px #7047da}
.zale-brand .splash{background:radial-gradient(circle at 50% 44%,#faf8ff 0 18%,#e9e0ff 48%,#bda8ee)}
.zale-brand .splash p{color:#71658d}.zale-brand .progress{background:#d9cff4}.zale-brand .progress i{background:#7047da}
.zale-brand .auth-art{background:radial-gradient(circle at 50% 40%,#faf8ff,#e6ddff 55%,#bca5ee)}
.zale-brand .auth-panel{background:#fff}.zale-brand .kicker{color:#7047da}
.zale-brand .switch button{color:#7047da}.zale-brand .notice{background:#f0ecff;border-color:#dcd2fa}
.zale-brand .falling-crumbs,.zale-brand .crumb,.zale-brand .falling-crumbs i{display:none!important}
@media(max-width:760px){.zale-brand .desktop-chat-stage{display:none}.zale-brand .chat-sidebar .title-row h1{font-size:34px}.zale-brand .brand b{font-size:22px}}
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
