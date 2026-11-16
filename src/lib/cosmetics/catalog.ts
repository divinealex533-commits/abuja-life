// Abuja Life — Style shop: name colours, avatar frames and titles.
// Looks only — no gameplay advantage. Prices are DEFAULTS
// (change in Admin → Prices). Safe for client and server.

export type CosmeticKind = "name_style" | "avatar_frame" | "title";

export interface Cosmetic {
  id: string;
  kind: CosmeticKind;
  name: string;
  defaultPriceNaira: number;
  /** Tailwind classes (kept literal so Tailwind keeps them). */
  className?: string;
  /** Text shown for titles. */
  label?: string;
}

export const COSMETICS: Cosmetic[] = [
  // ---------- Name colours ----------
  { id: "name_gold", kind: "name_style", name: "Gold Name", defaultPriceNaira: 300, className: "text-amber-300 font-black" },
  { id: "name_emerald", kind: "name_style", name: "Naija Green Name", defaultPriceNaira: 300, className: "text-emerald-300 font-black" },
  { id: "name_rose", kind: "name_style", name: "Rose Name", defaultPriceNaira: 300, className: "text-rose-300 font-black" },
  { id: "name_diamond", kind: "name_style", name: "Diamond Name", defaultPriceNaira: 400, className: "text-cyan-300 font-black drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]" },
  { id: "name_royal", kind: "name_style", name: "Royal Purple Name", defaultPriceNaira: 400, className: "text-violet-300 font-black drop-shadow-[0_0_6px_rgba(167,139,250,0.7)]" },
  { id: "name_rainbow", kind: "name_style", name: "Rainbow Name", defaultPriceNaira: 500, className: "bg-gradient-to-r from-amber-300 via-rose-400 to-cyan-300 bg-clip-text font-black text-transparent" },

  // ---------- Avatar frames ----------
  { id: "frame_gold", kind: "avatar_frame", name: "Gold Frame", defaultPriceNaira: 500, className: "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]" },
  { id: "frame_naija", kind: "avatar_frame", name: "Naija Frame", defaultPriceNaira: 400, className: "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white/80" },
  { id: "frame_fire", kind: "avatar_frame", name: "Fire Frame", defaultPriceNaira: 500, className: "ring-2 ring-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.75)]" },
  { id: "frame_diamond", kind: "avatar_frame", name: "Diamond Frame", defaultPriceNaira: 500, className: "ring-2 ring-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)]" },

  // ---------- Titles ----------
  { id: "title_odogwu", kind: "title", name: "Title: Odogwu", defaultPriceNaira: 200, label: "Odogwu" },
  { id: "title_big_boy", kind: "title", name: "Title: Big Boy", defaultPriceNaira: 200, label: "Big Boy" },
  { id: "title_baddie", kind: "title", name: "Title: Abuja Baddie", defaultPriceNaira: 200, label: "Abuja Baddie" },
  { id: "title_chairman", kind: "title", name: "Title: Chairman", defaultPriceNaira: 250, label: "Chairman" },
  { id: "title_oga", kind: "title", name: "Title: Oga at the Top", defaultPriceNaira: 300, label: "Oga at the Top" },
  { id: "title_soft_life", kind: "title", name: "Title: Soft Life", defaultPriceNaira: 200, label: "Soft Life" },
  { id: "title_agba_baller", kind: "title", name: "Title: Agba Baller", defaultPriceNaira: 300, label: "Agba Baller" },
];

export function getCosmetic(id: string | null | undefined): Cosmetic | undefined {
  if (!id) return undefined;
  return COSMETICS.find((c) => c.id === id);
}

export const COSMETIC_KIND_TITLES: Record<CosmeticKind, string> = {
  name_style: "Name colours",
  avatar_frame: "Avatar frames",
  title: "Titles",
};
