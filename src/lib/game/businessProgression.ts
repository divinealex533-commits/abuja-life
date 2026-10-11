import {
  getBusinessFinance,
  getBusinessCustomerCount,
} from "@/lib/game/businessFinance";

export interface BusinessProgression {
  businessId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  reputation: number;
  popularity: number;
  totalCustomers: number;
  totalRevenue: number;
  totalProfit: number;
  successfulDays: number;
  milestones: string[];
  unlockedFeatures: string[];
  lastUpdatedAt: number;
}

export interface BusinessMilestone {
  id: string;
  name: string;
  description: string;
  requirement:
    | "revenue"
    | "customers"
    | "reputation"
    | "level"
    | "profit";
  target: number;
  rewardExperience: number;
  rewardReputation: number;
  rewardPopularity: number;
}

export interface BusinessProgressionResult {
  progression: BusinessProgression;
  levelledUp: boolean;
  previousLevel: number;
  newLevel: number;
  experienceGained: number;
  reputationGained: number;
  popularityGained: number;
  newlyUnlockedMilestones: BusinessMilestone[];
}

const STORAGE_KEY =
  "abujaLifeBusinessProgression";

const MAX_BUSINESS_LEVEL = 100;

const BASE_EXPERIENCE = 1000;

const EXPERIENCE_GROWTH = 1.25;

const MILESTONES: BusinessMilestone[] = [
  {
    id: "first-customer",
    name: "First Customer",
    description:
      "Serve your first customer.",
    requirement: "customers",
    target: 1,
    rewardExperience: 100,
    rewardReputation: 2,
    rewardPopularity: 2,
  },
  {
    id: "ten-customers",
    name: "Getting Noticed",
    description:
      "Serve 10 customers.",
    requirement: "customers",
    target: 10,
    rewardExperience: 250,
    rewardReputation: 4,
    rewardPopularity: 5,
  },
  {
    id: "fifty-customers",
    name: "Local Favourite",
    description:
      "Serve 50 customers.",
    requirement: "customers",
    target: 50,
    rewardExperience: 750,
    rewardReputation: 8,
    rewardPopularity: 10,
  },
  {
    id: "hundred-customers",
    name: "Busy Business",
    description:
      "Serve 100 customers.",
    requirement: "customers",
    target: 100,
    rewardExperience: 1500,
    rewardReputation: 12,
    rewardPopularity: 15,
  },
  {
    id: "five-hundred-customers",
    name: "City Favourite",
    description:
      "Serve 500 customers.",
    requirement: "customers",
    target: 500,
    rewardExperience: 4000,
    rewardReputation: 20,
    rewardPopularity: 25,
  },
  {
    id: "million-revenue",
    name: "Million Naira Business",
    description:
      "Generate ₦1,000,000 in revenue.",
    requirement: "revenue",
    target: 1_000_000,
    rewardExperience: 3000,
    rewardReputation: 15,
    rewardPopularity: 20,
  },
  {
    id: "ten-million-revenue",
    name: "Major Enterprise",
    description:
      "Generate ₦10,000,000 in revenue.",
    requirement: "revenue",
    target: 10_000_000,
    rewardExperience: 7500,
    rewardReputation: 25,
    rewardPopularity: 35,
  },
  {
    id: "hundred-million-revenue",
    name: "Abuja Powerhouse",
    description:
      "Generate ₦100,000,000 in revenue.",
    requirement: "revenue",
    target: 100_000_000,
    rewardExperience: 20_000,
    rewardReputation: 40,
    rewardPopularity: 50,
  },
  {
    id: "first-profit",
    name: "In The Green",
    description:
      "Generate your first positive profit.",
    requirement: "profit",
    target: 1,
    rewardExperience: 500,
    rewardReputation: 5,
    rewardPopularity: 5,
  },
  {
    id: "ten-million-profit",
    name: "Serious Profits",
    description:
      "Generate ₦10,000,000 in total profit.",
    requirement: "profit",
    target: 10_000_000,
    rewardExperience: 10_000,
    rewardReputation: 30,
    rewardPopularity: 35,
  },
  {
    id: "reputation-25",
    name: "Trusted Business",
    description:
      "Reach 25 reputation.",
    requirement: "reputation",
    target: 25,
    rewardExperience: 1000,
    rewardReputation: 5,
    rewardPopularity: 8,
  },
  {
    id: "reputation-50",
    name: "Highly Rated",
    description:
      "Reach 50 reputation.",
    requirement: "reputation",
    target: 50,
    rewardExperience: 2500,
    rewardReputation: 8,
    rewardPopularity: 15,
  },
  {
    id: "reputation-75",
    name: "Abuja Favourite",
    description:
      "Reach 75 reputation.",
    requirement: "reputation",
    target: 75,
    rewardExperience: 5000,
    rewardReputation: 12,
    rewardPopularity: 25,
  },
  {
    id: "level-10",
    name: "Growing Business",
    description:
      "Reach business level 10.",
    requirement: "level",
    target: 10,
    rewardExperience: 3000,
    rewardReputation: 10,
    rewardPopularity: 15,
  },
  {
    id: "level-25",
    name: "Established Business",
    description:
      "Reach business level 25.",
    requirement: "level",
    target: 25,
    rewardExperience: 7500,
    rewardReputation: 20,
    rewardPopularity: 25,
  },
  {
    id: "level-50",
    name: "Major Abuja Brand",
    description:
      "Reach business level 50.",
    requirement: "level",
    target: 50,
    rewardExperience: 15_000,
    rewardReputation: 30,
    rewardPopularity: 40,
  },
];

function loadAllProgression(): Record<
  string,
  BusinessProgression
> {
  if (
    typeof window === "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      BusinessProgression
    >;
  } catch {
    return {};
  }
}

function saveAllProgression(
  data: Record<
    string,
    BusinessProgression
  >
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

function getExperienceRequired(
  level: number
): number {
  return Math.floor(
    BASE_EXPERIENCE *
      Math.pow(
        EXPERIENCE_GROWTH,
        Math.max(0, level - 1)
      )
  );
}

function createDefaultProgression(
  businessId: string
): BusinessProgression {
  return {
    businessId,
    level: 1,
    experience: 0,
    experienceToNextLevel:
      getExperienceRequired(1),
    reputation: 0,
    popularity: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalProfit: 0,
    successfulDays: 0,
    milestones: [],
    unlockedFeatures: [
      "basic_operations",
    ],
    lastUpdatedAt: Date.now(),
  };
}

export function loadBusinessProgression(
  businessId: string
): BusinessProgression {
  const all =
    loadAllProgression();

  const existing =
    all[businessId];

  if (existing) {
    return {
      ...createDefaultProgression(
        businessId
      ),
      ...existing,
      businessId,
    };
  }

  const created =
    createDefaultProgression(
      businessId
    );

  all[businessId] = created;

  saveAllProgression(all);

  return created;
}

export function saveBusinessProgression(
  progression: BusinessProgression
): void {
  const all =
    loadAllProgression();

  all[progression.businessId] =
    {
      ...progression,
      lastUpdatedAt:
        Date.now(),
    };

  saveAllProgression(all);
}

export function getBusinessLevel(
  businessId: string
): number {
  return loadBusinessProgression(
    businessId
  ).level;
}

export function getBusinessExperience(
  businessId: string
): number {
  return loadBusinessProgression(
    businessId
  ).experience;
}

export function getBusinessReputation(
  businessId: string
): number {
  return loadBusinessProgression(
    businessId
  ).reputation;
}

export function getBusinessPopularity(
  businessId: string
): number {
  return loadBusinessProgression(
    businessId
  ).popularity;
}

export function getBusinessExperienceRequired(
  businessId: string
): number {
  return loadBusinessProgression(
    businessId
  ).experienceToNextLevel;
}

export function getBusinessExperiencePercent(
  businessId: string
): number {
  const progression =
    loadBusinessProgression(
      businessId
    );

  if (
    progression.experienceToNextLevel <=
    0
  ) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (progression.experience /
        progression.experienceToNextLevel) *
        100
    )
  );
}

export function addBusinessExperience(
  businessId: string,
  amount: number
): BusinessProgression {
  const progression =
    loadBusinessProgression(
      businessId
    );

  let experience =
    progression.experience +
    Math.max(
      0,
      Math.floor(amount)
    );

  let level =
    progression.level;

  while (
    level <
      MAX_BUSINESS_LEVEL &&
    experience >=
      getExperienceRequired(
        level
      )
  ) {
    experience -=
      getExperienceRequired(
        level
      );

    level += 1;
  }

  progression.level =
    level;

  progression.experience =
    experience;

  progression.experienceToNextLevel =
    level >=
    MAX_BUSINESS_LEVEL
      ? 0
      : getExperienceRequired(
          level
        );

  saveBusinessProgression(
    progression
  );

  return progression;
}

export function addBusinessReputation(
  businessId: string,
  amount: number
): BusinessProgression {
  const progression =
    loadBusinessProgression(
      businessId
    );

  progression.reputation =
    Math.max(
      0,
      Math.min(
        100,
        progression.reputation +
          Math.floor(amount)
      )
    );

  saveBusinessProgression(
    progression
  );

  return progression;
}

export function addBusinessPopularity(
  businessId: string,
  amount: number
): BusinessProgression {
  const progression =
    loadBusinessProgression(
      businessId
    );

  progression.popularity =
    Math.max(
      0,
      Math.min(
        100,
        progression.popularity +
          Math.floor(amount)
      )
    );

  saveBusinessProgression(
    progression
  );

  return progression;
}

function getMilestoneValue(
  progression: BusinessProgression,
  milestone: BusinessMilestone
): number {
  switch (
    milestone.requirement
  ) {
    case "customers":
      return progression.totalCustomers;

    case "revenue":
      return progression.totalRevenue;

    case "profit":
      return progression.totalProfit;

    case "reputation":
      return progression.reputation;

    case "level":
      return progression.level;

    default:
      return 0;
  }
}

function getUnlockedMilestones(
  progression: BusinessProgression
): BusinessMilestone[] {
  return MILESTONES.filter(
    (milestone) =>
      progression.milestones.includes(
        milestone.id
      )
  );
}

export function getBusinessMilestones(): BusinessMilestone[] {
  return [...MILESTONES];
}

export function getBusinessMilestone(
  milestoneId: string
): BusinessMilestone | null {
  return (
    MILESTONES.find(
      (milestone) =>
        milestone.id ===
        milestoneId
    ) ?? null
  );
}

export function processBusinessMilestones(
  businessId: string
): BusinessProgressionResult {
  let progression =
    loadBusinessProgression(
      businessId
    );

  const previousLevel =
    progression.level;

  const previousMilestones =
    new Set(
      progression.milestones
    );

  const newlyUnlocked:
    BusinessMilestone[] = [];

  let experienceGained = 0;
  let reputationGained = 0;
  let popularityGained = 0;

  for (const milestone of MILESTONES) {
    if (
      previousMilestones.has(
        milestone.id
      )
    ) {
      continue;
    }

    const value =
      getMilestoneValue(
        progression,
        milestone
      );

    if (
      value <
      milestone.target
    ) {
      continue;
    }

    progression.milestones.push(
      milestone.id
    );

    experienceGained +=
      milestone.rewardExperience;

    reputationGained +=
      milestone.rewardReputation;

    popularityGained +=
      milestone.rewardPopularity;

    newlyUnlocked.push(
      milestone
    );
  }

  if (
    experienceGained > 0
  ) {
    progression =
      addBusinessExperience(
        businessId,
        experienceGained
      );
  }

  if (
    reputationGained > 0
  ) {
    progression =
      addBusinessReputation(
        businessId,
        reputationGained
      );
  }

  if (
    popularityGained > 0
  ) {
    progression =
      addBusinessPopularity(
        businessId,
        popularityGained
      );
  }

  progression =
    loadBusinessProgression(
      businessId
    );

  saveBusinessProgression(
    progression
  );

  return {
    progression,
    levelledUp:
      progression.level >
      previousLevel,
    previousLevel,
    newLevel:
      progression.level,
    experienceGained,
    reputationGained,
    popularityGained,
    newlyUnlockedMilestones:
      newlyUnlocked,
  };
}

export function syncBusinessFinance(
  businessId: string
): BusinessProgression {
  let progression =
    loadBusinessProgression(
      businessId
    );

  const finance =
    getBusinessFinance(
      businessId
    );

  const customers =
    getBusinessCustomerCount(
      businessId
    );

  const previousRevenue =
    progression.totalRevenue;

  const previousProfit =
    progression.totalProfit;

  const previousCustomers =
    progression.totalCustomers;

  const revenueDifference =
    Math.max(
      0,
      finance.totalRevenue -
        previousRevenue
    );

  const customerDifference =
    Math.max(
      0,
      customers -
        previousCustomers
    );

  const profitDifference =
    finance.totalProfit -
    previousProfit;

  progression.totalRevenue =
    finance.totalRevenue;

  progression.totalProfit =
    finance.totalProfit;

  progression.totalCustomers =
    customers;

  if (
    revenueDifference > 0
  ) {
    const revenueXP =
      Math.floor(
        revenueDifference /
          1000
      );

    progression =
      addBusinessExperience(
        businessId,
        revenueXP
      );
  }

  if (
    customerDifference > 0
  ) {
    progression =
      addBusinessReputation(
        businessId,
        Math.min(
          10,
          customerDifference
        )
      );

    progression =
      addBusinessPopularity(
        businessId,
        Math.min(
          15,
          customerDifference * 2
        )
      );
  }

  if (
    profitDifference > 0
  ) {
    progression =
      addBusinessExperience(
        businessId,
        Math.floor(
          profitDifference /
            5000
        )
      );
  }

  progression =
    loadBusinessProgression(
      businessId
    );

  if (
    finance.totalProfit >
    0 &&
    finance.totalRevenue >
    0
  ) {
    const margin =
      finance.totalProfit /
      finance.totalRevenue;

    if (margin >= 0.25) {
      progression =
        addBusinessReputation(
          businessId,
          1
        );
    }
  }

  progression =
    loadBusinessProgression(
      businessId
    );

  saveBusinessProgression(
    progression
  );

  processBusinessMilestones(
    businessId
  );

  return loadBusinessProgression(
    businessId
  );
}

export function calculateBusinessRating(
  businessId: string
): number {
  const progression =
    loadBusinessProgression(
      businessId
    );

  const reputationScore =
    progression.reputation *
    0.45;

  const popularityScore =
    progression.popularity *
    0.25;

  const levelScore =
    Math.min(
      100,
      progression.level * 2
    ) * 0.15;

  const customerScore =
    Math.min(
      100,
      progression.totalCustomers /
        10
    ) * 0.15;

  return Number(
    Math.min(
      100,
      reputationScore +
        popularityScore +
        levelScore +
        customerScore
    ).toFixed(2)
  );
}

export function getBusinessRatingStars(
  businessId: string
): number {
  const rating =
    calculateBusinessRating(
      businessId
    );

  return Number(
    Math.min(
      5,
      Math.max(
        0,
        rating / 20
      )
    ).toFixed(1)
  );
}

export function getBusinessUnlockedFeatures(
  businessId: string
): string[] {
  const progression =
    loadBusinessProgression(
      businessId
    );

  const features =
    new Set(
      progression.unlockedFeatures
    );

  if (
    progression.level >= 2
  ) {
    features.add(
      "basic_marketing"
    );
  }

  if (
    progression.level >= 5
  ) {
    features.add(
      "business_customization"
    );
  }

  if (
    progression.level >= 10
  ) {
    features.add(
      "premium_services"
    );
  }

  if (
    progression.level >= 15
  ) {
    features.add(
      "staff_management"
    );
  }

  if (
    progression.level >= 20
  ) {
    features.add(
      "advanced_marketing"
    );
  }

  if (
    progression.level >= 30
  ) {
    features.add(
      "second_business_slot"
    );
  }

  if (
    progression.level >= 40
  ) {
    features.add(
      "elite_services"
    );
  }

  if (
    progression.level >= 50
  ) {
    features.add(
      "major_brand_status"
    );
  }

  if (
    progression.level >= 75
  ) {
    features.add(
      "abuja_wide_brand"
    );
  }

  if (
    progression.level >= 100
  ) {
    features.add(
      "city_icon_status"
    );
  }

  const updated =
    Array.from(features);

  progression.unlockedFeatures =
    updated;

  saveBusinessProgression(
    progression
  );

  return updated;
}

export function getBusinessGrowthSummary(
  businessId: string
): {
  level: number;
  reputation: number;
  popularity: number;
  rating: number;
  stars: number;
  customers: number;
  revenue: number;
  profit: number;
  experience: number;
  experienceRequired: number;
  experiencePercent: number;
  milestonesCompleted: number;
  milestonesTotal: number;
  unlockedFeatures: string[];
} {
  const progression =
    loadBusinessProgression(
      businessId
    );

  return {
    level:
      progression.level,
    reputation:
      progression.reputation,
    popularity:
      progression.popularity,
    rating:
      calculateBusinessRating(
        businessId
      ),
    stars:
      getBusinessRatingStars(
        businessId
      ),
    customers:
      progression.totalCustomers,
    revenue:
      progression.totalRevenue,
    profit:
      progression.totalProfit,
    experience:
      progression.experience,
    experienceRequired:
      progression.experienceToNextLevel,
    experiencePercent:
      getBusinessExperiencePercent(
        businessId
      ),
    milestonesCompleted:
      progression.milestones.length,
    milestonesTotal:
      MILESTONES.length,
    unlockedFeatures:
      getBusinessUnlockedFeatures(
        businessId
      ),
  };
}

export function getBusinessMilestoneProgress(
  businessId: string
): Array<
  BusinessMilestone & {
    current: number;
    completed: boolean;
    progressPercent: number;
  }
> {
  const progression =
    loadBusinessProgression(
      businessId
    );

  return MILESTONES.map(
    (milestone) => {
      const current =
        getMilestoneValue(
          progression,
          milestone
        );

      const completed =
        progression.milestones.includes(
          milestone.id
        );

      const progressPercent =
        milestone.target <= 0
          ? 100
          : Math.min(
              100,
              Math.round(
                (current /
                  milestone.target) *
                  100
              )
            );

      return {
        ...milestone,
        current,
        completed,
        progressPercent,
      };
    }
  );
}

export function resetBusinessProgression(
  businessId: string
): void {
  const all =
    loadAllProgression();

  delete all[businessId];

  saveAllProgression(all);
}

export function resetAllBusinessProgression(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}

export function getAllBusinessProgression(): BusinessProgression[] {
  return Object.values(
    loadAllProgression()
  );
}

export function getTopBusinessesByLevel(
  limit = 10
): BusinessProgression[] {
  return getAllBusinessProgression()
    .sort(
      (a, b) =>
        b.level - a.level ||
        b.reputation -
          a.reputation
    )
    .slice(0, limit);
}

export function getTopBusinessesByReputation(
  limit = 10
): BusinessProgression[] {
  return getAllBusinessProgression()
    .sort(
      (a, b) =>
        b.reputation -
        a.reputation ||
        b.popularity -
          a.popularity
    )
    .slice(0, limit);
}