import {
  getBusinessFinance,
} from "@/lib/game/businessFinance";

import {
  getBusinessLevel,
  getBusinessReputation,
  loadBusinessProgression,
} from "@/lib/game/businessProgression";

export type BusinessUpgradeCategory =
  | "premises"
  | "staff"
  | "equipment"
  | "service"
  | "marketing"
  | "security"
  | "delivery"
  | "luxury";

export interface BusinessUpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: BusinessUpgradeCategory;
  levelRequired: number;
  cost: number;
  maxLevel: number;
  revenueMultiplierPerLevel: number;
  customerMultiplierPerLevel: number;
  reputationPerLevel: number;
  popularityPerLevel: number;
  capacityPerLevel: number;
  energyReductionPerLevel: number;
  icon: string;
}

export interface OwnedBusinessUpgrade {
  businessId: string;
  upgradeId: string;
  level: number;
  totalSpent: number;
  purchasedAt: number;
  updatedAt: number;
}

export interface BusinessUpgradeResult {
  success: boolean;
  upgrade: OwnedBusinessUpgrade | null;
  cost: number;
  message: string;
}

const STORAGE_KEY =
  "abujaLifeBusinessUpgrades";

const UPGRADE_DEFINITIONS:
  BusinessUpgradeDefinition[] = [
    {
      id: "premises",
      name: "Better Premises",
      description:
        "Improve the size, appearance and functionality of your business location.",
      category: "premises",
      levelRequired: 1,
      cost: 150_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.04,
      customerMultiplierPerLevel: 0.05,
      reputationPerLevel: 1,
      popularityPerLevel: 1,
      capacityPerLevel: 5,
      energyReductionPerLevel: 0,
      icon: "🏪",
    },
    {
      id: "staff",
      name: "Staff Capacity",
      description:
        "Hire and train more staff so your business can serve more customers.",
      category: "staff",
      levelRequired: 2,
      cost: 200_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.05,
      customerMultiplierPerLevel: 0.08,
      reputationPerLevel: 1,
      popularityPerLevel: 1,
      capacityPerLevel: 10,
      energyReductionPerLevel: 1,
      icon: "👥",
    },
    {
      id: "equipment",
      name: "Professional Equipment",
      description:
        "Upgrade your equipment to improve service quality and earning potential.",
      category: "equipment",
      levelRequired: 3,
      cost: 300_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.08,
      customerMultiplierPerLevel: 0.03,
      reputationPerLevel: 2,
      popularityPerLevel: 1,
      capacityPerLevel: 5,
      energyReductionPerLevel: 1,
      icon: "🛠️",
    },
    {
      id: "service",
      name: "Customer Experience",
      description:
        "Improve service quality and make customers more likely to return.",
      category: "service",
      levelRequired: 4,
      cost: 250_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.06,
      customerMultiplierPerLevel: 0.1,
      reputationPerLevel: 3,
      popularityPerLevel: 2,
      capacityPerLevel: 5,
      energyReductionPerLevel: 0,
      icon: "⭐",
    },
    {
      id: "marketing",
      name: "Marketing Campaign",
      description:
        "Advertise your business across Abuja and attract more customers.",
      category: "marketing",
      levelRequired: 5,
      cost: 350_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.1,
      customerMultiplierPerLevel: 0.15,
      reputationPerLevel: 1,
      popularityPerLevel: 5,
      capacityPerLevel: 10,
      energyReductionPerLevel: 0,
      icon: "📣",
    },
    {
      id: "security",
      name: "Advanced Security",
      description:
        "Protect your premises, equipment and customers.",
      category: "security",
      levelRequired: 6,
      cost: 450_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.03,
      customerMultiplierPerLevel: 0.04,
      reputationPerLevel: 2,
      popularityPerLevel: 1,
      capacityPerLevel: 5,
      energyReductionPerLevel: 0,
      icon: "🔐",
    },
    {
      id: "delivery",
      name: "Delivery Network",
      description:
        "Expand your business with faster delivery and logistics.",
      category: "delivery",
      levelRequired: 7,
      cost: 500_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.09,
      customerMultiplierPerLevel: 0.1,
      reputationPerLevel: 1,
      popularityPerLevel: 3,
      capacityPerLevel: 15,
      energyReductionPerLevel: 1,
      icon: "🚚",
    },
    {
      id: "luxury",
      name: "Luxury Upgrade",
      description:
        "Turn your business into a premium destination for high-value customers.",
      category: "luxury",
      levelRequired: 10,
      cost: 1_000_000,
      maxLevel: 10,
      revenueMultiplierPerLevel: 0.15,
      customerMultiplierPerLevel: 0.06,
      reputationPerLevel: 4,
      popularityPerLevel: 4,
      capacityPerLevel: 5,
      energyReductionPerLevel: 0,
      icon: "💎",
    },
  ];

function loadAllUpgrades(): Record<
  string,
  OwnedBusinessUpgrade[]
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
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      OwnedBusinessUpgrade[]
    >;
  } catch {
    return {};
  }
}

function saveAllUpgrades(
  upgrades: Record<
    string,
    OwnedBusinessUpgrade[]
  >
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(upgrades)
  );
}

export function getBusinessUpgradeDefinitions(): BusinessUpgradeDefinition[] {
  return [...UPGRADE_DEFINITIONS];
}

export function getBusinessUpgrade(
  upgradeId: string
): BusinessUpgradeDefinition | null {
  return (
    UPGRADE_DEFINITIONS.find(
      (upgrade) =>
        upgrade.id === upgradeId
    ) ?? null
  );
}

export function getBusinessUpgradesByCategory(
  category: BusinessUpgradeCategory
): BusinessUpgradeDefinition[] {
  return UPGRADE_DEFINITIONS.filter(
    (upgrade) =>
      upgrade.category === category
  );
}

export function getBusinessUpgradeCategories(): BusinessUpgradeCategory[] {
  return [
    "premises",
    "staff",
    "equipment",
    "service",
    "marketing",
    "security",
    "delivery",
    "luxury",
  ];
}

export function getOwnedBusinessUpgrades(
  businessId: string
): OwnedBusinessUpgrade[] {
  const all =
    loadAllUpgrades();

  return all[businessId]
    ? [...all[businessId]]
    : [];
}

export function getOwnedBusinessUpgrade(
  businessId: string,
  upgradeId: string
): OwnedBusinessUpgrade | null {
  return (
    getOwnedBusinessUpgrades(
      businessId
    ).find(
      (upgrade) =>
        upgrade.upgradeId ===
        upgradeId
    ) ?? null
  );
}

export function getBusinessUpgradeLevel(
  businessId: string,
  upgradeId: string
): number {
  return (
    getOwnedBusinessUpgrade(
      businessId,
      upgradeId
    )?.level ?? 0
  );
}

export function getBusinessUpgradeCost(
  businessId: string,
  upgradeId: string
): number {
  const definition =
    getBusinessUpgrade(
      upgradeId
    );

  if (!definition) {
    return 0;
  }

  const currentLevel =
    getBusinessUpgradeLevel(
      businessId,
      upgradeId
    );

  return Math.floor(
    definition.cost *
      Math.pow(
        1.45,
        currentLevel
      )
  );
}

export function canPurchaseBusinessUpgrade(
  businessId: string,
  upgradeId: string
): {
  allowed: boolean;
  reason: string;
  cost: number;
} {
  const definition =
    getBusinessUpgrade(
      upgradeId
    );

  if (!definition) {
    return {
      allowed: false,
      reason:
        "This upgrade does not exist.",
      cost: 0,
    };
  }

  const progression =
    loadBusinessProgression(
      businessId
    );

  const currentLevel =
    getBusinessUpgradeLevel(
      businessId,
      upgradeId
    );

  const cost =
    getBusinessUpgradeCost(
      businessId,
      upgradeId
    );

  if (
    currentLevel >=
    definition.maxLevel
  ) {
    return {
      allowed: false,
      reason:
        "This upgrade is already at maximum level.",
      cost,
    };
  }

  if (
    progression.level <
    definition.levelRequired
  ) {
    return {
      allowed: false,
      reason:
        `Business level ${definition.levelRequired} is required.`,
      cost,
    };
  }

  if (
    getBusinessReputation(
      businessId
    ) <
    Math.max(
      0,
      definition.levelRequired -
        1
    )
  ) {
    return {
      allowed: false,
      reason:
        "Your business reputation is too low for this upgrade.",
      cost,
    };
  }

  const finance =
    getBusinessFinance(
      businessId
    );

  if (
    finance.totalProfit <
    cost
  ) {
    return {
      allowed: false,
      reason:
        "Your business has not generated enough profit for this upgrade.",
      cost,
    };
  }

  return {
    allowed: true,
    reason:
      "Upgrade available.",
    cost,
  };
}

export function purchaseBusinessUpgrade(
  businessId: string,
  upgradeId: string
): BusinessUpgradeResult {
  const check =
    canPurchaseBusinessUpgrade(
      businessId,
      upgradeId
    );

  if (!check.allowed) {
    return {
      success: false,
      upgrade: null,
      cost: check.cost,
      message: check.reason,
    };
  }

  const definition =
    getBusinessUpgrade(
      upgradeId
    );

  if (!definition) {
    return {
      success: false,
      upgrade: null,
      cost: 0,
      message:
        "Upgrade not found.",
    };
  }

  const all =
    loadAllUpgrades();

  const businessUpgrades =
    all[businessId]
      ? [...all[businessId]]
      : [];

  const existingIndex =
    businessUpgrades.findIndex(
      (upgrade) =>
        upgrade.upgradeId ===
        upgradeId
    );

  const currentLevel =
    existingIndex >= 0
      ? businessUpgrades[
          existingIndex
        ].level
      : 0;

  const now =
    Date.now();

  const upgraded: OwnedBusinessUpgrade =
    {
      businessId,
      upgradeId,
      level:
        currentLevel + 1,
      totalSpent:
        (existingIndex >= 0
          ? businessUpgrades[
              existingIndex
            ].totalSpent
          : 0) +
        check.cost,
      purchasedAt:
        existingIndex >= 0
          ? businessUpgrades[
              existingIndex
            ].purchasedAt
          : now,
      updatedAt: now,
    };

  if (existingIndex >= 0) {
    businessUpgrades[
      existingIndex
    ] = upgraded;
  } else {
    businessUpgrades.push(
      upgraded
    );
  }

  all[businessId] =
    businessUpgrades;

  saveAllUpgrades(all);

  return {
    success: true,
    upgrade: upgraded,
    cost: check.cost,
    message:
      `${definition.name} upgraded to level ${upgraded.level}.`,
  };
}

export function calculateBusinessRevenueMultiplier(
  businessId: string
): number {
  let multiplier = 1;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    multiplier +=
      definition.revenueMultiplierPerLevel *
      owned.level;
  }

  return Number(
    multiplier.toFixed(3)
  );
}

export function calculateBusinessCustomerMultiplier(
  businessId: string
): number {
  let multiplier = 1;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    multiplier +=
      definition.customerMultiplierPerLevel *
      owned.level;
  }

  return Number(
    multiplier.toFixed(3)
  );
}

export function calculateBusinessCapacity(
  businessId: string
): number {
  let capacity = 10;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    capacity +=
      definition.capacityPerLevel *
      owned.level;
  }

  return capacity;
}

export function calculateBusinessEnergyReduction(
  businessId: string
): number {
  let reduction = 0;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    reduction +=
      definition.energyReductionPerLevel *
      owned.level;
  }

  return reduction;
}

export function calculateBusinessUpgradeReputation(
  businessId: string
): number {
  let reputation = 0;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    reputation +=
      definition.reputationPerLevel *
      owned.level;
  }

  return reputation;
}

export function calculateBusinessUpgradePopularity(
  businessId: string
): number {
  let popularity = 0;

  for (const owned of getOwnedBusinessUpgrades(
    businessId
  )) {
    const definition =
      getBusinessUpgrade(
        owned.upgradeId
      );

    if (!definition) {
      continue;
    }

    popularity +=
      definition.popularityPerLevel *
      owned.level;
  }

  return popularity;
}

export function getBusinessUpgradeSummary(
  businessId: string
): {
  upgradeCount: number;
  totalUpgradeLevels: number;
  totalSpent: number;
  revenueMultiplier: number;
  customerMultiplier: number;
  capacity: number;
  energyReduction: number;
  reputationBonus: number;
  popularityBonus: number;
} {
  const upgrades =
    getOwnedBusinessUpgrades(
      businessId
    );

  return {
    upgradeCount:
      upgrades.length,

    totalUpgradeLevels:
      upgrades.reduce(
        (total, upgrade) =>
          total + upgrade.level,
        0
      ),

    totalSpent:
      upgrades.reduce(
        (total, upgrade) =>
          total +
          upgrade.totalSpent,
        0
      ),

    revenueMultiplier:
      calculateBusinessRevenueMultiplier(
        businessId
      ),

    customerMultiplier:
      calculateBusinessCustomerMultiplier(
        businessId
      ),

    capacity:
      calculateBusinessCapacity(
        businessId
      ),

    energyReduction:
      calculateBusinessEnergyReduction(
        businessId
      ),

    reputationBonus:
      calculateBusinessUpgradeReputation(
        businessId
      ),

    popularityBonus:
      calculateBusinessUpgradePopularity(
        businessId
      ),
  };
}

export function getAvailableBusinessUpgrades(
  businessId: string
): BusinessUpgradeDefinition[] {
  const level =
    getBusinessLevel(
      businessId
    );

  return UPGRADE_DEFINITIONS.filter(
    (upgrade) =>
      level >=
      upgrade.levelRequired
  );
}

export function getLockedBusinessUpgrades(
  businessId: string
): BusinessUpgradeDefinition[] {
  const level =
    getBusinessLevel(
      businessId
    );

  return UPGRADE_DEFINITIONS.filter(
    (upgrade) =>
      level <
      upgrade.levelRequired
  );
}

export function getMaxedBusinessUpgrades(
  businessId: string
): BusinessUpgradeDefinition[] {
  return UPGRADE_DEFINITIONS.filter(
    (upgrade) =>
      getBusinessUpgradeLevel(
        businessId,
        upgrade.id
      ) >=
      upgrade.maxLevel
  );
}

export function getBusinessUpgradeProgress(
  businessId: string
): Array<
  BusinessUpgradeDefinition & {
    currentLevel: number;
    nextCost: number;
    maxed: boolean;
    available: boolean;
  }
> {
  const level =
    getBusinessLevel(
      businessId
    );

  return UPGRADE_DEFINITIONS.map(
    (upgrade) => {
      const currentLevel =
        getBusinessUpgradeLevel(
          businessId,
          upgrade.id
        );

      return {
        ...upgrade,
        currentLevel,
        nextCost:
          getBusinessUpgradeCost(
            businessId,
            upgrade.id
          ),
        maxed:
          currentLevel >=
          upgrade.maxLevel,
        available:
          level >=
          upgrade.levelRequired,
      };
    }
  );
}

export function resetBusinessUpgrades(
  businessId: string
): void {
  const all =
    loadAllUpgrades();

  delete all[businessId];

  saveAllUpgrades(all);
}

export function resetAllBusinessUpgrades(): void {
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