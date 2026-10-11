import type { Vehicle, OwnedVehicle } from "./vehicles";

export interface DrivingDestination {
  id: string;
  name: string;
  neighborhood: string;
  locationId: string;
  distanceKm: number;
  difficulty: "easy" | "medium" | "hard";
  trafficLevel: number;
  description: string;
}

export interface DrivingResult {
  completed: boolean;
  score: number;
  safetyScore: number;
  speedScore: number;
  controlScore: number;
  trafficScore: number;
  mistakes: number;
  distanceKm: number;
  fuelUsed: number;
  conditionLoss: number;
  message: string;
}

export const DRIVING_DESTINATIONS: DrivingDestination[] = [
  {
    id: "wuse-to-jabi",
    name: "Jabi Lake",
    neighborhood: "Jabi",
    locationId: "jabi",
    distanceKm: 7.4,
    difficulty: "easy",
    trafficLevel: 35,
    description: "A relaxed city drive toward Jabi Lake.",
  },
  {
    id: "garki-to-wuse",
    name: "Wuse Market",
    neighborhood: "Wuse",
    locationId: "wuse",
    distanceKm: 5.8,
    difficulty: "easy",
    trafficLevel: 45,
    description: "A busy urban route through central Abuja.",
  },
  {
    id: "garki-to-maitama",
    name: "Maitama",
    neighborhood: "Maitama",
    locationId: "maitama",
    distanceKm: 8.9,
    difficulty: "medium",
    trafficLevel: 40,
    description:
      "Drive through the capital toward the luxury district.",
  },
  {
    id: "wuse-to-gwarinpa",
    name: "Gwarinpa",
    neighborhood: "Gwarinpa",
    locationId: "gwarinpa",
    distanceKm: 12.6,
    difficulty: "medium",
    trafficLevel: 65,
    description:
      "A longer route with heavier traffic.",
  },
  {
    id: "garki-to-airport",
    name: "Nnamdi Azikiwe Airport",
    neighborhood: "Airport",
    locationId: "airport",
    distanceKm: 32.5,
    difficulty: "hard",
    trafficLevel: 55,
    description:
      "A long highway run toward Abuja airport.",
  },
  {
    id: "maitama-to-asokoro",
    name: "Asokoro",
    neighborhood: "Asokoro",
    locationId: "asokoro",
    distanceKm: 9.8,
    difficulty: "medium",
    trafficLevel: 50,
    description:
      "A premium route through Abuja's high-end districts.",
  },
];

export function getDrivingDestination(
  id: string
): DrivingDestination | undefined {
  return DRIVING_DESTINATIONS.find(
    (destination) => destination.id === id
  );
}

export function getDrivingFuelUsage(
  vehicle: Vehicle,
  ownedVehicle: OwnedVehicle,
  distanceKm: number,
  trafficLevel: number
): number {
  const efficiency = Math.max(
    25,
    vehicle.fuelEfficiency
  );

  const baseUsage =
    (distanceKm / efficiency) * 100;

  const trafficMultiplier =
    1 + trafficLevel / 250;

  let conditionMultiplier = 1;

  if (ownedVehicle.condition < 40) {
    conditionMultiplier = 1.25;
  } else if (ownedVehicle.condition < 70) {
    conditionMultiplier = 1.12;
  }

  return Math.min(
    100,
    Math.max(
      1,
      baseUsage *
        trafficMultiplier *
        conditionMultiplier
    )
  );
}

export function calculateConditionLoss(
  vehicle: Vehicle,
  mistakes: number,
  trafficLevel: number
): number {
  const reliabilityFactor =
    Math.max(
      0.5,
      (100 - vehicle.reliability) / 100
    );

  let trafficDamage = 0.25;

  if (trafficLevel >= 70) {
    trafficDamage = 1;
  } else if (trafficLevel >= 45) {
    trafficDamage = 0.5;
  }

  return Math.max(
    0,
    Math.min(
      12,
      Math.round(
        mistakes * 1.4 +
          trafficDamage +
          reliabilityFactor * 2
      )
    )
  );
}

export function calculateDrivingScore(
  safetyScore: number,
  speedScore: number,
  controlScore: number,
  trafficScore: number
): number {
  return Math.round(
    safetyScore * 0.35 +
      speedScore * 0.2 +
      controlScore * 0.25 +
      trafficScore * 0.2
  );
}

export function getDrivingMessage(
  score: number,
  mistakes: number
): string {
  if (score >= 95) {
    return "Perfect drive. Abuja traffic barely touched you.";
  }

  if (score >= 85) {
    return "Excellent drive. You handled the road like a pro.";
  }

  if (score >= 70) {
    return "Good drive. You arrived safely and efficiently.";
  }

  if (score >= 50) {
    return "You made it, but your driving needs some work.";
  }

  if (mistakes >= 5) {
    return "That was rough. Your vehicle took a beating.";
  }

  return "You arrived, but that was not your best drive.";
}