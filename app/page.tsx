"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  profile_colour: string;
  avatar_url: string | null;
  cover_url: string | null;
  is_private?: boolean;
};
type FriendRequest = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  introduction_message?: string | null;
  requester?: Profile;
};
type Conversation = {
  id: string;
  kind: "direct" | "group";
  disappearing_mode: "after_viewing" | "24_hours" | "2_days" | "never";
  person: Profile;
  person_last_read_at?: string | null;
  last_message_at?: string;
  last_sender_id?: string;
  unread_count: number;
};
type BestFriendRanking = {
  friend_id: string;
  rank: number;
  first_number_one_at: string | null;
  mutual_number_one_at: string | null;
  friend: Profile;
};
type Reaction = { emoji: string; user_id: string };
type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  reply_to_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_for_everyone_at: string | null;
  expires_at: string | null;
  audio_url?: string | null;
  reactions?: Reaction[];
  reply?: { id: string; body: string; sender_id: string } | null;
};
type AuthMode = "signin" | "signup";
type AppView = "chats" | "friends" | "crumbs" | "stories" | "profile";
type CrumbPost = {
  id: string;
  author_id: string;
  kind: "video" | "photo" | "text";
  media_path: string | null;
  media_url?: string | null;
  caption: string;
  audio_title: string | null;
  duration_seconds: number | null;
  created_at: string;
  author: Profile;
  likes: { user_id: string }[];
  saves: { user_id: string }[];
  reposts: { user_id: string }[];
  comments: {
    id: string;
    user_id: string;
    body: string;
    created_at: string;
    profile?: Profile;
  }[];
};

const interests = [
  "Music",
  "Comedy",
  "Fashion",
  "Food",
  "Gaming",
  "Sports",
  "Art",
  "Travel",
  "Books",
  "Dance",
  "Tech",
  "Faith",
];
const colours = [
  "#e76f51",
  "#8b5cf6",
  "#2a9d8f",
  "#e9a23b",
  "#e84a8a",
  "#457b9d",
];
const publicAppUrl =
  "https://cookie-app-nicholasdeheer-8842s-projects.vercel.app";
const flavours = [
  ["🍫", "Choc Chip", "Warm & easy-going"],
  ["🌈", "Funfetti", "Loud & playful"],
  ["🍯", "Caramel", "Sweet & thoughtful"],
  ["🌶️", "Ginger Snap", "Bold & spontaneous"],
];
const emojiGroups = {
  "😊": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "😂",
    "🤣",
    "🥲",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😋",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🥳",
    "😏",
    "😒",
    "😔",
    "😢",
    "😭",
    "😤",
    "😡",
    "🤯",
    "😳",
    "🥺",
    "😴",
    "🤭",
    "🫣",
    "🫠",
    "😈",
    "👻",
  ],
  "👋": [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🫶",
    "👌",
    "🤌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🙏",
    "💪",
    "🫂",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
  ],
  "🐻": [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🙈",
    "🙉",
    "🙊",
    "🐔",
    "🐧",
    "🐦",
    "🦄",
    "🐝",
    "🦋",
    "🐌",
    "🐞",
    "🐢",
    "🐍",
    "🦎",
    "🦖",
    "🐙",
    "🦀",
    "🐠",
    "🐬",
    "🐳",
    "🌸",
    "🌺",
    "🌻",
    "🌈",
    "⭐",
    "✨",
    "🔥",
    "☀️",
    "🌙",
  ],
  "🍪": [
    "🍪",
    "🍕",
    "🍔",
    "🍟",
    "🌭",
    "🍿",
    "🥐",
    "🥨",
    "🥞",
    "🧇",
    "🍗",
    "🍝",
    "🍜",
    "🍣",
    "🍤",
    "🍚",
    "🍦",
    "🍩",
    "🍰",
    "🧁",
    "🍫",
    "🍬",
    "🍭",
    "🍓",
    "🍒",
    "🍎",
    "🍉",
    "🍇",
    "🥭",
    "🍍",
    "🥑",
    "🥤",
    "☕",
    "🧃",
    "🎂",
    "🥳",
    "🎉",
    "🎊",
    "🎁",
    "🎈",
    "🎵",
    "🎶",
    "🎮",
    "⚽",
    "🏀",
    "🏆",
  ],
  "💡": [
    "💡",
    "📱",
    "💻",
    "⌚",
    "📷",
    "🎥",
    "🎧",
    "🎤",
    "☎️",
    "🔋",
    "💰",
    "💎",
    "🔑",
    "🎀",
    "📌",
    "✏️",
    "📚",
    "💬",
    "💭",
    "✅",
    "❌",
    "⚠️",
    "❓",
    "❗",
    "💯",
    "♻️",
    "🚗",
    "✈️",
    "🚀",
    "🏠",
    "🏫",
    "⛪",
    "🏖️",
    "🌍",
    "🇬🇭",
    "🕊️",
    "✝️",
    "☮️",
    "♾️",
    "🔒",
    "🔔",
    "📍",
    "🗓️",
    "⏰",
    "🚩",
    "🏁",
  ],
};

function CookieLogo({ small = false }: { small?: boolean }) {
  return (
    <span className={`cookie-logo ${small ? "small" : ""}`}>
      <img
        src="/cookie-logo-deeper-bite.png"
        alt="Cookie"
        width={180}
        height={180}
      />
    </span>
  );
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [signupStep, setSignupStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [flavour, setFlavour] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [colour, setColour] = useState(colours[0]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<AppView>("chats");
  const [chatFilter, setChatFilter] = useState<
    "all" | "unread" | "groups" | "best_friends" | "unreplied"
  >("all");
  const [search, setSearch] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [bestFriends, setBestFriends] = useState<BestFriendRanking[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] =
    useState<keyof typeof emojiGroups>("😊");
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [peerActivity, setPeerActivity] = useState<
    "typing" | "recording" | null
  >(null);
  const [isRecording, setIsRecording] = useState(false);
  const [crumbFeed, setCrumbFeed] = useState<"for_you" | "following">(
    "for_you",
  );
  const [crumbs, setCrumbs] = useState<CrumbPost[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [pendingFollowerIds, setPendingFollowerIds] = useState<string[]>([]);
  const [crumbComposerOpen, setCrumbComposerOpen] = useState(false);
  const [crumbKind, setCrumbKind] = useState<"video" | "photo" | "text">(
    "video",
  );
  const [crumbCaption, setCrumbCaption] = useState("");
  const [crumbFile, setCrumbFile] = useState<File | null>(null);
  const [crumbDuration, setCrumbDuration] = useState(30);
  const [crumbAudio, setCrumbAudio] = useState("");
  const [now, setNow] = useState(Date.now());
  const searchSequence = useRef(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const activityChannel = useRef<RealtimeChannel | null>(null);
  const activityTimer = useRef<number | null>(null);
  const peerActivityTimer = useRef<number | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const loadCrumbs = useCallback(
    async (accountId: string, feed: "for_you" | "following" = crumbFeed) => {
      const { data: followRows } = await supabase
        .from("crumb_follows")
        .select("following_id,status")
        .eq("follower_id", accountId);
      const accepted = (followRows ?? [])
        .filter((row) => row.status === "accepted")
        .map((row) => row.following_id);
      setFollowingIds(accepted);
      let query = supabase
        .from("crumb_posts")
        .select(
          "id,author_id,kind,media_path,caption,audio_title,duration_seconds,created_at,author:profiles!crumb_posts_author_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url,is_private),likes:crumb_likes(user_id),saves:crumb_saves(user_id),reposts:crumb_reposts(user_id),comments:crumb_comments(id,user_id,body,created_at)",
        )
        .order("created_at", { ascending: false })
        .limit(60);
      if (feed === "following")
        query = query.in("author_id", accepted.length ? accepted : [accountId]);
      const { data, error } = await query;
      if (error) {
        setNotice(`Crumbs could not load: ${error.message}`);
        return;
      }
      const rows = await Promise.all(
        (data ?? []).map(async (row) => {
          let mediaUrl: string | null = null;
          if (row.media_path) {
            const { data: signed } = await supabase.storage
              .from("crumb-media")
              .createSignedUrl(row.media_path, 3600);
            mediaUrl = signed?.signedUrl ?? null;
          }
          const authorValue = row.author;
          const author = (
            Array.isArray(authorValue) ? authorValue[0] : authorValue
          ) as Profile;
          return {
            ...row,
            author,
            media_url: mediaUrl,
          } as unknown as CrumbPost;
        }),
      );
      setCrumbs(rows);
    },
    [crumbFeed, supabase],
  );

  const loadConversations = useCallback(
    async (accountId: string) => {
      const { data: ownMemberships } = await supabase
        .from("conversation_members")
        .select("conversation_id,last_read_at")
        .eq("user_id", accountId);
      const ids = (ownMemberships ?? []).map((item) => item.conversation_id);
      if (!ids.length) {
        setConversations([]);
        return;
      }
      const [{ data: chatRows }, { data: members }, { data: recent }] =
        await Promise.all([
          supabase
            .from("conversations")
            .select("id,kind,disappearing_mode")
            .in("id", ids),
          supabase
            .from("conversation_members")
            .select(
              "conversation_id,user_id,last_read_at,profile:profiles(id,username,display_name,profile_colour,avatar_url,cover_url)",
            )
            .in("conversation_id", ids)
            .neq("user_id", accountId),
          supabase
            .from("messages")
            .select("conversation_id,sender_id,created_at")
            .in("conversation_id", ids)
            .order("created_at", { ascending: false })
            .limit(1000),
        ]);
      const list = (chatRows ?? [])
        .map((row) => {
          const member = (members ?? []).find(
            (item) => item.conversation_id === row.id,
          );
          const personValue = member?.profile;
          const person = (
            Array.isArray(personValue) ? personValue[0] : personValue
          ) as Profile | undefined;
          const last = (recent ?? []).find(
            (item) => item.conversation_id === row.id,
          );
          const ownLastRead = (ownMemberships ?? []).find(
            (item) => item.conversation_id === row.id,
          )?.last_read_at;
          const unreadCount = (recent ?? []).filter(
            (item) =>
              item.conversation_id === row.id &&
              item.sender_id !== accountId &&
              (!ownLastRead || item.created_at > ownLastRead),
          ).length;
          return person
            ? ({
                id: row.id,
                kind: row.kind,
                disappearing_mode: row.disappearing_mode,
                person,
                person_last_read_at: member?.last_read_at,
                last_message_at: last?.created_at,
                last_sender_id: last?.sender_id,
                unread_count: unreadCount,
              } as Conversation)
            : null;
        })
        .filter(Boolean) as Conversation[];
      setConversations(
        list.sort((a, b) =>
          (b.last_message_at || "").localeCompare(a.last_message_at || ""),
        ),
      );
    },
    [supabase],
  );

  const loadBestFriends = useCallback(
    async (accountId: string) => {
      const { error: refreshError } = await supabase.rpc(
        "refresh_my_best_friends",
      );
      if (refreshError) {
        setNotice(`Best Friends could not update: ${refreshError.message}`);
        return;
      }
      const { data, error } = await supabase
        .from("best_friend_rankings")
        .select(
          "friend_id,rank,first_number_one_at,mutual_number_one_at,friend:profiles!best_friend_rankings_friend_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url)",
        )
        .eq("user_id", accountId)
        .order("rank");
      if (error) {
        setNotice(`Best Friends could not load: ${error.message}`);
        return;
      }
      setBestFriends(
        (data ?? []).map((row: Record<string, unknown>) => ({
          ...row,
          friend: (Array.isArray(row.friend)
            ? row.friend[0]
            : row.friend) as Profile,
        })) as BestFriendRanking[],
      );
    },
    [supabase],
  );

  const loadAccount = useCallback(
    async (account: User | null) => {
      setUser(account);
      if (!account) {
        setProfile(null);
        setRequests([]);
        setFriends([]);
        setAllProfiles([]);
        setSentRequestIds([]);
        setConversations([]);
        setBestFriends([]);
        setActiveChat(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select(
          "id,username,display_name,profile_colour,avatar_url,cover_url,is_private",
        )
        .eq("id", account.id)
        .maybeSingle();
      let currentProfile = data as Profile | null;
      if (!currentProfile) {
        const emailName = account.email?.split("@")[0] || "cookie";
        const base =
          String(account.user_metadata?.username || emailName)
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "")
            .slice(0, 18) || "cookie";
        const fallback = {
          id: account.id,
          username: `${base}_${account.id.slice(0, 6)}`,
          display_name: String(
            account.user_metadata?.display_name || emailName,
          ),
          profile_colour: colours[0],
          avatar_url: null,
          cover_url: null,
          is_private: false,
        };
        const { data: created } = await supabase
          .from("profiles")
          .upsert(fallback)
          .select(
            "id,username,display_name,profile_colour,avatar_url,cover_url,is_private",
          )
          .single();
        currentProfile = (created as Profile | null) ?? fallback;
      }
      setProfile(currentProfile);

      const { data: incoming } = await supabase
        .from("friend_requests")
        .select(
          "id,requester_id,recipient_id,status,introduction_message,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url)",
        )
        .eq("recipient_id", account.id)
        .eq("status", "pending");
      setRequests(
        (incoming ?? []).map((item: Record<string, unknown>) => ({
          ...item,
          requester: Array.isArray(item.requester)
            ? item.requester[0]
            : item.requester,
        })) as FriendRequest[],
      );

      const { data: outgoing } = await supabase
        .from("friend_requests")
        .select("recipient_id")
        .eq("requester_id", account.id)
        .eq("status", "pending");
      setSentRequestIds((outgoing ?? []).map((item) => item.recipient_id));

      const { data: accepted } = await supabase
        .from("friend_requests")
        .select(
          "requester_id,recipient_id,requester:profiles!friend_requests_requester_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url),recipient:profiles!friend_requests_recipient_id_fkey(id,username,display_name,profile_colour,avatar_url,cover_url)",
        )
        .eq("status", "accepted")
        .or(`requester_id.eq.${account.id},recipient_id.eq.${account.id}`);
      const list = (accepted ?? [])
        .map((row: Record<string, unknown>) => {
          const value =
            row.requester_id === account.id ? row.recipient : row.requester;
          return (Array.isArray(value) ? value[0] : value) as Profile;
        })
        .filter(Boolean);
      setFriends(list);
      const { data: directory } = await supabase
        .from("profiles")
        .select("id,username,display_name,profile_colour,avatar_url,cover_url")
        .neq("id", account.id)
        .order("display_name")
        .limit(200);
      setAllProfiles((directory ?? []) as Profile[]);
      const { data: followerRequests } = await supabase
        .from("crumb_follows")
        .select("follower_id")
        .eq("following_id", account.id)
        .eq("status", "pending");
      setPendingFollowerIds(
        (followerRequests ?? []).map((row) => row.follower_id),
      );
      await loadConversations(account.id);
      await loadBestFriends(account.id);
      await loadCrumbs(account.id);
    },
    [loadBestFriends, loadConversations, loadCrumbs, supabase],
  );

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setShowSplash(false), 1500);
    const initialiseAuth = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { data: existing } = await supabase.auth.getSession();
        if (!existing.session) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !error.message.toLowerCase().includes("code verifier")) {
            setNotice(`Google sign-in failed: ${error.message}`);
          }
        }
        url.searchParams.delete("code");
        window.history.replaceState(
          {},
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
      const { data } = await supabase.auth.getUser();
      await loadAccount(data.user);
    };
    initialiseAuth().catch((error) => {
      setNotice(`Sign-in failed: ${String(error)}`);
      loadAccount(null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        window.setTimeout(() => {
          void loadAccount(session?.user ?? null);
        }, 0);
      },
    );
    return () => {
      window.clearTimeout(splashTimer);
      listener.subscription.unsubscribe();
    };
  }, [loadAccount, supabase]);

  async function switchCrumbFeed(feed: "for_you" | "following") {
    setCrumbFeed(feed);
    if (user) await loadCrumbs(user.id, feed);
  }

  async function publishCrumb() {
    if (!user) return;
    if (crumbKind !== "text" && !crumbFile) {
      setNotice("Choose a photo or video first.");
      return;
    }
    if (crumbKind === "video" && crumbFile) {
      const objectUrl = URL.createObjectURL(crumbFile);
      const actualDuration = await new Promise<number>((resolve) => {
        const preview = document.createElement("video");
        preview.preload = "metadata";
        preview.onloadedmetadata = () => resolve(preview.duration);
        preview.onerror = () => resolve(Number.POSITIVE_INFINITY);
        preview.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);
      if (!Number.isFinite(actualDuration) || actualDuration > crumbDuration + 0.5) {
        setNotice(`Choose a video no longer than ${crumbDuration === 30 ? "30 seconds" : crumbDuration === 60 ? "1 minute" : "3 minutes"}.`);
        return;
      }
    }
    if (crumbKind === "text" && !crumbCaption.trim()) {
      setNotice("Write something for your Crumb.");
      return;
    }
    setBusy(true);
    setNotice("");
    let mediaPath: string | null = null;
    if (crumbFile) {
      if (crumbFile.size > 50 * 1024 * 1024) {
        setBusy(false);
        setNotice("Crumb media must be smaller than 50 MB.");
        return;
      }
      const ext = (crumbFile.name.split(".").pop() || "bin")
        .replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
      mediaPath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("crumb-media")
        .upload(mediaPath, crumbFile, {
          contentType: crumbFile.type,
          upsert: false,
        });
      if (uploadError) {
        setBusy(false);
        setNotice(`Upload failed: ${uploadError.message}`);
        return;
      }
    }
    const { error } = await supabase
      .from("crumb_posts")
      .insert({
        author_id: user.id,
        kind: crumbKind,
        media_path: mediaPath,
        caption: crumbCaption.trim(),
        audio_title: crumbAudio.trim() || null,
        duration_seconds: crumbKind === "video" ? crumbDuration : null,
      });
    setBusy(false);
    if (error) {
      if (mediaPath)
        await supabase.storage.from("crumb-media").remove([mediaPath]);
      setNotice(error.message);
      return;
    }
    setCrumbComposerOpen(false);
    setCrumbCaption("");
    setCrumbFile(null);
    setCrumbAudio("");
    await loadCrumbs(user.id, crumbFeed);
    setNotice("Your Crumb is live! 🍪");
  }

  async function toggleCrumbAction(
    post: CrumbPost,
    table: "crumb_likes" | "crumb_saves" | "crumb_reposts",
    active: boolean,
  ) {
    if (!user) return;
    const request = active
      ? supabase
          .from(table)
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
      : supabase.from(table).insert({ post_id: post.id, user_id: user.id });
    const { error } = await request;
    if (error) {
      setNotice(error.message);
      return;
    }
    await loadCrumbs(user.id, crumbFeed);
    await loadBestFriends(user.id);
  }

  async function commentOnCrumb(post: CrumbPost) {
    if (!user) return;
    const body = window.prompt("Add a comment")?.trim();
    if (!body) return;
    const { error } = await supabase
      .from("crumb_comments")
      .insert({ post_id: post.id, user_id: user.id, body });
    if (error) {
      setNotice(error.message);
      return;
    }
    await loadCrumbs(user.id, crumbFeed);
    await loadBestFriends(user.id);
  }

  async function followCrumbCreator(person: Profile) {
    if (!user || person.id === user.id) return;
    const pending = Boolean(person.is_private);
    const { error } = await supabase
      .from("crumb_follows")
      .upsert({
        follower_id: user.id,
        following_id: person.id,
        status: pending ? "pending" : "accepted",
      });
    if (error) {
      setNotice(error.message);
      return;
    }
    setNotice(
      pending
        ? `Follow request sent to @${person.username}.`
        : `You are now following @${person.username}.`,
    );
    await loadCrumbs(user.id, crumbFeed);
  }

  async function setProfilePrivacy(isPrivate: boolean) {
    if (!user || !profile) return;
    const { error } = await supabase
      .from("profiles")
      .update({ is_private: isPrivate })
      .eq("id", user.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    setProfile({ ...profile, is_private: isPrivate });
    setNotice(
      isPrivate
        ? "Your Cookie account is now private."
        : "Your Cookie account is now public.",
    );
  }

  async function answerFollowRequest(followerId: string, accept: boolean) {
    if (!user) return;
    const query = supabase.from("crumb_follows");
    const { error } = accept
      ? await query
          .update({ status: "accepted" })
          .eq("follower_id", followerId)
          .eq("following_id", user.id)
      : await query
          .delete()
          .eq("follower_id", followerId)
          .eq("following_id", user.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    setPendingFollowerIds((current) =>
      current.filter((id) => id !== followerId),
    );
  }

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!user) return;
      const [{ data: rows, error }, { data: hidden }, { data: pins }] =
        await Promise.all([
          supabase
            .from("messages")
            .select(
              "id,conversation_id,sender_id,body,reply_to_id,created_at,edited_at,deleted_for_everyone_at,expires_at,reactions:message_reactions(emoji,user_id)",
            )
            .eq("conversation_id", conversationId)
            .order("created_at"),
          supabase
            .from("message_hidden_for")
            .select("message_id")
            .eq("user_id", user.id),
          supabase
            .from("message_pins")
            .select("message_id")
            .eq("conversation_id", conversationId),
        ]);
      if (error) {
        setNotice(`Messages could not load: ${error.message}`);
        return;
      }
      setNotice((current) =>
        current.startsWith("Messages could not load:") ? "" : current,
      );
      setHiddenMessageIds((hidden ?? []).map((item) => item.message_id));
      setPinnedMessageIds((pins ?? []).map((item) => item.message_id));
      const rawRows = (rows ?? []) as Array<Record<string, unknown>>;
      const hydrated = await Promise.all(
        rawRows.map(async (item) => {
          const repliedTo = item.reply_to_id
            ? rawRows.find((candidate) => candidate.id === item.reply_to_id)
            : null;
          const audioPath = String(item.body || "").startsWith("__audio__:")
            ? String(item.body).slice(10)
            : null;
          const { data: signed } = audioPath
            ? await supabase.storage
                .from("voice-notes")
                .createSignedUrl(audioPath, 3600)
            : { data: null };
          return {
            ...item,
            audio_url: signed?.signedUrl || null,
            reply: repliedTo
              ? {
                  id: String(repliedTo.id),
                  body: String(repliedTo.body || ""),
                  sender_id: String(repliedTo.sender_id),
                }
              : null,
          } as ChatMessage;
        }),
      );
      setMessages(hydrated);
      await supabase
        .from("conversation_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);
    },
    [supabase, user],
  );

  useEffect(() => {
    if (!activeChat || !user) return;
    void loadMessages(activeChat.id);
    void supabase.realtime.setAuth();
    const channel = supabase
      .channel(`conversation:${activeChat.id}`, { config: { private: true } })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeChat.id}`,
        },
        () => void loadMessages(activeChat.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => void loadMessages(activeChat.id),
      )
      .on("broadcast", { event: "activity" }, ({ payload }) => {
        if (payload.user_id === user.id) return;
        setPeerActivity(payload.state || null);
        if (peerActivityTimer.current)
          window.clearTimeout(peerActivityTimer.current);
        if (payload.state)
          peerActivityTimer.current = window.setTimeout(
            () => setPeerActivity(null),
            3500,
          );
      })
      .subscribe();
    activityChannel.current = channel;
    return () => {
      activityChannel.current = null;
      setPeerActivity(null);
      if (peerActivityTimer.current)
        window.clearTimeout(peerActivityTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [activeChat, loadMessages, supabase, user]);

  useEffect(() => {
    if (!activeChat) return;
    window.requestAnimationFrame(() =>
      messageEndRef.current?.scrollIntoView({ block: "end" }),
    );
  }, [activeChat, messages.length]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`cookie-chat-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => void loadConversations(user.id),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_members" },
        () => void loadConversations(user.id),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadConversations, supabase, user]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    setNotice(error ? error.message : "Welcome back! 🍪");
  }

  async function createAccount() {
    setBusy(true);
    setNotice("");
    const clean = username
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._]/g, "");
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .maybeSingle();
    if (taken) {
      setBusy(false);
      setSignupStep(1);
      setNotice("That username has already been taken. Try another crumb!");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: clean,
          display_name: displayName,
          flavour,
          interests: selectedInterests,
          profile_colour: colour,
        },
      },
    });
    setBusy(false);
    setNotice(
      error
        ? error.message
        : "Account created! Check your email to confirm it, then sign in. 🍪",
    );
    if (!error) {
      setAuthMode("signin");
      setSignupStep(0);
    }
  }

  async function googleSignIn() {
    setNotice("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: publicAppUrl },
    });
    if (error) setNotice(error.message);
  }

  async function resendConfirmation() {
    if (!email) {
      setNotice("Enter your email first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: publicAppUrl },
    });
    setBusy(false);
    setNotice(
      error
        ? error.message
        : "Confirmation email resent. Check your inbox and spam folder. 🍪",
    );
  }

  async function changeUsername() {
    if (!user || !profile) return;
    const clean = newUsername
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9._]/g, "");
    if (clean.length < 3) {
      setNotice("Username must contain at least 3 characters.");
      return;
    }
    setBusy(true);
    setNotice("");
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .neq("id", user.id)
      .maybeSingle();
    if (taken) {
      setBusy(false);
      setNotice("That username is already taken.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ username: clean })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    setProfile({ ...profile, username: clean });
    setProfileMenuOpen(false);
    setNotice(`Your username is now @${clean}. 🍪`);
  }

  async function uploadProfileImage(kind: "avatar" | "cover", file?: File) {
    if (!file || !user || !profile) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 8 MB.");
      return;
    }
    setBusy(true);
    setNotice("");
    const extension = (
      file.name.split(".").pop() ||
      file.type.split("/")[1] ||
      "jpg"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/${kind}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
    if (uploadError) {
      setBusy(false);
      setNotice(`Image upload failed: ${uploadError.message}`);
      return;
    }
    const { data: publicFile } = supabase.storage
      .from("profile-media")
      .getPublicUrl(path);
    const field = kind === "avatar" ? "avatar_url" : "cover_url";
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ [field]: publicFile.publicUrl })
      .eq("id", user.id);
    setBusy(false);
    if (profileError) {
      setNotice(`Profile update failed: ${profileError.message}`);
      return;
    }
    setProfile({ ...profile, [field]: publicFile.publicUrl });
    setProfileMenuOpen(false);
    setNotice(
      kind === "avatar"
        ? "Profile picture updated! 🍪"
        : "Cover picture updated! 🍪",
    );
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Permanently delete your Cookie account? This cannot be undone.",
      )
    )
      return;
    setBusy(true);
    setNotice("");
    const { error } = await supabase.functions.invoke("delete-account", {
      body: {},
    });
    if (error) {
      setBusy(false);
      setNotice(`Account deletion failed: ${error.message}`);
      return;
    }
    await supabase.auth.signOut();
    setBusy(false);
    setUser(null);
  }

  async function searchPeople(value: string) {
    setSearch(value);
    const sequence = ++searchSequence.current;
    const term = value.trim().toLowerCase().replace(/^@/, "");
    if (!term || !user) {
      setResults([]);
      setNotice("");
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,profile_colour,avatar_url,cover_url")
      .limit(100);
    if (sequence !== searchSequence.current) return;
    if (error) {
      setResults([]);
      setNotice(`Search failed: ${error.message}`);
      return;
    }
    const matches = (data ?? [])
      .filter(
        (person) =>
          person.id !== user.id &&
          (person.username.toLowerCase().includes(term) ||
            person.display_name.toLowerCase().includes(term)),
      )
      .slice(0, 20);
    setResults(matches);
    setNotice(matches.length ? "" : `No Cookie user found for @${term}.`);
  }

  async function addFriend(person: Profile) {
    if (!user) return;
    setNotice("");
    const introduction = window
      .prompt(
        `Add one introductory message for @${person.username}:`,
        "Hey! I'd like to add you on Cookie 🍪",
      )
      ?.trim();
    if (introduction === undefined) return;
    const { error } = await supabase
      .from("friend_requests")
      .insert({
        requester_id: user.id,
        recipient_id: person.id,
        introduction_message: introduction || null,
      });
    if (error) {
      setNotice(
        error.code === "23505"
          ? "A friend request already exists between you."
          : error.message,
      );
      if (error.code === "23505")
        setSentRequestIds((current) =>
          current.includes(person.id) ? current : [...current, person.id],
        );
      return;
    }
    setSentRequestIds((current) => [...current, person.id]);
    setNotice(`Friend request sent to @${person.username}!`);
  }

  async function answerRequest(
    request: FriendRequest,
    status: "accepted" | "declined" | "blocked",
  ) {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    setRequests((current) => current.filter((item) => item.id !== request.id));
    if (status === "accepted" && request.requester) {
      setFriends((current) => [...current, request.requester!]);
      if (
        request.introduction_message &&
        window.confirm(
          `Include this introduction in your new chat?\n\n“${request.introduction_message}”`,
        )
      ) {
        const chat = await openChat(request.requester);
        if (chat)
          await sendMessage(
            `__intro__:${request.requester.display_name}:${request.introduction_message}`,
            chat,
            user?.id,
          );
      }
    }
  }

  async function openChat(person: Profile) {
    if (!user) return null;
    const existing = conversations.find((item) => item.person.id === person.id);
    if (existing) {
      setActiveChat(existing);
      setView("chats");
      return existing;
    }
    setBusy(true);
    setNotice("");
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ created_by: user.id })
      .select("id,kind,disappearing_mode")
      .single();
    if (error || !created) {
      setBusy(false);
      setNotice(error?.message || "Chat could not be created.");
      return null;
    }
    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert([
        { conversation_id: created.id, user_id: user.id },
        { conversation_id: created.id, user_id: person.id },
      ]);
    setBusy(false);
    if (memberError) {
      setNotice(memberError.message);
      return null;
    }
    const chat: Conversation = { ...created, person, unread_count: 0 };
    setConversations((current) => [chat, ...current]);
    setActiveChat(chat);
    setView("chats");
    return chat;
  }

  function broadcastActivity(state: "typing" | "recording" | null) {
    if (!user || !activityChannel.current) return;
    void activityChannel.current.send({
      type: "broadcast",
      event: "activity",
      payload: { user_id: user.id, state },
    });
  }

  function updateMessageText(value: string) {
    setMessageText(value);
    broadcastActivity(value.trim() ? "typing" : null);
    if (activityTimer.current) window.clearTimeout(activityTimer.current);
    if (value.trim())
      activityTimer.current = window.setTimeout(
        () => broadcastActivity(null),
        1800,
      );
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorder.current?.stop();
      return;
    }
    if (!activeChat || !user || !navigator.mediaDevices?.getUserMedia) {
      setNotice("Audio recording is not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunks.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        broadcastActivity(null);
        const blob = new Blob(audioChunks.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (!blob.size) return;
        const extension = blob.type.includes("mp4")
          ? "m4a"
          : blob.type.includes("ogg")
            ? "ogg"
            : "webm";
        const path = `${activeChat.id}/${user.id}/voice-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("voice-notes")
          .upload(path, blob, { contentType: blob.type, upsert: false });
        if (uploadError) {
          setNotice(`Voice note failed: ${uploadError.message}`);
          return;
        }
        await sendMessage(`__audio__:${path}`, activeChat, user.id);
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
      broadcastActivity("recording");
    } catch (error) {
      setNotice(
        `Microphone could not start: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async function sendMessage(
    text = messageText,
    chat = activeChat,
    senderId = user?.id,
  ) {
    if (!chat || !senderId || !text.trim()) return;
    const clean = text.trim();
    setMessageText("");
    broadcastActivity(null);
    const expiresAt =
      chat.disappearing_mode === "24_hours"
        ? new Date(Date.now() + 86400000).toISOString()
        : chat.disappearing_mode === "2_days"
          ? new Date(Date.now() + 172800000).toISOString()
          : null;
    const { error } = await supabase
      .from("messages")
      .insert({
        conversation_id: chat.id,
        sender_id: senderId,
        body: clean,
        reply_to_id: replyingTo?.id || null,
        expires_at: expiresAt,
      });
    setReplyingTo(null);
    if (error) setNotice(error.message);
    else {
      await loadMessages(chat.id);
      if (user) {
        await loadConversations(user.id);
        await loadBestFriends(user.id);
      }
    }
  }

  async function reactToMessage(message: ChatMessage, emoji: string) {
    if (!user) return;
    const exists = message.reactions?.some(
      (item) => item.user_id === user.id && item.emoji === emoji,
    );
    const query = supabase.from("message_reactions");
    const { error } = exists
      ? await query
          .delete()
          .eq("message_id", message.id)
          .eq("user_id", user.id)
          .eq("emoji", emoji)
      : await query.insert({ message_id: message.id, user_id: user.id, emoji });
    if (error) setNotice(error.message);
    else if (activeChat) await loadMessages(activeChat.id);
  }

  async function editMessage(message: ChatMessage) {
    const value = window.prompt("Edit message:", message.body)?.trim();
    if (!value || value === message.body) return;
    const { error } = await supabase
      .from("messages")
      .update({ body: value, edited_at: new Date().toISOString() })
      .eq("id", message.id);
    if (error) setNotice(error.message);
    else if (activeChat) await loadMessages(activeChat.id);
    setSelectedMessage(null);
  }

  async function deleteMessage(message: ChatMessage, forEveryone: boolean) {
    if (!user) return;
    if (forEveryone) {
      if (!window.confirm("Delete this message for everyone?")) return;
      const { error } = await supabase
        .from("messages")
        .update({ deleted_for_everyone_at: new Date().toISOString() })
        .eq("id", message.id);
      if (error) setNotice(error.message);
    } else {
      const { error } = await supabase
        .from("message_hidden_for")
        .insert({ message_id: message.id, user_id: user.id });
      if (error) setNotice(error.message);
    }
    setSelectedMessage(null);
    if (activeChat) await loadMessages(activeChat.id);
  }

  async function togglePin(message: ChatMessage) {
    if (!user || !activeChat) return;
    const pinned = pinnedMessageIds.includes(message.id);
    const query = supabase.from("message_pins");
    const { error } = pinned
      ? await query
          .delete()
          .eq("conversation_id", activeChat.id)
          .eq("message_id", message.id)
      : await query.insert({
          conversation_id: activeChat.id,
          message_id: message.id,
          pinned_by: user.id,
        });
    if (error) setNotice(error.message);
    else await loadMessages(activeChat.id);
    setSelectedMessage(null);
  }

  async function changeDisappearingMode(
    mode: Conversation["disappearing_mode"],
  ) {
    if (!activeChat || !profile) return;
    const { error } = await supabase
      .from("conversations")
      .update({ disappearing_mode: mode, updated_at: new Date().toISOString() })
      .eq("id", activeChat.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    const label = {
      after_viewing: "after viewing",
      "24_hours": "within 24 hours",
      "2_days": "within 2 days",
      never: "never delete",
    }[mode];
    const updated = { ...activeChat, disappearing_mode: mode };
    setActiveChat(updated);
    setConversations((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    await supabase
      .from("messages")
      .insert({
        conversation_id: activeChat.id,
        sender_id: profile.id,
        body: `__system__:${profile.display_name} changed messages to ${label}.`,
      });
  }

  if (showSplash)
    return (
      <main className="splash">
        <div className="splash-bite">
          <CookieLogo />
        </div>
        <h1>Cookie</h1>
        <p>Baking your space…</p>
        <div className="progress">
          <i />
        </div>
        <div className="falling-crumbs">
          <i />
          <i />
          <i />
        </div>
      </main>
    );

  if (!user)
    return (
      <main className="auth-shell">
        <section className="auth-art">
          <div className="crumb c1" />
          <div className="crumb c2" />
          <CookieLogo />
          <p className="kicker">Your people. Your moments.</p>
          <h1>Welcome to Cookie</h1>
          <p>A warmer way to chat, share and stay close.</p>
        </section>
        <section className="auth-panel">
          <div className="mobile-brand">
            <CookieLogo small />
            <b>Cookie</b>
          </div>
          {authMode === "signin" ? (
            <form className="auth-card" onSubmit={signIn}>
              <p className="kicker">Follow the crumb trail</p>
              <h2>Sign in</h2>
              <p>Welcome back. Your Cookie circle is waiting.</p>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your secret recipe"
                  minLength={8}
                  required
                />
              </label>
              <button className="primary" disabled={busy}>
                {busy ? "Opening Cookie…" : "Sign in →"}
              </button>
              <div className="or">
                <span />
                or
                <span />
              </div>
              <button type="button" className="google" onClick={googleSignIn}>
                <b>G</b> Continue with Google
              </button>
              {notice && <p className="notice">{notice}</p>}
              {notice.toLowerCase().includes("email not confirmed") && (
                <button
                  type="button"
                  className="google"
                  disabled={busy}
                  onClick={resendConfirmation}
                >
                  Resend confirmation email
                </button>
              )}
              <p className="switch">
                New to Cookie?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setNotice("");
                  }}
                >
                  Create your account
                </button>
              </p>
            </form>
          ) : (
            <div className="poll-card" key={signupStep}>
              <div className="poll-top">
                <button
                  onClick={() =>
                    signupStep
                      ? setSignupStep(signupStep - 1)
                      : setAuthMode("signin")
                  }
                >
                  ←
                </button>
                <span>{signupStep + 1} of 5</span>
              </div>
              <div className="poll-progress">
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} className={i <= signupStep ? "done" : ""} />
                ))}
              </div>
              {signupStep === 0 && (
                <>
                  <span className="poll-emoji">🔐</span>
                  <p className="kicker">Create your secret recipe</p>
                  <h2>How will you sign in?</h2>
                  <label>
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </label>
                  <label>
                    Cookie password
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </label>
                </>
              )}
              {signupStep === 1 && (
                <>
                  <span className="poll-emoji">👋🏾</span>
                  <p className="kicker">Your first crumb</p>
                  <h2>What should we call you?</h2>
                  <label>
                    Your name
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Xanthe"
                    />
                  </label>
                  <label>
                    Unique username
                    <div className="username">
                      <span>@</span>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="yourname"
                      />
                    </div>
                  </label>
                </>
              )}
              {signupStep === 2 && (
                <>
                  <span className="poll-emoji">🍪</span>
                  <p className="kicker">Pick your flavour</p>
                  <h2>What’s your social energy?</h2>
                  <div className="choices">
                    {flavours.map(([emoji, title, copy]) => (
                      <button
                        key={title}
                        className={flavour === title ? "selected" : ""}
                        onClick={() => setFlavour(title)}
                      >
                        <span>{emoji}</span>
                        <b>{title}</b>
                        <small>{copy}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {signupStep === 3 && (
                <>
                  <span className="poll-emoji">✨</span>
                  <p className="kicker">Your feed, your vibe</p>
                  <h2>What are you into?</h2>
                  <div className="interest-list">
                    {interests.map((item) => (
                      <button
                        key={item}
                        className={
                          selectedInterests.includes(item) ? "selected" : ""
                        }
                        onClick={() =>
                          setSelectedInterests((current) =>
                            current.includes(item)
                              ? current.filter((x) => x !== item)
                              : [...current, item],
                          )
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {signupStep === 4 && (
                <>
                  <span className="poll-emoji">🎨</span>
                  <p className="kicker">Last crumb</p>
                  <h2>Choose your Cookie colour</h2>
                  <div className="profile-preview">
                    <Avatar
                      person={{
                        id: "",
                        username,
                        display_name: displayName || "Cookie Friend",
                        profile_colour: colour,
                        avatar_url: null,
                        cover_url: null,
                      }}
                    />
                    <div>
                      <b>{displayName || "Cookie Friend"}</b>
                      <small>@{username || "yourname"}</small>
                    </div>
                  </div>
                  <div className="colours">
                    {colours.map((item) => (
                      <button
                        aria-label={`Choose ${item}`}
                        key={item}
                        className={colour === item ? "selected" : ""}
                        style={{ background: item }}
                        onClick={() => setColour(item)}
                      />
                    ))}
                  </div>
                </>
              )}
              {notice && <p className="notice">{notice}</p>}
              <button
                className="primary next"
                disabled={
                  busy ||
                  (signupStep === 0 && (!email || password.length < 8)) ||
                  (signupStep === 1 &&
                    (!displayName || username.replace(/^@/, "").length < 3)) ||
                  (signupStep === 2 && !flavour) ||
                  (signupStep === 3 && !selectedInterests.length)
                }
                onClick={() =>
                  signupStep === 4
                    ? createAccount()
                    : setSignupStep(signupStep + 1)
                }
              >
                {signupStep === 4
                  ? busy
                    ? "Baking account…"
                    : "Create my Cookie 🍪"
                  : "Next crumb →"}
              </button>
            </div>
          )}
        </section>
      </main>
    );

  const bestFriendById = new Map(
    bestFriends.map((ranking) => [ranking.friend_id, ranking]),
  );
  const visibleConversations = conversations.filter((chat) => {
    if (chatFilter === "unread")
      return chat.last_sender_id !== user.id && chat.unread_count > 0;
    if (chatFilter === "groups") return chat.kind === "group";
    if (chatFilter === "best_friends")
      return bestFriendById.has(chat.person.id);
    if (chatFilter === "unreplied")
      return Boolean(chat.last_message_at) &&
        chat.last_sender_id !== user.id &&
        chat.unread_count === 0;
    return true;
  });

  const emptyFilterCopy = {
    all: [
      "No conversations yet",
      "Add friends to start chatting. Your real conversations will appear here.",
    ],
    unread: ["No unread chats", "New chats you have not opened will appear here."],
    groups: ["No groups yet", "Groups you join will appear here."],
    best_friends: [
      "No Best Friends yet",
      "Keep chatting and sharing Crumbs. Your six closest friends will appear automatically.",
    ],
    unreplied: [
      "You’re all caught up",
      "Opened chats waiting for your reply will appear here.",
    ],
  }[chatFilter];

  return (
    <main className="app-shell">
      <div className="app-frame">
        <header>
          <button className="brand" onClick={() => setView("chats")}>
            <CookieLogo small />
            <b>Cookie</b>
          </button>
          <div>
            <button aria-label="Notifications">
              ♢{requests.length > 0 && <i />}
            </button>
            <button
              className="mini-avatar"
              onClick={() => setView("profile")}
              style={{ background: profile?.profile_colour }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                profile?.display_name?.[0] || "C"
              )}
            </button>
          </div>
        </header>
        <section className="app-screen">
          {view === "chats" &&
            (activeChat ? (
              <div className="chat-pane">
                <div className="chat-head">
                  <button
                    className="chat-back"
                    onClick={() => {
                      setActiveChat(null);
                      setSelectedMessage(null);
                      void loadConversations(user.id);
                    }}
                  >
                    ‹
                  </button>
                  <Avatar person={activeChat.person} />
                  <div>
                    <b>{activeChat.person.display_name}</b>
                    <small className={peerActivity ? "live-activity" : ""}>
                      {peerActivity === "recording"
                        ? "recording audio…"
                        : peerActivity === "typing"
                          ? "typing…"
                          : `@${activeChat.person.username}`}
                    </small>
                  </div>
                  <select
                    aria-label="Automatic message deletion"
                    value={activeChat.disappearing_mode}
                    onChange={(event) =>
                      changeDisappearingMode(
                        event.target.value as Conversation["disappearing_mode"],
                      )
                    }
                  >
                    <option value="after_viewing">After viewing</option>
                    <option value="24_hours">Within 24 hours</option>
                    <option value="2_days">Within 2 days</option>
                    <option value="never">Never delete</option>
                  </select>
                </div>
                {pinnedMessageIds.length > 0 && (
                  <div className="pinned-strip">
                    📌 {pinnedMessageIds.length} pinned message
                    {pinnedMessageIds.length > 1 ? "s" : ""}
                  </div>
                )}
                <div className="message-stream">
                  {messages
                    .filter(
                      (message) =>
                        !hiddenMessageIds.includes(message.id) &&
                        (!message.expires_at ||
                          new Date(message.expires_at).getTime() > Date.now()),
                    )
                    .map((message) => {
                      const mine = message.sender_id === user.id;
                      const system = message.body.startsWith("__system__:");
                      const intro = message.body.startsWith("__intro__:");
                      if (system)
                        return (
                          <div className="system-message" key={message.id}>
                            {message.body.replace("__system__:", "")}
                          </div>
                        );
                      const grouped = Object.entries(
                        (message.reactions || []).reduce(
                          (map, item) => ({
                            ...map,
                            [item.emoji]: (map[item.emoji] || 0) + 1,
                          }),
                          {} as Record<string, number>,
                        ),
                      );
                      return (
                        <div
                          className={`message-row ${mine ? "mine" : "theirs"}`}
                          key={message.id}
                          onTouchStart={(event) =>
                            (swipeStart.current = {
                              x: event.touches[0].clientX,
                              y: event.touches[0].clientY,
                            })
                          }
                          onTouchEnd={(event) => {
                            if (
                              swipeStart.current &&
                              event.changedTouches[0].clientX -
                                swipeStart.current.x >
                                65
                            )
                              setReplyingTo(message);
                            swipeStart.current = null;
                          }}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className={`message-bubble ${message.deleted_for_everyone_at ? "deleted" : ""}`}
                            onClick={() =>
                              !message.deleted_for_everyone_at &&
                              setSelectedMessage(
                                selectedMessage?.id === message.id
                                  ? null
                                  : message,
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                (event.key === "Enter" || event.key === " ") &&
                                !message.deleted_for_everyone_at
                              )
                                setSelectedMessage(
                                  selectedMessage?.id === message.id
                                    ? null
                                    : message,
                                );
                            }}
                          >
                            {message.reply && (
                              <span className="reply-preview">
                                <b>
                                  {message.reply.sender_id === user.id
                                    ? "You"
                                    : activeChat.person.display_name}
                                </b>
                                {message.reply.body.slice(0, 80)}
                              </span>
                            )}
                            {message.deleted_for_everyone_at ? (
                              <em>
                                {(mine
                                  ? profile?.display_name
                                  : activeChat.person.display_name
                                )?.toUpperCase()}{" "}
                                DELETED THIS MESSAGE
                              </em>
                            ) : intro ? (
                              <span className="intro-message">
                                Friend request message
                                <br />
                                <b>
                                  {message.body.split(":").slice(2).join(":")}
                                </b>
                              </span>
                            ) : message.body.startsWith("__audio__:") ? (
                              <span className="voice-note">
                                <b>Voice note</b>
                                {message.audio_url ? (
                                  <audio
                                    controls
                                    preload="metadata"
                                    src={message.audio_url}
                                  />
                                ) : (
                                  <small>Loading audio…</small>
                                )}
                              </span>
                            ) : (
                              message.body
                            )}
                            {!message.deleted_for_everyone_at && (
                              <small>
                                {message.edited_at && "Edited · "}
                                {new Date(
                                  message.created_at,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                ·{" "}
                                {mine ? (
                                  <CrumbStatus
                                    delivered
                                    read={Boolean(
                                      activeChat.person_last_read_at &&
                                        activeChat.person_last_read_at >
                                          message.created_at,
                                    )}
                                  />
                                ) : (
                                  "Received"
                                )}
                              </small>
                            )}
                          </div>
                          {grouped.length > 0 && (
                            <div className="reaction-counts">
                              {grouped.map(([emoji, count]) => (
                                <span key={emoji}>
                                  {emoji}
                                  {count > 1 && count}
                                </span>
                              ))}
                            </div>
                          )}
                          {selectedMessage?.id === message.id && (
                            <div className="message-actions">
                              <div className="quick-reactions">
                                {["🍪", "❤️", "😂", "😮", "😢", "👍"].map(
                                  (emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        reactToMessage(message, emoji)
                                      }
                                    >
                                      {emoji}
                                    </button>
                                  ),
                                )}
                                <button
                                  onClick={() => {
                                    const emoji =
                                      window.prompt("Choose an emoji");
                                    if (emoji)
                                      void reactToMessage(message, emoji);
                                  }}
                                >
                                  ＋
                                </button>
                              </div>
                              <button onClick={() => togglePin(message)}>
                                {pinnedMessageIds.includes(message.id)
                                  ? "Unpin"
                                  : "Pin"}
                              </button>
                              {mine &&
                                Date.now() -
                                  new Date(message.created_at).getTime() <
                                  900000 && (
                                  <button onClick={() => editMessage(message)}>
                                    Edit
                                  </button>
                                )}
                              <button
                                onClick={() => deleteMessage(message, false)}
                              >
                                Delete for me
                              </button>
                              {mine && (
                                <button
                                  onClick={() => deleteMessage(message, true)}
                                >
                                  Delete for everyone
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  <div ref={messageEndRef} aria-hidden="true" />
                </div>
                <div className="chat-compose">
                  {replyingTo && (
                    <div className="replying">
                      <span>
                        Replying to{" "}
                        <b>
                          {replyingTo.sender_id === user.id
                            ? "yourself"
                            : activeChat.person.display_name}
                        </b>
                        <small>{replyingTo.body.slice(0, 90)}</small>
                      </span>
                      <button onClick={() => setReplyingTo(null)}>×</button>
                    </div>
                  )}
                  {emojiPickerOpen && (
                    <div className="emoji-picker">
                      <div className="emoji-tabs">
                        {(
                          Object.keys(emojiGroups) as Array<
                            keyof typeof emojiGroups
                          >
                        ).map((category) => (
                          <button
                            key={category}
                            className={
                              emojiCategory === category ? "active" : ""
                            }
                            onClick={() => setEmojiCategory(category)}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      <div className="emoji-grid">
                        {emojiGroups[emojiCategory].map((emoji, index) => (
                          <button
                            key={`${emoji}-${index}`}
                            onClick={() =>
                              updateMessageText(messageText + emoji)
                            }
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="compose-row">
                    <button
                      className={emojiPickerOpen ? "picker-active" : ""}
                      title="Open emoji picker"
                      aria-label="Open emoji picker"
                      onClick={() => setEmojiPickerOpen((current) => !current)}
                    >
                      ☺
                    </button>
                    <button
                      className="attach"
                      title="Photos, files, location, contacts, polls and events"
                    >
                      ＋
                    </button>
                    <input
                      value={messageText}
                      onChange={(event) =>
                        updateMessageText(event.target.value)
                      }
                      onFocus={() => setEmojiPickerOpen(false)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      placeholder={
                        isRecording ? "Recording audio…" : "Message…"
                      }
                    />
                    <button
                      className={`record ${isRecording ? "recording" : ""}`}
                      aria-label={
                        isRecording
                          ? "Stop and send voice note"
                          : "Record voice note"
                      }
                      title={
                        isRecording ? "Stop and send" : "Record voice note"
                      }
                      onClick={() => void toggleRecording()}
                    >
                      {isRecording ? "■" : "🎙"}
                    </button>
                    <button
                      className="send"
                      disabled={!messageText.trim()}
                      onClick={() => sendMessage()}
                    >
                      ➤
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="page">
                <div className="title-row">
                  <div>
                    <p className="kicker">
                      Welcome, {profile?.display_name.split(" ")[0]}
                    </p>
                    <h1>Your chats</h1>
                  </div>
                  <button className="round" onClick={() => setView("friends")}>
                    ＋
                  </button>
                </div>
                <div className="crumb-legend">
                  <CrumbStatus />
                  <span>Sent</span>
                  <CrumbStatus delivered />
                  <span>Delivered</span>
                  <CrumbStatus read />
                  <span>Read</span>
                </div>
                <div className="search-box">
                  ⌕ <input placeholder="Search messages, people and files" />
                </div>
                <div className="folder-row">
                  {(
                    [
                      ["all", "All"],
                      ["unread", "Unread"],
                      ["groups", "Groups"],
                      ["best_friends", "Best Friends"],
                      ["unreplied", "Unreplied"],
                    ] as const
                  ).map(([filter, label]) => (
                    <button
                      key={filter}
                      className={chatFilter === filter ? "active" : ""}
                      onClick={() => setChatFilter(filter)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {requests.length > 0 && (
                  <button
                    className="request-banner"
                    onClick={() => setView("friends")}
                  >
                    <span>✉</span>
                    <div>
                      <b>Friend requests</b>
                      <small>{requests.length} waiting for you</small>
                    </div>
                    <strong>{requests.length}</strong>
                    <i>›</i>
                  </button>
                )}
                {visibleConversations.length > 0 ? (
                  <div className="chat-list">
                    {visibleConversations.map((chat) => {
                      const bestFriend = bestFriendById.get(chat.person.id);
                      const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
                      const mutualForTwoWeeks = Boolean(
                        bestFriend?.rank === 1 &&
                          bestFriend.mutual_number_one_at &&
                          new Date(bestFriend.mutual_number_one_at).getTime() <=
                            twoWeeksAgo,
                      );
                      const numberOneForTwoWeeks = Boolean(
                        bestFriend?.rank === 1 &&
                          bestFriend.first_number_one_at &&
                          new Date(bestFriend.first_number_one_at).getTime() <=
                            twoWeeksAgo,
                      );
                      const bestFriendEmoji = bestFriend
                        ? mutualForTwoWeeks
                          ? "❤️"
                          : numberOneForTwoWeeks
                            ? "🩷"
                            : "🤗"
                        : "";
                      const read = Boolean(
                        chat.last_message_at &&
                          chat.person_last_read_at &&
                          chat.person_last_read_at > chat.last_message_at,
                      );
                      const hasMessage = Boolean(chat.last_message_at);
                      const age = chat.last_message_at
                        ? formatAgo(chat.last_message_at, now)
                        : "";
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setActiveChat(chat)}
                        >
                          <Avatar person={chat.person} />
                          <span>
                            <b>
                              {chat.person.display_name}{" "}
                              {bestFriendEmoji && (
                                <span
                                  className="best-friend-emoji"
                                  title={
                                    mutualForTwoWeeks
                                      ? "You’ve been each other’s #1 Best Friend for two weeks"
                                      : numberOneForTwoWeeks
                                        ? `${chat.person.display_name} has been your #1 Best Friend for two weeks`
                                        : "One of your six Best Friends"
                                  }
                                >
                                  {bestFriendEmoji}
                                </span>
                              )}
                            </b>
                            <small
                              className={chat.unread_count ? "new-chat" : ""}
                            >
                              {chat.unread_count ? (
                                chat.unread_count === 1 ? (
                                  "New Chat"
                                ) : (
                                  "New Chats"
                                )
                              ) : hasMessage &&
                                chat.last_sender_id === user.id ? (
                                <>
                                  <CrumbStatus delivered read={read} />
                                  {read ? "Read" : "Delivered"}
                                </>
                              ) : hasMessage ? (
                                "Received"
                              ) : (
                                "Start chatting 🍪"
                              )}
                              {age && <time>· {age}</time>}
                            </small>
                            {(mutualForTwoWeeks || numberOneForTwoWeeks) && (
                              <small className="best-friend-milestone">
                                {mutualForTwoWeeks
                                  ? "You’ve been each other’s #1 Best Friend for two weeks"
                                  : `${chat.person.display_name} has been your #1 Best Friend for two weeks`}
                              </small>
                            )}
                          </span>
                          <i>›</i>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title={emptyFilterCopy[0]}
                    copy={emptyFilterCopy[1]}
                    action={chatFilter === "all" ? "Find friends" : undefined}
                    onAction={
                      chatFilter === "all" ? () => setView("friends") : undefined
                    }
                  />
                )}
              </div>
            ))}
          {view === "friends" && (
            <div className="page">
              <div className="title-row">
                <div>
                  <p className="kicker">Grow your circle</p>
                  <h1>Find friends</h1>
                </div>
              </div>
              <div className="search-box">
                @{" "}
                <input
                  value={search}
                  onChange={(e) => searchPeople(e.target.value)}
                  placeholder="Search a unique username"
                  autoFocus
                />
              </div>
              {notice && <p className="notice inline">{notice}</p>}
              {results.length > 0 && (
                <div className="people-list">
                  <h3>People</h3>
                  {results.map((person) => (
                    <div className="person" key={person.id}>
                      <Avatar person={person} />
                      <div>
                        <b>{person.display_name}</b>
                        <small>@{person.username}</small>
                      </div>
                      <button
                        disabled={
                          friends.some((friend) => friend.id === person.id) ||
                          sentRequestIds.includes(person.id)
                        }
                        onClick={() => addFriend(person)}
                      >
                        {friends.some((friend) => friend.id === person.id)
                          ? "Friends"
                          : sentRequestIds.includes(person.id)
                            ? "Added"
                            : "Add friend"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {requests.length > 0 && (
                <div className="people-list">
                  <h3>Requests</h3>
                  {requests.map((request) => (
                    <div className="person request" key={request.id}>
                      {request.requester && (
                        <Avatar person={request.requester} />
                      )}
                      <div>
                        <b>{request.requester?.display_name}</b>
                        <small>@{request.requester?.username}</small>
                        {request.introduction_message && (
                          <em>“{request.introduction_message}”</em>
                        )}
                      </div>
                      <button
                        onClick={() => answerRequest(request, "accepted")}
                      >
                        Accept
                      </button>
                      <button
                        className="quiet"
                        onClick={() => answerRequest(request, "declined")}
                      >
                        Decline
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!search &&
                allProfiles.some(
                  (person) =>
                    !friends.some((friend) => friend.id === person.id),
                ) && (
                  <div className="people-list cookie-directory">
                    <h3>People on Cookie</h3>
                    {allProfiles
                      .filter(
                        (person) =>
                          !friends.some((friend) => friend.id === person.id),
                      )
                      .map((person) => (
                        <div className="person" key={person.id}>
                          <Avatar person={person} />
                          <div>
                            <b>{person.display_name}</b>
                            <small>@{person.username}</small>
                          </div>
                          <button
                            disabled={sentRequestIds.includes(person.id)}
                            onClick={() => addFriend(person)}
                          >
                            {sentRequestIds.includes(person.id)
                              ? "Added"
                              : "Add friend"}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              {friends.length > 0 && (
                <div className="people-list">
                  <h3>Your friends</h3>
                  {friends.map((person) => (
                    <div className="person" key={person.id}>
                      <Avatar person={person} />
                      <div>
                        <b>{person.display_name}</b>
                        <small>@{person.username}</small>
                      </div>
                      <button onClick={() => openChat(person)}>Message</button>
                    </div>
                  ))}
                </div>
              )}
              {!search &&
                allProfiles.length === 0 &&
                requests.length === 0 &&
                friends.length === 0 && (
                  <EmptyState
                    title="Your circle starts here"
                    copy="New Cookie accounts will appear here."
                  />
                )}
            </div>
          )}
          {view === "crumbs" && (
            <div className="crumbs-view">
              <div className="crumbs-top">
                <div className="crumb-feed-tabs">
                  <button
                    className={crumbFeed === "for_you" ? "active" : ""}
                    onClick={() => void switchCrumbFeed("for_you")}
                  >
                    For You
                  </button>
                  <button
                    className={crumbFeed === "following" ? "active" : ""}
                    onClick={() => void switchCrumbFeed("following")}
                  >
                    Following
                  </button>
                </div>
                <button
                  className="create-crumb"
                  onClick={() => setCrumbComposerOpen(true)}
                >
                  ＋ <span>Create</span>
                </button>
              </div>
              {notice && <p className="crumb-notice">{notice}</p>}
              <div className="crumb-feed">
                {crumbs.length ? (
                  crumbs.map((post) => {
                    const liked = post.likes.some(
                      (item) => item.user_id === user.id,
                    );
                    const saved = post.saves.some(
                      (item) => item.user_id === user.id,
                    );
                    const reposted = post.reposts.some(
                      (item) => item.user_id === user.id,
                    );
                    const following = followingIds.includes(post.author_id);
                    return (
                      <article
                        className={`crumb-card ${post.kind}`}
                        key={post.id}
                      >
                        <div className="crumb-media">
                          {post.kind === "video" && post.media_url ? (
                            <video
                              src={post.media_url}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                            />
                          ) : post.kind === "photo" && post.media_url ? (
                            <img
                              src={post.media_url}
                              alt={post.caption || "Crumb post"}
                            />
                          ) : (
                            <div className="text-crumb">
                              <span>🍪</span>
                              <p>{post.caption}</p>
                            </div>
                          )}
                          <div className="crumb-shade" />
                        </div>
                        <div className="crumb-copy">
                          <div className="crumb-author">
                            <Avatar person={post.author} />
                            <span>
                              <b>@{post.author.username}</b>
                              <small>
                                {formatAgo(post.created_at, now)} ago
                              </small>
                            </span>
                            {post.author_id !== user.id && !following && (
                              <button
                                onClick={() =>
                                  void followCrumbCreator(post.author)
                                }
                              >
                                Follow
                              </button>
                            )}
                          </div>
                          {post.kind !== "text" && post.caption && (
                            <p>{post.caption}</p>
                          )}
                          {post.audio_title && (
                            <small className="crumb-audio">
                              ♫ {post.audio_title}
                            </small>
                          )}
                          {post.comments.slice(-2).map((comment) => (
                            <small className="crumb-comment" key={comment.id}>
                              <b>Comment</b> {comment.body}
                            </small>
                          ))}
                        </div>
                        <div className="crumb-actions">
                          <button
                            className={liked ? "active" : ""}
                            onClick={() =>
                              void toggleCrumbAction(post, "crumb_likes", liked)
                            }
                          >
                            <span>{liked ? "❤️" : "🤍"}</span>
                            <small>{post.likes.length}</small>
                          </button>
                          <button onClick={() => void commentOnCrumb(post)}>
                            <span>💬</span>
                            <small>{post.comments.length}</small>
                          </button>
                          <button
                            className={reposted ? "active" : ""}
                            onClick={() =>
                              void toggleCrumbAction(
                                post,
                                "crumb_reposts",
                                reposted,
                              )
                            }
                          >
                            <span>↻</span>
                            <small>{post.reposts.length}</small>
                          </button>
                          <button
                            onClick={async () => {
                              const url = `${publicAppUrl}?crumb=${post.id}`;
                              if (navigator.share)
                                await navigator.share({
                                  title: "Cookie Crumb",
                                  text: post.caption,
                                  url,
                                });
                              else {
                                await navigator.clipboard.writeText(url);
                                setNotice("Crumb link copied!");
                              }
                            }}
                          >
                            <span>➤</span>
                            <small>Share</small>
                          </button>
                          <button
                            className={saved ? "active" : ""}
                            onClick={() =>
                              void toggleCrumbAction(post, "crumb_saves", saved)
                            }
                          >
                            <span>{saved ? "🔖" : "▱"}</span>
                            <small>Save</small>
                          </button>
                          <button
                            onClick={() => {
                              const person = friends[0];
                              if (person)
                                void openChat(person).then(
                                  (chat) =>
                                    chat &&
                                    sendMessage(
                                      `Shared a Crumb: ${publicAppUrl}?crumb=${post.id}`,
                                      chat,
                                      user.id,
                                    ),
                                );
                              else
                                setNotice(
                                  "Add a friend first to send Crumbs directly.",
                                );
                            }}
                          >
                            <span>✉</span>
                            <small>Send</small>
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="crumb-empty">
                    <span>🍪</span>
                    <h2>
                      {crumbFeed === "following"
                        ? "Follow people to fill this feed"
                        : "Be the first to leave a Crumb"}
                    </h2>
                    <p>Post a video, photo, or thought for Cookie.</p>
                    <button onClick={() => setCrumbComposerOpen(true)}>
                      Create a Crumb
                    </button>
                  </div>
                )}
              </div>
              {crumbComposerOpen && (
                <div className="crumb-modal">
                  <div className="crumb-composer">
                    <button
                      className="crumb-close"
                      onClick={() => setCrumbComposerOpen(false)}
                    >
                      ×
                    </button>
                    <p className="kicker">Bake something new</p>
                    <h2>Create a Crumb</h2>
                    <div className="crumb-kind-tabs">
                      {(["video", "photo", "text"] as const).map((kind) => (
                        <button
                          className={crumbKind === kind ? "active" : ""}
                          key={kind}
                          onClick={() => {
                            setCrumbKind(kind);
                            setCrumbFile(null);
                          }}
                        >
                          {kind === "video"
                            ? "🎬 Video"
                            : kind === "photo"
                              ? "📷 Photo"
                              : "✍️ Text"}
                        </button>
                      ))}
                    </div>
                    {crumbKind !== "text" && (
                      <label className="crumb-upload">
                        Choose {crumbKind}
                        <input
                          type="file"
                          accept={crumbKind === "video" ? "video/*" : "image/*"}
                          onChange={(event) =>
                            setCrumbFile(event.target.files?.[0] || null)
                          }
                        />
                        <small>
                          {crumbFile?.name || "Tap to select from your device"}
                        </small>
                      </label>
                    )}
                    {crumbKind === "video" && (
                      <div className="duration-row">
                        <span>Length</span>
                        {[30, 60, 180].map((value) => (
                          <button
                            className={crumbDuration === value ? "active" : ""}
                            key={value}
                            onClick={() => setCrumbDuration(value)}
                          >
                            {value === 30
                              ? "30 sec"
                              : value === 60
                                ? "1 min"
                                : "3 min"}
                          </button>
                        ))}
                      </div>
                    )}
                    <label>
                      Caption or text
                      <textarea
                        value={crumbCaption}
                        onChange={(event) =>
                          setCrumbCaption(event.target.value)
                        }
                        maxLength={2000}
                        placeholder="Leave a crumb…"
                      />
                    </label>
                    <label>
                      Music or original audio
                      <input
                        value={crumbAudio}
                        onChange={(event) => setCrumbAudio(event.target.value)}
                        placeholder="Song title, original audio, or uploaded track name"
                      />
                    </label>
                    <div className="creator-tools">
                      <button>♫ Music</button>
                      <button>✨ Filter</button>
                      <button>Aa Text</button>
                      <button>😊 Stickers</button>
                      <button>✂ Trim</button>
                      <button>1× Speed</button>
                    </div>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => void publishCrumb()}
                    >
                      {busy ? "Posting…" : "Post Crumb 🍪"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {view === "stories" && (
            <div className="coming">
              <span>✨</span>
              <h1>Stories</h1>
              <p>Nothing here yet. Your friends’ stories will appear here.</p>
            </div>
          )}
          {view === "profile" && (
            <div className="profile-page">
              <button
                className="profile-menu-button"
                aria-label="Profile settings"
                onClick={() => {
                  setProfileMenuOpen((current) => !current);
                  setNewUsername(profile?.username || "");
                }}
              >
                •••
              </button>
              {profileMenuOpen && (
                <div className="profile-settings">
                  <h3>Profile settings</h3>
                  <label className="privacy-toggle">
                    <span><b>Private account</b><small>Approve people before they follow you</small></span>
                    <input type="checkbox" checked={Boolean(profile?.is_private)} onChange={(event) => void setProfilePrivacy(event.target.checked)} />
                  </label>
                  {pendingFollowerIds.length > 0 && <div className="follow-requests"><b>Follow requests</b>{pendingFollowerIds.map((id) => { const person = allProfiles.find((item) => item.id === id); return <div key={id}><span>{person ? `@${person.username}` : "Cookie user"}</span><button onClick={() => void answerFollowRequest(id, true)}>Accept</button><button onClick={() => void answerFollowRequest(id, false)}>×</button></div>; })}</div>}
                  <div className="photo-actions">
                    <label className="photo-choice">
                      <span>Change profile picture</span>
                      <small>Shown beside your name</small>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy}
                        onChange={(event) =>
                          uploadProfileImage("avatar", event.target.files?.[0])
                        }
                      />
                    </label>
                    <label className="photo-choice">
                      <span>Change cover picture</span>
                      <small>Shown behind your profile</small>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy}
                        onChange={(event) =>
                          uploadProfileImage("cover", event.target.files?.[0])
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Change username
                    <div className="username">
                      <span>@</span>
                      <input
                        value={newUsername}
                        onChange={(event) => setNewUsername(event.target.value)}
                        placeholder="your_username"
                      />
                    </div>
                  </label>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={changeUsername}
                  >
                    {busy ? "Saving…" : "Save username"}
                  </button>
                  <button
                    className="danger-button"
                    disabled={busy}
                    onClick={deleteAccount}
                  >
                    Delete account
                  </button>
                </div>
              )}
              {profile ? (
                <>
                  <div
                    className={`profile-hero ${profile.cover_url ? "has-cover" : ""}`}
                    style={
                      profile.cover_url
                        ? { backgroundImage: `url("${profile.cover_url}")` }
                        : undefined
                    }
                  >
                    <Avatar person={profile} />
                  </div>
                  <h1>{profile.display_name}</h1>
                  <p>@{profile.username}</p>
                  <div className="stats">
                    <div>
                      <b>{friends.length}</b>
                      <small>Friends</small>
                    </div>
                    <div>
                      <b>0</b>
                      <small>Followers</small>
                    </div>
                    <div>
                      <b>0</b>
                      <small>Following</small>
                    </div>
                  </div>
                </>
              ) : (
                <div className="coming">
                  <span>🍪</span>
                  <h1>Loading your profile…</h1>
                </div>
              )}
              {notice && <p className="notice inline">{notice}</p>}
              <button
                className="outline"
                onClick={() => supabase.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          )}
        </section>
        <nav>
          {(
            [
              { id: "chats", icon: "◒", label: "Chats" },
              { id: "friends", icon: "＋", label: "Friends" },
              { id: "crumbs", icon: "●", label: "Crumbs" },
              { id: "stories", icon: "◉", label: "Stories" },
              { id: "profile", icon: "○", label: "Profile" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

function Avatar({ person }: { person: Profile }) {
  return (
    <span className="avatar" style={{ background: person.profile_colour }}>
      {person.avatar_url ? (
        <img src={person.avatar_url} alt={`${person.display_name} profile`} />
      ) : (
        person.display_name?.[0]?.toUpperCase() || "C"
      )}
    </span>
  );
}
function CrumbStatus({
  delivered = false,
  read = false,
}: {
  delivered?: boolean;
  read?: boolean;
}) {
  return (
    <span
      className={`crumb-status ${read ? "read" : ""}`}
      aria-label={read ? "Read" : delivered ? "Delivered" : "Sent"}
    >
      <i />
      {(delivered || read) && <i />}
    </span>
  );
}
function formatAgo(value: string, now: number) {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
function EmptyState({
  title,
  copy,
  action,
  onAction,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <span>🍪</span>
      <h2>{title}</h2>
      <p>{copy}</p>
      {action && <button onClick={onAction}>{action} →</button>}
    </div>
  );
}
