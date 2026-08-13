"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function FaithHeaderLink() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [required, setRequired] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkUsername() {
      const { data: authData } = await supabase.auth.getUser();
      const account = authData.user;
      if (!account || cancelled) {
        setUserId(null);
        setRequired(false);
        return;
      }

      setUserId(account.id);
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", account.id)
        .maybeSingle();

      if (cancelled) return;
      setRequired(/^cookie_[a-z0-9]+$/i.test(String(data?.username || "")));
    }

    void checkUsername();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => void checkUsername(), 0);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function saveUsername(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    const clean = username
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._]/g, "");

    if (clean.length < 3 || clean.length > 24) {
      setError("Choose a username between 3 and 24 characters.");
      return;
    }
    if (!/^[a-z0-9][a-z0-9._]*$/.test(clean)) {
      setError("Use letters, numbers, dots or underscores, and start with a letter or number.");
      return;
    }
    if (clean.startsWith("cookie_")) {
      setError("Choose your own username instead of the temporary Cookie username.");
      return;
    }

    setBusy(true);
    setError("");

    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .neq("id", userId)
      .maybeSingle();

    if (taken) {
      setBusy(false);
      setError("That username is already taken. Try another one.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: clean })
      .eq("id", userId);

    setBusy(false);
    if (updateError) {
      setError("Cookie couldn't save that username. Please try again.");
      return;
    }

    setRequired(false);
    setUsername("");
  }

  return (
    <>
      <Link
        href="/faith"
        className="faith-header-link"
        aria-label="Open Faith Space"
        title="Faith Space"
      >
        ✝
      </Link>

      {required && (
        <div style={styles.backdrop}>
          <form onSubmit={saveUsername} style={styles.card}>
            <div style={styles.cookie}>🍪</div>
            <p style={styles.kicker}>ONE LAST CRUMB</p>
            <h1 style={styles.heading}>Choose your Cookie username</h1>
            <p style={styles.copy}>
              Your Google account is connected. Pick a unique username so friends can find you on Cookie.
            </p>
            <label style={styles.label}>
              Username
              <div style={styles.inputWrap}>
                <span style={styles.at}>@</span>
                <input
                  autoFocus
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  placeholder="yourname"
                  maxLength={24}
                  style={styles.input}
                />
              </div>
            </label>
            <small style={styles.help}>
              3–24 characters · letters, numbers, dots and underscores
            </small>
            {error && <p style={styles.error}>{error}</p>}
            <button
              disabled={busy || username.trim().length < 3}
              style={styles.button}
            >
              {busy ? "Saving…" : "Continue to Cookie →"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const styles = {
  backdrop: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 2147483647,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    background: "rgba(31, 18, 15, 0.72)",
    backdropFilter: "blur(12px)",
  },
  card: {
    width: "min(440px, 100%)",
    borderRadius: "28px",
    padding: "34px",
    background: "#fffaf2",
    boxShadow: "0 28px 90px rgba(33, 18, 12, 0.35)",
    fontFamily: "inherit",
  },
  cookie: { fontSize: "44px", marginBottom: "10px" },
  kicker: {
    margin: "0 0 8px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.15em",
    color: "#9a5b2d",
  },
  heading: {
    margin: "0 0 10px",
    fontSize: "30px",
    lineHeight: 1.05,
    color: "#28170f",
  },
  copy: { margin: "0 0 24px", lineHeight: 1.55, color: "#6d574a" },
  label: {
    display: "grid",
    gap: "8px",
    fontWeight: 700,
    color: "#3b2418",
  },
  inputWrap: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d9c9bc",
    borderRadius: "16px",
    background: "white",
    overflow: "hidden",
  },
  at: { paddingLeft: "16px", fontWeight: 800, color: "#8a6d5a" },
  input: {
    width: "100%",
    border: 0,
    outline: 0,
    padding: "15px 16px 15px 6px",
    fontSize: "16px",
    background: "transparent",
    color: "#28170f",
  },
  help: {
    display: "block",
    marginTop: "8px",
    color: "#8b7466",
    lineHeight: 1.4,
  },
  error: {
    margin: "14px 0 0",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#fff0ed",
    color: "#a33a2c",
    fontSize: "14px",
    lineHeight: 1.4,
  },
  button: {
    width: "100%",
    marginTop: "20px",
    border: 0,
    borderRadius: "16px",
    padding: "15px 18px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    background: "#8b4f2c",
    color: "white",
  },
};
