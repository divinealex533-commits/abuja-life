// Abuja Life — social accounts players can link. Safe for client and server.

export type PlatformId = "tiktok" | "snapchat" | "instagram" | "x" | "youtube";
export type LivePlatformId = "tiktok" | "instagram" | "youtube";

export interface Platform {
  id: PlatformId;
  label: string;
  icon: string;
  /** Tailwind classes for the badge. */
  tone: string;
  placeholder: string;
  profileUrl: (handle: string) => string;
  /** Where viewers go to watch a live stream, if the platform has one. */
  liveUrl?: (handle: string) => string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "tiktok",
    label: "TikTok",
    icon: "🎵",
    tone: "border-pink-400/40 bg-gradient-to-r from-cyan-400/15 to-pink-500/20 text-pink-100",
    placeholder: "yourtiktok",
    profileUrl: (h) => `https://www.tiktok.com/@${h}`,
    liveUrl: (h) => `https://www.tiktok.com/@${h}/live`,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    icon: "👻",
    tone: "border-yellow-300/50 bg-yellow-300/15 text-yellow-100",
    placeholder: "yoursnap",
    profileUrl: (h) => `https://www.snapchat.com/add/${h}`,
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: "📸",
    tone: "border-fuchsia-400/40 bg-gradient-to-r from-amber-400/15 via-fuchsia-500/20 to-purple-500/20 text-fuchsia-100",
    placeholder: "yourinsta",
    profileUrl: (h) => `https://www.instagram.com/${h}`,
    liveUrl: (h) => `https://www.instagram.com/${h}/live`,
  },
  {
    id: "x",
    label: "X",
    icon: "✖️",
    tone: "border-white/30 bg-white/10 text-white",
    placeholder: "yourhandle",
    profileUrl: (h) => `https://x.com/${h}`,
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: "▶️",
    tone: "border-red-400/40 bg-red-500/15 text-red-100",
    placeholder: "yourchannel",
    profileUrl: (h) => `https://www.youtube.com/@${h}`,
    liveUrl: (h) => `https://www.youtube.com/@${h}/live`,
  },
];

export const LIVE_PLATFORMS = PLATFORMS.filter((p) => p.liveUrl) as (Platform & {
  id: LivePlatformId;
  liveUrl: (h: string) => string;
})[];

export type Socials = Partial<Record<PlatformId, string>>;

/** A live session ends by itself after this long, in case the player forgets. */
export const LIVE_MAX_HOURS = 4;

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}

/**
 * Turn whatever the player typed ("@abuja_boy", a full profile link, spaces)
 * into a clean handle, or "" if it isn't valid.
 */
export function cleanHandle(input: unknown): string {
  if (typeof input !== "string") return "";
  let value = input.trim();
  // Pasted a link? Take the last path part.
  if (/^https?:\/\//i.test(value) || /\.(com|app)\//i.test(value)) {
    value = value.replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/\/live$/i, "");
    value = value.split("/").pop() ?? "";
  }
  value = value.replace(/^@+/, "");
  return /^[A-Za-z0-9._-]{1,40}$/.test(value) ? value : "";
}

/** Keep only known platforms with valid handles. */
export function normalizeSocials(input: unknown): Socials {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Socials = {};
  for (const p of PLATFORMS) {
    const handle = cleanHandle(raw[p.id]);
    if (handle) out[p.id] = handle;
  }
  return out;
}

export function isLiveNow(startedAt: string | null | undefined): boolean {
  if (!startedAt) return false;
  const started = new Date(startedAt).getTime();
  return Number.isFinite(started) && Date.now() - started < LIVE_MAX_HOURS * 3600_000;
}
