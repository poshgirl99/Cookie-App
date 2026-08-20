"use client";

import { useEffect } from "react";

export default function CookieStoryToolAutoclose() {
  useEffect(() => {
    const closeOpenTool = () => {
      const actions = document.querySelector(".csc-canvas-actions") as HTMLElement | null;
      if (!actions) return;
      const buttons = Array.from(actions.querySelectorAll("button")) as HTMLButtonElement[];

      if (document.querySelector(".csc-emoji-picker")) {
        buttons[0]?.click();
        return;
      }
      if (document.querySelector(".csc-bg-grid")) {
        buttons[1]?.click();
        return;
      }
      if (document.querySelector(".csc-font-grid")) {
        buttons[2]?.click();
      }
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const fontChoice = target.closest(".csc-font-grid button");
      const bgChoice = target.closest(".csc-bg-grid button");

      if (fontChoice || bgChoice) {
        window.setTimeout(closeOpenTool, 0);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".csc-canvas textarea")) return;
      if (
        document.querySelector(".csc-emoji-picker") ||
        document.querySelector(".csc-bg-grid") ||
        document.querySelector(".csc-font-grid")
      ) {
        closeOpenTool();
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
