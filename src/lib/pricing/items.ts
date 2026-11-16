// Abuja Life — everything that has a price.
//
// Each item has a DEFAULT price here. In Admin → Prices you can change
// the amount, switch between game cash and real Naira, make it free,
// or turn it off. Your changes are saved in the price_settings table
// and always win over these defaults.

import { CAREERS } from "@/lib/game/careers";
import { JOBS } from "@/lib/game/jobs";
import { AD_PLAN_ORDER, AD_PLANS } from "@/lib/business/catalog";
import { COSMETICS } from "@/lib/cosmetics/catalog";
import { STORE_PRODUCTS } from "@/lib/vip/catalog";
import { VIP_VENUES } from "@/lib/vip/venues";

export type PriceMethod = "cash" | "naira" | "free";

export type PriceGroup = "store" | "ad" | "cosmetic" | "venue" | "career" | "job";

export interface PricedItem {
  key: string; // e.g. "venue:hotel_vip_room"
  group: PriceGroup;
  id: string;
  name: string;
  subtitle: string;
  allowedMethods: PriceMethod[];
  defaultMethod: PriceMethod;
  defaultAmount: number;
}

export interface EffectivePrice {
  method: PriceMethod;
  amount: number;
  active: boolean;
}

/** Default licence fees for the advanced careers (game cash). */
const CAREER_DEFAULT_FEES: Record<string, number> = {
  "pos-agent": 5_000,
  "keke-rider": 8_000,
  mechanic: 25_000,
  "real-estate-agent": 30_000,
  nurse: 40_000,
  pharmacist: 50_000,
  "luxury-car-dealer": 250_000,
  surgeon: 800_000,
  diplomat: 700_000,
  "oil-gas-engineer": 2_000_000,
  "startup-founder": 1_500_000,
};

const JOB_DEFAULT_FEES = { easy: 2_000, medium: 10_000, hard: 30_000 } as const;

export const PRICED_ITEMS: PricedItem[] = [
  ...STORE_PRODUCTS.map<PricedItem>((product) => ({
    key: `product:${product.id}`,
    group: "store",
    id: product.id,
    name: product.name,
    subtitle: product.description,
    allowedMethods: ["naira"],
    defaultMethod: "naira",
    defaultAmount: product.priceNaira,
  })),

  ...AD_PLAN_ORDER.map<PricedItem>((planId) => ({
    key: `ad:${planId}`,
    group: "ad",
    id: planId,
    name: `Business ad — ${AD_PLANS[planId].name}`,
    subtitle: `${AD_PLANS[planId].days} days for a real business`,
    allowedMethods: ["naira"],
    defaultMethod: "naira",
    defaultAmount: AD_PLANS[planId].defaultPriceNaira,
  })),

  ...COSMETICS.map<PricedItem>((cosmetic) => ({
    key: `cosmetic:${cosmetic.id}`,
    group: "cosmetic",
    id: cosmetic.id,
    name: cosmetic.name,
    subtitle: "Style shop · looks only",
    allowedMethods: ["naira", "cash", "free"],
    defaultMethod: "naira",
    defaultAmount: cosmetic.defaultPriceNaira,
  })),

  ...VIP_VENUES.map<PricedItem>((venue) => ({
    key: `venue:${venue.id}`,
    group: "venue",
    id: venue.id,
    name: venue.name,
    subtitle: `${venue.place} · ${venue.minTier}+ VIP`,
    allowedMethods: ["cash", "naira", "free"],
    defaultMethod: venue.defaultMethod,
    defaultAmount: venue.defaultPrice,
  })),

  ...CAREERS.map<PricedItem>((career) => ({
    key: `career:${career.id}`,
    group: "career",
    id: career.id,
    name: `${career.name} licence`,
    subtitle: career.vipTier ? `VIP career · ${career.vipTier}+` : "Advanced career",
    allowedMethods: ["cash", "naira", "free"],
    defaultMethod: "cash",
    defaultAmount: CAREER_DEFAULT_FEES[career.id] ?? 20_000,
  })),

  ...JOBS.map<PricedItem>((job) => ({
    key: `job:${job.id}`,
    group: "job",
    id: job.id,
    name: `${job.name} application fee`,
    subtitle: `Classic job · ${job.difficulty}`,
    allowedMethods: ["cash", "naira", "free"],
    defaultMethod: "cash",
    defaultAmount: JOB_DEFAULT_FEES[job.difficulty] ?? 5_000,
  })),
];

export function getPricedItem(key: string): PricedItem | undefined {
  return PRICED_ITEMS.find((item) => item.key === key);
}

export function defaultPrice(item: PricedItem): EffectivePrice {
  return { method: item.defaultMethod, amount: item.defaultAmount, active: true };
}

export const PRICE_GROUP_TITLES: Record<PriceGroup, { title: string; help: string }> = {
  store: {
    title: "VIP store & bundles (real money)",
    help: "What players pay in Naira through Paystack.",
  },
  ad: {
    title: "Business advertising (real money)",
    help: "What real Abuja businesses pay you per 30 days to appear in the game.",
  },
  cosmetic: {
    title: "Style shop",
    help: "Name colours, avatar frames and titles. Looks only.",
  },
  venue: {
    title: "VIP places",
    help: "Hotel rooms, VIP rooms, jets. Charge game cash or real Naira.",
  },
  career: {
    title: "Advanced career licences",
    help: "One-time fee to unlock a career. VIP careers should be expensive.",
  },
  job: {
    title: "Classic job application fees",
    help: "Charged each time a player applies for one of the original jobs.",
  },
};

export function formatPrice(price: EffectivePrice): string {
  if (price.method === "free") return "Free";
  const amount = `₦${Math.round(price.amount).toLocaleString("en-NG")}`;
  return price.method === "naira" ? `${amount} (real money)` : `${amount} game cash`;
}
