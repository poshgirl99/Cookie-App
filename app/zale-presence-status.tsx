"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

function presenceLabel(lastActive?: string | null) {
  if (!lastActive) return "Here recently";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(lastActive).getTime()) / 1000));
  if (seconds < 75) return "Here now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Here ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Here ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Here ${days}d ago`;
}

export default function ZalePresenceStatus() {
  useEffect(() => {
    const supabase = createClient();
    let stopped = false;
    let heartbeat: number | undefined;
    let refresh: number | undefined;

    const touchPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || stopped) return;
      await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
    };

    const updateHeader = async () => {
      const small = document.querySelector<HTMLElement>(".chat-profile-trigger small:not(.live-activity)");
      if (!small || !small.textContent?.trim().startsWith("@")) return;
      const username = small.textContent.trim().slice(1);
      const { data } = await supabase.from("profiles").select("last_active_at").eq("username", username).maybeSingle();
      if (!stopped && small.isConnected) {
        small.dataset.zalePresence = "true";
        small.textContent = presenceLabel(data?.last_active_at);
      }
    };

    void touchPresence();
    void updateHeader();
    heartbeat = window.setInterval(() => void touchPresence(), 45000);
    refresh = window.setInterval(() => void updateHeader(), 15000);
    const observer = new MutationObserver(() => void updateHeader());
    observer.observe(document.body, { childList: true, subtree: true });
    const onVisible = () => { if (document.visibilityState === "visible") void touchPresence(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      if (heartbeat) window.clearInterval(heartbeat);
      if (refresh) window.clearInterval(refresh);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
