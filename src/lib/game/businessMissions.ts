"use client";

export type BusinessMissionCategory =
  | "event"
  | "interior"
  | "food"
  | "fashion"
  | "beauty"
  | "automotive"
  | "hospitality"
  | "media"
  | "technology"
  | "logistics"
  | "real_estate"
  | "entertainment";

export type BusinessMissionDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "elite";

export interface BusinessMission {
  id: string;
  businessId: string;
  title: string;
  category: BusinessMissionCategory;
  description: string;
  client: string;
  location: string;
  reward: number;
  reputationGain: number;
  experienceGain: number;
  energyCost: number;
  estimatedMinutes: number;
  difficulty: BusinessMissionDifficulty;
  requiredBusinessLevel: number;
  tags: string[];
}

export const BUSINESS_MISSIONS: BusinessMission[] = [
  // ─────────────────────────────────────────────────────────────
  // EVENT PLANNER
  // ─────────────────────────────────────────────────────────────
  {
    id: "event-birthday-planning",
    businessId: "event-planner",
    title: "Luxury Birthday Celebration",
    category: "event",
    description:
      "Plan and coordinate a luxury birthday celebration for a high-profile client.",
    client: "Private Client",
    location: "Maitama",
    reward: 85000,
    reputationGain: 12,
    experienceGain: 80,
    energyCost: 20,
    estimatedMinutes: 12,
    difficulty: "medium",
    requiredBusinessLevel: 1,
    tags: ["birthday", "luxury", "planning"],
  },
  {
    id: "event-wedding-planning",
    businessId: "event-planner",
    title: "Wedding Coordination",
    category: "event",
    description:
      "Coordinate venue setup, vendors, guests and the wedding schedule.",
    client: "Wedding Client",
    location: "Asokoro",
    reward: 180000,
    reputationGain: 25,
    experienceGain: 150,
    energyCost: 30,
    estimatedMinutes: 20,
    difficulty: "hard",
    requiredBusinessLevel: 3,
    tags: ["wedding", "coordination", "premium"],
  },
  {
    id: "event-corporate-launch",
    businessId: "event-planner",
    title: "Corporate Product Launch",
    category: "event",
    description:
      "Organize a professional product launch for a growing Abuja company.",
    client: "Corporate Client",
    location: "CBD",
    reward: 250000,
    reputationGain: 30,
    experienceGain: 200,
    energyCost: 35,
    estimatedMinutes: 25,
    difficulty: "elite",
    requiredBusinessLevel: 5,
    tags: ["corporate", "launch", "business"],
  },

  // ─────────────────────────────────────────────────────────────
  // INTERIOR DECORATOR
  // ─────────────────────────────────────────────────────────────
  {
    id: "interior-starter-room",
    businessId: "interior-decorator",
    title: "Starter Room Makeover",
    category: "interior",
    description:
      "Transform a basic starter room into a comfortable modern living space.",
    client: "New Resident",
    location: "Garki",
    reward: 45000,
    reputationGain: 8,
    experienceGain: 50,
    energyCost: 15,
    estimatedMinutes: 10,
    difficulty: "easy",
    requiredBusinessLevel: 1,
    tags: ["home", "decor", "starter"],
  },
  {
    id: "interior-apartment-makeover",
    businessId: "interior-decorator",
    title: "Luxury Apartment Makeover",
    category: "interior",
    description:
      "Design a premium apartment with furniture, lighting and modern décor.",
    client: "Apartment Owner",
    location: "Wuse 2",
    reward: 125000,
    reputationGain: 18,
    experienceGain: 110,
    energyCost: 25,
    estimatedMinutes: 18,
    difficulty: "medium",
    requiredBusinessLevel: 2,
    tags: ["apartment", "luxury", "furniture"],
  },
  {
    id: "interior-penthouse-design",
    businessId: "interior-decorator",
    title: "Penthouse Interior Project",
    category: "interior",
    description:
      "Create a high-end interior concept for an Abuja penthouse.",
    client: "Luxury Property Owner",
    location: "Maitama",
    reward: 300000,
    reputationGain: 35,
    experienceGain: 240,
    energyCost: 40,
    estimatedMinutes: 30,
    difficulty: "elite",
    requiredBusinessLevel: 6,
    tags: ["penthouse", "luxury", "elite"],
  },

  // ─────────────────────────────────────────────────────────────
  // RESTAURANT / FOOD
  // ─────────────────────────────────────────────────────────────
  {
    id: "restaurant-private-dinner",
    businessId: "restaurant",
    title: "Private Dinner Service",
    category: "food",
    description:
      "Prepare and serve a premium private dinner for a small group.",
    client: "Private Client",
    location: "Maitama",
    reward: 65000,
    reputationGain: 8,
    experienceGain: 55,
    energyCost: 15,
    estimatedMinutes: 10,
    difficulty: "easy",
    requiredBusinessLevel: 1,
    tags: ["food", "dinner", "private"],
  },
  {
    id: "restaurant-corporate-catering",
    businessId: "restaurant",
    title: "Corporate Catering Contract",
    category: "food",
    description:
      "Handle catering for a large corporate meeting.",
    client: "Corporate Client",
    location: "CBD",
    reward: 150000,
    reputationGain: 20,
    experienceGain: 120,
    energyCost: 25,
    estimatedMinutes: 18,
    difficulty: "hard",
    requiredBusinessLevel: 3,
    tags: ["catering", "corporate", "food"],
  },

  // ─────────────────────────────────────────────────────────────
  // FASHION
  // ─────────────────────────────────────────────────────────────
  {
    id: "fashion-custom-outfit",
    businessId: "fashion-designer",
    title: "Custom Outfit",
    category: "fashion",
    description:
      "Create a custom outfit for a player attending a major Abuja event.",
    client: "Player Client",
    location: "Wuse",
    reward: 55000,
    reputationGain: 8,
    experienceGain: 50,
    energyCost: 12,
    estimatedMinutes: 10,
    difficulty: "easy",
    requiredBusinessLevel: 1,
    tags: ["fashion", "clothing", "custom"],
  },

  // ─────────────────────────────────────────────────────────────
  // BEAUTY
  // ─────────────────────────────────────────────────────────────
  {
    id: "beauty-vip-session",
    businessId: "beauty-studio",
    title: "VIP Beauty Session",
    category: "beauty",
    description:
      "Provide a premium beauty and styling session for a VIP client.",
    client: "VIP Client",
    location: "Wuse 2",
    reward: 70000,
    reputationGain: 10,
    experienceGain: 65,
    energyCost: 15,
    estimatedMinutes: 10,
    difficulty: "medium",
    requiredBusinessLevel: 2,
    tags: ["beauty", "vip", "styling"],
  },

  // ─────────────────────────────────────────────────────────────
  // AUTOMOTIVE
  // ─────────────────────────────────────────────────────────────
  {
    id: "car-detailing-luxury",
    businessId: "car-detailing",
    title: "Luxury Car Detailing",
    category: "automotive",
    description:
      "Restore and detail a luxury vehicle for a demanding customer.",
    client: "Luxury Car Owner",
    location: "Jabi",
    reward: 60000,
    reputationGain: 9,
    experienceGain: 60,
    energyCost: 14,
    estimatedMinutes: 10,
    difficulty: "medium",
    requiredBusinessLevel: 1,
    tags: ["cars", "detailing", "luxury"],
  },

  // ─────────────────────────────────────────────────────────────
  // HOSPITALITY
  // ─────────────────────────────────────────────────────────────
  {
    id: "hotel-vip-booking",
    businessId: "hotel",
    title: "VIP Hotel Booking",
    category: "hospitality",
    description:
      "Prepare a premium hotel stay for a VIP visitor.",
    client: "VIP Guest",
    location: "Maitama",
    reward: 95000,
    reputationGain: 12,
    experienceGain: 80,
    energyCost: 12,
    estimatedMinutes: 8,
    difficulty: "medium",
    requiredBusinessLevel: 2,
    tags: ["hotel", "vip", "hospitality"],
  },

  // ─────────────────────────────────────────────────────────────
  // MEDIA
  // ─────────────────────────────────────────────────────────────
  {
    id: "media-event-coverage",
    businessId: "media-studio",
    title: "Event Photography",
    category: "media",
    description:
      "Photograph and deliver coverage from a major Abuja event.",
    client: "Event Organizer",
    location: "Jabi",
    reward: 90000,
    reputationGain: 14,
    experienceGain: 90,
    energyCost: 18,
    estimatedMinutes: 15,
    difficulty: "medium",
    requiredBusinessLevel: 2,
    tags: ["photography", "event", "media"],
  },

  // ─────────────────────────────────────────────────────────────
  // TECHNOLOGY
  // ─────────────────────────────────────────────────────────────
  {
    id: "tech-business-website",
    businessId: "tech-agency",
    title: "Business Website Contract",
    category: "technology",
    description:
      "Build a professional website for a growing Abuja business.",
    client: "Business Owner",
    location: "Wuse",
    reward: 180000,
    reputationGain: 20,
    experienceGain: 140,
    energyCost: 25,
    estimatedMinutes: 20,
    difficulty: "hard",
    requiredBusinessLevel: 3,
    tags: ["technology", "website", "business"],
  },

  // ─────────────────────────────────────────────────────────────
  // LOGISTICS
  // ─────────────────────────────────────────────────────────────
  {
    id: "logistics-multi-delivery",
    businessId: "logistics-company",
    title: "Multi-Stop Delivery Contract",
    category: "logistics",
    description:
      "Complete a multi-stop delivery contract across Abuja.",
    client: "Business Client",
    location: "Garki",
    reward: 80000,
    reputationGain: 10,
    experienceGain: 70,
    energyCost: 20,
    estimatedMinutes: 15,
    difficulty: "medium",
    requiredBusinessLevel: 1,
    tags: ["delivery", "logistics", "transport"],
  },

  // ─────────────────────────────────────────────────────────────
  // REAL ESTATE
  // ─────────────────────────────────────────────────────────────
  {
    id: "real-estate-property-sale",
    businessId: "real-estate-agency",
    title: "Property Sale Contract",
    category: "real_estate",
    description:
      "Help a client find and close a deal on a premium Abuja property.",
    client: "Property Investor",
    location: "Asokoro",
    reward: 220000,
    reputationGain: 25,
    experienceGain: 180,
    energyCost: 25,
    estimatedMinutes: 20,
    difficulty: "hard",
    requiredBusinessLevel: 4,
    tags: ["property", "sales", "investment"],
  },

  // ─────────────────────────────────────────────────────────────
  // ENTERTAINMENT
  // ─────────────────────────────────────────────────────────────
  {
    id: "entertainment-game-night",
    businessId: "gaming-lounge",
    title: "Gaming Night",
    category: "entertainment",
    description:
      "Host a competitive gaming night and keep customers entertained.",
    client: "Player Community",
    location: "Jabi",
    reward: 75000,
    reputationGain: 11,
    experienceGain: 75,
    energyCost: 18,
    estimatedMinutes: 12,
    difficulty: "medium",
    requiredBusinessLevel: 1,
    tags: ["gaming", "competition", "entertainment"],
  },
];

export function getBusinessMissionById(
  missionId: string
): BusinessMission | undefined {
  return BUSINESS_MISSIONS.find((mission) => mission.id === missionId);
}

export function getBusinessMissionsByBusiness(
  businessId: string
): BusinessMission[] {
  return BUSINESS_MISSIONS.filter(
    (mission) => mission.businessId === businessId
  );
}

export function getBusinessMissionsByCategory(
  category: BusinessMissionCategory
): BusinessMission[] {
  return BUSINESS_MISSIONS.filter(
    (mission) => mission.category === category
  );
}

export function getAvailableBusinessMissions(
  businessId: string,
  businessLevel: number
): BusinessMission[] {
  return BUSINESS_MISSIONS.filter(
    (mission) =>
      mission.businessId === businessId &&
      businessLevel >= mission.requiredBusinessLevel
  );
}

export function calculateBusinessMissionReward(
  mission: BusinessMission,
  businessLevel: number,
  reputation: number
): number {
  const levelBonus = Math.max(0, businessLevel - 1) * 0.04;
  const reputationBonus = Math.min(reputation / 10000, 0.2);

  const multiplier = 1 + levelBonus + reputationBonus;

  return Math.round(mission.reward * multiplier);
}

export function calculateBusinessMissionExperience(
  mission: BusinessMission,
  businessLevel: number
): number {
  const levelBonus = Math.max(0, businessLevel - 1) * 0.05;

  return Math.round(mission.experienceGain * (1 + levelBonus));
}

export function searchBusinessMissions(
  query: string
): BusinessMission[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return BUSINESS_MISSIONS;
  }

  return BUSINESS_MISSIONS.filter((mission) =>
    [
      mission.title,
      mission.description,
      mission.businessId,
      mission.client,
      mission.location,
      mission.category,
      ...mission.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}