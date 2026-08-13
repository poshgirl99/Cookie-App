"use client";

import { useEffect } from "react";

export default function InstantDeleteFeedback() {
  useEffect(() => {
    let pendingDeleteForEveryoneRow: HTMLElement | null = null;
    const originalConfirm = window.confirm.bind(window);

    const hideForMe = (row: HTMLElement) => {
      row.style.transition = "opacity 120ms ease, transform 120ms ease";
      row.style.opacity = "0";
      row.style.transform = "scale(.98)";
      window.setTimeout(() => {
        if (document.body.contains(row)) row.style.display = "none";
      }, 120);
    };

    const showDeletedForEveryone = (row: HTMLElement) => {
      const bubble = row.querySelector(".message-bubble") as HTMLElement | null;
      if (!bubble) return;

      bubble.classList.add("deleted");
      const deletedLabel = document.createElement("em");
      deletedLabel.textContent = "YOU DELETED THIS MESSAGE";
      bubble.replaceChildren(deletedLabel);

      row
        .querySelectorAll(
          ".message-hover-tools,.message-hover-popover,.message-actions,.reaction-counts",
        )
        .forEach((node) => node.remove());
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button) return;

      const label = button.textContent?.trim().toLowerCase();
      if (label !== "delete for me" && label !== "delete for everyone") return;

      const row = button.closest(".message-row") as HTMLElement | null;
      if (!row) return;

      if (label === "delete for me") {
        hideForMe(row);
        return;
      }

      pendingDeleteForEveryoneRow = row;
    };

    window.confirm = (message?: string) => {
      const confirmed = originalConfirm(message);
      if (
        String(message).toLowerCase().includes("delete this message for everyone")
      ) {
        if (confirmed && pendingDeleteForEveryoneRow) {
          showDeletedForEveryone(pendingDeleteForEveryoneRow);
        }
        pendingDeleteForEveryoneRow = null;
      }
      return confirmed;
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.confirm = originalConfirm;
    };
  }, []);

  return null;
}
