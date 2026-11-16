// Abuja Life — Advanced Careers registry.

import { STANDARD_CAREERS } from "./standard";
import { VIP_CAREERS } from "./vip";
import type { Career } from "./types";

export const CAREERS: Career[] = [...STANDARD_CAREERS, ...VIP_CAREERS];

export function getCareer(careerId: string): Career | undefined {
  return CAREERS.find((career) => career.id === careerId);
}

export function isCareerId(jobId: string | null | undefined): boolean {
  return Boolean(jobId && getCareer(jobId));
}

/** Tailwind classes per accent (kept literal so Tailwind keeps them). */
export const ACCENT_CLASSES: Record<
  Career["accent"],
  { text: string; bg: string; border: string; button: string; glow: string }
> = {
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    button: "bg-emerald-400 hover:bg-emerald-300 text-black",
    glow: "from-emerald-500/15",
  },
  sky: {
    text: "text-sky-300",
    bg: "bg-sky-400/10",
    border: "border-sky-400/25",
    button: "bg-sky-400 hover:bg-sky-300 text-black",
    glow: "from-sky-500/15",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/25",
    button: "bg-amber-400 hover:bg-amber-300 text-black",
    glow: "from-amber-500/15",
  },
  rose: {
    text: "text-rose-300",
    bg: "bg-rose-400/10",
    border: "border-rose-400/25",
    button: "bg-rose-400 hover:bg-rose-300 text-black",
    glow: "from-rose-500/15",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-400/10",
    border: "border-violet-400/25",
    button: "bg-violet-400 hover:bg-violet-300 text-black",
    glow: "from-violet-500/15",
  },
  cyan: {
    text: "text-cyan-300",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/25",
    button: "bg-cyan-400 hover:bg-cyan-300 text-black",
    glow: "from-cyan-500/15",
  },
  orange: {
    text: "text-orange-300",
    bg: "bg-orange-400/10",
    border: "border-orange-400/25",
    button: "bg-orange-400 hover:bg-orange-300 text-black",
    glow: "from-orange-500/15",
  },
  lime: {
    text: "text-lime-300",
    bg: "bg-lime-400/10",
    border: "border-lime-400/25",
    button: "bg-lime-400 hover:bg-lime-300 text-black",
    glow: "from-lime-500/15",
  },
};
