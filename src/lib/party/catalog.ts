// Abuja Life — party themes, dances and spray notes. Safe for client and server.

export const PARTY_COST = 5000;
export const PARTY_HOURS = 2;

export const PARTY_THEMES = [
  { id: "owambe", label: "Owambe", icon: "🎊", colors: ["#f59e0b", "#ec4899", "#8b5cf6"], blurb: "Aso-ebi, jollof and plenty spraying." },
  { id: "club", label: "Club night", icon: "🪩", colors: ["#06b6d4", "#a855f7", "#f43f5e"], blurb: "Lights down, volume up." },
  { id: "birthday", label: "Birthday", icon: "🎂", colors: ["#f472b6", "#facc15", "#34d399"], blurb: "Celebrate the celebrant!" },
  { id: "pool", label: "Pool party", icon: "🏖️", colors: ["#38bdf8", "#22d3ee", "#fde047"], blurb: "Sun, splash and small chops." },
  { id: "wedding", label: "Wedding", icon: "💍", colors: ["#fbbf24", "#f8fafc", "#10b981"], blurb: "Spray the couple, dance the dollar dance." },
] as const;

export type PartyThemeId = (typeof PARTY_THEMES)[number]["id"];

export function getTheme(id: string) {
  return PARTY_THEMES.find((t) => t.id === id) ?? PARTY_THEMES[0];
}

export const DANCES = [
  { id: "shaku", label: "Shaku Shaku", icon: "🕺" },
  { id: "zanku", label: "Zanku", icon: "🦵" },
  { id: "gwara", label: "Gwara Gwara", icon: "💃" },
  { id: "azonto", label: "Azonto", icon: "🙌" },
  { id: "buga", label: "Buga", icon: "😎" },
  { id: "chill", label: "Just vibing", icon: "🎶" },
] as const;

export type DanceId = (typeof DANCES)[number]["id"];

/** Naira notes you can spray. */
export const NOTES = [
  { value: 200, color: "#7dd3a8", ink: "#065f46" },
  { value: 500, color: "#a5b4fc", ink: "#312e81" },
  { value: 1000, color: "#fca5a5", ink: "#7f1d1d" },
] as const;

/** Most a single spray request can move (taps are batched). */
export const MAX_SPRAY_PER_REQUEST = 100_000;
/** Spray requests allowed per player per minute. */
export const SPRAYS_PER_MINUTE = 30;
