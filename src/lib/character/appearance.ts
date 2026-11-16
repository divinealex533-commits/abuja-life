// Abuja Life — character appearance options. Safe for client and server.

export const SKIN_TONES = ["#3b2416", "#5a3a22", "#7a4a2a", "#8d5524", "#a86b3c", "#c68642", "#e0ac69"] as const;

export const HAIR_STYLES = [
  { id: "lowcut", label: "Low cut" },
  { id: "waves", label: "360 waves" },
  { id: "afro", label: "Afro" },
  { id: "braids", label: "Braids" },
  { id: "dreads", label: "Dreads" },
  { id: "bun", label: "Bun" },
  { id: "long", label: "Long" },
  { id: "bald", label: "Bald" },
] as const;

export const HAIR_COLORS = ["#141414", "#2e1a10", "#5a3218", "#8a5a2b", "#c9a14a", "#6d1a36", "#9a9a9a"] as const;

export const OUTFITS = [
  { id: "tshirt", label: "T-shirt & jeans" },
  { id: "hoodie", label: "Hoodie" },
  { id: "suit", label: "Corporate suit" },
  { id: "agbada", label: "Agbada" },
  { id: "kaftan", label: "Kaftan" },
  { id: "ankara", label: "Ankara dress" },
] as const;

export const OUTFIT_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#111827", "#f8fafc", "#ec4899"] as const;

export const EYES = [
  { id: "round", label: "Round" },
  { id: "happy", label: "Happy" },
  { id: "sharp", label: "Sharp" },
] as const;

export const MOUTHS = [
  { id: "smile", label: "Smile" },
  { id: "grin", label: "Big grin" },
  { id: "calm", label: "Calm" },
] as const;

export const FACIAL_HAIR = [
  { id: "none", label: "None" },
  { id: "beard", label: "Full beard" },
  { id: "goatee", label: "Goatee" },
  { id: "moustache", label: "Moustache" },
] as const;

export const ACCESSORIES = [
  { id: "none", label: "None" },
  { id: "glasses", label: "Glasses" },
  { id: "shades", label: "Shades" },
  { id: "cap", label: "Cap" },
  { id: "gele", label: "Gele" },
  { id: "chain", label: "Gold chain" },
  { id: "earrings", label: "Earrings" },
] as const;

export interface Appearance {
  skin: string;
  hair: (typeof HAIR_STYLES)[number]["id"];
  hairColor: string;
  outfit: (typeof OUTFITS)[number]["id"];
  outfitColor: string;
  eyes: (typeof EYES)[number]["id"];
  mouth: (typeof MOUTHS)[number]["id"];
  facialHair: (typeof FACIAL_HAIR)[number]["id"];
  accessory: (typeof ACCESSORIES)[number]["id"];
}

export const DEFAULT_APPEARANCE: Appearance = {
  skin: SKIN_TONES[3],
  hair: "lowcut",
  hairColor: HAIR_COLORS[0],
  outfit: "tshirt",
  outfitColor: OUTFIT_COLORS[0],
  eyes: "round",
  mouth: "smile",
  facialHair: "none",
  accessory: "none",
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Turn anything (saved JSON, request body) into a valid appearance. */
export function normalizeAppearance(input: unknown): Appearance {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return {
    skin: pick(raw.skin, SKIN_TONES, DEFAULT_APPEARANCE.skin),
    hair: pick(raw.hair, HAIR_STYLES.map((h) => h.id), DEFAULT_APPEARANCE.hair),
    hairColor: pick(raw.hairColor, HAIR_COLORS, DEFAULT_APPEARANCE.hairColor),
    outfit: pick(raw.outfit, OUTFITS.map((o) => o.id), DEFAULT_APPEARANCE.outfit),
    outfitColor: pick(raw.outfitColor, OUTFIT_COLORS, DEFAULT_APPEARANCE.outfitColor),
    eyes: pick(raw.eyes, EYES.map((e) => e.id), DEFAULT_APPEARANCE.eyes),
    mouth: pick(raw.mouth, MOUTHS.map((m) => m.id), DEFAULT_APPEARANCE.mouth),
    facialHair: pick(raw.facialHair, FACIAL_HAIR.map((f) => f.id), DEFAULT_APPEARANCE.facialHair),
    accessory: pick(raw.accessory, ACCESSORIES.map((a) => a.id), DEFAULT_APPEARANCE.accessory),
  };
}

/** Random look, for the "Surprise me" button. */
export function randomAppearance(): Appearance {
  const r = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];
  return {
    skin: r(SKIN_TONES),
    hair: r(HAIR_STYLES).id,
    hairColor: r(HAIR_COLORS),
    outfit: r(OUTFITS).id,
    outfitColor: r(OUTFIT_COLORS),
    eyes: r(EYES).id,
    mouth: r(MOUTHS).id,
    facialHair: r(FACIAL_HAIR).id,
    accessory: r(ACCESSORIES).id,
  };
}

/** Slightly darker version of a hex colour (shadows, trousers). */
export function shade(hex: string, amount = -30): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amount);
  const g = clamp(((n >> 8) & 0xff) + amount);
  const b = clamp((n & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
