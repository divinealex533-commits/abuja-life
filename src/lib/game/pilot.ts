"use client";

export type PilotDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type PilotAction =
  | "inspect"
  | "fuel"
  | "taxi"
  | "takeoff"
  | "climb"
  | "navigate"
  | "communicate"
  | "avoid"
  | "stabilize"
  | "descend"
  | "land"
  | "go-around";

export type PilotEventType =
  | "engine-warning"
  | "bad-weather"
  | "turbulence"
  | "navigation"
  | "fuel-warning"
  | "passenger"
  | "air-traffic"
  | "runway"
  | "bird-strike"
  | "hydraulic"
  | "final-approach"
  | "emergency";

export interface PilotMission {
  id: string;
  title: string;
  route: string;
  departure: string;
  destination: string;
  description: string;
  emoji: string;
  difficulty: PilotDifficulty;
  startingReward: number;
  maxReward: number;
  passengers: number;
  fuel: number;
  flightTime: number;
  weather: string;
}

export interface PilotScenario {
  id: string;
  title: string;
  description: string;
  type: PilotEventType;
  difficulty: PilotDifficulty;
  correctAction: PilotAction;
  safetyImpact: number;
  fuelImpact: number;
  navigationImpact: number;
  passengerImpact: number;
  reward: number;
}

export interface PilotResult {
  score: number;
  cash: number;
  reputation: number;
  passengersSafe: number;
  passengersAtRisk: number;
  fuelRemaining: number;
  safety: number;
  navigation: number;
  successfulActions: number;
  failedActions: number;
  missionsCompleted: number;
  flightTime: number;
  rank: string;
  message: string;
}

const PILOT_MISSIONS: PilotMission[] = [
  {
    id: "abuja-kaduna",
    title: "Abuja → Kaduna Shuttle",
    route: "Abuja → Kaduna",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Kaduna International Airport",
    description:
      "A short domestic passenger flight. Complete the pre-flight checks, navigate safely and deliver every passenger.",
    emoji: "🛫",
    difficulty: "easy",
    startingReward: 4500,
    maxReward: 10000,
    passengers: 48,
    fuel: 85,
    flightTime: 110,
    weather: "Clear skies",
  },
  {
    id: "abuja-lagos",
    title: "Abuja → Lagos Express",
    route: "Abuja → Lagos",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Murtala Muhammed International Airport",
    description:
      "A busy domestic route with heavier air traffic and a crowded arrival corridor.",
    emoji: "✈️",
    difficulty: "medium",
    startingReward: 6500,
    maxReward: 15000,
    passengers: 96,
    fuel: 90,
    flightTime: 145,
    weather: "Light cloud cover",
  },
  {
    id: "abuja-port-harcourt",
    title: "Abuja → Port Harcourt",
    route: "Abuja → Port Harcourt",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Port Harcourt International Airport",
    description:
      "A longer domestic flight where weather changes can test your navigation and fuel management.",
    emoji: "🌤️",
    difficulty: "medium",
    startingReward: 7500,
    maxReward: 18000,
    passengers: 112,
    fuel: 92,
    flightTime: 165,
    weather: "Scattered storms",
  },
  {
    id: "abuja-accra",
    title: "Abuja → Accra International",
    route: "Abuja → Accra",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Kotoka International Airport",
    description:
      "An international route requiring excellent communication, navigation and fuel discipline.",
    emoji: "🌍",
    difficulty: "hard",
    startingReward: 10000,
    maxReward: 24000,
    passengers: 138,
    fuel: 95,
    flightTime: 190,
    weather: "Crosswinds",
  },
  {
    id: "abuja-cairo",
    title: "Abuja → Cairo Long Haul",
    route: "Abuja → Cairo",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Cairo International Airport",
    description:
      "A demanding international flight with changing weather, fuel decisions and complex air traffic.",
    emoji: "🌍",
    difficulty: "hard",
    startingReward: 14000,
    maxReward: 32000,
    passengers: 176,
    fuel: 100,
    flightTime: 235,
    weather: "Variable conditions",
  },
  {
    id: "abuja-dubai",
    title: "Abuja → Dubai",
    route: "Abuja → Dubai",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Dubai International Airport",
    description:
      "A prestigious long-haul mission. Keep the aircraft stable, manage fuel and survive multiple high-pressure situations.",
    emoji: "🏙️",
    difficulty: "extreme",
    startingReward: 20000,
    maxReward: 48000,
    passengers: 224,
    fuel: 100,
    flightTime: 290,
    weather: "Severe weather corridor",
  },
  {
    id: "abuja-emergency",
    title: "Abuja Emergency Flight",
    route: "Abuja → Emergency Diversion",
    departure: "Nnamdi Azikiwe International Airport",
    destination: "Nearest Safe Airport",
    description:
      "A serious in-flight emergency. Protect your passengers, communicate with air traffic control and land safely.",
    emoji: "🚨",
    difficulty: "extreme",
    startingReward: 25000,
    maxReward: 60000,
    passengers: 190,
    fuel: 70,
    flightTime: 180,
    weather: "Severe turbulence",
  },
];

const PILOT_SCENARIOS: PilotScenario[] = [
  {
    id: "preflight-check",
    title: "Pre-Flight Inspection",
    description:
      "Your aircraft is preparing for departure. Complete the final inspection before leaving the gate.",
    type: "navigation",
    difficulty: "easy",
    correctAction: "inspect",
    safetyImpact: 8,
    fuelImpact: 0,
    navigationImpact: 4,
    passengerImpact: 2,
    reward: 500,
  },
  {
    id: "fuel-check",
    title: "Fuel Calculation",
    description:
      "The flight computer reports that fuel planning needs confirmation before takeoff.",
    type: "fuel-warning",
    difficulty: "easy",
    correctAction: "fuel",
    safetyImpact: 6,
    fuelImpact: 5,
    navigationImpact: 2,
    passengerImpact: 2,
    reward: 450,
  },
  {
    id: "taxi-clearance",
    title: "Taxi Clearance",
    description:
      "Ground control gives you clearance to taxi toward the runway.",
    type: "air-traffic",
    difficulty: "easy",
    correctAction: "taxi",
    safetyImpact: 5,
    fuelImpact: -2,
    navigationImpact: 5,
    passengerImpact: 2,
    reward: 400,
  },
  {
    id: "takeoff-clearance",
    title: "Takeoff Clearance",
    description:
      "The runway is clear and tower control has issued your departure instructions.",
    type: "runway",
    difficulty: "easy",
    correctAction: "takeoff",
    safetyImpact: 8,
    fuelImpact: -3,
    navigationImpact: 5,
    passengerImpact: 3,
    reward: 650,
  },
  {
    id: "rapid-climb",
    title: "Rapid Climb Warning",
    description:
      "Your aircraft is approaching another traffic corridor. Climb smoothly and maintain control.",
    type: "air-traffic",
    difficulty: "medium",
    correctAction: "climb",
    safetyImpact: 7,
    fuelImpact: -4,
    navigationImpact: 6,
    passengerImpact: 3,
    reward: 750,
  },
  {
    id: "navigation-update",
    title: "Navigation Update",
    description:
      "Air traffic control sends a new waypoint. Update your route before continuing.",
    type: "navigation",
    difficulty: "medium",
    correctAction: "navigate",
    safetyImpact: 4,
    fuelImpact: -2,
    navigationImpact: 10,
    passengerImpact: 3,
    reward: 800,
  },
  {
    id: "atc-communication",
    title: "ATC Communication",
    description:
      "Control requests your altitude, position and next waypoint.",
    type: "air-traffic",
    difficulty: "medium",
    correctAction: "communicate",
    safetyImpact: 8,
    fuelImpact: -1,
    navigationImpact: 8,
    passengerImpact: 3,
    reward: 850,
  },
  {
    id: "turbulence",
    title: "Severe Turbulence",
    description:
      "The aircraft enters a turbulent zone. Stabilize the aircraft and protect the passengers.",
    type: "turbulence",
    difficulty: "medium",
    correctAction: "stabilize",
    safetyImpact: 10,
    fuelImpact: -4,
    navigationImpact: 2,
    passengerImpact: 8,
    reward: 1000,
  },
  {
    id: "storm-front",
    title: "Storm Front Ahead",
    description:
      "Weather radar shows a dangerous storm directly along your current route.",
    type: "bad-weather",
    difficulty: "hard",
    correctAction: "avoid",
    safetyImpact: 12,
    fuelImpact: -8,
    navigationImpact: 10,
    passengerImpact: 8,
    reward: 1300,
  },
  {
    id: "engine-warning",
    title: "Engine Warning",
    description:
      "One engine reports an abnormal temperature. Keep the aircraft stable while assessing the situation.",
    type: "engine-warning",
    difficulty: "hard",
    correctAction: "stabilize",
    safetyImpact: 14,
    fuelImpact: -6,
    navigationImpact: 4,
    passengerImpact: 10,
    reward: 1700,
  },
  {
    id: "bird-strike",
    title: "Bird Strike Alert",
    description:
      "A bird strike has occurred. Monitor the aircraft and maintain control.",
    type: "bird-strike",
    difficulty: "hard",
    correctAction: "stabilize",
    safetyImpact: 12,
    fuelImpact: -5,
    navigationImpact: 3,
    passengerImpact: 10,
    reward: 1600,
  },
  {
    id: "fuel-warning",
    title: "Fuel Warning",
    description:
      "Fuel reserves are falling faster than expected. Review your route and fuel status immediately.",
    type: "fuel-warning",
    difficulty: "hard",
    correctAction: "fuel",
    safetyImpact: 10,
    fuelImpact: 10,
    navigationImpact: 6,
    passengerImpact: 7,
    reward: 1500,
  },
  {
    id: "passenger-emergency",
    title: "Passenger Medical Emergency",
    description:
      "Cabin crew reports a serious passenger emergency. Coordinate with the crew and prepare for possible diversion.",
    type: "passenger",
    difficulty: "hard",
    correctAction: "communicate",
    safetyImpact: 7,
    fuelImpact: -3,
    navigationImpact: 7,
    passengerImpact: 14,
    reward: 1800,
  },
  {
    id: "hydraulic-warning",
    title: "Hydraulic System Warning",
    description:
      "A hydraulic warning appears during descent preparation. Stabilize the aircraft before continuing.",
    type: "hydraulic",
    difficulty: "hard",
    correctAction: "stabilize",
    safetyImpact: 15,
    fuelImpact: -5,
    navigationImpact: 3,
    passengerImpact: 12,
    reward: 2200,
  },
  {
    id: "runway-change",
    title: "Runway Change",
    description:
      "Air traffic control changes your landing runway because of wind direction.",
    type: "runway",
    difficulty: "medium",
    correctAction: "navigate",
    safetyImpact: 8,
    fuelImpact: -3,
    navigationImpact: 9,
    passengerImpact: 4,
    reward: 1000,
  },
  {
    id: "final-approach",
    title: "Final Approach",
    description:
      "You are on final approach. Maintain a stable descent and prepare for landing.",
    type: "final-approach",
    difficulty: "medium",
    correctAction: "descend",
    safetyImpact: 10,
    fuelImpact: -4,
    navigationImpact: 7,
    passengerImpact: 5,
    reward: 1100,
  },
  {
    id: "crosswind-landing",
    title: "Strong Crosswind",
    description:
      "A powerful crosswind hits during final approach. Correct your alignment before touchdown.",
    type: "final-approach",
    difficulty: "hard",
    correctAction: "land",
    safetyImpact: 15,
    fuelImpact: -4,
    navigationImpact: 8,
    passengerImpact: 10,
    reward: 2300,
  },
  {
    id: "go-around",
    title: "Unsafe Landing",
    description:
      "The runway is no longer safe for touchdown. Abort the landing and try again.",
    type: "runway",
    difficulty: "hard",
    correctAction: "go-around",
    safetyImpact: 14,
    fuelImpact: -7,
    navigationImpact: 7,
    passengerImpact: 9,
    reward: 2100,
  },
  {
    id: "emergency-landing",
    title: "Emergency Landing",
    description:
      "The aircraft must land at the nearest safe airport. Communicate and prepare for the emergency approach.",
    type: "emergency",
    difficulty: "extreme",
    correctAction: "land",
    safetyImpact: 18,
    fuelImpact: -10,
    navigationImpact: 12,
    passengerImpact: 16,
    reward: 3500,
  },
];

const DIFFICULTY_MULTIPLIER: Record<
  PilotDifficulty,
  number
> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  extreme: 2.1,
};

export function getPilotMission(
  missionId: string
): PilotMission | null {
  return (
    PILOT_MISSIONS.find(
      (mission) => mission.id === missionId
    ) ?? null
  );
}

export function getAllPilotMissions(): PilotMission[] {
  return [...PILOT_MISSIONS];
}

export function getRandomPilotMission(): PilotMission {
  const index = Math.floor(
    Math.random() * PILOT_MISSIONS.length
  );

  return PILOT_MISSIONS[index];
}

export function getRandomPilotScenario(
  mission?: PilotMission
): PilotScenario {
  let scenarios = PILOT_SCENARIOS;

  if (mission) {
    const difficultyOrder: PilotDifficulty[] = [
      "easy",
      "medium",
      "hard",
      "extreme",
    ];

    const missionLevel =
      difficultyOrder.indexOf(mission.difficulty);

    scenarios = PILOT_SCENARIOS.filter((scenario) => {
      const scenarioLevel =
        difficultyOrder.indexOf(scenario.difficulty);

      return scenarioLevel <= missionLevel + 1;
    });
  }

  const index = Math.floor(
    Math.random() * scenarios.length
  );

  return scenarios[index];
}

export function getPilotResponseTime(
  mission: PilotMission
): number {
  const baseTime = mission.flightTime;

  const variation =
    Math.floor(Math.random() * 16) - 8;

  return Math.max(45, baseTime + variation);
}

export function getPilotActionOutcome(
  scenario: PilotScenario,
  action: PilotAction
): {
  success: boolean;
  safetyChange: number;
  fuelChange: number;
  navigationChange: number;
  passengerChange: number;
  scoreChange: number;
  cashChange: number;
} {
  const multiplier =
    DIFFICULTY_MULTIPLIER[scenario.difficulty];

  if (action === scenario.correctAction) {
    return {
      success: true,
      safetyChange: Math.round(
        scenario.safetyImpact
      ),
      fuelChange: scenario.fuelImpact,
      navigationChange: Math.round(
        scenario.navigationImpact
      ),
      passengerChange: Math.round(
        scenario.passengerImpact
      ),
      scoreChange: Math.round(
        100 * multiplier +
          scenario.reward / 10
      ),
      cashChange: Math.round(
        scenario.reward * multiplier
      ),
    };
  }

  return {
    success: false,
    safetyChange: -Math.round(
      scenario.safetyImpact * 0.8
    ),
    fuelChange: -Math.max(
      2,
      Math.abs(scenario.fuelImpact)
    ),
    navigationChange: -Math.max(
      2,
      Math.round(
        scenario.navigationImpact * 0.65
      )
    ),
    passengerChange: -Math.max(
      1,
      Math.round(
        scenario.passengerImpact * 0.6
      )
    ),
    scoreChange: -Math.round(
      80 * multiplier
    ),
    cashChange: -Math.round(
      scenario.reward * 0.35
    ),
  };
}

export function getPilotSuccessMessage(
  scenario: PilotScenario
): string {
  const messages: Record<
    PilotEventType,
    string
  > = {
    "engine-warning":
      "Engine stabilized. You kept the aircraft under control.",
    "bad-weather":
      "Storm avoided. The new route keeps the aircraft clear of the weather.",
    turbulence:
      "Aircraft stabilized. The cabin is safe.",
    navigation:
      "Navigation updated. You are back on the correct route.",
    "fuel-warning":
      "Fuel situation managed. Your reserves are back under control.",
    passenger:
      "Cabin crew coordinated. The passenger emergency is being handled.",
    "air-traffic":
      "ATC communication handled correctly.",
    runway:
      "Runway procedure completed safely.",
    "bird-strike":
      "Aircraft stabilized after the bird strike.",
    hydraulic:
      "Hydraulic warning managed. Aircraft remains stable.",
    "final-approach":
      "Final approach is stable.",
    emergency:
      "Emergency landing completed successfully.",
  };

  return (
    messages[scenario.type] ??
    "Excellent piloting. The situation is under control."
  );
}

export function getPilotFailureMessage(
  scenario: PilotScenario
): string {
  const messages: Record<
    PilotEventType,
    string
  > = {
    "engine-warning":
      "The engine warning became more serious.",
    "bad-weather":
      "The aircraft entered dangerous weather.",
    turbulence:
      "Passengers were affected by the turbulence.",
    navigation:
      "Navigation accuracy dropped.",
    "fuel-warning":
      "Fuel reserves became dangerously low.",
    passenger:
      "The passenger emergency became more difficult to manage.",
    "air-traffic":
      "ATC coordination broke down.",
    runway:
      "Runway procedures were not handled correctly.",
    "bird-strike":
      "Aircraft stability was affected.",
    hydraulic:
      "The hydraulic problem became more dangerous.",
    "final-approach":
      "The approach became unstable.",
    emergency:
      "The emergency situation became critical.",
  };

  return (
    messages[scenario.type] ??
    "The situation became more dangerous."
  );
}

export function calculatePilotResult(params: {
  mission: PilotMission;
  safety: number;
  navigation: number;
  fuelRemaining: number;
  passengersSafe: number;
  passengersAtRisk: number;
  successfulActions: number;
  failedActions: number;
  responseTime: number;
  missionsCompleted: number;
}): PilotResult {
  const {
    mission,
    safety,
    navigation,
    fuelRemaining,
    passengersSafe,
    passengersAtRisk,
    successfulActions,
    failedActions,
    responseTime,
    missionsCompleted,
  } = params;

  const multiplier =
    DIFFICULTY_MULTIPLIER[mission.difficulty];

  const safetyScore = Math.max(
    0,
    Math.min(100, safety)
  );

  const navigationScore = Math.max(
    0,
    Math.min(100, navigation)
  );

  const fuelScore = Math.max(
    0,
    Math.min(100, fuelRemaining)
  );

  const passengerRatio =
    mission.passengers > 0
      ? passengersSafe / mission.passengers
      : 0;

  const baseScore =
    safetyScore * 3 +
    navigationScore * 2 +
    fuelScore +
    passengerRatio * 100 +
    successfulActions * 45 -
    failedActions * 55;

  const score = Math.max(
    0,
    Math.round(baseScore * multiplier)
  );

  const completionBonus =
    safetyScore >= 80 &&
    navigationScore >= 80 &&
    fuelScore >= 25 &&
    passengersAtRisk === 0
      ? Math.round(2500 * multiplier)
      : 0;

  const performanceRatio = Math.min(
    1,
    score / 500
  );

  const rewardRange =
    mission.maxReward -
    mission.startingReward;

  const cash = Math.max(
    0,
    Math.round(
      mission.startingReward +
        rewardRange * performanceRatio +
        completionBonus
    )
  );

  const reputation = Math.max(
    1,
    Math.round(
      6 +
        safetyScore / 15 +
        navigationScore / 20 +
        successfulActions * 1.5 -
        failedActions * 2
    )
  );

  let rank = "Cadet Pilot";

  if (score >= 900) {
    rank = "Legendary Captain";
  } else if (score >= 700) {
    rank = "Senior Captain";
  } else if (score >= 500) {
    rank = "Commercial Captain";
  } else if (score >= 300) {
    rank = "First Officer";
  }

  let message =
    "Flight completed. Keep improving your cockpit performance.";

  if (
    safetyScore >= 90 &&
    navigationScore >= 90 &&
    passengersAtRisk === 0
  ) {
    message =
      "Outstanding flight! You handled the aircraft like a true Abuja aviation legend.";
  } else if (safetyScore >= 75) {
    message =
      "Strong flight. Your passengers arrived safely.";
  } else if (safetyScore >= 50) {
    message =
      "Flight completed, but there were several dangerous moments.";
  } else {
    message =
      "That was a rough flight. Your cockpit decisions need improvement.";
  }

  return {
    score,
    cash,
    reputation,
    passengersSafe,
    passengersAtRisk,
    fuelRemaining: fuelScore,
    safety: safetyScore,
    navigation: navigationScore,
    successfulActions,
    failedActions,
    missionsCompleted:
      missionsCompleted + 1,
    flightTime: responseTime,
    rank,
    message,
  };
}
