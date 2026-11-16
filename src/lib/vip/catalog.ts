// Abuja Life — VIP & Store Catalog
//
// The ONE place where real-money prices live.
// The server reads prices from here; the browser only sends a
// product ID, so nobody can change what they pay.
//
// Safe to import from both client and server code.

export type VipTier = "silver" | "gold" | "diamond";

export const VIP_TIER_RANK: Record<VipTier, number> = {
  silver: 1,
  gold: 2,
  diamond: 3,
};

export interface VipTierInfo {
  id: VipTier;
  name: string;
  emoji: string;
  color: string; // tailwind text color
  border: string; // tailwind border color
  gradient: string; // tailwind gradient classes
  /** Extra pay on every server-paid career shift (0.25 = +25%). */
  jobPayBonus: number;
  /** Multiplier for weekend rewards. */
  weekendMultiplier: number;
  /** In-game cash from the VIP Lounge stipend, once per day. */
  dailyStipend: number;
  /** Free full-energy refills per day. */
  energyRefillsPerDay: number;
  perks: string[];
}

export const VIP_TIERS: Record<VipTier, VipTierInfo> = {
  silver: {
    id: "silver",
    name: "VIP Silver",
    emoji: "🥈",
    color: "text-slate-200",
    border: "border-slate-300/30",
    gradient: "from-slate-400/20 via-slate-500/10 to-transparent",
    jobPayBonus: 0.25,
    weekendMultiplier: 2,
    dailyStipend: 2_000,
    energyRefillsPerDay: 1,
    perks: [
      "+25% pay on career shifts",
      "2× weekend rewards",
      "₦2,000 daily VIP stipend",
      "1 free energy refill per day",
      "Silver VIP jobs unlocked",
      "VIP badge in chat",
    ],
  },
  gold: {
    id: "gold",
    name: "VIP Gold",
    emoji: "🥇",
    color: "text-amber-300",
    border: "border-amber-400/30",
    gradient: "from-amber-400/20 via-yellow-500/10 to-transparent",
    jobPayBonus: 0.5,
    weekendMultiplier: 3,
    dailyStipend: 5_000,
    energyRefillsPerDay: 2,
    perks: [
      "+50% pay on career shifts",
      "3× weekend rewards",
      "₦5,000 daily VIP stipend",
      "2 free energy refills per day",
      "Gold VIP jobs unlocked (Surgeon, Diplomat)",
      "All VIP lounges and districts",
      "Gold badge in chat",
    ],
  },
  diamond: {
    id: "diamond",
    name: "VIP Diamond",
    emoji: "💎",
    color: "text-cyan-300",
    border: "border-cyan-400/30",
    gradient: "from-cyan-400/20 via-violet-500/10 to-transparent",
    jobPayBonus: 1.0,
    weekendMultiplier: 5,
    dailyStipend: 12_000,
    energyRefillsPerDay: 3,
    perks: [
      "Double pay on career shifts",
      "5× weekend rewards",
      "₦12,000 daily VIP stipend",
      "3 free energy refills per day",
      "Every VIP job (Oil & Gas, Startup Founder)",
      "All VIP lounges, districts and listings",
      "Diamond badge and name glow",
    ],
  },
};

export type ProductKind = "vip" | "bundle";

export interface StoreProduct {
  id: string;
  kind: ProductKind;
  name: string;
  description: string;
  /** Real money, in Naira. */
  priceNaira: number;
  vipTier?: VipTier;
  vipDays?: number;
  /** In-game cash credited after payment. */
  bonusCash?: number;
  /** Can only be bought once per account. */
  oncePerAccount?: boolean;
  highlight?: string;
  /** Maps to the existing payment_transactions.purpose values. */
  purpose: "vip" | "wallet";
}

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "vip_silver_week",
    kind: "vip",
    name: "Silver — 7 days",
    description: "Try VIP for a week.",
    priceNaira: 300,
    vipTier: "silver",
    vipDays: 7,
    purpose: "vip",
  },
  {
    id: "vip_silver_month",
    kind: "vip",
    name: "Silver — 30 days",
    description: "Steady boost for everyday players.",
    priceNaira: 1_000,
    vipTier: "silver",
    vipDays: 30,
    purpose: "vip",
  },
  {
    id: "vip_gold_month",
    kind: "vip",
    name: "Gold — 30 days",
    description: "Most popular. Unlocks the big VIP careers.",
    priceNaira: 2_500,
    vipTier: "gold",
    vipDays: 30,
    highlight: "MOST POPULAR",
    purpose: "vip",
  },
  {
    id: "vip_diamond_month",
    kind: "vip",
    name: "Diamond — 30 days",
    description: "Everything in Abuja Life, maxed out.",
    priceNaira: 5_000,
    vipTier: "diamond",
    vipDays: 30,
    highlight: "BEST VALUE",
    purpose: "vip",
  },
  {
    id: "starter_pack",
    kind: "bundle",
    name: "New in Abuja Starter Pack",
    description: "₦50,000 game cash + 3 days of VIP Silver. One per account.",
    priceNaira: 500,
    vipTier: "silver",
    vipDays: 3,
    bonusCash: 50_000,
    oncePerAccount: true,
    highlight: "ONE TIME",
    purpose: "wallet",
  },
  {
    id: "cash_bundle_small",
    kind: "bundle",
    name: "₦100,000 Game Cash",
    description: "Instant in-game cash for houses, cars and businesses.",
    priceNaira: 700,
    bonusCash: 100_000,
    purpose: "wallet",
  },
  {
    id: "cash_bundle_large",
    kind: "bundle",
    name: "₦500,000 Game Cash",
    description: "Big money move. 30% more cash per naira.",
    priceNaira: 2_700,
    bonusCash: 500_000,
    purpose: "wallet",
  },
];

export function getProduct(productId: string): StoreProduct | undefined {
  return STORE_PRODUCTS.find((product) => product.id === productId);
}

export function tierAtLeast(
  current: VipTier | null | undefined,
  required: VipTier
): boolean {
  if (!current) return false;
  return VIP_TIER_RANK[current] >= VIP_TIER_RANK[required];
}

export function higherTier(a: VipTier | null, b: VipTier): VipTier {
  if (!a) return b;
  return VIP_TIER_RANK[a] >= VIP_TIER_RANK[b] ? a : b;
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
