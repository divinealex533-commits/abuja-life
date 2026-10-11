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

function loadAllClients(): Record<
  string,
  BusinessClient[]
> {
  if (
    typeof window === "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(
        CLIENTS_KEY
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
  if (
    typeof window === "undefined"
  ) {
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
  if (
    typeof window === "undefined"
  ) {
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
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    INTERACTIONS_KEY,
    JSON.stringify(
      interactions
    )
  );
}

function clamp(
  value: number,
  min = 0,
  max = 100
): number {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
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
        (24 *
          60 *
          60 *
          1000)
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

  if (!all[params.businessId]) {
    all[params.businessId] =
      [];
  }

  const existing =
    all[params.businessId].find(
      (client) =>
        client.name.toLowerCase() ===
        params.name
          .trim()
          .toLowerCase()
    );

  if (existing) {
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
      lastInteractionAt: now,
      firstInteractionAt: now,
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
    };

  all[params.businessId].push(
    client
  );

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

  return all[businessId]
    ? [...all[businessId]]
    : [];
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

  const amount =
    Math.max(
      0,
      params.amount ?? 0
    );

  const now =
    Date.now();

  client.satisfaction =
    clamp(
      client.satisfaction +
        (params.satisfactionChange ??
          0)
    );

  client.trust =
    clamp(
      client.trust +
        (params.trustChange ??
          0)
    );

  client.loyalty =
    clamp(
      client.loyalty +
        (params.loyaltyChange ??
          0)
    );

  client.reputation =
    clamp(
      client.reputation +
        (params.reputationChange ??
          0)
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

  const interaction: BusinessClientInteraction =
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
      satisfactionChange:
        params.satisfactionChange ??
        0,
      trustChange:
        params.trustChange ??
        0,
      loyaltyChange:
        params.loyaltyChange ??
        0,
      reputationChange:
        params.reputationChange ??
        0,
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

  if (
    params.completed === false
  ) {
    client.cancelledContracts +=
      1;
  } else {
    client.completedContracts +=
      1;
  }

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

  const interactions: BusinessClientInteraction[] =
    [];

  for (const clientInteractions of Object.values(
    all
  )) {
    for (const interaction of clientInteractions) {
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
      : client.tier === "platinum"
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
    .slice(0, limit);
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
    .slice(0, limit);
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
    .slice(0, limit);
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

  client.tier =
    calculateClientTier(
      client.totalSpent
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

  for (const client of clients) {
    updateClientStatus(
      businessId,
      client.id
    );
  }

  return getBusinessClients(
    businessId
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

  for (const clientId of clientIds) {
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