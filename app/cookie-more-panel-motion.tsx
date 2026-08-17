"use client";

export default function CookieMorePanelMotion(){
  return <style jsx global>{`
    .cookie-more-backdrop{
      animation:cookieMoreBackdropFade .22s ease-out both!important;
      will-change:opacity;
    }
    .cookie-more-panel{
      animation:cookieMorePanelIn .26s cubic-bezier(.22,.85,.3,1) both!important;
      transform-origin:right center;
      will-change:transform,opacity;
    }
    @keyframes cookieMoreBackdropFade{
      from{opacity:0}
      to{opacity:1}
    }
    @keyframes cookieMorePanelIn{
      from{opacity:0;transform:translateX(28px)}
      to{opacity:1;transform:translateX(0)}
    }
    @media (prefers-reduced-motion:reduce){
      .cookie-more-backdrop,.cookie-more-panel{animation:none!important}
    }
  `}</style>;
}
