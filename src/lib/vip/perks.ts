// Abuja Life — VIP perks shown in VIP sections around the city.
// Rewards are applied on the server (/api/vip/perks), with daily
// limits stored in vip_perk_claims. Shared by client and server.

import { VIP_TIERS, type VipTier } from "@/lib/vip/catalog";

export type VipArea =
  | "hub"
  | "jobs"
  | "location"
  | "houses"
  | "dealership"
  | "businesses";

export interface PerkReward {
  cash?: number;
  energy?: number;
  reputation?: number;
  experience?: number;
  refillEnergy?: boolean;
}

export interface VipPerk {
  id: string;
  area: VipArea;
  name: string;
  emoji: string;
  description: string;
  minTier: VipTier;
  /** How many times per day (Abuja time) this tier can use it. */
  usesPerDay: (tier: VipTier) => number;
  reward: (tier: VipTier) => PerkReward;
}

const scale: Record<VipTier, number> = { silver: 1, gold: 1.6, diamond: 2.5 };

export const VIP_PERKS: VipPerk[] = [
  // ---------- Game hub ----------
  {
    id: "daily_stipend",
    area: "hub",
    name: "Daily VIP Stipend",
    emoji: "💸",
    description: "Collect your daily VIP allowance in game cash.",
    minTier: "silver",
    usesPerDay: () => 1,
    reward: (tier) => ({ cash: VIP_TIERS[tier].dailyStipend }),
  },
  {
    id: "energy_refill",
    area: "hub",
    name: "Full Energy Refill",
    emoji: "⚡",
    description: "Instantly refill your energy to max.",
    minTier: "silver",
    usesPerDay: (tier) => VIP_TIERS[tier].energyRefillsPerDay,
    reward: () => ({ refillEnergy: true }),
  },

  // ---------- Jobs ----------
  {
    id: "career_coach",
    area: "jobs",
    name: "Private Career Coach",
    emoji: "🎓",
    description: "One-on-one session that boosts your job experience.",
    minTier: "silver",
    usesPerDay: () => 1,
    reward: (tier) => ({ experience: Math.round(3 * scale[tier]) }),
  },
  {
    id: "headhunter",
    area: "jobs",
    name: "Executive Headhunter",
    emoji: "🕴️",
    description: "Top recruiters talk you up around Abuja. Big reputation boost.",
    minTier: "gold",
    usesPerDay: () => 1,
    reward: (tier) => ({ reputation: Math.round(12 * scale[tier]) }),
  },

  // ---------- Locations ----------
  {
    id: "skyline_lounge",
    area: "location",
    name: "Maitama Skyline Lounge",
    emoji: "🍸",
    description: "Relax in the rooftop VIP lounge. Restores energy and gets you noticed.",
    minTier: "silver",
    usesPerDay: () => 1,
    reward: (tier) => ({
      energy: Math.round(35 * scale[tier]),
      reputation: Math.round(4 * scale[tier]),
    }),
  },
  {
    id: "jabi_yacht",
    area: "location",
    name: "Jabi Lake Private Yacht",
    emoji: "🛥️",
    description: "Private evening cruise with Abuja's movers and shakers.",
    minTier: "gold",
    usesPerDay: () => 1,
    reward: (tier) => ({
      reputation: Math.round(10 * scale[tier]),
      cash: Math.round(3_000 * scale[tier]),
    }),
  },

  // ---------- Houses ----------
  {
    id: "rental_income",
    area: "houses",
    name: "VIP Rental Income",
    emoji: "🏘️",
    description: "Your VIP property manager collects rent from your tenants daily.",
    minTier: "gold",
    usesPerDay: () => 1,
    reward: (tier) => ({ cash: Math.round(6_000 * scale[tier]) }),
  },
  {
    id: "home_spa",
    area: "houses",
    name: "In-Home Spa Session",
    emoji: "🧖",
    description: "A masseuse comes to your house. Big energy restore.",
    minTier: "silver",
    usesPerDay: () => 1,
    reward: (tier) => ({ energy: Math.round(30 * scale[tier]) }),
  },

  // ---------- Dealership ----------
  {
    id: "dealer_cashback",
    area: "dealership",
    name: "Dealer Loyalty Cashback",
    emoji: "🚘",
    description: "VIP customers get daily loyalty cashback from the dealership.",
    minTier: "silver",
    usesPerDay: () => 1,
    reward: (tier) => ({ cash: Math.round(2_500 * scale[tier]) }),
  },
  {
    id: "track_day",
    area: "dealership",
    name: "Supercar Track Day",
    emoji: "🏁",
    description: "Drive the newest supercars on the private track. Huge reputation.",
    minTier: "diamond",
    usesPerDay: () => 1,
    reward: () => ({ reputation: 30, experience: 4 }),
  },

  // ---------- Businesses ----------
  {
    id: "investor_meetup",
    area: "businesses",
    name: "Investor Network Meetup",
    emoji: "🤝",
    description: "Pitch to Abuja investors at the Central Business District club.",
    minTier: "gold",
    usesPerDay: () => 1,
    reward: (tier) => ({
      cash: Math.round(7_500 * scale[tier]),
      reputation: Math.round(8 * scale[tier]),
    }),
  },
  {
    id: "board_dividend",
    area: "businesses",
    name: "Board Seat Dividend",
    emoji: "📈",
    description: "Your seat on a company board pays a daily dividend.",
    minTier: "diamond",
    usesPerDay: () => 1,
    reward: () => ({ cash: 15_000 }),
  },
];

export function getPerk(perkId: string): VipPerk | undefined {
  return VIP_PERKS.find((perk) => perk.id === perkId);
}

export function getPerksForArea(area: VipArea): VipPerk[] {
  return VIP_PERKS.filter((perk) => perk.area === area);
}

export function describeReward(reward: PerkReward): string {
  const parts: string[] = [];
  if (reward.cash) parts.push(`₦${reward.cash.toLocaleString("en-NG")}`);
  if (reward.refillEnergy) parts.push("Full energy");
  if (reward.energy) parts.push(`+${reward.energy} energy`);
  if (reward.reputation) parts.push(`+${reward.reputation} reputation`);
  if (reward.experience) parts.push(`+${reward.experience} XP`);
  return parts.join(" · ");
}

export const VIP_AREA_TITLES: Record<VipArea, { title: string; subtitle: string }> = {
  hub: {
    title: "VIP Club",
    subtitle: "Your daily VIP benefits. Claim them every day.",
  },
  jobs: {
    title: "VIP Career Suite",
    subtitle: "Coaching, headhunters and exclusive high-paying careers.",
  },
  location: {
    title: "VIP Lounges",
    subtitle: "Private spaces only VIP members can enter.",
  },
  houses: {
    title: "VIP Estates",
    subtitle: "Property perks for VIP homeowners.",
  },
  dealership: {
    title: "VIP Showroom",
    subtitle: "Cashback and private track days.",
  },
  businesses: {
    title: "VIP Business Club",
    subtitle: "Investor networks and boardroom dividends.",
  },
};
