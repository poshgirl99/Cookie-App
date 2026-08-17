"use client";

import { useEffect, useMemo, useRef } from "react";
import { createClient } from "../lib/supabase";

type AliasEntry = { alias: string; original: string };
type AliasMap = Record<string, AliasEntry>;

const LEGACY_KEY = "zale-friend-aliases";
const COOKIE_KEY = "cookie-friend-aliases";

function readLocalAliases(): AliasMap {
  try {
    const raw = localStorage.getItem(COOKIE_KEY) || localStorage.getItem(LEGACY_KEY) || "{}";
    return JSON.parse(raw) as AliasMap;
  } catch {
    return {};
  }
}

function writeLocalAliases(aliases: AliasMap) {
  const raw = JSON.stringify(aliases);
  localStorage.setItem(COOKIE_KEY, raw);
  // Keep the old editor compatible until all Zale-era code is retired.
  localStorage.setItem(LEGACY_KEY, raw);
  window.dispatchEvent(new Event("cookie:friend-aliases-updated"));
}

export default function CookieAliasCloudSync() {
  const supabase = useMemo(() => createClient(), []);
  const lastLocal = useRef("");
  const activeUser = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function uploadLocal(uid: string, aliases: AliasMap) {
      const usernames = Object.keys(aliases).filter(Boolean);
      if (!usernames.length) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,display_name")
        .in("username", usernames);
      const byUsername = new Map((profiles ?? []).map((p) => [p.username, p]));
      const rows = usernames
        .map((username) => {
          const friend = byUsername.get(username);
          const entry = aliases[username];
          if (!friend || !entry?.alias?.trim()) return null;
          return {
            owner_id: uid,
            friend_id: friend.id,
            alias: entry.alias.trim().slice(0, 40),
            original_name: entry.original || friend.display_name || entry.alias,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean);
      if (rows.length) {
        await supabase.from("friend_aliases").upsert(rows, { onConflict: "owner_id,friend_id" });
      }
    }

    async function loadCloud(uid: string) {
      const { data: rows } = await supabase
        .from("friend_aliases")
        .select("friend_id,alias,original_name,updated_at")
        .eq("owner_id", uid);
      const ids = (rows ?? []).map((row) => row.friend_id);
      if (!ids.length) {
        const local = readLocalAliases();
        writeLocalAliases(local);
        lastLocal.current = JSON.stringify(local);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username")
        .in("id", ids);
      const usernames = new Map((profiles ?? []).map((p) => [p.id, p.username]));
      const cloud: AliasMap = {};
      for (const row of rows ?? []) {
        const username = usernames.get(row.friend_id);
        if (!username) continue;
        cloud[username] = { alias: row.alias, original: row.original_name };
      }
      writeLocalAliases(cloud);
      lastLocal.current = JSON.stringify(cloud);
    }

    async function initialise(uid: string) {
      activeUser.current = uid;
      const migrationKey = `cookie-friend-aliases-migrated:${uid}`;
      const local = readLocalAliases();
      if (!localStorage.getItem(migrationKey) && Object.keys(local).length) {
        await uploadLocal(uid, local);
        localStorage.setItem(migrationKey, "1");
      }
      await loadCloud(uid);
    }

    async function tick() {
      const uid = activeUser.current;
      if (!uid) return;
      const local = readLocalAliases();
      const serialised = JSON.stringify(local);
      if (serialised === lastLocal.current) return;
      lastLocal.current = serialised;
      await uploadLocal(uid, local);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) void initialise(data.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      activeUser.current = session?.user?.id ?? null;
      if (session?.user?.id) void initialise(session.user.id);
      else lastLocal.current = "";
    });

    const refresh = () => {
      if (activeUser.current) void loadCloud(activeUser.current);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    timer = window.setInterval(() => void tick(), 1200);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
