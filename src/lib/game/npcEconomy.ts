import { NPC } from "@/lib/game/npcs";

export type NPCWealthLevel =
  | "poor"
  | "lower_middle"
  | "middle"
  | "upper_middle"
  | "wealthy"
  | "elite";

export type NPCExpenseCategory =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "social"
  | "business"
  | "housing"
  | "education"
  | "health"
  | "miscellaneous";

export type NPCIncomeSource =
  | "job"
  | "business"
  | "investment"
  | "family"
  | "tourism"
  | "freelance"
  | "other";

export interface NPCEconomyProfile {
  npcId: string;
  balance: number;
  wealthLevel: NPCWealthLevel;
  dailyIncome: number;
  dailyExpenses: number;
  lifetimeIncome: number;
  lifetimeExpenses: number;
  incomeSource: NPCIncomeSource;
  spendingMultiplier: number;
  savingsRate: number;
  lastIncomeAt: number | null;
  lastExpenseAt: number | null;
}

export interface NPCIncomeTransaction {
  npcId: string;
  amount: number;
  source: NPCIncomeSource;
  description: string;
  createdAt: number;
}

export interface NPCExpenseTransaction {
  npcId: string;
  amount: number;
  category: NPCExpenseCategory;
  description: string;
  locationId: string;
  createdAt: number;
}

export interface NPCEconomyResult {
  profile: NPCEconomyProfile;
  transaction:
    | NPCIncomeTransaction
    | NPCExpenseTransaction
    | null;
  success: boolean;
  message: string;
}

const DEFAULT_NPC_BALANCE = 25_000;

const BASE_DAILY_INCOME: Record<
  NPCIncomeSource,
  number
> = {
  job: 12_000,
  business: 25_000,
  investment: 18_000,
  family: 8_000,
  tourism: 10_000,
  freelance: 15_000,
  other: 7_000,
};

const EXPENSE_RANGES: Record<
  NPCExpenseCategory,
  [number, number]
> = {
  food: [800, 6_000],
  transport: [300, 4_500],
  shopping: [1_000, 25_000],
  entertainment: [1_000, 15_000],
  social: [500, 8_000],
  business: [2_000, 50_000],
  housing: [3_000, 80_000],
  education: [1_000, 30_000],
  health: [1_000, 35_000],
  miscellaneous: [500, 10_000],
};

const economyProfiles =
  new Map<string, NPCEconomyProfile>();

const incomeHistory: NPCIncomeTransaction[] =
  [];

const expenseHistory: NPCExpenseTransaction[] =
  [];

function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(
    minimum,
    Math.min(maximum, value)
  );
}

function randomBetween(
  minimum: number,
  maximum: number
): number {
  return Math.floor(
    minimum +
      Math.random() *
        (maximum - minimum + 1)
  );
}

function getWealthLevel(
  balance: number
): NPCWealthLevel {
  if (balance < 10_000) {
    return "poor";
  }

  if (balance < 50_000) {
    return "lower_middle";
  }

  if (balance < 250_000) {
    return "middle";
  }

  if (balance < 1_000_000) {
    return "upper_middle";
  }

  if (balance < 10_000_000) {
    return "wealthy";
  }

  return "elite";
}

function getRoleIncomeSource(
  npc: NPC
): NPCIncomeSource {
  switch (npc.role) {
    case "business_owner":
      return "business";

    case "tourist":
      return "tourism";

    case "vendor":
      return "business";

    case "driver":
    case "worker":
      return "job";

    case "student":
      return "family";

    default:
      return "job";
  }
}

function getNPCSpendingMultiplier(
  npc: NPC
): number {
  if (
    npc.tags.some(
      (tag) =>
        tag.toLowerCase() ===
        "luxury"
    )
  ) {
    return 1.5;
  }

  if (
    npc.personality
      .toLowerCase()
      .includes("ambitious")
  ) {
    return 1.25;
  }

  if (
    npc.personality
      .toLowerCase()
      .includes("careful")
  ) {
    return 0.75;
  }

  if (
    npc.personality
      .toLowerCase()
      .includes("social")
  ) {
    return 1.2;
  }

  return 1;
}

function getSavingsRate(
  npc: NPC
): number {
  if (
    npc.personality
      .toLowerCase()
      .includes("careful")
  ) {
    return 0.35;
  }

  if (
    npc.personality
      .toLowerCase()
      .includes("ambitious")
  ) {
    return 0.25;
  }

  if (
    npc.personality
      .toLowerCase()
      .includes("social")
  ) {
    return 0.1;
  }

  return 0.2;
}

/**
 * Create or retrieve an NPC's economic profile.
 */
export function getNPCEconomyProfile(
  npc: NPC
): NPCEconomyProfile {
  const existing =
    economyProfiles.get(npc.id);

  if (existing) {
    return existing;
  }

  const incomeSource =
    getRoleIncomeSource(npc);

  const profile: NPCEconomyProfile = {
    npcId: npc.id,
    balance: DEFAULT_NPC_BALANCE,
    wealthLevel:
      getWealthLevel(
        DEFAULT_NPC_BALANCE
      ),
    dailyIncome:
      BASE_DAILY_INCOME[
        incomeSource
      ],
    dailyExpenses: 0,
    lifetimeIncome: 0,
    lifetimeExpenses: 0,
    incomeSource,
    spendingMultiplier:
      getNPCSpendingMultiplier(npc),
    savingsRate:
      getSavingsRate(npc),
    lastIncomeAt: null,
    lastExpenseAt: null,
  };

  economyProfiles.set(
    npc.id,
    profile
  );

  return profile;
}

/**
 * Save an NPC economy profile.
 */
export function saveNPCEconomyProfile(
  profile: NPCEconomyProfile
): NPCEconomyProfile {
  const updated: NPCEconomyProfile = {
    ...profile,
    wealthLevel:
      getWealthLevel(
        profile.balance
      ),
  };

  economyProfiles.set(
    profile.npcId,
    updated
  );

  return updated;
}

/**
 * Give an NPC income.
 */
export function addNPCIncome(
  npc: NPC,
  amount: number,
  source: NPCIncomeSource,
  description: string
): NPCEconomyResult {
  const profile =
    getNPCEconomyProfile(npc);

  const safeAmount = Math.max(
    0,
    Math.floor(amount)
  );

  if (safeAmount <= 0) {
    return {
      profile,
      transaction: null,
      success: false,
      message:
        "Income amount must be greater than zero.",
    };
  }

  const now = Date.now();

  const transaction: NPCIncomeTransaction =
    {
      npcId: npc.id,
      amount: safeAmount,
      source,
      description,
      createdAt: now,
    };

  const updated =
    saveNPCEconomyProfile({
      ...profile,
      balance:
        profile.balance +
        safeAmount,
      lifetimeIncome:
        profile.lifetimeIncome +
        safeAmount,
      lastIncomeAt: now,
    });

  incomeHistory.push(
    transaction
  );

  return {
    profile: updated,
    transaction,
    success: true,
    message: `${npc.name} earned ₦${safeAmount.toLocaleString()}.`,
  };
}

/**
 * Check whether an NPC can afford an expense.
 */
export function canNPCSpend(
  npc: NPC,
  amount: number
): boolean {
  const profile =
    getNPCEconomyProfile(npc);

  return (
    amount > 0 &&
    profile.balance >= amount
  );
}

/**
 * Spend NPC money.
 */
export function spendNPCMoney(
  npc: NPC,
  amount: number,
  category: NPCExpenseCategory,
  locationId: string,
  description: string
): NPCEconomyResult {
  const profile =
    getNPCEconomyProfile(npc);

  const safeAmount = Math.max(
    0,
    Math.floor(amount)
  );

  if (safeAmount <= 0) {
    return {
      profile,
      transaction: null,
      success: false,
      message:
        "Expense amount must be greater than zero.",
    };
  }

  if (
    profile.balance <
    safeAmount
  ) {
    return {
      profile,
      transaction: null,
      success: false,
      message:
        `${npc.name} cannot afford this expense.`,
    };
  }

  const now = Date.now();

  const transaction: NPCExpenseTransaction =
    {
      npcId: npc.id,
      amount: safeAmount,
      category,
      description,
      locationId,
      createdAt: now,
    };

  const updated =
    saveNPCEconomyProfile({
      ...profile,
      balance:
        profile.balance -
        safeAmount,
      dailyExpenses:
        profile.dailyExpenses +
        safeAmount,
      lifetimeExpenses:
        profile.lifetimeExpenses +
        safeAmount,
      lastExpenseAt: now,
    });

  expenseHistory.push(
    transaction
  );

  return {
    profile: updated,
    transaction,
    success: true,
    message: `${npc.name} spent ₦${safeAmount.toLocaleString()}.`,
  };
}

/**
 * Generate a normal expense based on the NPC's
 * wealth, personality and selected category.
 */
export function generateNPCExpense(
  npc: NPC,
  category: NPCExpenseCategory,
  locationId: string,
  description?: string
): NPCEconomyResult {
  const profile =
    getNPCEconomyProfile(npc);

  const range =
    EXPENSE_RANGES[category];

  const baseAmount =
    randomBetween(
      range[0],
      range[1]
    );

  const amount = Math.max(
    100,
    Math.floor(
      baseAmount *
        profile.spendingMultiplier
    )
  );

  return spendNPCMoney(
    npc,
    amount,
    category,
    locationId,
    description ??
      `NPC ${category} expense`
  );
}

/**
 * Generate income for an NPC based on role.
 */
export function generateNPCDailyIncome(
  npc: NPC
): NPCEconomyResult {
  const profile =
    getNPCEconomyProfile(npc);

  const base =
    BASE_DAILY_INCOME[
      profile.incomeSource
    ];

  const variation =
    randomBetween(
      Math.floor(base * 0.75),
      Math.floor(base * 1.25)
    );

  return addNPCIncome(
    npc,
    variation,
    profile.incomeSource,
    "Daily NPC income"
  );
}

/**
 * Calculate a recommended daily spending budget.
 */
export function getNPCDailyBudget(
  npc: NPC
): number {
  const profile =
    getNPCEconomyProfile(npc);

  const disposable =
    profile.dailyIncome *
    (1 - profile.savingsRate);

  return Math.max(
    0,
    Math.floor(disposable)
  );
}

/**
 * Get an NPC's current wealth level.
 */
export function getNPCWealthLevel(
  npc: NPC
): NPCWealthLevel {
  return getNPCEconomyProfile(
    npc
  ).wealthLevel;
}

/**
 * Get an NPC's current balance.
 */
export function getNPCBalance(
  npc: NPC
): number {
  return getNPCEconomyProfile(
    npc
  ).balance;
}

/**
 * Get the NPC's total lifetime income.
 */
export function getNPCLifetimeIncome(
  npc: NPC
): number {
  return getNPCEconomyProfile(
    npc
  ).lifetimeIncome;
}

/**
 * Get the NPC's total lifetime expenses.
 */
export function getNPCLifetimeExpenses(
  npc: NPC
): number {
  return getNPCEconomyProfile(
    npc
  ).lifetimeExpenses;
}

/**
 * Get the NPC's estimated disposable income.
 */
export function getNPCDisposableIncome(
  npc: NPC
): number {
  const profile =
    getNPCEconomyProfile(npc);

  return Math.max(
    0,
    Math.floor(
      profile.balance *
        (1 - profile.savingsRate)
    )
  );
}

/**
 * Get all NPC economy profiles.
 */
export function getAllNPCEconomyProfiles(): NPCEconomyProfile[] {
  return Array.from(
    economyProfiles.values()
  );
}

/**
 * Get the richest NPC profiles.
 */
export function getRichestNPCs(
  limit = 10
): NPCEconomyProfile[] {
  return [
    ...economyProfiles.values(),
  ]
    .sort(
      (a, b) =>
        b.balance -
        a.balance
    )
    .slice(0, limit);
}

/**
 * Get NPCs grouped by wealth level.
 */
export function getNPCWealthDistribution(): Record<
  NPCWealthLevel,
  number
> {
  const distribution: Record<
    NPCWealthLevel,
    number
  > = {
    poor: 0,
    lower_middle: 0,
    middle: 0,
    upper_middle: 0,
    wealthy: 0,
    elite: 0,
  };

  for (const profile of economyProfiles.values()) {
    distribution[
      profile.wealthLevel
    ] += 1;
  }

  return distribution;
}

/**
 * Get total NPC money currently circulating.
 */
export function getTotalNPCMoney(): number {
  let total = 0;

  for (const profile of economyProfiles.values()) {
    total += profile.balance;
  }

  return total;
}

/**
 * Get total NPC income generated.
 */
export function getTotalNPCIncome(): number {
  return incomeHistory.reduce(
    (total, transaction) =>
      total + transaction.amount,
    0
  );
}

/**
 * Get total NPC spending.
 */
export function getTotalNPCSpending(): number {
  return expenseHistory.reduce(
    (total, transaction) =>
      total + transaction.amount,
    0
  );
}

/**
 * Get recent NPC income transactions.
 */
export function getNPCIncomeHistory(
  npcId?: string
): NPCIncomeTransaction[] {
  if (!npcId) {
    return [...incomeHistory];
  }

  return incomeHistory.filter(
    (transaction) =>
      transaction.npcId === npcId
  );
}

/**
 * Get recent NPC expense transactions.
 */
export function getNPCExpenseHistory(
  npcId?: string
): NPCExpenseTransaction[] {
  if (!npcId) {
    return [...expenseHistory];
  }

  return expenseHistory.filter(
    (transaction) =>
      transaction.npcId === npcId
  );
}

/**
 * Reset one NPC's economy profile.
 */
export function resetNPCEconomy(
  npcId: string
): void {
  economyProfiles.delete(npcId);
}

/**
 * Reset the complete NPC economy.
 */
export function resetNPCEconomyWorld(): void {
  economyProfiles.clear();
  incomeHistory.length = 0;
  expenseHistory.length = 0;
}

/**
 * Calculate an economy summary for the NPC population.
 */
export function getNPCEconomySummary(): {
  npcCount: number;
  totalMoney: number;
  totalIncome: number;
  totalSpending: number;
  averageBalance: number;
  richestBalance: number;
  wealthDistribution: Record<
    NPCWealthLevel,
    number
  >;
} {
  const profiles =
    getAllNPCEconomyProfiles();

  const totalMoney =
    getTotalNPCMoney();

  const totalIncome =
    getTotalNPCIncome();

  const totalSpending =
    getTotalNPCSpending();

  const richest =
    profiles.length > 0
      ? Math.max(
          ...profiles.map(
            (profile) =>
              profile.balance
          )
        )
      : 0;

  return {
    npcCount:
      profiles.length,

    totalMoney,

    totalIncome,

    totalSpending,

    averageBalance:
      profiles.length > 0
        ? Math.floor(
            totalMoney /
              profiles.length
          )
        : 0,

    richestBalance:
      richest,

    wealthDistribution:
      getNPCWealthDistribution(),
  };
}