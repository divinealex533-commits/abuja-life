// Abuja Life — Taxi Driver Gameplay
// Rich taxi missions, route choices, traffic events,
// passenger satisfaction and tips.

export type TaxiRouteStyle = "safe" | "fast" | "balanced";

export type TaxiTrafficLevel = "light" | "normal" | "heavy";

export interface TaxiMission {
  id: string;
  pickup: string;
  destination: string;
  passenger: string;
  passengerMood: string;
  baseFare: number;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: TaxiTrafficLevel;
  difficulty: "easy" | "medium" | "hard";
}

export interface TaxiRoute {
  style: TaxiRouteStyle;
  name: string;
  description: string;
  timeModifier: number;
  satisfactionModifier: number;
  energyModifier: number;
  rewardModifier: number;
}

export interface TaxiTripResult {
  fare: number;
  tip: number;
  reputation: number;
  satisfaction: number;
  energyCost: number;
  message: string;
}

export const TAXI_MISSIONS: TaxiMission[] = [
  {
    id: "taxi-jabi-wuse",
    pickup: "Jabi",
    destination: "Wuse",
    passenger: "Chinedu",
    passengerMood: "In a hurry",
    baseFare: 2200,
    distanceKm: 8,
    estimatedMinutes: 18,
    traffic: "normal",
    difficulty: "easy",
  },
  {
    id: "taxi-maitama-cbd",
    pickup: "Maitama",
    destination: "CBD",
    passenger: "Aisha",
    passengerMood: "Relaxed",
    baseFare: 3000,
    distanceKm: 7,
    estimatedMinutes: 20,
    traffic: "light",
    difficulty: "easy",
  },
  {
    id: "taxi-garki-jabi",
    pickup: "Garki",
    destination: "Jabi",
    passenger: "David",
    passengerMood: "Friendly",
    baseFare: 2800,
    distanceKm: 10,
    estimatedMinutes: 25,
    traffic: "normal",
    difficulty: "medium",
  },
  {
    id: "taxi-wuse-gwarinpa",
    pickup: "Wuse 2",
    destination: "Gwarinpa",
    passenger: "Fatima",
    passengerMood: "Running late",
    baseFare: 3500,
    distanceKm: 14,
    estimatedMinutes: 32,
    traffic: "heavy",
    difficulty: "medium",
  },
  {
    id: "taxi-airport-cbd",
    pickup: "Airport",
    destination: "CBD",
    passenger: "Michael",
    passengerMood: "Tired after a flight",
    baseFare: 5500,
    distanceKm: 35,
    estimatedMinutes: 45,
    traffic: "heavy",
    difficulty: "hard",
  },
  {
    id: "taxi-jabi-maitama",
    pickup: "Jabi",
    destination: "Maitama",
    passenger: "Blessing",
    passengerMood: "Chatty",
    baseFare: 3200,
    distanceKm: 11,
    estimatedMinutes: 26,
    traffic: "normal",
    difficulty: "medium",
  },
];

export const TAXI_ROUTES: TaxiRoute[] = [
  {
    style: "safe",
    name: "Safe Route",
    description:
      "Take the calmer roads. Slower, but passengers feel safer.",
    timeModifier: 1.2,
    satisfactionModifier: 8,
    energyModifier: 1,
    rewardModifier: 0.95,
  },
  {
    style: "balanced",
    name: "Balanced Route",
    description:
      "A practical route that balances speed, safety and fuel.",
    timeModifier: 1,
    satisfactionModifier: 3,
    energyModifier: 1,
    rewardModifier: 1,
  },
  {
    style: "fast",
    name: "Fast Route",
    description:
      "Push for speed. Higher risk, but impatient passengers may tip more.",
    timeModifier: 0.8,
    satisfactionModifier: -2,
    energyModifier: 2,
    rewardModifier: 1.1,
  },
];

export function getTaxiMissionById(
  missionId: string
): TaxiMission | undefined {
  return TAXI_MISSIONS.find(
    (mission) => mission.id === missionId
  );
}

export function getTaxiRoute(
  style: TaxiRouteStyle
): TaxiRoute {
  return (
    TAXI_ROUTES.find(
      (route) => route.style === style
    ) ?? TAXI_ROUTES[1]
  );
}

export function calculateTaxiTrip(
  mission: TaxiMission,
  routeStyle: TaxiRouteStyle,
  performance = 0.8
): TaxiTripResult {
  const route = getTaxiRoute(routeStyle);

  const safePerformance = Math.max(
    0,
    Math.min(1, performance)
  );

  const trafficPenalty =
    mission.traffic === "heavy"
      ? 5
      : mission.traffic === "normal"
        ? 2
        : 0;

  const satisfaction = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        70 +
          safePerformance * 20 +
          route.satisfactionModifier -
          trafficPenalty
      )
    )
  );

  const fare = Math.round(
    mission.baseFare * route.rewardModifier
  );

  const tipRate =
    satisfaction >= 90
      ? 0.2
      : satisfaction >= 80
        ? 0.12
        : satisfaction >= 70
          ? 0.05
          : 0;

  const tip = Math.round(fare * tipRate);

  const reputation =
    satisfaction >= 90
      ? 5
      : satisfaction >= 80
        ? 4
        : satisfaction >= 70
          ? 3
          : 1;

  const energyCost =
    10 + mission.distanceKm + route.energyModifier * 2;

  let message = "Trip completed.";

  if (satisfaction >= 90) {
    message =
      "Excellent driving! The passenger loved the trip and left a generous tip.";
  } else if (satisfaction >= 80) {
    message =
      "Great trip! The passenger was happy with your service.";
  } else if (satisfaction >= 70) {
    message =
      "Trip completed. The passenger was reasonably satisfied.";
  } else {
    message =
      "Trip completed, but the passenger was not very impressed.";
  }

  return {
    fare,
    tip,
    reputation,
    satisfaction,
    energyCost,
    message,
  };
}

export function getTaxiTrafficLabel(
  traffic: TaxiTrafficLevel
): string {
  switch (traffic) {
    case "light":
      return "Light Traffic";
    case "heavy":
      return "Heavy Traffic";
    default:
      return "Normal Traffic";
  }
}