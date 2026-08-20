"use client";

import { useEffect } from "react";

export default function CookieFriendAcceptSafety() {
  useEffect(() => {
    const originalConfirm = window.confirm.bind(window);
    let suppressUntil = 0;

    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest("button");
      if (!button) return;
      const request = button.closest(".person.request");
      if (!request) return;
      if ((button.textContent || "").trim().toLowerCase() !== "accept") return;
      // The friendship update should complete first. The legacy flow then asks
      // whether to create/open a chat and inject the request introduction.
      // Suppress only that follow-up prompt so acceptance cannot break the page.
      suppressUntil = Date.now() + 8000;
    };

    window.confirm = (message?: string) => {
      const text = String(message || "");
      if (
        Date.now() < suppressUntil &&
        text.toLowerCase().includes("include this introduction in your new chat")
      ) {
        suppressUntil = 0;
        return false;
      }
      return originalConfirm(message);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.confirm = originalConfirm;
    };
  }, []);

  return null;
}
