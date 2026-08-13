"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function UnaddControl() {
  useEffect(() => {
    const supabase = createClient();
    const enhance = () => {
      document.querySelectorAll<HTMLButtonElement>(".friend-profile-actions button").forEach((button) => {
        if (button.textContent?.trim() !== "Added" || button.dataset.unaddReady) return;
        button.dataset.unaddReady = "1";
        button.disabled = false;
        button.textContent = "Unadd";
        button.classList.add("unadd-friend-button");
        button.onclick = async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const card = button.closest(".friend-profile-card");
          const username = card?.querySelector(".friend-profile-identity p")?.textContent?.trim().replace(/^@/, "");
          if (!username || !confirm(`Unadd @${username}?`)) return;
          button.disabled = true;
          button.textContent = "Removing…";
          const { data: auth } = await supabase.auth.getUser();
          if (!auth.user) return;
          const { data: person } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
          if (!person) return;
          const { error } = await supabase.from("friend_requests").delete().eq("requester_id", auth.user.id).eq("recipient_id", person.id);
          if (error) {
            button.disabled = false;
            button.textContent = "Unadd";
            alert("Could not unadd this person. Please try again.");
            return;
          }
          location.reload();
        };
      });
    };
    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
