"use client";

import { useEffect, useRef, useState } from "react";

export default function StorySentFeedback() {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const showConfirmation = () => {
      setVisible(true);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setVisible(false), 2500);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const quickReply = target?.closest(".story-quick-replies button");
      if (quickReply) showConfirmation();
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form?.matches(".story-reply")) return;
      const input = form.querySelector<HTMLInputElement>("input");
      if (input?.value.trim()) showConfirmation();
    };

    const observer = new MutationObserver(() => {
      if (document.querySelector(".story-sent-toast")) showConfirmation();
    });

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      observer.disconnect();
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        zIndex: 2147483647,
        left: "50%",
        bottom: "max(104px, calc(84px + env(safe-area-inset-bottom)))",
        transform: "translateX(-50%)",
        padding: "12px 22px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.55)",
        background: "rgba(60,33,24,.97)",
        color: "white",
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: ".2px",
        boxShadow: "0 14px 38px rgba(43,22,12,.58)",
        backdropFilter: "blur(10px)",
        pointerEvents: "none",
      }}
    >
      Sent ✓
    </div>
  );
}
