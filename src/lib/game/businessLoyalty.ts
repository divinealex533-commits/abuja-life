export type BusinessClientType =
  | "npc"
  | "player"
  | "company"
  | "event"
  | "government"
  | "celebrity"
  | "tourist";

export type BusinessClientStatus =
  | "prospect"
  | "active"
  | "returning"
  | "vip"
  | "inactive"
  | "lost";

export type BusinessClientTier =
  | "standard"
  | "silver"
  | "gold"
  | "platinum"
  | "elite";

export type BusinessClientRelationshipLevel =
  | "new"
  | "acquainted"
  | "trusted"
  | "loyal"
  | "preferred"
  | "vip"
  | "elite";

export interface BusinessClient {
  id: string;
  businessId: string;
  clientType: BusinessClientType;
  name: string;
  description: string;
  status: BusinessClientStatus;
  tier: BusinessClientTier;
  satisfaction: number;
  trust: number;
  loyalty: number;
  reputation: number;
  totalSpent: number;
  totalContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  successfulVisits: number;
  lastInteractionAt: number;
  firstInteractionAt: number;
  nextInteractionAt: number;
  preferredService?: string;
  preferredLocation?: string;
  notes: string[];
  tags: string[];

  relationshipXP?: number;
  relationshipLevel?: BusinessClientRelationshipLevel;
  repeatContractStreak?: number;
  bestContractStreak?: number;
  totalRewardsEarned?: number;
  lastContractCompletedAt?: number;
}

export interface BusinessClientInteraction {
  id: string;
  businessId: string;
  clientId: string;
  type:
    | "visit"
    | "contract"
    | "purchase"
    | "meeting"
    | "complaint"
    | "feedback"
    | "event"
    | "payment"
    | "follow_up"
    | "other";
  amount: number;
  satisfactionChange: number;
  trustChange: number;
  loyaltyChange: number;
  reputationChange: number;
  description: string;
  createdAt: number;
}

export interface BusinessClientResult {
  success: boolean;
  client: BusinessClient | null;
  interaction: BusinessClientInteraction | null;
  message: string;
}

export interface BusinessClientSummary {
  businessId: string;
  totalClients: number;
  activeClients: number;
  returningClients: number;
  vipClients: number;
  lostClients: number;
  averageSatisfaction: number;
  averageTrust: number;
  averageLoyalty: number;
  totalClientSpending: number;
  totalContracts: number;
  completedContracts: number;
  repeatClientRate: number;
}

export interface BusinessClientRelationshipProgress {
  clientId: string;
  relationshipXP: number;
  relationshipLevel: BusinessClientRelationshipLevel;
  relationshipScore: number;
  progressPercent: number;
  nextLevelXP: number | null;
  repeatContractStreak: number;
  bestContractStreak: number;
  totalRewardsEarned: number;
}

export interface BusinessClientReward {
  clientId: string;
  businessId: string;
  eligible: boolean;
  multiplier: number;
  bonusPercent: number;
  reason: string;
}

const CLIENTS_KEY =
  "abujaLifeBusinessClients";

const INTERACTIONS_KEY =
  "abujaLifeBusinessClientInteractions";

const CLIENT_TIER_THRESHOLDS: Record<
  BusinessClientTier,
  number
> = {
  standard: 0,
  silver: 100_000,
  gold: 500_000,
  platinum: 2_000_000,
  elite: 10_000_000,
};

const CLIENT_STATUS_THRESHOLDS = {
  returningContracts: 2,
  vipSpending: 2_000_000,
  lostDays: 30,
};

const RELATIONSHIP_LEVELS: Array<{
  level: BusinessClientRelationshipLevel;
  minXP: number;
}> = [
  { level: "elite", minXP: 10_000 },
  { level: "vip", minXP: 5_000 },
  { level: "preferred", minXP: 2_500 },
  { level: "loyal", minXP: 1_200 },
  { level: "trusted", minXP: 500 },
  { level: "acquainted", minXP: 100 },
  { level: "new", minXP: 0 },
];

const RELATIONSHIP_LEVEL_XP: Record<
  BusinessClientRelationshipLevel,
  number | null
> = {
  new: 100,
  acquainted: 500,
  trusted: 1_200,
  loyal: 2_500,
  preferred: 5_000,
  vip: 10_000,
  elite: null,
};

function loadAllClients(): Record<
  string,
  BusinessClient[]
> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(CLIENTS_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      BusinessClient[]
    >;
  } catch {
    return {};
  }
}

function saveAllClients(
  clients: Record<
    string,
    BusinessClient[]
  >
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CLIENTS_KEY,
    JSON.stringify(clients)
  );
}

function loadAllInteractions(): Record<
  string,
  BusinessClientInteraction[]
> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(
        INTERACTIONS_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      BusinessClientInteraction[]
    >;
  } catch {
    return {};
  }
}

function saveAllInteractions(
  interactions: Record<
    string,
    BusinessClientInteraction[]
  >
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    INTERACTIONS_KEY,
    JSON.stringify(interactions)
  );
}

function clamp(
  value: number,
  min = 0,
  max = 100
): number {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function safeNumber(
  value: number | undefined,
  fallback = 0
): number {
  return Number.isFinite(value)
    ? Number(value)
    : fallback;
}

function calculateRelationshipLevel(
  relationshipXP: number
): BusinessClientRelationshipLevel {
  for (const entry of RELATIONSHIP_LEVELS) {
    if (
      relationshipXP >=
      entry.minXP
    ) {
      return entry.level;
    }
  }

  return "new";
}

function normalizeClient(
  client: BusinessClient
): BusinessClient {
  client.relationshipXP =
    Math.max(
      0,
      safeNumber(
        client.relationshipXP
      )
    );

  client.relationshipLevel =
    client.relationshipLevel ??
    calculateRelationshipLevel(
      client.relationshipXP
    );

  client.repeatContractStreak =
    Math.max(
      0,
      Math.floor(
        safeNumber(
          client.repeatContractStreak
        )
      )
    );

  client.bestContractStreak =
    Math.max(
      client.repeatContractStreak,
      Math.floor(
        safeNumber(
          client.bestContractStreak
        )
      )
    );

  client.totalRewardsEarned =
    Math.max(
      0,
      safeNumber(
        client.totalRewardsEarned
      )
    );

  return client;
}

function calculateClientTier(
  totalSpent: number
): BusinessClientTier {
  if (
    totalSpent >=
    CLIENT_TIER_THRESHOLDS.elite
  ) {
    return "elite";
  }

  if (
    totalSpent >=
    CLIENT_TIER_THRESHOLDS.platinum
  ) {
    return "platinum";
  }

  if (
    totalSpent >=
    CLIENT_TIER_THRESHOLDS.gold
  ) {
    return "gold";
  }

  if (
    totalSpent >=
    CLIENT_TIER_THRESHOLDS.silver
  ) {
    return "silver";
  }

  return "standard";
}

function calculateClientStatus(
  client: BusinessClient
): BusinessClientStatus {
  const daysSinceInteraction =
    Math.floor(
      (Date.now() -
        client.lastInteractionAt) /
        (24 * 60 * 60 * 1000)
    );

  if (
    client.totalSpent >=
      CLIENT_STATUS_THRESHOLDS.vipSpending &&
    client.loyalty >= 75
  ) {
    return "vip";
  }

  if (
    daysSinceInteraction >=
    CLIENT_STATUS_THRESHOLDS.lostDays
  ) {
    return "lost";
  }

  if (
    client.completedContracts >=
      CLIENT_STATUS_THRESHOLDS.returningContracts ||
    client.successfulVisits >=
      CLIENT_STATUS_THRESHOLDS.returningContracts
  ) {
    return "returning";
  }

  if (
    client.totalContracts > 0 ||
    client.successfulVisits > 0
  ) {
    return "active";
  }

  return "prospect";
}

function calculateRelationshipScore(
  client: BusinessClient
): number {
  const satisfaction =
    clamp(
      safeNumber(
        client.satisfaction
      )
    );

  const trust =
    clamp(
      safeNumber(client.trust)
    );

  const loyalty =
    clamp(
      safeNumber(client.loyalty)
    );

  const reputation =
    clamp(
      safeNumber(
        client.reputation
      )
    );

  return Number(
    (
      satisfaction * 0.25 +
      trust * 0.25 +
      loyalty * 0.35 +
      reputation * 0.15
    ).toFixed(1)
  );
}

function calculateRelationshipProgressPercent(
  client: BusinessClient
): number {
  const xp = Math.max(
    0,
    safeNumber(
      client.relationshipXP
    )
  );

  const level =
    client.relationshipLevel ??
    calculateRelationshipLevel(
      xp
    );

  const currentMin =
    RELATIONSHIP_LEVELS.find(
      (entry) =>
        entry.level === level
    )?.minXP ?? 0;

  const nextXP =
    RELATIONSHIP_LEVEL_XP[
      level
    ];

  if (nextXP === null) {
    return 100;
  }

  const range = Math.max(
    1,
    nextXP - currentMin
  );

  return Number(
    clamp(
      ((xp - currentMin) /
        range) *
        100
    ).toFixed(1)
  );
}

function calculateRelationshipXPForInteraction(
  type: BusinessClientInteraction["type"],
  satisfactionChange: number,
  trustChange: number,
  loyaltyChange: number
): number {
  const baseXP: Record<
    BusinessClientInteraction["type"],
    number
  > = {
    visit: 20,
    contract: 40,
    purchase: 30,
    meeting: 25,
    complaint: 0,
    feedback: 15,
    event: 20,
    payment: 20,
    follow_up: 25,
    other: 10,
  };

  const positiveGrowth =
    Math.max(
      0,
      satisfactionChange
    ) * 4 +
    Math.max(
      0,
      trustChange
    ) * 5 +
    Math.max(
      0,
      loyaltyChange
    ) * 6;

  const negativePenalty =
    Math.max(
      0,
      -satisfactionChange
    ) * 3 +
    Math.max(
      0,
      -trustChange
    ) * 4 +
    Math.max(
      0,
      -loyaltyChange
    ) * 5;

  return Math.max(
    0,
    Math.round(
      baseXP[type] +
        positiveGrowth -
        negativePenalty
    )
  );
}

function getRelationshipRewardMultiplier(
  client: BusinessClient
): number {
  const level =
    client.relationshipLevel ??
    calculateRelationshipLevel(
      safeNumber(
        client.relationshipXP
      )
    );

  const levelMultiplier: Record<
    BusinessClientRelationshipLevel,
    number
  > = {
    new: 1,
    acquainted: 1.02,
    trusted: 1.05,
    loyal: 1.08,
    preferred: 1.12,
    vip: 1.18,
    elite: 1.25,
  };

  const score =
    calculateRelationshipScore(
      client
    );

  const scoreBonus =
    score >= 90
      ? 0.05
      : score >= 80
        ? 0.03
        : score >= 70
          ? 0.01
          : 0;

  return Number(
    (
      levelMultiplier[level] +
      scoreBonus
    ).toFixed(2)
  );
}

function calculateRepeatContractBonusPercent(
  client: BusinessClient
): number {
  const streak =
    Math.max(
      0,
      safeNumber(
        client.repeatContractStreak
      )
    );

  const level =
    client.relationshipLevel ??
    calculateRelationshipLevel(
      safeNumber(
        client.relationshipXP
      )
    );

  const levelBonus: Record<
    BusinessClientRelationshipLevel,
    number
  > = {
    new: 0,
    acquainted: 1,
    trusted: 2,
    loyal: 4,
    preferred: 6,
    vip: 8,
    elite: 10,
  };

  const streakBonus =
    Math.min(
      10,
      Math.max(
        0,
        streak - 1
      ) * 1
    );

  return Math.min(
    20,
    levelBonus[level] +
      streakBonus
  );
}

function createClientId(): string {
  return `client-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function createInteractionId(): string {
  return `client-interaction-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function createBusinessClient(
  params: {
    businessId: string;
    name: string;
    clientType: BusinessClientType;
    description?: string;
    preferredService?: string;
    preferredLocation?: string;
    tags?: string[];
  }
): BusinessClientResult {
  if (
    !params.businessId.trim()
  ) {
    return {
      success: false,
      client: null,
      interaction: null,
      message:
        "Business ID is required.",
    };
  }

  if (!params.name.trim()) {
    return {
      success: false,
      client: null,
      interaction: null,
      message:
        "Client name is required.",
    };
  }

  const all =
    loadAllClients();

  if (
    !all[
      params.businessId
    ]
  ) {
    all[
      params.businessId
    ] = [];
  }

  const existing =
    all[
      params.businessId
    ].find(
      (client) =>
        client.name
          .toLowerCase() ===
        params.name
          .trim()
          .toLowerCase()
    );

  if (existing) {
    normalizeClient(
      existing
    );

    saveAllClients(all);

    return {
      success: true,
      client: existing,
      interaction: null,
      message:
        "This client already exists.",
    };
  }

  const now =
    Date.now();

  const client: BusinessClient =
    {
      id: createClientId(),
      businessId:
        params.businessId,
      clientType:
        params.clientType,
      name:
        params.name.trim(),
      description:
        params.description?.trim() ||
        "",
      status: "prospect",
      tier: "standard",
      satisfaction: 70,
      trust: 20,
      loyalty: 0,
      reputation: 0,
      totalSpent: 0,
      totalContracts: 0,
      completedContracts: 0,
      cancelledContracts: 0,
      successfulVisits: 0,
      lastInteractionAt:
        now,
      firstInteractionAt:
        now,
      nextInteractionAt:
        now +
        7 *
          24 *
          60 *
          60 *
          1000,
      preferredService:
        params.preferredService,
      preferredLocation:
        params.preferredLocation,
      notes: [],
      tags:
        params.tags ?? [],
      relationshipXP: 0,
      relationshipLevel:
        "new",
      repeatContractStreak:
        0,
      bestContractStreak:
        0,
      totalRewardsEarned:
        0,
    };

  all[
    params.businessId
  ].push(client);

  saveAllClients(all);

  return {
    success: true,
    client,
    interaction: null,
    message:
      `${client.name} has been added as a business client.`,
  };
}

export function getBusinessClients(
  businessId: string
): BusinessClient[] {
  const all =
    loadAllClients();

  const clients =
    all[businessId] ?? [];

  let changed = false;

  for (const client of clients) {
    const before =
      JSON.stringify({
        relationshipXP:
          client.relationshipXP,
        relationshipLevel:
          client.relationshipLevel,
        repeatContractStreak:
          client.repeatContractStreak,
        bestContractStreak:
          client.bestContractStreak,
        totalRewardsEarned:
          client.totalRewardsEarned,
      });

    normalizeClient(client);

    const after =
      JSON.stringify({
        relationshipXP:
          client.relationshipXP,
        relationshipLevel:
          client.relationshipLevel,
        repeatContractStreak:
          client.repeatContractStreak,
        bestContractStreak:
          client.bestContractStreak,
        totalRewardsEarned:
          client.totalRewardsEarned,
      });

    if (before !== after) {
      changed = true;
    }
  }

  if (changed) {
    saveAllClients(all);
  }

  return [...clients];
}

export function getBusinessClient(
  businessId: string,
  clientId: string
): BusinessClient | null {
  return (
    getBusinessClients(
      businessId
    ).find(
      (client) =>
        client.id ===
        clientId
    ) ?? null
  );
}

export function getClientByName(
  businessId: string,
  name: string
): BusinessClient | null {
  const normalized =
    name
      .trim()
      .toLowerCase();

  return (
    getBusinessClients(
      businessId
    ).find(
      (client) =>
        client.name
          .toLowerCase() ===
        normalized
    ) ?? null
  );
}

export function getBusinessClientCount(
  businessId: string
): number {
  return getBusinessClients(
    businessId
  ).length;
}

export function getActiveBusinessClients(
  businessId: string
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.status ===
        "active" ||
      client.status ===
        "returning" ||
      client.status ===
        "vip"
  );
}

export function getReturningBusinessClients(
  businessId: string
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.status ===
        "returning" ||
      client.status ===
        "vip"
  );
}

export function getVIPBusinessClients(
  businessId: string
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.status ===
      "vip"
  );
}

export function getLostBusinessClients(
  businessId: string
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.status ===
      "lost"
  );
}

export function getBusinessClientsByTier(
  businessId: string,
  tier: BusinessClientTier
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.tier ===
      tier
  );
}

export function getBusinessClientsByType(
  businessId: string,
  clientType: BusinessClientType
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.clientType ===
      clientType
  );
}

export function recordBusinessClientInteraction(
  params: {
    businessId: string;
    clientId: string;
    type: BusinessClientInteraction["type"];
    amount?: number;
    satisfactionChange?: number;
    trustChange?: number;
    loyaltyChange?: number;
    reputationChange?: number;
    description: string;
  }
): BusinessClientResult {
  const all =
    loadAllClients();

  const clients =
    all[params.businessId];

  if (!clients) {
    return {
      success: false,
      client: null,
      interaction: null,
      message:
        "Business clients could not be found.",
    };
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        params.clientId
    );

  if (!client) {
    return {
      success: false,
      client: null,
      interaction: null,
      message:
        "Client not found.",
    };
  }

  normalizeClient(client);

  const amount =
    Math.max(
      0,
      params.amount ?? 0
    );

  const satisfactionChange =
    safeNumber(
      params.satisfactionChange
    );

  const trustChange =
    safeNumber(
      params.trustChange
    );

  const loyaltyChange =
    safeNumber(
      params.loyaltyChange
    );

  const reputationChange =
    safeNumber(
      params.reputationChange
    );

  const now =
    Date.now();

  client.satisfaction =
    clamp(
      client.satisfaction +
        satisfactionChange
    );

  client.trust =
    clamp(
      client.trust +
        trustChange
    );

  client.loyalty =
    clamp(
      client.loyalty +
        loyaltyChange
    );

  client.reputation =
    clamp(
      client.reputation +
        reputationChange
    );

  if (amount > 0) {
    client.totalSpent +=
      amount;
  }

  if (
    params.type ===
    "contract"
  ) {
    client.totalContracts +=
      1;
  }

  if (
    params.type ===
      "visit" ||
    params.type ===
      "purchase"
  ) {
    client.successfulVisits +=
      1;
  }

  const relationshipXP =
    calculateRelationshipXPForInteraction(
      params.type,
      satisfactionChange,
      trustChange,
      loyaltyChange
    );

  client.relationshipXP =
    Math.max(
      0,
      safeNumber(
        client.relationshipXP
      ) +
        relationshipXP
    );

  client.relationshipLevel =
    calculateRelationshipLevel(
      client.relationshipXP
    );

  client.tier =
    calculateClientTier(
      client.totalSpent
    );

  client.lastInteractionAt =
    now;

  client.nextInteractionAt =
    now +
    7 *
      24 *
      60 *
      60 *
      1000;

  client.status =
    calculateClientStatus(
      client
    );

  const interaction:
    BusinessClientInteraction =
    {
      id:
        createInteractionId(),
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type:
        params.type,
      amount,
      satisfactionChange,
      trustChange,
      loyaltyChange,
      reputationChange,
      description:
        params.description,
      createdAt: now,
    };

  saveAllClients(all);

  const allInteractions =
    loadAllInteractions();

  if (
    !allInteractions[
      params.clientId
    ]
  ) {
    allInteractions[
      params.clientId
    ] = [];
  }

  allInteractions[
    params.clientId
  ].push(interaction);

  saveAllInteractions(
    allInteractions
  );

  return {
    success: true,
    client,
    interaction,
    message:
      `Interaction recorded for ${client.name}.`,
  };
}

export function recordClientPurchase(
  params: {
    businessId: string;
    clientId: string;
    amount: number;
    description?: string;
  }
): BusinessClientResult {
  return recordBusinessClientInteraction(
    {
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type: "purchase",
      amount:
        params.amount,
      satisfactionChange: 2,
      trustChange: 1,
      loyaltyChange: 4,
      reputationChange: 1,
      description:
        params.description ??
        "Client purchase completed.",
    }
  );
}

export function recordClientVisit(
  params: {
    businessId: string;
    clientId: string;
    amount?: number;
    description?: string;
  }
): BusinessClientResult {
  return recordBusinessClientInteraction(
    {
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type: "visit",
      amount:
        params.amount ?? 0,
      satisfactionChange: 2,
      trustChange: 1,
      loyaltyChange: 3,
      reputationChange: 1,
      description:
        params.description ??
        "Client visited the business.",
    }
  );
}

export function recordClientContract(
  params: {
    businessId: string;
    clientId: string;
    amount: number;
    completed?: boolean;
    description?: string;
  }
): BusinessClientResult {
  const result =
    recordBusinessClientInteraction(
      {
        businessId:
          params.businessId,
        clientId:
          params.clientId,
        type: "contract",
        amount:
          params.amount,
        satisfactionChange:
          params.completed === false
            ? -8
            : 5,
        trustChange:
          params.completed === false
            ? -5
            : 4,
        loyaltyChange:
          params.completed === false
            ? -3
            : 6,
        reputationChange:
          params.completed === false
            ? -2
            : 2,
        description:
          params.description ??
          "Business contract recorded.",
      }
    );

  if (
    !result.success ||
    !result.client
  ) {
    return result;
  }

  const all =
    loadAllClients();

  const clients =
    all[params.businessId];

  if (!clients) {
    return result;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        params.clientId
    );

  if (!client) {
    return result;
  }

  normalizeClient(client);

  if (
    params.completed === false
  ) {
    client.cancelledContracts +=
      1;

    client.repeatContractStreak =
      0;
  } else {
    client.completedContracts +=
      1;

    client.repeatContractStreak =
      Math.max(
        0,
        safeNumber(
          client.repeatContractStreak
        )
      ) + 1;

    client.bestContractStreak =
      Math.max(
        safeNumber(
          client.bestContractStreak
        ),
        client.repeatContractStreak
      );

    client.lastContractCompletedAt =
      Date.now();

    const rewardAmount =
      calculateClientContractReward(
        params.businessId,
        params.clientId,
        Math.max(
          0,
          params.amount
        )
      );

    if (
      rewardAmount > 0
    ) {
      client.totalRewardsEarned =
        safeNumber(
          client.totalRewardsEarned
        ) +
        rewardAmount;
    }
  }

  client.relationshipLevel =
    calculateRelationshipLevel(
      safeNumber(
        client.relationshipXP
      )
    );

  client.status =
    calculateClientStatus(
      client
    );

  saveAllClients(all);

  return {
    ...result,
    client,
  };
}

export function recordClientComplaint(
  params: {
    businessId: string;
    clientId: string;
    description?: string;
  }
): BusinessClientResult {
  return recordBusinessClientInteraction(
    {
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type: "complaint",
      satisfactionChange:
        -12,
      trustChange:
        -8,
      loyaltyChange:
        -8,
      reputationChange:
        -3,
      description:
        params.description ??
        "Client complaint recorded.",
    }
  );
}

export function recordClientFeedback(
  params: {
    businessId: string;
    clientId: string;
    satisfactionChange?: number;
    description?: string;
  }
): BusinessClientResult {
  const change =
    params.satisfactionChange ??
    3;

  return recordBusinessClientInteraction(
    {
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type: "feedback",
      satisfactionChange:
        change,
      trustChange:
        change > 0 ? 2 : -2,
      loyaltyChange:
        change > 0 ? 2 : -2,
      reputationChange:
        change > 0 ? 1 : -1,
      description:
        params.description ??
        "Client feedback recorded.",
    }
  );
}

export function recordClientFollowUp(
  params: {
    businessId: string;
    clientId: string;
    description?: string;
  }
): BusinessClientResult {
  return recordBusinessClientInteraction(
    {
      businessId:
        params.businessId,
      clientId:
        params.clientId,
      type: "follow_up",
      satisfactionChange: 3,
      trustChange: 4,
      loyaltyChange: 5,
      reputationChange: 1,
      description:
        params.description ??
        "Business followed up with client.",
    }
  );
}

export function addClientNote(
  businessId: string,
  clientId: string,
  note: string
): BusinessClient | null {
  if (!note.trim()) {
    return getBusinessClient(
      businessId,
      clientId
    );
  }

  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  client.notes.push(
    note.trim()
  );

  saveAllClients(all);

  return client;
}

export function addClientTag(
  businessId: string,
  clientId: string,
  tag: string
): BusinessClient | null {
  if (!tag.trim()) {
    return getBusinessClient(
      businessId,
      clientId
    );
  }

  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  if (
    !client.tags.includes(
      tag.trim()
    )
  ) {
    client.tags.push(
      tag.trim()
    );
  }

  saveAllClients(all);

  return client;
}

export function getClientInteractions(
  clientId: string
): BusinessClientInteraction[] {
  const all =
    loadAllInteractions();

  return all[clientId]
    ? [...all[clientId]].sort(
        (a, b) =>
          b.createdAt -
          a.createdAt
      )
    : [];
}

export function getBusinessClientInteractions(
  businessId: string
): BusinessClientInteraction[] {
  const all =
    loadAllInteractions();

  const interactions:
    BusinessClientInteraction[] =
    [];

  for (
    const clientInteractions of
      Object.values(all)
  ) {
    for (
      const interaction of
        clientInteractions
    ) {
      if (
        interaction.businessId ===
        businessId
      ) {
        interactions.push(
          interaction
        );
      }
    }
  }

  return interactions.sort(
    (a, b) =>
      b.createdAt -
      a.createdAt
  );
}

export function getClientTotalSpent(
  businessId: string,
  clientId: string
): number {
  return (
    getBusinessClient(
      businessId,
      clientId
    )?.totalSpent ?? 0
  );
}

export function getClientLoyaltyLevel(
  businessId: string,
  clientId: string
): BusinessClientTier {
  return (
    getBusinessClient(
      businessId,
      clientId
    )?.tier ?? "standard"
  );
}

export function getClientLoyaltyPercent(
  businessId: string,
  clientId: string
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return 0;
  }

  return clamp(
    client.loyalty
  );
}

export function getClientLifetimeValue(
  businessId: string,
  clientId: string
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return 0;
  }

  const loyaltyMultiplier =
    client.tier === "elite"
      ? 1.5
      : client.tier ===
          "platinum"
        ? 1.35
        : client.tier ===
            "gold"
          ? 1.2
          : client.tier ===
              "silver"
            ? 1.1
            : 1;

  return Math.floor(
    client.totalSpent *
      loyaltyMultiplier
  );
}

export function getBusinessRepeatClientRate(
  businessId: string
): number {
  const clients =
    getBusinessClients(
      businessId
    );

  if (clients.length === 0) {
    return 0;
  }

  const returning =
    clients.filter(
      (client) =>
        client.status ===
          "returning" ||
        client.status ===
          "vip" ||
        client.completedContracts >=
          2 ||
        client.successfulVisits >=
          2
    ).length;

  return Number(
    (
      (returning /
        clients.length) *
      100
    ).toFixed(1)
  );
}

export function getBusinessClientSummary(
  businessId: string
): BusinessClientSummary {
  const clients =
    getBusinessClients(
      businessId
    );

  if (clients.length === 0) {
    return {
      businessId,
      totalClients: 0,
      activeClients: 0,
      returningClients: 0,
      vipClients: 0,
      lostClients: 0,
      averageSatisfaction: 0,
      averageTrust: 0,
      averageLoyalty: 0,
      totalClientSpending: 0,
      totalContracts: 0,
      completedContracts: 0,
      repeatClientRate: 0,
    };
  }

  const active =
    clients.filter(
      (client) =>
        client.status ===
          "active" ||
        client.status ===
          "returning" ||
        client.status ===
          "vip"
    );

  const returning =
    clients.filter(
      (client) =>
        client.status ===
          "returning" ||
        client.status ===
          "vip"
    );

  const vip =
    clients.filter(
      (client) =>
        client.status ===
        "vip"
    );

  const lost =
    clients.filter(
      (client) =>
        client.status ===
        "lost"
    );

  return {
    businessId,

    totalClients:
      clients.length,

    activeClients:
      active.length,

    returningClients:
      returning.length,

    vipClients:
      vip.length,

    lostClients:
      lost.length,

    averageSatisfaction:
      Number(
        (
          clients.reduce(
            (total, client) =>
              total +
              client.satisfaction,
            0
          ) /
          clients.length
        ).toFixed(1)
      ),

    averageTrust:
      Number(
        (
          clients.reduce(
            (total, client) =>
              total +
              client.trust,
            0
          ) /
          clients.length
        ).toFixed(1)
      ),

    averageLoyalty:
      Number(
        (
          clients.reduce(
            (total, client) =>
              total +
              client.loyalty,
            0
          ) /
          clients.length
        ).toFixed(1)
      ),

    totalClientSpending:
      clients.reduce(
        (total, client) =>
          total +
          client.totalSpent,
        0
      ),

    totalContracts:
      clients.reduce(
        (total, client) =>
          total +
          client.totalContracts,
        0
      ),

    completedContracts:
      clients.reduce(
        (total, client) =>
          total +
          client.completedContracts,
        0
      ),

    repeatClientRate:
      getBusinessRepeatClientRate(
        businessId
      ),
  };
}

export function getTopBusinessClients(
  businessId: string,
  limit = 10
): BusinessClient[] {
  return getBusinessClients(
    businessId
  )
    .sort(
      (a, b) =>
        b.totalSpent -
        a.totalSpent
    )
    .slice(
      0,
      Math.max(0, limit)
    );
}

export function getMostLoyalBusinessClients(
  businessId: string,
  limit = 10
): BusinessClient[] {
  return getBusinessClients(
    businessId
  )
    .sort(
      (a, b) =>
        b.loyalty -
        a.loyalty
    )
    .slice(
      0,
      Math.max(0, limit)
    );
}

export function getMostSatisfiedBusinessClients(
  businessId: string,
  limit = 10
): BusinessClient[] {
  return getBusinessClients(
    businessId
  )
    .sort(
      (a, b) =>
        b.satisfaction -
        a.satisfaction
    )
    .slice(
      0,
      Math.max(0, limit)
    );
}

export function getClientsNeedingFollowUp(
  businessId: string
): BusinessClient[] {
  const now =
    Date.now();

  return getBusinessClients(
    businessId
  ).filter(
    (client) =>
      client.nextInteractionAt <=
        now &&
      client.status !==
        "lost"
  );
}

export function scheduleClientFollowUp(
  businessId: string,
  clientId: string,
  days = 7
): BusinessClient | null {
  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  client.nextInteractionAt =
    Date.now() +
    Math.max(
      1,
      days
    ) *
      24 *
      60 *
      60 *
      1000;

  saveAllClients(all);

  return client;
}

export function reactivateBusinessClient(
  businessId: string,
  clientId: string
): BusinessClientResult {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return {
      success: false,
      client: null,
      interaction: null,
      message:
        "Client not found.",
    };
  }

  const result =
    recordBusinessClientInteraction(
      {
        businessId,
        clientId,
        type: "follow_up",
        satisfactionChange: 4,
        trustChange: 5,
        loyaltyChange: 6,
        reputationChange: 1,
        description:
          "Lost client was successfully reactivated.",
      }
    );

  if (
    result.client
  ) {
    const all =
      loadAllClients();

    const clients =
      all[businessId];

    const updated =
      clients?.find(
        (item) =>
          item.id ===
          clientId
      );

    if (updated) {
      normalizeClient(
        updated
      );

      updated.status =
        updated.totalSpent >=
          CLIENT_STATUS_THRESHOLDS.vipSpending &&
        updated.loyalty >= 75
          ? "vip"
          : "returning";

      saveAllClients(all);

      result.client =
        updated;
    }
  }

  return result;
}

export function updateClientStatus(
  businessId: string,
  clientId: string
): BusinessClient | null {
  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  normalizeClient(
    client
  );

  client.tier =
    calculateClientTier(
      client.totalSpent
    );

  client.relationshipLevel =
    calculateRelationshipLevel(
      safeNumber(
        client.relationshipXP
      )
    );

  client.status =
    calculateClientStatus(
      client
    );

  saveAllClients(all);

  return client;
}

export function updateAllBusinessClientStatuses(
  businessId: string
): BusinessClient[] {
  const clients =
    getBusinessClients(
      businessId
    );

  for (
    const client of clients
  ) {
    updateClientStatus(
      businessId,
      client.id
    );
  }

  return getBusinessClients(
    businessId
  );
}

/* ─────────────────────────────────────────────
   BUSINESS CLIENTS 2.0
   RELATIONSHIP PROGRESSION
───────────────────────────────────────────── */

export function getBusinessClientRelationshipProgress(
  businessId: string,
  clientId: string
): BusinessClientRelationshipProgress | null {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return null;
  }

  const relationshipXP =
    Math.max(
      0,
      safeNumber(
        client.relationshipXP
      )
    );

  const relationshipLevel =
    client.relationshipLevel ??
    calculateRelationshipLevel(
      relationshipXP
    );

  const nextLevelXP =
    RELATIONSHIP_LEVEL_XP[
      relationshipLevel
    ];

  return {
    clientId:
      client.id,
    relationshipXP,
    relationshipLevel,
    relationshipScore:
      calculateRelationshipScore(
        client
      ),
    progressPercent:
      calculateRelationshipProgressPercent(
        client
      ),
    nextLevelXP,
    repeatContractStreak:
      Math.max(
        0,
        safeNumber(
          client.repeatContractStreak
        )
      ),
    bestContractStreak:
      Math.max(
        0,
        safeNumber(
          client.bestContractStreak
        )
      ),
    totalRewardsEarned:
      Math.max(
        0,
        safeNumber(
          client.totalRewardsEarned
        )
      ),
  };
}

export function getClientRelationshipLevel(
  businessId: string,
  clientId: string
): BusinessClientRelationshipLevel {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return "new";
  }

  return (
    client.relationshipLevel ??
    calculateRelationshipLevel(
      safeNumber(
        client.relationshipXP
      )
    )
  );
}

export function getClientRelationshipScore(
  businessId: string,
  clientId: string
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  return client
    ? calculateRelationshipScore(
        client
      )
    : 0;
}

export function getClientRelationshipXP(
  businessId: string,
  clientId: string
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  return client
    ? Math.max(
        0,
        safeNumber(
          client.relationshipXP
        )
      )
    : 0;
}

export function getClientRelationshipReward(
  businessId: string,
  clientId: string
): BusinessClientReward {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return {
      clientId,
      businessId,
      eligible: false,
      multiplier: 1,
      bonusPercent: 0,
      reason:
        "Client not found.",
    };
  }

  const relationshipScore =
    calculateRelationshipScore(
      client
    );

  const eligible =
    client.status ===
      "returning" ||
    client.status ===
      "vip" ||
    safeNumber(
      client.repeatContractStreak
    ) > 0;

  const multiplier =
    getRelationshipRewardMultiplier(
      client
    );

  return {
    clientId,
    businessId,
    eligible,
    multiplier:
      eligible
        ? multiplier
        : 1,
    bonusPercent:
      eligible
        ? calculateRepeatContractBonusPercent(
            client
          )
        : 0,
    reason:
      eligible
        ? `Relationship level ${
            client.relationshipLevel ??
            "new"
          } with a score of ${relationshipScore}.`
        : "Client has not reached repeat-client eligibility yet.",
  };
}

export function calculateClientContractReward(
  businessId: string,
  clientId: string,
  baseAmount: number
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (
    !client ||
    baseAmount <= 0
  ) {
    return 0;
  }

  const reward =
    baseAmount *
    Math.max(
      0,
      getRelationshipRewardMultiplier(
        client
      ) - 1
    );

  return Math.floor(
    reward
  );
}

export function recordClientReward(
  businessId: string,
  clientId: string,
  rewardAmount: number
): BusinessClient | null {
  if (
    rewardAmount <= 0
  ) {
    return getBusinessClient(
      businessId,
      clientId
    );
  }

  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  normalizeClient(
    client
  );

  client.totalRewardsEarned =
    safeNumber(
      client.totalRewardsEarned
    ) +
    Math.max(
      0,
      rewardAmount
    );

  saveAllClients(all);

  return client;
}

export function getPreferredBusinessClientService(
  businessId: string,
  clientId: string
): string | null {
  return (
    getBusinessClient(
      businessId,
      clientId
    )?.preferredService ??
    null
  );
}

export function setClientPreferences(
  businessId: string,
  clientId: string,
  preferences: {
    preferredService?: string;
    preferredLocation?: string;
  }
): BusinessClient | null {
  const all =
    loadAllClients();

  const clients =
    all[businessId];

  if (!clients) {
    return null;
  }

  const client =
    clients.find(
      (item) =>
        item.id ===
        clientId
    );

  if (!client) {
    return null;
  }

  if (
    preferences.preferredService !==
    undefined
  ) {
    client.preferredService =
      preferences.preferredService.trim() ||
      undefined;
  }

  if (
    preferences.preferredLocation !==
    undefined
  ) {
    client.preferredLocation =
      preferences.preferredLocation.trim() ||
      undefined;
  }

  saveAllClients(all);

  return client;
}

export function getClientRetentionScore(
  businessId: string,
  clientId: string
): number {
  const client =
    getBusinessClient(
      businessId,
      clientId
    );

  if (!client) {
    return 0;
  }

  const relationshipScore =
    calculateRelationshipScore(
      client
    );

  const repeatScore =
    clamp(
      safeNumber(
        client.completedContracts
      ) * 10
    );

  const recencyDays =
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          client.lastInteractionAt) /
          (24 *
            60 *
            60 *
            1000)
      )
    );

  const recencyScore =
    clamp(
      100 -
        recencyDays * 3
    );

  return Number(
    (
      relationshipScore *
        0.5 +
      repeatScore * 0.2 +
      recencyScore * 0.3
    ).toFixed(1)
  );
}

export function getClientsAtRisk(
  businessId: string
): BusinessClient[] {
  return getBusinessClients(
    businessId
  ).filter(
    (client) => {
      if (
        client.status ===
        "lost"
      ) {
        return false;
      }

      const retention =
        getClientRetentionScore(
          businessId,
          client.id
        );

      return (
        retention < 50 ||
        client.satisfaction <
          50 ||
        client.trust < 40 ||
        client.loyalty < 40
      );
    }
  );
}

export function resetBusinessClients(
  businessId: string
): void {
  const allClients =
    loadAllClients();

  const clients =
    allClients[
      businessId
    ] ?? [];

  const clientIds =
    new Set(
      clients.map(
        (client) =>
          client.id
      )
    );

  delete allClients[
    businessId
  ];

  saveAllClients(
    allClients
  );

  const allInteractions =
    loadAllInteractions();

  for (
    const clientId of
      clientIds
  ) {
    delete allInteractions[
      clientId
    ];
  }

  saveAllInteractions(
    allInteractions
  );
}

export function resetAllBusinessClients(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    CLIENTS_KEY
  );

  localStorage.removeItem(
    INTERACTIONS_KEY
  );
}