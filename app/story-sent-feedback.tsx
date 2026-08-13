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

    const observer = new MutationObserver(() => {
      if (document.querySelector(".story-sent-toast")) showConfirmation();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
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
        zIndex: 10000,
        left: "50%",
        bottom: "max(92px, calc(72px + env(safe-area-inset-bottom)))",
        transform: "translateX(-50%)",
        padding: "11px 20px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.44)",
        background: "rgba(60,33,24,.95)",
        color: "white",
        fontWeight: 900,
        boxShadow: "0 12px 34px rgba(43,22,12,.5)",
        backdropFilter: "blur(10px)",
        pointerEvents: "none",
      }}
    >
      Sent ✓
    </div>
  );
}
