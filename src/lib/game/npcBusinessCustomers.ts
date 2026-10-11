import { NPC } from "@/lib/game/npcs";
import {
  canNPCSpend,
  spendNPCMoney,
  getNPCEconomyProfile,
} from "@/lib/game/npcEconomy";
type OwnedBusiness = {
  id: string;
  name?: string;
  businessName?: string;
  category?: string;
  type?: string;
  locationId?: string;
  location?: string;
};

export type CustomerVisitType =
  | "food"
  | "shopping"
  | "beauty"
  | "hospitality"
  | "entertainment"
  | "automotive"
  | "media"
  | "technology"
  | "logistics"
  | "real_estate"
  | "fashion"
  | "interior"
  | "general";

type NPCExpenseCategory =
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

export interface NPCBusinessVisit {
  npcId: string;
  businessId: string;
  businessName: string;
  locationId: string;
  visitType: CustomerVisitType;
  amountSpent: number;
  durationMinutes: number;
  successful: boolean;
  createdAt: number;
}

export interface NPCBusinessCustomerResult {
  npc: NPC;
  business: OwnedBusiness;
  visit: NPCBusinessVisit;
  message: string;
}

export interface NPCBusinessRevenue {
  businessId: string;
  businessName: string;
  visits: number;
  revenue: number;
  averageSpend: number;
  lastVisitAt: number | null;
}

const visitHistory: NPCBusinessVisit[] = [];

const BUSINESS_TYPE_MAP: Record<
  string,
  CustomerVisitType
> = {
  restaurant: "food",
  food: "food",
  fashion: "fashion",
  beauty: "beauty",
  salon: "beauty",
  hotel: "hospitality",
  hospitality: "hospitality",
  entertainment: "entertainment",
  gaming: "entertainment",
  automotive: "automotive",
  car: "automotive",
  media: "media",
  technology: "technology",
  tech: "technology",
  logistics: "logistics",
  real_estate: "real_estate",
  property: "real_estate",
  interior: "interior",
  interior_design: "interior",
  shopping: "shopping",
};

const EXPENSE_CATEGORY_MAP: Record<
  CustomerVisitType,
  NPCExpenseCategory
> = {
  food: "food",
  shopping: "shopping",
  beauty: "shopping",
  hospitality: "entertainment",
  entertainment: "entertainment",
  automotive: "transport",
  media: "business",
  technology: "business",
  logistics: "transport",
  real_estate: "housing",
  fashion: "shopping",
  interior: "housing",
  general: "miscellaneous",
};

const SPENDING_RANGES: Record<
  CustomerVisitType,
  [number, number]
> = {
  food: [800, 12000],
  shopping: [1500, 30000],
  beauty: [2000, 25000],
  hospitality: [5000, 80000],
  entertainment: [1000, 25000],
  automotive: [5000, 100000],
  media: [3000, 50000],
  technology: [5000, 100000],
  logistics: [2000, 50000],
  real_estate: [10000, 150000],
  fashion: [3000, 50000],
  interior: [5000, 120000],
  general: [500, 10000],
};

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

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getBusinessType(
  business: OwnedBusiness
): CustomerVisitType {
  const record = business as OwnedBusiness & {
    category?: string;
    type?: string;
  };

  const rawType =
    record.category ??
    record.type ??
    "general";

  return (
    BUSINESS_TYPE_MAP[
      normalize(rawType)
    ] ?? "general"
  );
}

function getBusinessName(
  business: OwnedBusiness
): string {
  const record = business as OwnedBusiness & {
    name?: string;
    businessName?: string;
  };

  return (
    record.name ??
    record.businessName ??
    "Player Business"
  );
}

function getBusinessLocation(
  business: OwnedBusiness
): string {
  const record = business as OwnedBusiness & {
    locationId?: string;
    location?: string;
  };

  return (
    record.locationId ??
    record.location ??
    "garki"
  );
}

function getCustomerMultiplier(
  npc: NPC
): number {
  const profile =
    getNPCEconomyProfile(npc)

  switch (profile.wealthLevel) {
    case "elite":
      return 2;

    case "wealthy":
      return 1.6;

    case "upper_middle":
      return 1.3;

    case "middle":
      return 1;

    case "lower_middle":
      return 0.8;

    case "poor":
      return 0.6;

    default:
      return 1;
  }
}

function isNPCInterested(
  npc: NPC,
  business: OwnedBusiness
): boolean {
  const type =
    getBusinessType(business);

  if (npc.activity === "sleeping") {
    return false;
  }

  if (
    npc.activity === "working" &&
    type !== "food" &&
    type !== "shopping"
  ) {
    return false;
  }

  if (
    npc.role === "tourist" &&
    (
      type === "hospitality" ||
      type === "entertainment" ||
      type === "food"
    )
  ) {
    return true;
  }

  if (
    npc.activity === "shopping" &&
    (
      type === "shopping" ||
      type === "fashion" ||
      type === "beauty"
    )
  ) {
    return true;
  }

  if (
    npc.activity === "eating" &&
    type === "food"
  ) {
    return true;
  }

  if (
    npc.activity === "socializing" &&
    (
      type === "entertainment" ||
      type === "food" ||
      type === "beauty"
    )
  ) {
    return true;
  }

  if (
    npc.activity === "relaxing" &&
    (
      type === "hospitality" ||
      type === "entertainment"
    )
  ) {
    return true;
  }

  if (
    npc.role === "business_owner" &&
    (
      type === "technology" ||
      type === "real_estate" ||
      type === "interior"
    )
  ) {
    return true;
  }

  return Math.random() < 0.35;
}

export function canNPCVisitBusiness(
  npc: NPC,
  business: OwnedBusiness
): boolean {
  if (
    !isNPCInterested(
      npc,
      business
    )
  ) {
    return false;
  }

  const type =
    getBusinessType(business);

  const range =
    SPENDING_RANGES[type];

  const multiplier =
    getCustomerMultiplier(npc);

  const estimatedCost =
    Math.max(
      100,
      Math.floor(
        range[0] * multiplier
      )
    );

  return canNPCSpend(
    npc,
    estimatedCost
  );
}

export function createNPCBusinessVisit(
  npc: NPC,
  business: OwnedBusiness
): NPCBusinessCustomerResult {
  const type =
    getBusinessType(business);

  const businessName =
    getBusinessName(business);

  const locationId =
    getBusinessLocation(business);

  const range =
    SPENDING_RANGES[type];

  const multiplier =
    getCustomerMultiplier(npc);

  const amount = Math.max(
    100,
    Math.floor(
      randomBetween(
        range[0],
        range[1]
      ) * multiplier
    )
  );

  const expenseCategory =
    EXPENSE_CATEGORY_MAP[type];

  if (
    !canNPCSpend(
      npc,
      amount
    )
  ) {
    const failedVisit: NPCBusinessVisit = {
      npcId: npc.id,
      businessId: business.id,
      businessName,
      locationId,
      visitType: type,
      amountSpent: 0,
      durationMinutes:
        randomBetween(5, 20),
      successful: false,
      createdAt: Date.now(),
    };

    visitHistory.push(
      failedVisit
    );

    return {
      npc,
      business,
      visit: failedVisit,
      message:
        `${npc.name} wanted to visit ${businessName}, but could not afford it.`,
    };
  }

  const spending =
    spendNPCMoney(
      npc,
      amount,
      expenseCategory,
      locationId,
      `Purchase at ${businessName}`
    );

  const successful =
    spending.success;

  const visit: NPCBusinessVisit = {
    npcId: npc.id,
    businessId: business.id,
    businessName,
    locationId,
    visitType: type,
    amountSpent:
      successful ? amount : 0,
    durationMinutes:
      randomBetween(15, 120),
    successful,
    createdAt: Date.now(),
  };

  visitHistory.push(visit);

  return {
    npc,
    business,
    visit,
    message: successful
      ? `${npc.name} visited ${businessName} and spent ₦${amount.toLocaleString()}.`
      : `${npc.name} could not complete the purchase at ${businessName}.`,
  };
}

export function processNPCBusinessCustomers(
  npcs: NPC[],
  business: OwnedBusiness,
  maxCustomers = 10
): NPCBusinessCustomerResult[] {
  const eligible =
    npcs.filter((npc) =>
      canNPCVisitBusiness(
        npc,
        business
      )
    );

  const shuffled =
    [...eligible].sort(
      () => Math.random() - 0.5
    );

  return shuffled
    .slice(0, maxCustomers)
    .map((npc) =>
      createNPCBusinessVisit(
        npc,
        business
      )
    );
}

export function processNPCBusinessTraffic(
  npcs: NPC[],
  businesses: OwnedBusiness[],
  maxCustomersPerBusiness = 10
): NPCBusinessCustomerResult[] {
  const results: NPCBusinessCustomerResult[] =
    [];

  for (const business of businesses) {
    results.push(
      ...processNPCBusinessCustomers(
        npcs,
        business,
        maxCustomersPerBusiness
      )
    );
  }

  return results;
}

export function getNPCBusinessRevenue(
  businessId: string
): NPCBusinessRevenue {
  const visits =
    visitHistory.filter(
      (visit) =>
        visit.businessId ===
          businessId &&
        visit.successful
    );

  const revenue =
    visits.reduce(
      (total, visit) =>
        total +
        visit.amountSpent,
      0
    );

  return {
    businessId,
    businessName:
      visits[0]?.businessName ??
      "Player Business",
    visits: visits.length,
    revenue,
    averageSpend:
      visits.length > 0
        ? Math.floor(
            revenue /
              visits.length
          )
        : 0,
    lastVisitAt:
      visits.length > 0
        ? Math.max(
            ...visits.map(
              (visit) =>
                visit.createdAt
            )
          )
        : null,
  };
}

export function getAllNPCBusinessRevenue(): NPCBusinessRevenue[] {
  const businessIds =
    new Set(
      visitHistory.map(
        (visit) =>
          visit.businessId
      )
    );

  return Array.from(
    businessIds
  ).map((businessId) =>
    getNPCBusinessRevenue(
      businessId
    )
  );
}

export function getTotalPlayerBusinessRevenue(): number {
  return visitHistory.reduce(
    (total, visit) =>
      total +
      (visit.successful
        ? visit.amountSpent
        : 0),
    0
  );
}

export function getSuccessfulNPCVisits(): NPCBusinessVisit[] {
  return visitHistory.filter(
    (visit) =>
      visit.successful
  );
}

export function getFailedNPCVisits(): NPCBusinessVisit[] {
  return visitHistory.filter(
    (visit) =>
      !visit.successful
  );
}

export function getNPCBusinessVisitHistory(
  businessId?: string
): NPCBusinessVisit[] {
  if (!businessId) {
    return [...visitHistory];
  }

  return visitHistory.filter(
    (visit) =>
      visit.businessId ===
      businessId
  );
}

export function getNPCBusinessCustomerCount(
  businessId: string
): number {
  return visitHistory.filter(
    (visit) =>
      visit.businessId ===
        businessId &&
      visit.successful
  ).length;
}

export function getNPCBusinessRevenueSince(
  businessId: string,
  sinceTimestamp: number
): number {
  return visitHistory
    .filter(
      (visit) =>
        visit.businessId ===
          businessId &&
        visit.successful &&
        visit.createdAt >=
          sinceTimestamp
    )
    .reduce(
      (total, visit) =>
        total +
        visit.amountSpent,
      0
    );
}

export function getMostPopularNPCBusinesses(
  limit = 10
): NPCBusinessRevenue[] {
  return getAllNPCBusinessRevenue()
    .sort(
      (a, b) =>
        b.visits - a.visits
    )
    .slice(0, limit);
}

export function getHighestEarningNPCBusinesses(
  limit = 10
): NPCBusinessRevenue[] {
  return getAllNPCBusinessRevenue()
    .sort(
      (a, b) =>
        b.revenue -
        a.revenue
    )
    .slice(0, limit);
}

export function resetNPCBusinessCustomerHistory(): void {
  visitHistory.length = 0;
}

export function getNPCBusinessCustomerSummary(): {
  totalVisits: number;
  successfulVisits: number;
  failedVisits: number;
  totalRevenue: number;
  averageSpend: number;
  businessesVisited: number;
} {
  const successful =
    getSuccessfulNPCVisits();

  const revenue =
    successful.reduce(
      (total, visit) =>
        total +
        visit.amountSpent,
      0
    );

  const businesses =
    new Set(
      successful.map(
        (visit) =>
          visit.businessId
      )
    );

  return {
    totalVisits:
      visitHistory.length,
    successfulVisits:
      successful.length,
    failedVisits:
      visitHistory.length -
      successful.length,
    totalRevenue:
      revenue,
    averageSpend:
      successful.length > 0
        ? Math.floor(
            revenue /
              successful.length
          )
        : 0,
    businessesVisited:
      businesses.size,
  };
}