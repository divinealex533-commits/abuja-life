// src/lib/game/garage.ts

import {
  OwnedVehicle,
  Vehicle,
  getVehicleById,
  calculateVehicleResaleValue,
} from "./vehicles";

const OWNED_VEHICLES_KEY = "abujaLifeOwnedVehicles";

export function loadOwnedVehicles(): OwnedVehicle[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(OWNED_VEHICLES_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveOwnedVehicles(
  vehicles: OwnedVehicle[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    OWNED_VEHICLES_KEY,
    JSON.stringify(vehicles)
  );
}

export function addOwnedVehicle(
  ownedVehicle: OwnedVehicle
): OwnedVehicle[] {
  const vehicles = loadOwnedVehicles();

  const updated = [...vehicles, ownedVehicle];

  saveOwnedVehicles(updated);

  return updated;
}

export function removeOwnedVehicle(
  vehicleId: string,
  purchasedAt: string
): OwnedVehicle[] {
  const vehicles = loadOwnedVehicles();

  const updated = vehicles.filter(
    (vehicle) =>
      !(
        vehicle.vehicleId === vehicleId &&
        vehicle.purchasedAt === purchasedAt
      )
  );

  saveOwnedVehicles(updated);

  return updated;
}

export function updateOwnedVehicle(
  updatedVehicle: OwnedVehicle
): OwnedVehicle[] {
  const vehicles = loadOwnedVehicles();

  const updated = vehicles.map((vehicle) => {
    if (
      vehicle.vehicleId === updatedVehicle.vehicleId &&
      vehicle.purchasedAt === updatedVehicle.purchasedAt
    ) {
      return updatedVehicle;
    }

    return vehicle;
  });

  saveOwnedVehicles(updated);

  return updated;
}

export function getOwnedVehicleCount(): number {
  return loadOwnedVehicles().length;
}

export function getVehicleFromOwned(
  ownedVehicle: OwnedVehicle
): Vehicle | undefined {
  return getVehicleById(ownedVehicle.vehicleId);
}

export function getOwnedVehicleValue(
  ownedVehicle: OwnedVehicle
): number {
  const vehicle = getVehicleFromOwned(ownedVehicle);

  if (!vehicle) {
    return 0;
  }

  return calculateVehicleResaleValue(
    vehicle,
    ownedVehicle
  );
}