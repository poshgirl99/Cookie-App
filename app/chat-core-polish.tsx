"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type SearchHit = {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  created_at: string;
};

export default function ChatCorePolish() {
  const supabase = useRef(createClient()).current;
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const activeConversationId = useRef<string | null>(null);
  const userId = useRef<string | null>(null);
  const busyEnhance = useRef(false);

  useEffect(() => {
    let stopped = false;
    let observer: MutationObserver | null = null;
    let timer: number | null = null;

    const resolveConversation = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id || null;
      userId.current = uid;
      if (!uid) return null;

      const head = document.querySelector(".chat-pane .chat-head .chat-profile-trigger");
      if (!head) {
        activeConversationId.current = null;
        return null;
      }
      const small = head.querySelector("small")?.textContent?.trim() || "";
      const name = head.querySelector("b")?.textContent?.replace(/AI/g, "").trim() || "";

      const { data: mine } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", uid);
      const myIds = (mine || []).map((x) => x.conversation_id);
      if (!myIds.length) return null;

      let conversationId: string | null = null;
      if (small.startsWith("@")) {
        const username = small.slice(1);
        const { data: person } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();
        if (person) {
          const { data: theirs } = await supabase
            .from("conversation_members")
            .select("conversation_id")
            .eq("user_id", person.id)
            .in("conversation_id", myIds);
          conversationId = theirs?.[0]?.conversation_id || null;
        }
      } else if (small.includes("Group chat")) {
        const { data: group } = await supabase
          .from("conversations")
          .select("id")
          .in("id", myIds)
          .eq("kind", "group")
          .eq("name", name)
          .limit(1)
          .maybeSingle();
        conversationId = group?.id || null;
      }
      activeConversationId.current = conversationId;
      return conversationId;
    };

    const decorateMessages = async () => {
      if (busyEnhance.current || stopped) return;
      const stream = document.querySelector(".chat-pane .message-stream");
      if (!stream) return;
      busyEnhance.current = true;
      try {
        const conversationId = await resolveConversation();
        const uid = userId.current;
        if (!conversationId || !uid) return;

        const { data: rows } = await supabase
          .from("messages")
          .select("id,sender_id,body,message_type,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at");
        const messages = (rows || []) as MessageRow[];
        const visible = messages.filter((m) => !m.body.startsWith("__system__:"));
        const domRows = Array.from(stream.querySelectorAll<HTMLElement>(".message-row"));

        for (let i = 0; i < Math.min(visible.length, domRows.length); i++) {
          const msg = visible[i];
          const row = domRows[i];
          row.dataset.cookieMessageId = msg.id;
          const bubble = row.querySelector<HTMLElement>(".message-bubble");
          if (!bubble) continue;

          if (msg.sender_id === uid) {
            const { data: receipts } = await supabase
              .from("message_receipts")
              .select("delivered_at,read_at")
              .eq("message_id", msg.id)
              .neq("user_id", uid);
            const list = receipts || [];
            const status = list.length && list.every((r) => r.read_at)
              ? "Read"
              : list.length && list.every((r) => r.delivered_at)
                ? "Delivered"
                : "Sent";
            const meta = bubble.querySelector<HTMLElement>(":scope > small");
            if (meta && meta.dataset.cookieReceipt !== status) {
              const raw = meta.textContent || "";
              const prefix = raw.split("·")[0]?.trim() || "";
              meta.innerHTML = `${prefix} · <span class=\"cookie-real-receipt\">${status}</span>`;
              meta.dataset.cookieReceipt = status;
            }
          }

          if (msg.body.startsWith("__media__:") && !bubble.querySelector(".cookie-chat-media")) {
            const parts = msg.body.split(":");
            const kind = parts[1] || "file";
            const path = parts[2] || "";
            const filename = parts.slice(3).join(":") || "Attachment";
            const { data: signed } = await supabase.storage.from("chat-media").createSignedUrl(path, 3600);
            if (!signed?.signedUrl) continue;
            Array.from(bubble.childNodes).forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes("__media__:")) node.textContent = "";
            });
            const media = document.createElement("div");
            media.className = "cookie-chat-media";
            if (kind === "image") {
              const img = document.createElement("img");
              img.src = signed.signedUrl;
              img.alt = filename;
              img.style.cssText = "display:block;max-width:260px;max-height:320px;border-radius:14px;object-fit:cover;";
              media.appendChild(img);
            } else if (kind === "video") {
              const video = document.createElement("video");
              video.src = signed.signedUrl;
              video.controls = true;
              video.playsInline = true;
              video.style.cssText = "display:block;max-width:280px;max-height:340px;border-radius:14px;";
              media.appendChild(video);
            } else {
              const link = document.createElement("a");
              link.href = signed.signedUrl;
              link.target = "_blank";
              link.rel = "noreferrer";
              link.textContent = `📎 ${filename}`;
              link.style.cssText = "display:inline-block;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.55);color:inherit;text-decoration:none;font-weight:700;";
              media.appendChild(link);
            }
            bubble.insertBefore(media, bubble.firstChild);
          }
        }
      } finally {
        busyEnhance.current = false;
      }
    };

    const wireSearch = () => {
      const input = document.querySelector<HTMLInputElement>('.chat-sidebar .search-box input[placeholder*="Search messages"]');
      if (!input || input.dataset.cookieSearchWired) return;
      input.dataset.cookieSearchWired = "1";
      input.addEventListener("input", async () => {
        const term = input.value.trim();
        if (term.length < 2) {
          setHits([]);
          setSearchOpen(false);
          return;
        }
        const { data, error } = await supabase.rpc("search_my_messages", { search_term: term, result_limit: 30 });
        if (!error) {
          setHits((data || []) as SearchHit[]);
          setSearchOpen(true);
        }
      });
    };

    const wireAttachmentButton = () => {
      const button = document.querySelector<HTMLButtonElement>(".chat-pane .chat-compose .compose-row .attach");
      if (!button || button.dataset.cookieAttachWired) return;
      button.dataset.cookieAttachWired = "1";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        void resolveConversation().then(() => fileInput.current?.click());
      });
    };

    const run = () => {
      wireSearch();
      wireAttachmentButton();
      void decorateMessages();
    };

    run();
    observer = new MutationObserver(() => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(run, 180);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const receiptChannel = supabase
      .channel("cookie-chat-receipts-ui")
      .on("postgres_changes", { event: "*", schema: "public", table: "message_receipts" }, () => void decorateMessages())
      .subscribe();

    return () => {
      stopped = true;
      observer?.disconnect();
      if (timer) window.clearTimeout(timer);
      void supabase.removeChannel(receiptChannel);
    };
  }, [supabase]);

  async function sendAttachment(file: File | null) {
    const conversationId = activeConversationId.current;
    const uid = userId.current;
    if (!file || !conversationId || !uid) return;
    if (file.size > 50 * 1024 * 1024) {
      window.alert("Choose a file smaller than 50 MB.");
      return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${conversationId}/${uid}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) {
      window.alert(`Attachment failed: ${uploadError.message}`);
      return;
    }
    const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: uid,
      body: `__media__:${kind}:${path}:${file.name}`,
      message_type: kind,
    });
    if (error) {
      await supabase.storage.from("chat-media").remove([path]);
      window.alert(`Message failed: ${error.message}`);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function openSearchHit(hit: SearchHit) {
    setSearchOpen(false);
    const { data: members } = await supabase
      .from("conversation_members")
      .select("user_id,profile:profiles(id,username,display_name)")
      .eq("conversation_id", hit.conversation_id);
    const uid = userId.current;
    const other = (members || []).find((m) => m.user_id !== uid);
    const profile = Array.isArray(other?.profile) ? other?.profile[0] : other?.profile;
    const targetText = profile && "display_name" in profile ? String(profile.display_name) : "";
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".chat-list > button"));
    const target = buttons.find((b) => targetText && b.textContent?.includes(targetText));
    target?.click();
    window.setTimeout(() => {
      const row = document.querySelector<HTMLElement>(`[data-cookie-message-id=\"${hit.message_id}\"]`);
      row?.scrollIntoView({ behavior: "smooth", block: "center" });
      row?.animate([{ transform: "scale(1)" }, { transform: "scale(1.025)" }, { transform: "scale(1)" }], { duration: 700 });
    }, 900);
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        style={{ display: "none" }}
        onChange={(e) => void sendAttachment(e.target.files?.[0] || null)}
      />
      {searchOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 10020,
            left: "max(20px, calc(50% - 540px))",
            top: 150,
            width: "min(420px, calc(100vw - 40px))",
            maxHeight: "55vh",
            overflow: "auto",
            background: "#fff8ed",
            border: "1px solid rgba(92,54,32,.16)",
            borderRadius: 18,
            boxShadow: "0 18px 50px rgba(50,30,18,.18)",
            padding: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px 10px" }}>
            <b>Message search</b>
            <button onClick={() => setSearchOpen(false)} style={{ border: 0, background: "transparent", fontSize: 20 }}>×</button>
          </div>
          {hits.length ? hits.map((hit) => (
            <button
              key={hit.message_id}
              onClick={() => void openSearchHit(hit)}
              style={{ display: "block", width: "100%", textAlign: "left", border: 0, background: "transparent", padding: "10px 9px", borderRadius: 12, cursor: "pointer" }}
            >
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {hit.body.startsWith("__media__:") ? "📎 Attachment" : hit.body}
              </div>
              <small style={{ opacity: .6 }}>{new Date(hit.created_at).toLocaleString()}</small>
            </button>
          )) : <p style={{ padding: "12px 8px", opacity: .7 }}>No matching messages.</p>}
        </div>
      )}
    </>
  );
}
