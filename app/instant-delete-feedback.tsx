"use client";

import { useEffect } from "react";

export default function InstantDeleteFeedback() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const label = button.textContent?.trim().toLowerCase();
      if (label !== "delete for me") return;

      const row = button.closest(".message-row") as HTMLElement | null;
      if (!row) return;

      row.style.transition = "opacity 120ms ease, transform 120ms ease";
      row.style.opacity = "0";
      row.style.transform = "scale(.98)";
      window.setTimeout(() => {
        row.style.display = "none";
      }, 120);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
