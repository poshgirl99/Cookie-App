"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MyStoryShortcut() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [myName, setMyName] = useState("");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest("button");
      if (!button) return;
      const label = button.textContent?.trim() || "";
      if (!/^Stories$/i.test(label)) return;

      const visibleName =
        document.querySelector<HTMLElement>(".workspace-profile-chip b")?.textContent?.trim() ||
        document.querySelector<HTMLElement>(".profile-page h1")?.textContent?.trim() ||
        "";
      if (visibleName) setMyName(visibleName);

      window.setTimeout(() => {
        const page = document.querySelector<HTMLElement>(".stories-page");
        const head = page?.querySelector<HTMLElement>(".stories-head");
        if (!page || !head) return;
        let mount = page.querySelector<HTMLElement>("#zale-my-story-mount");
        if (!mount) {
          mount = document.createElement("div");
          mount.id = "zale-my-story-mount";
          head.insertAdjacentElement("afterend", mount);
        }
        setTarget(mount);
      }, 0);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!document.querySelector(".stories-page")) setTarget(null);
  });

  const openMyStory = () => {
    const storyButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".story-grid > button"));
    const mine = myName
      ? storyButtons.find((button) =>
          button.querySelector("b")?.textContent?.trim().toLowerCase() === myName.toLowerCase(),
        )
      : undefined;

    if (mine) {
      mine.click();
      return;
    }

    const addInput = document.querySelector<HTMLInputElement>(".story-add input[type='file']");
    addInput?.click();
  };

  if (!target) return null;

  return createPortal(
    <div className="zale-my-story-row">
      <button type="button" className="zale-my-story-card" onClick={openMyStory}>
        <span className="zale-my-story-avatar">＋</span>
        <span>
          <b>My Story</b>
          <small>View your story or add a new one</small>
        </span>
        <strong>›</strong>
      </button>
      <style jsx>{`
        .zale-my-story-row{padding:14px 0 8px}
        .zale-my-story-card{width:100%;display:flex;align-items:center;gap:13px;padding:14px 16px;border:1px solid #e2daf4;border-radius:20px;background:#fff;color:#241443;text-align:left;cursor:pointer;box-shadow:0 7px 20px rgba(74,45,125,.07)}
        .zale-my-story-avatar{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#8f59ff,#642dd7);color:#fff;font-size:28px;font-weight:500;border:3px solid #eee7ff;flex:0 0 auto}
        .zale-my-story-card>span:nth-child(2){display:grid;gap:3px;flex:1}.zale-my-story-card b{font-size:16px}.zale-my-story-card small{color:#7a718e;font-size:12px}.zale-my-story-card strong{font-size:25px;color:#7553c4;font-weight:500}
        @media(max-width:760px){.zale-my-story-row{padding-top:10px}.zale-my-story-card{padding:12px 13px;border-radius:17px}.zale-my-story-avatar{width:46px;height:46px}}
      `}</style>
    </div>,
    target,
  );
}
