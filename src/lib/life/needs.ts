// Abuja Life — needs, mood, opening hours and life activities.
// Shared by the browser and the server so both agree on the numbers.

import { getLocationById, type GameLocation } from "@/lib/game/locations";

export type NeedId = "hunger" | "hygiene" | "fun" | "social";

export type Needs = Record<NeedId, number>;

export const NEEDS: { id: NeedId; label: string; icon: string; low: string }[] = [
  { id: "hunger", label: "Hunger", icon: "🍲", low: "You're hungry. Grab some food." },
  { id: "hygiene", label: "Hygiene", icon: "🚿", low: "You need a bath. People are noticing." },
  { id: "fun", label: "Fun", icon: "🎉", low: "You're bored. Go and enjoy yourself." },
  { id: "social", label: "Social", icon: "💬", low: "You're lonely. Hang out with people." },
];

export const FULL_NEEDS: Needs = { hunger: 80, hygiene: 80, fun: 70, social: 70 };

/** Points lost per real hour. */
export const DECAY_PER_HOUR: Needs = { hunger: 12, hygiene: 8, fun: 10, social: 7 };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

export function normalizeNeeds(input: unknown): Needs {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out = { ...FULL_NEEDS };
  for (const need of NEEDS) {
    const value = Number(raw[need.id]);
    if (Number.isFinite(value)) out[need.id] = clamp(value);
  }
  return out;
}

/** Needs after time has passed since they were saved. */
export function decayNeeds(needs: Needs, savedAt: string | number | Date | null | undefined, now = Date.now()): Needs {
  const saved = savedAt ? new Date(savedAt).getTime() : now;
  const hours = Number.isFinite(saved) ? Math.max(0, (now - saved) / 3_600_000) : 0;
  const out = { ...needs };
  for (const need of NEEDS) out[need.id] = clamp(needs[need.id] - DECAY_PER_HOUR[need.id] * hours);
  return out;
}

export function addToNeeds(needs: Needs, change: Partial<Needs>): Needs {
  const out = { ...needs };
  for (const need of NEEDS) out[need.id] = clamp(needs[need.id] + (change[need.id] ?? 0));
  return out;
}

/** Overall mood 0–100: the four needs plus energy. */
export function moodScore(needs: Needs, energy: number, maxEnergy = 100): number {
  const energyPct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
  const total = needs.hunger + needs.hygiene + needs.fun + needs.social + Math.max(0, Math.min(100, energyPct));
  return Math.round(total / 5);
}

export function moodInfo(score: number): { label: string; emoji: string; payFactor: number; tone: string } {
  if (score >= 70) return { label: "Feeling great", emoji: "😎", payFactor: 1.05, tone: "text-emerald-300" };
  if (score >= 50) return { label: "Doing okay", emoji: "🙂", payFactor: 1, tone: "text-sky-300" };
  if (score >= 30) return { label: "Stressed", emoji: "😩", payFactor: 0.9, tone: "text-amber-300" };
  return { label: "Struggling", emoji: "🥵", payFactor: 0.75, tone: "text-red-300" };
}

/** What a work shift takes out of you. */
export const SHIFT_NEEDS_COST: Partial<Needs> = { hunger: -15, hygiene: -12, fun: -8, social: 5 };

/** Hustle tasks in a shift: tapping all of them pays a 15% bonus. */
export const SHIFT_TASKS = 4;
export function hustleBonusShare(tasksDone: number): number {
  const done = Math.max(0, Math.min(SHIFT_TASKS, Math.floor(tasksDone)));
  return done >= SHIFT_TASKS ? 0.15 : done * 0.03;
}

// ------------------------------------------------------------------
// Opening hours (Abuja time)
// ------------------------------------------------------------------

type PlaceType = GameLocation["type"];

/** [open hour, close hour]. Close < open means it runs past midnight. */
export const PLACE_HOURS: Record<PlaceType, [number, number] | "24h"> = {
  residential: "24h",
  transport: "24h",
  health: "24h",
  shopping: [9, 21],
  business: [8, 20],
  entertainment: [10, 24],
  food: [7, 23],
  education: [8, 18],
  government: [8, 16],
  nature: [6, 20],
  nightlife: [18, 4],
};

/** Current hour and minute in Abuja (Africa/Lagos). */
export function abujaClock(now = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute };
}

export function isOpenAt(hours: [number, number] | "24h", hour: number): boolean {
  if (hours === "24h") return true;
  const [open, close] = hours;
  return close > open ? hour >= open && hour < close : hour >= open || hour < close;
}

export function formatHour(hour: number): string {
  const h = hour % 24;
  return `${h % 12 || 12}${h >= 12 ? "PM" : "AM"}`;
}

export function hoursLabel(hours: [number, number] | "24h"): string {
  return hours === "24h" ? "Open 24 hours" : `${formatHour(hours[0])} – ${formatHour(hours[1])}`;
}

export function placeStatus(locationId: string, now = new Date()) {
  const location = getLocationById(locationId);
  const hours = location ? PLACE_HOURS[location.type] : "24h";
  const { hour } = abujaClock(now);
  const open = isOpenAt(hours, hour);
  let text = hoursLabel(hours);
  if (hours !== "24h") text = open ? `Open until ${formatHour(hours[1])}` : `Closed · opens ${formatHour(hours[0])}`;
  return { location, hours, open, text };
}

// ------------------------------------------------------------------
// Life activities
// ------------------------------------------------------------------

export interface LifeActivity {
  id: string;
  label: string;
  icon: string;
  /** Short line shown while it runs. */
  doing: string;
  cost: number;
  seconds: number;
  needs: Partial<Needs>;
  energy?: number;
  /** Place types where you can do this. Empty = anywhere. */
  places: PlaceType[];
  /** Extra hours rule on top of the place's own hours. */
  hours?: [number, number];
}

export const LIFE_ACTIVITIES: LifeActivity[] = [
  { id: "suya", label: "Buy suya", icon: "🍢", doing: "Eating hot suya with yaji...", cost: 1500, seconds: 8, needs: { hunger: 30, fun: 5 }, places: ["food", "nightlife", "entertainment", "business", "transport"] },
  { id: "jollof", label: "Jollof & chicken", icon: "🍛", doing: "Eating party jollof at the buka...", cost: 3000, seconds: 12, needs: { hunger: 60 }, places: ["food", "shopping", "business", "education", "government"] },
  { id: "fine-dining", label: "Fine dining", icon: "🍷", doing: "Enjoying a fancy dinner...", cost: 15000, seconds: 15, needs: { hunger: 85, fun: 20, social: 10 }, places: ["nightlife", "entertainment", "residential"] },
  { id: "bath", label: "Bath at home", icon: "🛁", doing: "Bathing and freshening up...", cost: 0, seconds: 10, needs: { hygiene: 100 }, places: ["residential"] },
  { id: "freshen-up", label: "Freshen up", icon: "🧼", doing: "Washing up in the restroom...", cost: 300, seconds: 6, needs: { hygiene: 35 }, places: ["shopping", "business", "transport", "entertainment", "food", "government", "education"] },
  { id: "sleep", label: "Sleep", icon: "🛏️", doing: "Sleeping... zzz", cost: 0, seconds: 20, needs: { hunger: -5 }, energy: 60, places: ["residential"] },
  { id: "power-nap", label: "Power nap", icon: "😴", doing: "Quick nap on a bench...", cost: 0, seconds: 10, needs: { hygiene: -5 }, energy: 15, places: [] },
  { id: "lake-walk", label: "Walk & chill", icon: "🌳", doing: "Enjoying the breeze...", cost: 0, seconds: 10, needs: { fun: 25, social: 5 }, energy: -5, places: ["nature"] },
  { id: "cinema", label: "Watch a movie", icon: "🎬", doing: "Watching the latest Nollywood blockbuster...", cost: 4000, seconds: 15, needs: { fun: 50, social: 10, hunger: -5 }, places: ["entertainment", "shopping"] },
  { id: "football", label: "Play football", icon: "⚽", doing: "Playing 5-a-side with the guys...", cost: 1000, seconds: 15, needs: { fun: 40, social: 30, hygiene: -25 }, energy: -15, places: ["entertainment", "nature", "education"] },
  { id: "club", label: "Hit the club", icon: "🪩", doing: "Turning up at the club...", cost: 10000, seconds: 15, needs: { fun: 70, social: 45, hygiene: -15 }, energy: -15, places: ["nightlife"], hours: [22, 4] },
  { id: "hangout", label: "Hang out", icon: "🗣️", doing: "Gisting with people around...", cost: 0, seconds: 10, needs: { social: 30, fun: 10 }, places: [] },
];

export function getActivity(id: string): LifeActivity | undefined {
  return LIFE_ACTIVITIES.find((a) => a.id === id);
}

/** Why an activity can't be done here right now, or null if it can. */
export function activityBlock(activity: LifeActivity, locationId: string, now = new Date()): string | null {
  const status = placeStatus(locationId, now);
  const type = status.location?.type;
  if (activity.places.length > 0 && (!type || !activity.places.includes(type))) {
    return "Not available here";
  }
  if (!status.open) return status.text;
  if (activity.hours && !isOpenAt(activity.hours, abujaClock(now).hour)) {
    return `Opens ${formatHour(activity.hours[0])}`;
  }
  return null;
}
