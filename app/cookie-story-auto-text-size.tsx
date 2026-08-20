"use client";

import { useEffect } from "react";

function sizeForLength(length: number) {
  if (length <= 18) return 64;
  if (length <= 35) return 56;
  if (length <= 55) return 48;
  if (length <= 80) return 42;
  if (length <= 115) return 36;
  if (length <= 160) return 31;
  return 27;
}

export default function CookieStoryAutoTextSize() {
  useEffect(() => {
    const apply = (ta: HTMLTextAreaElement) => {
      if (!ta.closest(".csc-canvas")) return;
      const px = sizeForLength(ta.value.trim().length);
      ta.style.setProperty("font-size", `${px}px`, "important");
      ta.style.setProperty("line-height", px <= 31 ? "1.22" : "1.16", "important");
    };

    const bind = () => {
      document.querySelectorAll<HTMLTextAreaElement>(".csc-canvas textarea").forEach((ta) => {
        if (ta.dataset.cookieAutoSize === "1") {
          apply(ta);
          return;
        }
        ta.dataset.cookieAutoSize = "1";
        const handler = () => apply(ta);
        ta.addEventListener("input", handler);
        ta.addEventListener("change", handler);
        apply(ta);
      });
    };

    bind();
    const observer = new MutationObserver(bind);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
