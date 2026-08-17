"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  read_at: string | null;
  created_at: string;
};

export default function CookieNotificationCenter() {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  async function load(uid = userId) {
    if (!uid) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,body,url,read_at,created_at")
      .eq("recipient_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data ?? []) as NotificationRow[]);
  }

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const bind = (): (() => void) | undefined => {
      const button = document.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement | null;
      if (!button) return undefined;
      const handler = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen((value) => !value);
        void load();
      };
      button.addEventListener("click", handler, true);
      return () => button.removeEventListener("click", handler, true);
    };

    cleanup = bind();
    const observer = new MutationObserver(() => {
      if (!cleanup) cleanup = bind();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) void load(uid);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) void load(uid);
      else setRows([]);
    });

    return () => {
      observer.disconnect();
      cleanup?.();
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`cookie-notifications-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, () => void load(userId))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, userId]);

  const unread = rows.filter((row) => !row.read_at).length;

  useEffect(() => {
    const button = document.querySelector('button[aria-label="Notifications"]') as HTMLButtonElement | null;
    if (!button) return;
    button.setAttribute("data-cookie-unread", String(unread));
    button.title = unread ? `${unread} unread notification${unread === 1 ? "" : "s"}` : "Notifications";
  }, [unread]);

  async function openNotification(row: NotificationRow) {
    if (!row.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", row.id);
    }
    setOpen(false);
    window.location.href = row.url || "/";
  }

  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null);
    await load(userId);
  }

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(24,15,10,.24)" }} onClick={() => setOpen(false)}>
      <section onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 68, right: 18, width: "min(390px,calc(100vw - 28px))", maxHeight: "70vh", overflow: "auto", background: "#fffaf2", color: "#3a2417", borderRadius: 18, boxShadow: "0 18px 50px rgba(0,0,0,.22)", padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div><b style={{ fontSize: 18 }}>Notifications</b><div style={{ fontSize: 12, opacity: .65 }}>{unread ? `${unread} unread` : "You're all caught up"}</div></div>
          {unread > 0 && <button onClick={markAllRead} style={{ border: 0, background: "transparent", color: "#a85f1d", fontWeight: 800, cursor: "pointer" }}>Mark all read</button>}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "28px 12px", textAlign: "center", opacity: .7 }}>No notifications yet 🍪</div>
        ) : rows.map((row) => (
          <button key={row.id} onClick={() => openNotification(row)} style={{ width: "100%", textAlign: "left", border: 0, borderTop: "1px solid rgba(58,36,23,.08)", background: row.read_at ? "transparent" : "#fff1dc", padding: "12px 10px", cursor: "pointer", borderRadius: 10 }}>
            <div style={{ fontWeight: row.read_at ? 700 : 900, marginBottom: 3 }}>{row.title || "Cookie"}</div>
            <div style={{ fontSize: 13, lineHeight: 1.35 }}>{row.body}</div>
            <div style={{ fontSize: 11, opacity: .55, marginTop: 5 }}>{new Date(row.created_at).toLocaleString()}</div>
          </button>
        ))}
      </section>
    </div>
  );
}
