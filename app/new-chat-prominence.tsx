"use client";

import { useEffect } from "react";

export default function NewChatProminence() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .zale-brand .chat-list .zale-new-chat-label {
        color:#5f35e0 !important;
        font-weight:900 !important;
        font-size:13px !important;
        letter-spacing:-.1px;
        opacity:1 !important;
      }
      .zale-brand .chat-list button:has(.zale-new-chat-label) {
        border-color:#d8cdf8 !important;
        box-shadow:0 8px 22px rgba(93,53,224,.10) !important;
      }
      .zale-brand .chat-list button:has(.zale-new-chat-label)::after {
        content:'';
        width:8px;
        height:8px;
        border-radius:999px;
        background:#6a3de0;
        box-shadow:0 0 0 4px rgba(106,61,224,.10);
        align-self:center;
      }
    `;
    document.head.appendChild(style);

    const enhance = () => {
      document.querySelectorAll(".chat-list button").forEach((button) => {
        const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim() || "";
          if (/^New Chat(s)?$/i.test(text)) {
            const parent = node.parentElement;
            if (parent) parent.classList.add("zale-new-chat-label");
          }
        }
      });
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); style.remove(); };
  }, []);

  return null;
}
