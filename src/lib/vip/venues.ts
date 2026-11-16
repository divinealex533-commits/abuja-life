// Abuja Life — VIP places players can book (hotel suites, VIP rooms…).
//
// These are DEFAULT prices. You change the real price, and whether it
// costs game cash or real Naira, in Admin → Prices. Shared by client
// and server.

import type { VipTier } from "@/lib/vip/catalog";
import type { PerkReward, VipArea } from "@/lib/vip/perks";

export interface VipVenue {
  id: string;
  area: VipArea;
  name: string;
  place: string;
  emoji: string;
  description: string;
  minTier: VipTier;
  defaultMethod: "cash" | "naira";
  /** Game cash (₦ in-game) or real Naira, depending on the method. */
  defaultPrice: number;
  /** What the player gets after booking. */
  reward: PerkReward;
  /** Bookings allowed per day when paying with game cash. */
  usesPerDay: number;
}

export const VIP_VENUES: VipVenue[] = [
  // ---------- Locations ----------
  {
    id: "hotel_vip_room",
    area: "location",
    name: "VIP Hotel Room",
    place: "Maitama Grand Hotel",
    emoji: "🏨",
    description: "A night in a VIP room with room service. Wake up fully rested.",
    minTier: "silver",
    defaultMethod: "cash",
    defaultPrice: 150_000,
    reward: { refillEnergy: true, reputation: 8 },
    usesPerDay: 1,
  },
  {
    id: "hotel_presidential_suite",
    area: "location",
    name: "Presidential Suite",
    place: "Maitama Grand Hotel",
    emoji: "👑",
    description: "The top floor. Butler, city views and the most important guests in Abuja.",
    minTier: "gold",
    defaultMethod: "cash",
    defaultPrice: 450_000,
    reward: { refillEnergy: true, reputation: 30, experience: 5 },
    usesPerDay: 1,
  },
  {
    id: "club_vip_room",
    area: "location",
    name: "Club VIP Room",
    place: "Wuse 2 Nightlife Strip",
    emoji: "🍾",
    description: "Private VIP room, bottle service and the city's celebrities.",
    minTier: "silver",
    defaultMethod: "cash",
    defaultPrice: 100_000,
    reward: { reputation: 18 },
    usesPerDay: 1,
  },

  // ---------- Houses ----------
  {
    id: "penthouse_staycation",
    area: "houses",
    name: "Penthouse Staycation",
    place: "Jabi Lake Towers",
    emoji: "🌆",
    description: "A weekend in a lakeside penthouse with a private chef.",
    minTier: "gold",
    defaultMethod: "cash",
    defaultPrice: 300_000,
    reward: { refillEnergy: true, reputation: 20 },
    usesPerDay: 1,
  },

  // ---------- Dealership ----------
  {
    id: "supercar_rental",
    area: "dealership",
    name: "Supercar Weekend Rental",
    place: "Jabi Auto Row",
    emoji: "🏎️",
    description: "Roll through Abuja in a Lamborghini for the weekend. Everyone will notice.",
    minTier: "gold",
    defaultMethod: "cash",
    defaultPrice: 350_000,
    reward: { reputation: 35 },
    usesPerDay: 1,
  },

  // ---------- Businesses ----------
  {
    id: "boardroom_dinner",
    area: "businesses",
    name: "Private Boardroom Dinner",
    place: "Central Business District Club",
    emoji: "🍽️",
    description: "Dinner with Abuja's top CEOs. Learn their secrets, grow your name.",
    minTier: "gold",
    defaultMethod: "cash",
    defaultPrice: 250_000,
    reward: { reputation: 25, experience: 8 },
    usesPerDay: 1,
  },
  {
    id: "private_jet",
    area: "businesses",
    name: "Private Jet to Lagos",
    place: "Nnamdi Azikiwe Airport — Private Terminal",
    emoji: "🛩️",
    description: "Fly private for a business deal in Lagos. The ultimate status move.",
    minTier: "diamond",
    defaultMethod: "naira",
    defaultPrice: 1_000,
    reward: { refillEnergy: true, reputation: 60, experience: 12 },
    usesPerDay: 1,
  },

  // ---------- Jobs ----------
  {
    id: "executive_course",
    area: "jobs",
    name: "Executive Training Course",
    place: "Abuja Business School",
    emoji: "🎓",
    description: "An intensive course that fast-tracks your career experience.",
    minTier: "silver",
    defaultMethod: "cash",
    defaultPrice: 200_000,
    reward: { experience: 15, reputation: 5 },
    usesPerDay: 1,
  },
];

export function getVenue(venueId: string): VipVenue | undefined {
  return VIP_VENUES.find((venue) => venue.id === venueId);
}

export function getVenuesForArea(area: VipArea): VipVenue[] {
  return VIP_VENUES.filter((venue) => venue.area === area);
}
