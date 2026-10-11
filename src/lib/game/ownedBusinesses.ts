"use client";

import {
  Business,
  OwnedBusiness,
  calculateBusinessRevenue,
  getBusinessById,
} from "@/lib/game/businesses";

const STORAGE_KEY = "abujaLifeOwnedBusinesses";

export function loadOwnedBusinesses(): OwnedBusiness[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOwnedBusinesses(
  businesses: OwnedBusiness[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(businesses)
  );
}

export function getOwnedBusiness(
  businessId: string
): OwnedBusiness | undefined {
  return loadOwnedBusinesses().find(
    (business) => business.businessId === businessId
  );
}

export function createOwnedBusiness(
  business: Business,
  ownerId?: string
): OwnedBusiness {
  return {
    id: crypto.randomUUID(),
    businessId: business.id,
    ownerId,

    name: `My ${business.name}`,

    level: 1,
    reputation: 0,

    condition: 100,
    customerSatisfaction: 100,

    dailyRevenue: calculateBusinessRevenue(
      business,
      1,
      0,
      100
    ),

    totalRevenue: 0,

    staffCount: 0,
    upgradeIds: [],

    locationId: business.locationId,

    createdAt: new Date().toISOString(),
  };
}

export function addOwnedBusiness(
  business: OwnedBusiness
): OwnedBusiness[] {
  const businesses = loadOwnedBusinesses();

  const alreadyOwned = businesses.some(
    (item) => item.businessId === business.businessId
  );

  if (alreadyOwned) {
    return businesses;
  }

  const updated = [...businesses, business];

  saveOwnedBusinesses(updated);

  return updated;
}

export function updateOwnedBusiness(
  businessId: string,
  updates: Partial<OwnedBusiness>
): OwnedBusiness[] {
  const businesses = loadOwnedBusinesses();

  const updated = businesses.map((business) =>
    business.id === businessId
      ? {
          ...business,
          ...updates,
        }
      : business
  );

  saveOwnedBusinesses(updated);

  return updated;
}

export function removeOwnedBusiness(
  businessId: string
): OwnedBusiness[] {
  const businesses = loadOwnedBusinesses();

  const updated = businesses.filter(
    (business) => business.id !== businessId
  );

  saveOwnedBusinesses(updated);

  return updated;
}

export function calculateOwnedBusinessRevenue(
  ownedBusiness: OwnedBusiness
): number {
  const business = getBusinessById(
    ownedBusiness.businessId
  );

  if (!business) {
    return 0;
  }

  return calculateBusinessRevenue(
    business,
    ownedBusiness.level,
    ownedBusiness.reputation,
    ownedBusiness.customerSatisfaction
  );
}

export function collectBusinessRevenue(
  businessId: string
): {
  amount: number;
  businesses: OwnedBusiness[];
} {
  const businesses = loadOwnedBusinesses();

  const target = businesses.find(
    (business) => business.id === businessId
  );

  if (!target) {
    return {
      amount: 0,
      businesses,
    };
  }

  const amount = calculateOwnedBusinessRevenue(target);

  const updated = businesses.map((business) =>
    business.id === businessId
      ? {
          ...business,
          dailyRevenue: amount,
          totalRevenue: business.totalRevenue + amount,
        }
      : business
  );

  saveOwnedBusinesses(updated);

  return {
    amount,
    businesses: updated,
  };
}

export function getBusinessCount(): number {
  return loadOwnedBusinesses().length;
}