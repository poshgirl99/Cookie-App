"use client";

import { useEffect } from "react";

export default function ZeeChatEntry() {
  useEffect(() => {
    const mount = () => {
      const list = document.querySelector(".chat-list");
      if (!list) return;
      if (list.querySelector(".zee-chat-entry")) return;

      const row = document.createElement("button");
      row.type = "button";
      row.className = "zee-chat-entry";
      row.innerHTML = `
        <span class="zee-chat-avatar"><b>Z</b></span>
        <span class="zee-chat-copy">
          <b>Zee AI <i>AI</i></b>
          <small>Your Zale assistant</small>
        </span>
      `;
      row.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("zale:open-zee", { detail: { expanded: true } }));
      });

      const stamp = Number(localStorage.getItem("zale-zee-last-active") || 0);
      const children = Array.from(list.children);
      const target = stamp && Date.now() - stamp < 15 * 60 * 1000 ? 0 : Math.min(2, children.length);
      if (target === 0) list.prepend(row);
      else if (children[target]) list.insertBefore(row, children[target]);
      else list.appendChild(row);
    };

    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
