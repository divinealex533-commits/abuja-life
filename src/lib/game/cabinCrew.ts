"use client";

export type CabinCrewDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type CabinCrewAction =
  | "greet-passengers"
  | "check-cabin"
  | "demonstrate-safety"
  | "serve-meals"
  | "serve-drinks"
  | "assist-passenger"
  | "handle-complaint"
  | "manage-turbulence"
  | "secure-cabin"
  | "help-medical"
  | "assist-vip"
  | "prepare-landing"
  | "announce-update"
  | "handle-emergency";

export type CabinCrewScenarioType =
  | "boarding"
  | "service"
  | "passenger"
  | "safety"
  | "turbulence"
  | "medical"
  | "vip"
  | "emergency"
  | "landing";

export type CabinCrewOutcome =
  | "outstanding"
  | "excellent"
  | "good"
  | "mixed"
  | "poor"
  | "critical";

export interface CabinCrewFlight {
  id: string;
  name: string;
  route: string;
  airline: string;
  difficulty: CabinCrewDifficulty;
  description: string;
  passengers: number;
  vipPassengers: number;
  serviceRequests: number;
  safetyChecks: number;
  minReward: number;
  maxReward: number;
  timeLimit: number;
  reputation: number;
}

export interface CabinCrewScenario {
  id: string;
  flightId: string;
  title: string;
  instruction: string;
  type: CabinCrewScenarioType;
  correctActions: CabinCrewAction[];
  difficulty: CabinCrewDifficulty;
  timeLimit: number;
  successPoints: number;
  failurePoints: number;
}

export interface CabinCrewActionResult {
  success: boolean;
  points: number;
  message: string;
}

export interface CabinCrewResult {
  score: number;
  cash: number;
  reputation: number;
  passengerSatisfaction: number;
  safetyRating: number;
  correctActions: number;
  mistakes: number;
  passengersHelped: number;
  outcome: CabinCrewOutcome;
  rank: string;
}

export const CABIN_CREW_FLIGHTS: CabinCrewFlight[] = [
  {
    id: "abuja-kaduna-shuttle",
    name: "Abuja–Kaduna Shuttle",
    route: "Abuja → Kaduna",
    airline: "Abuja Air",
    difficulty: "easy",
    description:
      "A short domestic flight. Keep passengers comfortable, complete safety checks and deliver smooth service.",
    passengers: 54,
    vipPassengers: 2,
    serviceRequests: 8,
    safetyChecks: 4,
    minReward: 3000,
    maxReward: 7500,
    timeLimit: 85,
    reputation: 6,
  },
  {
    id: "abuja-lagos-service",
    name: "Abuja–Lagos Service",
    route: "Abuja → Lagos",
    airline: "Capital Wings",
    difficulty: "easy",
    description:
      "A busy domestic route with families, business travellers and a growing number of service requests.",
    passengers: 96,
    vipPassengers: 4,
    serviceRequests: 14,
    safetyChecks: 5,
    minReward: 4000,
    maxReward: 10000,
    timeLimit: 100,
    reputation: 8,
  },
  {
    id: "abuja-port-harcourt",
    name: "Abuja–Port Harcourt",
    route: "Abuja → Port Harcourt",
    airline: "Naija Airways",
    difficulty: "medium",
    description:
      "Manage a packed cabin while dealing with changing weather and several demanding passengers.",
    passengers: 118,
    vipPassengers: 6,
    serviceRequests: 18,
    safetyChecks: 6,
    minReward: 5500,
    maxReward: 14000,
    timeLimit: 115,
    reputation: 10,
  },
  {
    id: "abuja-accra",
    name: "Abuja–Accra International",
    route: "Abuja → Accra",
    airline: "West Africa Connect",
    difficulty: "medium",
    description:
      "An international flight requiring excellent passenger care, clear announcements and strict cabin procedures.",
    passengers: 146,
    vipPassengers: 8,
    serviceRequests: 22,
    safetyChecks: 7,
    minReward: 7000,
    maxReward: 18000,
    timeLimit: 135,
    reputation: 12,
  },
  {
    id: "abuja-cairo",
    name: "Abuja–Cairo International",
    route: "Abuja → Cairo",
    airline: "Global Africa Airways",
    difficulty: "hard",
    description:
      "A long international flight where fatigue, passenger needs and unexpected situations test your crew skills.",
    passengers: 188,
    vipPassengers: 10,
    serviceRequests: 28,
    safetyChecks: 8,
    minReward: 9000,
    maxReward: 24000,
    timeLimit: 155,
    reputation: 15,
  },
  {
    id: "abuja-dubai-vip",
    name: "Abuja–Dubai VIP Flight",
    route: "Abuja → Dubai",
    airline: "Royal Capital Airlines",
    difficulty: "hard",
    description:
      "A premium international flight filled with VIP passengers who expect flawless service.",
    passengers: 224,
    vipPassengers: 28,
    serviceRequests: 34,
    safetyChecks: 10,
    minReward: 12000,
    maxReward: 32000,
    timeLimit: 180,
    reputation: 20,
  },
  {
    id: "abuja-emergency-flight",
    name: "Abuja Emergency Flight",
    route: "Abuja → Lagos",
    airline: "Capital Wings",
    difficulty: "extreme",
    description:
      "A high-pressure flight where turbulence, a medical emergency and cabin safety problems happen at once.",
    passengers: 210,
    vipPassengers: 12,
    serviceRequests: 40,
    safetyChecks: 12,
    minReward: 18000,
    maxReward: 50000,
    timeLimit: 210,
    reputation: 28,
  },
];

export const CABIN_CREW_SCENARIOS: CabinCrewScenario[] = [
  {
    id: "boarding-greeting",
    flightId: "abuja-kaduna-shuttle",
    title: "Welcome Passengers",
    instruction:
      "Passengers are boarding. Welcome them professionally and help them settle into the cabin.",
    type: "boarding",
    correctActions: ["greet-passengers"],
    difficulty: "easy",
    timeLimit: 8,
    successPoints: 80,
    failurePoints: -25,
  },
  {
    id: "cabin-check",
    flightId: "abuja-kaduna-shuttle",
    title: "Pre-Flight Cabin Check",
    instruction:
      "The aircraft is almost ready for departure. Complete the final cabin inspection.",
    type: "safety",
    correctActions: ["check-cabin"],
    difficulty: "easy",
    timeLimit: 8,
    successPoints: 90,
    failurePoints: -35,
  },
  {
    id: "safety-demo",
    flightId: "abuja-lagos-service",
    title: "Safety Demonstration",
    instruction:
      "The doors are closing. Demonstrate the emergency procedures clearly.",
    type: "safety",
    correctActions: ["demonstrate-safety"],
    difficulty: "easy",
    timeLimit: 8,
    successPoints: 100,
    failurePoints: -40,
  },
  {
    id: "meal-service",
    flightId: "abuja-lagos-service",
    title: "Meal Service",
    instruction:
      "Passengers are ready for their meals. Begin cabin service efficiently.",
    type: "service",
    correctActions: ["serve-meals"],
    difficulty: "easy",
    timeLimit: 8,
    successPoints: 90,
    failurePoints: -30,
  },
  {
    id: "drink-service",
    flightId: "abuja-port-harcourt",
    title: "Beverage Service",
    instruction:
      "The beverage cart is ready. Serve passengers without blocking the aisle.",
    type: "service",
    correctActions: ["serve-drinks"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 105,
    failurePoints: -35,
  },
  {
    id: "passenger-assistance",
    flightId: "abuja-port-harcourt",
    title: "Passenger Needs Help",
    instruction:
      "An elderly passenger needs assistance with their luggage and seat.",
    type: "passenger",
    correctActions: ["assist-passenger"],
    difficulty: "medium",
    timeLimit: 8,
    successPoints: 120,
    failurePoints: -45,
  },
  {
    id: "angry-passenger",
    flightId: "abuja-port-harcourt",
    title: "Customer Complaint",
    instruction:
      "A passenger is upset about a delayed meal. Calm the situation professionally.",
    type: "passenger",
    correctActions: ["handle-complaint"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 125,
    failurePoints: -50,
  },
  {
    id: "turbulence-warning",
    flightId: "abuja-accra",
    title: "Turbulence Ahead",
    instruction:
      "The pilot has reported turbulence. Secure the cabin and prepare passengers.",
    type: "turbulence",
    correctActions: ["manage-turbulence", "secure-cabin"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 140,
    failurePoints: -60,
  },
  {
    id: "cabin-secure",
    flightId: "abuja-accra",
    title: "Secure Cabin",
    instruction:
      "Turbulence is getting stronger. Make sure the cabin is completely secure.",
    type: "turbulence",
    correctActions: ["secure-cabin"],
    difficulty: "hard",
    timeLimit: 6,
    successPoints: 150,
    failurePoints: -70,
  },
  {
    id: "medical-emergency",
    flightId: "abuja-cairo",
    title: "Medical Emergency",
    instruction:
      "A passenger has collapsed. Respond quickly and coordinate the medical response.",
    type: "medical",
    correctActions: ["help-medical"],
    difficulty: "hard",
    timeLimit: 7,
    successPoints: 180,
    failurePoints: -80,
  },
  {
    id: "vip-service",
    flightId: "abuja-dubai-vip",
    title: "VIP Passenger",
    instruction:
      "A high-profile VIP has requested immediate assistance. Handle the request discreetly.",
    type: "vip",
    correctActions: ["assist-vip"],
    difficulty: "hard",
    timeLimit: 7,
    successPoints: 175,
    failurePoints: -70,
  },
  {
    id: "vip-announcement",
    flightId: "abuja-dubai-vip",
    title: "Important Cabin Update",
    instruction:
      "Passengers need an important update about the flight. Make a clear announcement.",
    type: "vip",
    correctActions: ["announce-update"],
    difficulty: "hard",
    timeLimit: 7,
    successPoints: 155,
    failurePoints: -55,
  },
  {
    id: "landing-preparation",
    flightId: "abuja-cairo",
    title: "Prepare for Landing",
    instruction:
      "The aircraft is beginning its descent. Prepare the cabin for landing.",
    type: "landing",
    correctActions: ["prepare-landing"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 130,
    failurePoints: -50,
  },
  {
    id: "landing-announcement",
    flightId: "abuja-lagos-service",
    title: "Landing Announcement",
    instruction:
      "The aircraft is approaching Lagos. Make the final passenger announcement.",
    type: "landing",
    correctActions: ["announce-update"],
    difficulty: "easy",
    timeLimit: 7,
    successPoints: 90,
    failurePoints: -30,
  },
  {
    id: "major-emergency",
    flightId: "abuja-emergency-flight",
    title: "CABIN EMERGENCY",
    instruction:
      "The cabin is experiencing a serious emergency. Follow emergency procedures immediately.",
    type: "emergency",
    correctActions: ["handle-emergency", "secure-cabin"],
    difficulty: "extreme",
    timeLimit: 6,
    successPoints: 250,
    failurePoints: -120,
  },
  {
    id: "emergency-medical",
    flightId: "abuja-emergency-flight",
    title: "Emergency Medical Response",
    instruction:
      "A second passenger requires urgent assistance during the emergency.",
    type: "medical",
    correctActions: ["help-medical"],
    difficulty: "extreme",
    timeLimit: 6,
    successPoints: 240,
    failurePoints: -110,
  },
];

export function getCabinCrewFlight(
  flightId: string
): CabinCrewFlight | undefined {
  return CABIN_CREW_FLIGHTS.find(
    (flight) => flight.id === flightId
  );
}

export function getAllCabinCrewFlights(): CabinCrewFlight[] {
  return CABIN_CREW_FLIGHTS;
}

export function getRandomCabinCrewFlight(): CabinCrewFlight {
  return CABIN_CREW_FLIGHTS[
    Math.floor(Math.random() * CABIN_CREW_FLIGHTS.length)
  ];
}

export function getCabinCrewScenarios(
  flightId: string
): CabinCrewScenario[] {
  const scenarios = CABIN_CREW_SCENARIOS.filter(
    (scenario) => scenario.flightId === flightId
  );

  if (scenarios.length > 0) {
    return scenarios;
  }

  return CABIN_CREW_SCENARIOS;
}

export function getRandomCabinCrewScenario(
  flightId: string
): CabinCrewScenario {
  const scenarios = getCabinCrewScenarios(flightId);

  return scenarios[
    Math.floor(Math.random() * scenarios.length)
  ];
}

export function getCabinCrewResponseTime(
  scenario: CabinCrewScenario
): number {
  switch (scenario.difficulty) {
    case "easy":
      return scenario.timeLimit;

    case "medium":
      return Math.max(4, scenario.timeLimit - 1);

    case "hard":
      return Math.max(3, scenario.timeLimit - 2);

    case "extreme":
      return Math.max(3, scenario.timeLimit - 3);

    default:
      return scenario.timeLimit;
  }
}

export function getCabinCrewActionOutcome(
  scenario: CabinCrewScenario,
  action: CabinCrewAction
): CabinCrewActionResult {
  const success = scenario.correctActions.includes(action);

  if (success) {
    return {
      success: true,
      points: scenario.successPoints,
      message: getCabinCrewSuccessMessage(action),
    };
  }

  return {
    success: false,
    points: scenario.failurePoints,
    message: getCabinCrewFailureMessage(action),
  };
}

export function getCabinCrewSuccessMessage(
  action: CabinCrewAction
): string {
  switch (action) {
    case "greet-passengers":
      return "Excellent welcome. Passengers feel comfortable and valued.";

    case "check-cabin":
      return "Cabin inspection complete. Everything is ready for departure.";

    case "demonstrate-safety":
      return "Safety demonstration completed clearly and professionally.";

    case "serve-meals":
      return "Meal service is running smoothly. Great cabin organization.";

    case "serve-drinks":
      return "Excellent beverage service. The aisle stayed clear.";

    case "assist-passenger":
      return "Passenger assisted successfully. Great customer care.";

    case "handle-complaint":
      return "You handled the complaint calmly and professionally.";

    case "manage-turbulence":
      return "Turbulence procedure handled correctly. Passengers are reassured.";

    case "secure-cabin":
      return "Cabin secured. Passengers are safely prepared for turbulence.";

    case "help-medical":
      return "Medical response handled quickly. Excellent emergency teamwork.";

    case "assist-vip":
      return "VIP request handled discreetly and professionally.";

    case "prepare-landing":
      return "Cabin prepared perfectly for landing.";

    case "announce-update":
      return "Clear announcement. Passengers know exactly what is happening.";

    case "handle-emergency":
      return "Emergency procedure executed correctly. The cabin crew stayed calm.";

    default:
      return "Excellent cabin crew decision.";
  }
}

export function getCabinCrewFailureMessage(
  action: CabinCrewAction
): string {
  switch (action) {
    case "greet-passengers":
      return "Passengers were left waiting without assistance.";

    case "check-cabin":
      return "You missed an important cabin safety check.";

    case "demonstrate-safety":
      return "The safety demonstration was not completed correctly.";

    case "serve-meals":
      return "Meal service became disorganized and several passengers waited too long.";

    case "serve-drinks":
      return "The beverage service was poorly coordinated.";

    case "assist-passenger":
      return "The passenger did not receive the assistance they needed.";

    case "handle-complaint":
      return "The complaint escalated because it was not handled properly.";

    case "manage-turbulence":
      return "You reacted too slowly to the turbulence warning.";

    case "secure-cabin":
      return "The cabin was not secured properly before turbulence.";

    case "help-medical":
      return "The medical response was too slow.";

    case "assist-vip":
      return "The VIP request was not handled professionally.";

    case "prepare-landing":
      return "The cabin was not fully prepared for landing.";

    case "announce-update":
      return "The announcement was unclear and confused passengers.";

    case "handle-emergency":
      return "Emergency procedures were not followed correctly.";

    default:
      return "That was the wrong cabin crew decision.";
  }
}

function calculatePassengerSatisfaction(
  score: number,
  mistakes: number,
  totalActions: number
): number {
  if (totalActions <= 0) {
    return 0;
  }

  const baseAccuracy = Math.max(
    0,
    Math.min(
      100,
      (score / (totalActions * 140)) * 100
    )
  );

  const mistakePenalty = mistakes * 5;

  return Math.round(
    Math.max(
      0,
      Math.min(100, baseAccuracy - mistakePenalty)
    )
  );
}

function calculateSafetyRating(
  score: number,
  mistakes: number
): number {
  const base = Math.max(
    0,
    Math.min(100, 60 + score / 18)
  );

  return Math.round(
    Math.max(0, Math.min(100, base - mistakes * 7))
  );
}

function calculateCabinCrewOutcome(
  score: number,
  satisfaction: number,
  safetyRating: number
): CabinCrewOutcome {
  if (
    score >= 1400 &&
    satisfaction >= 92 &&
    safetyRating >= 92
  ) {
    return "outstanding";
  }

  if (
    score >= 1100 &&
    satisfaction >= 82 &&
    safetyRating >= 82
  ) {
    return "excellent";
  }

  if (
    score >= 800 &&
    satisfaction >= 70 &&
    safetyRating >= 70
  ) {
    return "good";
  }

  if (
    score >= 500 &&
    satisfaction >= 55 &&
    safetyRating >= 55
  ) {
    return "mixed";
  }

  if (
    score >= 250 &&
    satisfaction >= 35 &&
    safetyRating >= 40
  ) {
    return "poor";
  }

  return "critical";
}

function calculateCabinCrewRank(
  score: number,
  satisfaction: number,
  safetyRating: number
): string {
  if (
    score >= 1500 &&
    satisfaction >= 95 &&
    safetyRating >= 95
  ) {
    return "Legendary Purser";
  }

  if (
    score >= 1250 &&
    satisfaction >= 88 &&
    safetyRating >= 88
  ) {
    return "Senior Purser";
  }

  if (
    score >= 1000 &&
    satisfaction >= 78 &&
    safetyRating >= 80
  ) {
    return "Lead Cabin Crew";
  }

  if (
    score >= 750 &&
    satisfaction >= 68 &&
    safetyRating >= 70
  ) {
    return "Senior Cabin Crew";
  }

  if (
    score >= 450 &&
    satisfaction >= 55 &&
    safetyRating >= 55
  ) {
    return "Cabin Crew";
  }

  return "Junior Cabin Crew";
}

export function calculateCabinCrewResult(params: {
  flight: CabinCrewFlight;
  score: number;
  correctActions: number;
  mistakes: number;
  passengersHelped?: number;
}): CabinCrewResult {
  const {
    flight,
    score,
    correctActions,
    mistakes,
    passengersHelped = 0,
  } = params;

  const normalizedScore = Math.max(0, score);

  const totalActions = Math.max(
    flight.safetyChecks + 4,
    correctActions + mistakes
  );

  const passengerSatisfaction =
    calculatePassengerSatisfaction(
      normalizedScore,
      mistakes,
      totalActions
    );

  const safetyRating = calculateSafetyRating(
    normalizedScore,
    mistakes
  );

  const outcome = calculateCabinCrewOutcome(
    normalizedScore,
    passengerSatisfaction,
    safetyRating
  );

  const progress = Math.max(
    0,
    Math.min(1, normalizedScore / 1500)
  );

  const rewardRange =
    flight.maxReward - flight.minReward;

  const baseCash = Math.round(
    flight.minReward +
      rewardRange * progress
  );

  const outcomeMultiplier =
    outcome === "outstanding"
      ? 1.2
      : outcome === "excellent"
        ? 1.08
        : outcome === "good"
          ? 1
          : outcome === "mixed"
            ? 0.8
            : outcome === "poor"
              ? 0.55
              : 0.2;

  const cash = Math.round(
    baseCash * outcomeMultiplier
  );

  const reputationMultiplier =
    outcome === "outstanding"
      ? 1.6
      : outcome === "excellent"
        ? 1.35
        : outcome === "good"
          ? 1
          : outcome === "mixed"
            ? 0.7
            : outcome === "poor"
              ? 0.4
              : 0.15;

  const reputation = Math.max(
    0,
    Math.round(
      flight.reputation * reputationMultiplier
    )
  );

  return {
    score: normalizedScore,
    cash,
    reputation,
    passengerSatisfaction,
    safetyRating,
    correctActions,
    mistakes,
    passengersHelped,
    outcome,
    rank: calculateCabinCrewRank(
      normalizedScore,
      passengerSatisfaction,
      safetyRating
    ),
  };
}
