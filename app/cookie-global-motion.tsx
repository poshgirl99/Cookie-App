"use client";

export default function CookieGlobalMotion(){
  return <style jsx global>{`
    @keyframes cookieBackdropFade{from{opacity:0}to{opacity:1}}
    @keyframes cookiePanelIn{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:translateX(0)}}
    @keyframes cookieContentIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}

    .cookie-more-backdrop,.cs-back{animation:cookieBackdropFade .20s ease-out both}
    .cookie-more-panel,.cs-panel{animation:cookiePanelIn .24s cubic-bezier(.22,.8,.28,1) both}

    .cookie-more-panel>header,
    .cookie-more-menu,
    .cookie-friends-view,
    .cookie-saved-list,
    .cookie-qr-view,
    .cookie-help,
    .cs-panel>header,
    .cs-list,
    .cs-body,
    .cs-blocked{animation:cookieContentIn .20s ease-out both}

    .cookie-more-menu button,
    .cookie-friend-list button,
    .cookie-best-grid button,
    .cookie-saved-list button,
    .cs-list>button,
    .cs-body>button,
    .cs-blocked button,
    button[aria-label="Notifications"],
    button[aria-label="More"]{
      transition:transform .14s ease,opacity .14s ease,background-color .14s ease,box-shadow .14s ease;
    }
    .cookie-more-menu button:active,
    .cookie-friend-list button:active,
    .cookie-best-grid button:active,
    .cookie-saved-list button:active,
    .cs-list>button:active,
    .cs-body>button:active,
    .cs-blocked button:active,
    button[aria-label="Notifications"]:active,
    button[aria-label="More"]:active{transform:scale(.975);opacity:.88}

    @media (prefers-reduced-motion: reduce){
      .cookie-more-backdrop,.cs-back,.cookie-more-panel,.cs-panel,
      .cookie-more-panel>header,.cookie-more-menu,.cookie-friends-view,.cookie-saved-list,.cookie-qr-view,.cookie-help,
      .cs-panel>header,.cs-list,.cs-body,.cs-blocked{animation:none!important}
      *{scroll-behavior:auto!important}
    }
  `}</style>;
}
