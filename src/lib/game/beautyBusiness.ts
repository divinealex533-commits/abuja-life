"use client";

export type BeautyBusinessSpecialty =
  | "makeup"
  | "wig-revamp"
  | "wig-sales"
  | "beauty-salon"
  | "full-beauty";

export type BeautyBusinessEventType =
  | "makeup-job"
  | "wig-job"
  | "customer-order"
  | "stock-purchase"
  | "customer-delivery"
  | "vip-order";

export type BeautyBusinessUnlock =
  | "basic-suppliers"
  | "premium-suppliers"
  | "luxury-suppliers"
  | "vip-customers"
  | "luxury-orders"
  | "elite-suppliers"
  | "beauty-studio";

export interface BeautyBusinessState {
  businessName: string;
  specialty: BeautyBusinessSpecialty;

  level: number;
  xp: number;
  reputation: number;

  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;

  makeupJobsCompleted: number;
  wigJobsCompleted: number;
  customerOrdersCompleted: number;
  vipOrdersCompleted: number;

  activeCustomers: number;
  inventoryValue: number;

  unlockedFeatures: BeautyBusinessUnlock[];
  lastActivityAt: string | null;
}

export interface BeautyBusinessTransaction {
  id: string;
  type: BeautyBusinessEventType;
  title: string;
  amount: number;
  profit: number;
  xp: number;
  reputation: number;
  createdAt: string;
}

export interface BeautyBusinessProgress {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  xpProgress: number;
  reputation: number;
  rank: string;
  nextRank: string | null;
}

const BUSINESS_KEY = "abujaLifeBeautyBusiness";
const TRANSACTIONS_KEY = "abujaLifeBeautyTransactions";

const DEFAULT_BUSINESS: BeautyBusinessState = {
  businessName: "New Beauty Business",
  specialty: "full-beauty",

  level: 1,
  xp: 0,
  reputation: 0,

  totalRevenue: 0,
  totalProfit: 0,
  totalExpenses: 0,

  makeupJobsCompleted: 0,
  wigJobsCompleted: 0,
  customerOrdersCompleted: 0,
  vipOrdersCompleted: 0,

  activeCustomers: 0,
  inventoryValue: 0,

  unlockedFeatures: ["basic-suppliers"],
  lastActivityAt: null,
};

const XP_PER_LEVEL = 1000;

const BUSINESS_RANKS = [
  {
    minLevel: 1,
    name: "Beauty Beginner",
  },
  {
    minLevel: 3,
    name: "Beauty Hustler",
  },
  {
    minLevel: 5,
    name: "Beauty Professional",
  },
  {
    minLevel: 8,
    name: "Beauty Entrepreneur",
  },
  {
    minLevel: 12,
    name: "Luxury Beauty Boss",
  },
  {
    minLevel: 18,
    name: "Elite Beauty Mogul",
  },
  {
    minLevel: 25,
    name: "Abuja Beauty Empire",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage failures.
  }
}

function createTransactionId() {
  return `beauty-tx-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getLevelFromXP(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1);
}

function getUnlocksForLevel(level: number): BeautyBusinessUnlock[] {
  const unlocks: BeautyBusinessUnlock[] = ["basic-suppliers"];

  if (level >= 3) {
    unlocks.push("premium-suppliers");
  }

  if (level >= 5) {
    unlocks.push("luxury-suppliers");
  }

  if (level >= 7) {
    unlocks.push("vip-customers");
  }

  if (level >= 10) {
    unlocks.push("luxury-orders");
  }

  if (level >= 14) {
    unlocks.push("elite-suppliers");
  }

  if (level >= 18) {
    unlocks.push("beauty-studio");
  }

  return unlocks;
}

function mergeUnlocks(
  existing: BeautyBusinessUnlock[],
  newUnlocks: BeautyBusinessUnlock[]
) {
  return Array.from(new Set([...existing, ...newUnlocks]));
}

export function getDefaultBeautyBusinessState(): BeautyBusinessState {
  return {
    ...DEFAULT_BUSINESS,
    unlockedFeatures: [...DEFAULT_BUSINESS.unlockedFeatures],
  };
}

export function loadBeautyBusiness(): BeautyBusinessState {
  const saved = getStorage<Partial<BeautyBusinessState> | null>(
    BUSINESS_KEY,
    null
  );

  if (!saved) {
    return getDefaultBeautyBusinessState();
  }

  const level = getLevelFromXP(Number(saved.xp) || 0);

  return {
    ...getDefaultBeautyBusinessState(),
    ...saved,

    level,

    xp: Math.max(0, Number(saved.xp) || 0),
    reputation: clamp(Number(saved.reputation) || 0, 0, 1000000),

    totalRevenue: Math.max(0, Number(saved.totalRevenue) || 0),
    totalProfit: Number(saved.totalProfit) || 0,
    totalExpenses: Math.max(0, Number(saved.totalExpenses) || 0),

    makeupJobsCompleted: Math.max(
      0,
      Number(saved.makeupJobsCompleted) || 0
    ),

    wigJobsCompleted: Math.max(
      0,
      Number(saved.wigJobsCompleted) || 0
    ),

    customerOrdersCompleted: Math.max(
      0,
      Number(saved.customerOrdersCompleted) || 0
    ),

    vipOrdersCompleted: Math.max(
      0,
      Number(saved.vipOrdersCompleted) || 0
    ),

    activeCustomers: Math.max(
      0,
      Number(saved.activeCustomers) || 0
    ),

    inventoryValue: Math.max(
      0,
      Number(saved.inventoryValue) || 0
    ),

    unlockedFeatures: mergeUnlocks(
      saved.unlockedFeatures ?? [],
      getUnlocksForLevel(level)
    ),
  };
}

export function saveBeautyBusiness(
  state: BeautyBusinessState
) {
  setStorage(BUSINESS_KEY, state);
}

export function resetBeautyBusiness() {
  const state = getDefaultBeautyBusinessState();

  saveBeautyBusiness(state);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TRANSACTIONS_KEY);
  }

  return state;
}

export function getBeautyTransactions(): BeautyBusinessTransaction[] {
  return getStorage<BeautyBusinessTransaction[]>(
    TRANSACTIONS_KEY,
    []
  );
}

export function saveBeautyTransactions(
  transactions: BeautyBusinessTransaction[]
) {
  setStorage(TRANSACTIONS_KEY, transactions);
}

export function addBeautyTransaction(
  transaction: Omit<BeautyBusinessTransaction, "id" | "createdAt">
) {
  const transactions = getBeautyTransactions();

  const newTransaction: BeautyBusinessTransaction = {
    ...transaction,
    id: createTransactionId(),
    createdAt: new Date().toISOString(),
  };

  saveBeautyTransactions([
    newTransaction,
    ...transactions,
  ].slice(0, 100));

  return newTransaction;
}

export function getBeautyBusinessLevel(
  state: BeautyBusinessState
) {
  return getLevelFromXP(state.xp);
}

export function getBeautyBusinessRank(
  state: BeautyBusinessState
) {
  const level = getBeautyBusinessLevel(state);

  let rank = BUSINESS_RANKS[0].name;

  for (const item of BUSINESS_RANKS) {
    if (level >= item.minLevel) {
      rank = item.name;
    }
  }

  return rank;
}

export function getNextBeautyBusinessRank(
  state: BeautyBusinessState
) {
  const level = getBeautyBusinessLevel(state);

  const next = BUSINESS_RANKS.find(
    (item) => item.minLevel > level
  );

  return next?.name ?? null;
}

export function getBeautyBusinessProgress(
  state: BeautyBusinessState
): BeautyBusinessProgress {
  const level = getBeautyBusinessLevel(state);

  const currentLevelXP = (level - 1) * XP_PER_LEVEL;
  const nextLevelXP = level * XP_PER_LEVEL;

  const xpIntoLevel = Math.max(
    0,
    state.xp - currentLevelXP
  );

  const xpNeeded = Math.max(
    1,
    nextLevelXP - currentLevelXP
  );

  return {
    currentLevel: level,
    currentXP: state.xp,
    xpForNextLevel: nextLevelXP,
    xpProgress: clamp(
      Math.round((xpIntoLevel / xpNeeded) * 100),
      0,
      100
    ),
    reputation: state.reputation,
    rank: getBeautyBusinessRank(state),
    nextRank: getNextBeautyBusinessRank(state),
  };
}

export function getBeautyXPForLevel(level: number) {
  return Math.max(0, (Math.max(1, level) - 1) * XP_PER_LEVEL);
}

export function getBeautyXPToNextLevel(
  state: BeautyBusinessState
) {
  const level = getBeautyBusinessLevel(state);
  const nextLevelXP = level * XP_PER_LEVEL;

  return Math.max(0, nextLevelXP - state.xp);
}

export function hasBeautyUnlock(
  state: BeautyBusinessState,
  unlock: BeautyBusinessUnlock
) {
  return state.unlockedFeatures.includes(unlock);
}

export function getBeautyUnlockLabel(
  unlock: BeautyBusinessUnlock
) {
  switch (unlock) {
    case "basic-suppliers":
      return "Basic Suppliers";

    case "premium-suppliers":
      return "Premium Suppliers";

    case "luxury-suppliers":
      return "Luxury Suppliers";

    case "vip-customers":
      return "VIP Customers";

    case "luxury-orders":
      return "Luxury Customer Orders";

    case "elite-suppliers":
      return "Elite Suppliers";

    case "beauty-studio":
      return "Beauty Studio";

    default:
      return unlock;
  }
}

export function getBeautyLevelUnlocks(
  level: number
) {
  return getUnlocksForLevel(Math.max(1, level));
}

export function calculateBeautyJobXP(
  baseXP: number,
  score: number,
  difficultyMultiplier = 1
) {
  const safeBaseXP = Math.max(0, baseXP);
  const safeScore = clamp(score, 0, 100);

  const performanceMultiplier =
    0.5 + safeScore / 200;

  return Math.max(
    1,
    Math.round(
      safeBaseXP *
        performanceMultiplier *
        Math.max(0.5, difficultyMultiplier)
    )
  );
}

export function calculateBeautyJobReputation(
  baseReputation: number,
  score: number,
  difficultyMultiplier = 1
) {
  const safeBase = Math.max(0, baseReputation);
  const safeScore = clamp(score, 0, 100);

  const performanceMultiplier =
    0.5 + safeScore / 200;

  return Math.max(
    0,
    Math.round(
      safeBase *
        performanceMultiplier *
        Math.max(0.5, difficultyMultiplier)
    )
  );
}

export function calculateBeautyBusinessProfit(
  revenue: number,
  expenses: number
) {
  return Math.round(
    Math.max(0, revenue) - Math.max(0, expenses)
  );
}

export function recordBeautyJob(
  state: BeautyBusinessState,
  params: {
    type: "makeup" | "wig-revamp";
    title: string;
    cashEarned: number;
    xp: number;
    reputation: number;
    score?: number;
  }
) {
  const cashEarned = Math.max(0, Math.round(params.cashEarned));
  const xpEarned = Math.max(0, Math.round(params.xp));
  const reputationEarned = Math.max(
    0,
    Math.round(params.reputation)
  );

  const nextXP = state.xp + xpEarned;
  const nextLevel = getLevelFromXP(nextXP);

  const nextState: BeautyBusinessState = {
    ...state,

    level: nextLevel,
    xp: nextXP,

    reputation: clamp(
      state.reputation + reputationEarned,
      0,
      1000000
    ),

    totalRevenue:
      state.totalRevenue + cashEarned,

    totalProfit:
      state.totalProfit + cashEarned,

    makeupJobsCompleted:
      state.makeupJobsCompleted +
      (params.type === "makeup" ? 1 : 0),

    wigJobsCompleted:
      state.wigJobsCompleted +
      (params.type === "wig-revamp" ? 1 : 0),

    unlockedFeatures: mergeUnlocks(
      state.unlockedFeatures,
      getUnlocksForLevel(nextLevel)
    ),

    lastActivityAt: new Date().toISOString(),
  };

  addBeautyTransaction({
    type:
      params.type === "makeup"
        ? "makeup-job"
        : "wig-job",
    title: params.title,
    amount: cashEarned,
    profit: cashEarned,
    xp: xpEarned,
    reputation: reputationEarned,
  });

  saveBeautyBusiness(nextState);

  return {
    state: nextState,
    levelUp: nextLevel > state.level,
    previousLevel: state.level,
    newLevel: nextLevel,
  };
}

export function recordBeautyCustomerOrder(
  state: BeautyBusinessState,
  params: {
    orderId: string;
    customerName: string;
    revenue: number;
    expenses: number;
    xp: number;
    reputation: number;
    isVIP?: boolean;
  }
) {
  const revenue = Math.max(
    0,
    Math.round(params.revenue)
  );

  const expenses = Math.max(
    0,
    Math.round(params.expenses)
  );

  const profit = calculateBeautyBusinessProfit(
    revenue,
    expenses
  );

  const xpEarned = Math.max(
    0,
    Math.round(params.xp)
  );

  const reputationEarned = Math.max(
    0,
    Math.round(params.reputation)
  );

  const nextXP = state.xp + xpEarned;
  const nextLevel = getLevelFromXP(nextXP);

  const nextState: BeautyBusinessState = {
    ...state,

    level: nextLevel,
    xp: nextXP,

    reputation: clamp(
      state.reputation + reputationEarned,
      0,
      1000000
    ),

    totalRevenue:
      state.totalRevenue + revenue,

    totalExpenses:
      state.totalExpenses + expenses,

    totalProfit:
      state.totalProfit + profit,

    customerOrdersCompleted:
      state.customerOrdersCompleted + 1,

    vipOrdersCompleted:
      state.vipOrdersCompleted +
      (params.isVIP ? 1 : 0),

    activeCustomers: Math.max(
      state.activeCustomers,
      state.customerOrdersCompleted + 1
    ),

    unlockedFeatures: mergeUnlocks(
      state.unlockedFeatures,
      getUnlocksForLevel(nextLevel)
    ),

    lastActivityAt: new Date().toISOString(),
  };

  addBeautyTransaction({
    type: params.isVIP
      ? "vip-order"
      : "customer-delivery",
    title: `${params.customerName} order`,
    amount: revenue,
    profit,
    xp: xpEarned,
    reputation: reputationEarned,
  });

  saveBeautyBusiness(nextState);

  return {
    state: nextState,
    profit,
    levelUp: nextLevel > state.level,
    previousLevel: state.level,
    newLevel: nextLevel,
  };
}

export function recordBeautyStockPurchase(
  state: BeautyBusinessState,
  params: {
    productName: string;
    amount: number;
  }
) {
  const amount = Math.max(
    0,
    Math.round(params.amount)
  );

  const nextState: BeautyBusinessState = {
    ...state,

    totalExpenses:
      state.totalExpenses + amount,

    totalProfit:
      state.totalProfit - amount,

    inventoryValue:
      state.inventoryValue + amount,

    lastActivityAt: new Date().toISOString(),
  };

  addBeautyTransaction({
    type: "stock-purchase",
    title: `Stock purchase: ${params.productName}`,
    amount: 0,
    profit: -amount,
    xp: 25,
    reputation: 0,
  });

  saveBeautyBusiness(nextState);

  return nextState;
}

export function updateBeautyInventoryValue(
  state: BeautyBusinessState,
  inventoryValue: number
) {
  const nextState: BeautyBusinessState = {
    ...state,
    inventoryValue: Math.max(
      0,
      Math.round(inventoryValue)
    ),
    lastActivityAt: new Date().toISOString(),
  };

  saveBeautyBusiness(nextState);

  return nextState;
}

export function addBeautyCustomer(
  state: BeautyBusinessState,
  count = 1
) {
  const nextState: BeautyBusinessState = {
    ...state,
    activeCustomers: Math.max(
      0,
      state.activeCustomers + Math.max(0, count)
    ),
    lastActivityAt: new Date().toISOString(),
  };

  saveBeautyBusiness(nextState);

  return nextState;
}

export function getBeautyBusinessSummary(
  state: BeautyBusinessState
) {
  const progress = getBeautyBusinessProgress(state);

  const averageOrderValue =
    state.customerOrdersCompleted > 0
      ? Math.round(
          state.totalRevenue /
            state.customerOrdersCompleted
        )
      : 0;

  const profitMargin =
    state.totalRevenue > 0
      ? Math.round(
          (state.totalProfit /
            state.totalRevenue) *
            100
        )
      : 0;

  return {
    businessName: state.businessName,
    specialty: state.specialty,

    level: progress.currentLevel,
    rank: progress.rank,
    nextRank: progress.nextRank,

    xp: state.xp,
    xpToNextLevel:
      getBeautyXPToNextLevel(state),
    xpProgress: progress.xpProgress,

    reputation: state.reputation,

    totalRevenue: state.totalRevenue,
    totalExpenses: state.totalExpenses,
    totalProfit: state.totalProfit,

    makeupJobsCompleted:
      state.makeupJobsCompleted,

    wigJobsCompleted:
      state.wigJobsCompleted,

    customerOrdersCompleted:
      state.customerOrdersCompleted,

    vipOrdersCompleted:
      state.vipOrdersCompleted,

    activeCustomers:
      state.activeCustomers,

    inventoryValue:
      state.inventoryValue,

    averageOrderValue,
    profitMargin,

    unlockedFeatures:
      state.unlockedFeatures.map(
        getBeautyUnlockLabel
      ),
  };
}

export function getBeautyBusinessTier(
  state: BeautyBusinessState
) {
  const level = getBeautyBusinessLevel(state);

  if (level >= 25) return "empire";
  if (level >= 18) return "elite";
  if (level >= 12) return "luxury";
  if (level >= 8) return "professional";
  if (level >= 5) return "premium";

  return "starter";
}

export function getBeautyBusinessTierLabel(
  state: BeautyBusinessState
) {
  switch (getBeautyBusinessTier(state)) {
    case "empire":
      return "Beauty Empire";

    case "elite":
      return "Elite Beauty Business";

    case "luxury":
      return "Luxury Beauty Business";

    case "professional":
      return "Professional Beauty Business";

    case "premium":
      return "Premium Beauty Business";

    default:
      return "Starter Beauty Business";
  }
}
