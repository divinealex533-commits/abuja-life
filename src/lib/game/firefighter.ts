"use client";

export type FirefighterDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type FirefighterAction =
  | "assess"
  | "equip"
  | "rescue"
  | "extinguish"
  | "ventilate"
  | "protect"
  | "evacuate"
  | "command";

export type FirefighterEventType =
  | "house-fire"
  | "shop-fire"
  | "vehicle-fire"
  | "gas-leak"
  | "high-rise"
  | "rescue"
  | "smoke"
  | "explosion"
  | "wildfire"
  | "alarm";

export interface FirefighterMission {
  id: string;
  title: string;
  location: string;
  description: string;
  emoji: string;
  difficulty: FirefighterDifficulty;
  startingReward: number;
  maxReward: number;
  civiliansAtRisk: number;
  fireIntensity: number;
  timeLimit: number;
}

export interface FirefighterScenario {
  id: string;
  title: string;
  description: string;
  type: FirefighterEventType;
  difficulty: FirefighterDifficulty;
  correctAction: FirefighterAction;
  safetyImpact: number;
  fireImpact: number;
  rescueImpact: number;
  reward: number;
}

export interface FirefighterResult {
  score: number;
  cash: number;
  reputation: number;
  civiliansSaved: number;
  civiliansAtRisk: number;
  fireRemaining: number;
  safety: number;
  successfulActions: number;
  failedActions: number;
  missionsCompleted: number;
  responseTime: number;
  rank: string;
  message: string;
}

export const FIREFIGHTER_MISSIONS: FirefighterMission[] = [
  {
    id: "wuse-house-fire",
    title: "Wuse House Fire",
    location: "Wuse",
    description:
      "A residential building is filling with smoke. Several residents may still be trapped inside.",
    emoji: "🏠",
    difficulty: "easy",
    startingReward: 3000,
    maxReward: 8500,
    civiliansAtRisk: 4,
    fireIntensity: 45,
    timeLimit: 120,
  },
  {
    id: "garki-shop-fire",
    title: "Garki Shop Fire",
    location: "Garki",
    description:
      "A busy roadside shop has caught fire. Nearby businesses are beginning to panic.",
    emoji: "🏪",
    difficulty: "medium",
    startingReward: 4500,
    maxReward: 12000,
    civiliansAtRisk: 6,
    fireIntensity: 55,
    timeLimit: 130,
  },
  {
    id: "jabi-car-fire",
    title: "Jabi Vehicle Fire",
    location: "Jabi",
    description:
      "A vehicle is burning near a busy road. Traffic and nearby pedestrians are creating an additional hazard.",
    emoji: "🚗",
    difficulty: "medium",
    startingReward: 5000,
    maxReward: 13000,
    civiliansAtRisk: 3,
    fireIntensity: 60,
    timeLimit: 115,
  },
  {
    id: "maitama-gas-leak",
    title: "Maitama Gas Emergency",
    location: "Maitama",
    description:
      "A suspected gas leak has created a dangerous situation inside a large property.",
    emoji: "💥",
    difficulty: "hard",
    startingReward: 7000,
    maxReward: 18000,
    civiliansAtRisk: 8,
    fireIntensity: 65,
    timeLimit: 150,
  },
  {
    id: "wuse-high-rise",
    title: "Wuse High-Rise Rescue",
    location: "Wuse",
    description:
      "A high-rise building is experiencing a major fire. Smoke is spreading across several floors.",
    emoji: "🏢",
    difficulty: "hard",
    startingReward: 9000,
    maxReward: 24000,
    civiliansAtRisk: 12,
    fireIntensity: 75,
    timeLimit: 170,
  },
  {
    id: "jabi-explosion",
    title: "Jabi Explosion",
    location: "Jabi",
    description:
      "An explosion has damaged a commercial property. Fire, debris and trapped civilians are creating a critical emergency.",
    emoji: "🚨",
    difficulty: "extreme",
    startingReward: 12000,
    maxReward: 32000,
    civiliansAtRisk: 15,
    fireIntensity: 90,
    timeLimit: 190,
  },
  {
    id: "abuja-wildfire",
    title: "Abuja Wildfire",
    location: "Outskirts of Abuja",
    description:
      "A rapidly spreading vegetation fire is threatening nearby homes and roads.",
    emoji: "🌲",
    difficulty: "extreme",
    startingReward: 14000,
    maxReward: 38000,
    civiliansAtRisk: 10,
    fireIntensity: 95,
    timeLimit: 200,
  },
];

export const FIREFIGHTER_SCENARIOS: FirefighterScenario[] = [
  {
    id: "initial-assessment",
    title: "Assess the Scene",
    description:
      "Smoke is blocking your view. Before rushing in, determine where the greatest danger is.",
    type: "alarm",
    difficulty: "easy",
    correctAction: "assess",
    safetyImpact: 10,
    fireImpact: -2,
    rescueImpact: 2,
    reward: 700,
  },
  {
    id: "gear-check",
    title: "Protective Gear Check",
    description:
      "The heat is increasing. Your team needs proper protective equipment before entering the danger zone.",
    type: "smoke",
    difficulty: "easy",
    correctAction: "equip",
    safetyImpact: 12,
    fireImpact: 0,
    rescueImpact: 2,
    reward: 800,
  },
  {
    id: "trapped-resident",
    title: "Resident Trapped",
    description:
      "You hear someone calling for help from inside the building.",
    type: "rescue",
    difficulty: "medium",
    correctAction: "rescue",
    safetyImpact: 5,
    fireImpact: 0,
    rescueImpact: 1,
    reward: 1500,
  },
  {
    id: "main-fire",
    title: "Attack the Main Fire",
    description:
      "Flames are spreading rapidly through the main room. The fire needs to be brought under control.",
    type: "house-fire",
    difficulty: "medium",
    correctAction: "extinguish",
    safetyImpact: 4,
    fireImpact: -20,
    rescueImpact: 0,
    reward: 1800,
  },
  {
    id: "smoke-filled-room",
    title: "Clear the Smoke",
    description:
      "Visibility has dropped almost completely. Smoke is making rescue operations dangerous.",
    type: "smoke",
    difficulty: "medium",
    correctAction: "ventilate",
    safetyImpact: 10,
    fireImpact: -8,
    rescueImpact: 3,
    reward: 1600,
  },
  {
    id: "gas-warning",
    title: "Gas Leak Detected",
    description:
      "You detect a possible gas leak close to the fire. One wrong move could make the situation much worse.",
    type: "gas-leak",
    difficulty: "hard",
    correctAction: "protect",
    safetyImpact: 15,
    fireImpact: -5,
    rescueImpact: 3,
    reward: 2500,
  },
  {
    id: "evacuation",
    title: "Emergency Evacuation",
    description:
      "The structure is becoming unstable. Everyone nearby needs to be moved away from the danger zone.",
    type: "high-rise",
    difficulty: "hard",
    correctAction: "evacuate",
    safetyImpact: 18,
    fireImpact: -4,
    rescueImpact: 4,
    reward: 2800,
  },
  {
    id: "vehicle-fire",
    title: "Vehicle Fire",
    description:
      "A burning vehicle is close to pedestrians and traffic. Control the scene before the fire spreads.",
    type: "vehicle-fire",
    difficulty: "medium",
    correctAction: "protect",
    safetyImpact: 8,
    fireImpact: -15,
    rescueImpact: 2,
    reward: 1900,
  },
  {
    id: "team-command",
    title: "Coordinate the Team",
    description:
      "Multiple hazards are appearing at once. Your crew needs clear instructions.",
    type: "rescue",
    difficulty: "hard",
    correctAction: "command",
    safetyImpact: 12,
    fireImpact: -8,
    rescueImpact: 5,
    reward: 2600,
  },
  {
    id: "explosion-risk",
    title: "Secondary Explosion Risk",
    description:
      "A damaged container may explode. Protect the team and civilians before continuing the attack.",
    type: "explosion",
    difficulty: "extreme",
    correctAction: "protect",
    safetyImpact: 20,
    fireImpact: -10,
    rescueImpact: 4,
    reward: 3500,
  },
  {
    id: "high-rise-rescue",
    title: "High-Rise Rescue",
    description:
      "Several civilians are trapped above the fire line. You must prioritize the rescue.",
    type: "high-rise",
    difficulty: "extreme",
    correctAction: "rescue",
    safetyImpact: 8,
    fireImpact: -4,
    rescueImpact: 7,
    reward: 4000,
  },
  {
    id: "wildfire-line",
    title: "Stop the Fire Line",
    description:
      "The wildfire is moving toward nearby buildings. Create a safe boundary before it spreads.",
    type: "wildfire",
    difficulty: "extreme",
    correctAction: "command",
    safetyImpact: 12,
    fireImpact: -18,
    rescueImpact: 4,
    reward: 4200,
  },
  {
    id: "final-extinguish",
    title: "Final Fire Attack",
    description:
      "The remaining flames are weakening, but hot spots are still active. Finish the job.",
    type: "house-fire",
    difficulty: "hard",
    correctAction: "extinguish",
    safetyImpact: 6,
    fireImpact: -25,
    rescueImpact: 1,
    reward: 3000,
  },
];

const DIFFICULTY_MULTIPLIER: Record<
  FirefighterDifficulty,
  number
> = {
  easy: 1,
  medium: 1.2,
  hard: 1.5,
  extreme: 2,
};

export function getFirefighterMission(
  id: string
) {
  return FIREFIGHTER_MISSIONS.find(
    (mission) => mission.id === id
  );
}

export function getRandomFirefighterMission() {
  return FIREFIGHTER_MISSIONS[
    Math.floor(
      Math.random() *
        FIREFIGHTER_MISSIONS.length
    )
  ];
}

export function getRandomFirefighterScenario(
  excludedIds: string[] = []
) {
  const available =
    FIREFIGHTER_SCENARIOS.filter(
      (scenario) =>
        !excludedIds.includes(scenario.id)
    );

  const pool =
    available.length > 0
      ? available
      : FIREFIGHTER_SCENARIOS;

  return pool[
    Math.floor(Math.random() * pool.length)
  ];
}

export function getFirefighterResponseTime(
  mission: FirefighterMission
) {
  return mission.timeLimit;
}

export function getFirefighterActionOutcome(
  scenario: FirefighterScenario,
  action: FirefighterAction
) {
  const correct =
    action === scenario.correctAction;

  const multiplier =
    DIFFICULTY_MULTIPLIER[
      scenario.difficulty
    ];

  if (correct) {
    return {
      correct: true,
      score: Math.round(
        100 * multiplier
      ),
      cash: Math.round(
        scenario.reward * multiplier
      ),
      safetyImpact: scenario.safetyImpact,
      fireImpact: scenario.fireImpact,
      rescueImpact: scenario.rescueImpact,
      message: getSuccessMessage(
        scenario.type
      ),
    };
  }

  return {
    correct: false,
    score: -Math.round(
      45 * multiplier
    ),
    cash: -Math.round(
      scenario.reward * 0.25
    ),
    safetyImpact: -Math.max(
      4,
      Math.round(
        scenario.safetyImpact * 0.45
      )
    ),
    fireImpact: Math.max(
      3,
      Math.round(
        Math.abs(scenario.fireImpact) * 0.45
      )
    ),
    rescueImpact: -Math.max(
      1,
      Math.round(
        scenario.rescueImpact * 0.5
      )
    ),
    message: getFailureMessage(
      scenario.type
    ),
  };
}

function getSuccessMessage(
  type: FirefighterEventType
) {
  switch (type) {
    case "rescue":
      return "Excellent rescue work. The civilian has been moved toward safety.";

    case "gas-leak":
      return "Good call. You protected the crew from a potentially dangerous gas situation.";

    case "high-rise":
      return "Strong command. The evacuation route is now safer.";

    case "explosion":
      return "You prevented a dangerous escalation and protected the response team.";

    case "wildfire":
      return "Great coordination. The fire line is being brought under control.";

    case "vehicle-fire":
      return "The vehicle fire is contained and nearby people are safer.";

    case "smoke":
      return "Visibility has improved and the crew can operate more safely.";

    default:
      return "Good decision. The emergency is moving under control.";
  }
}

function getFailureMessage(
  type: FirefighterEventType
) {
  switch (type) {
    case "rescue":
      return "The rescue was delayed. The situation inside remains dangerous.";

    case "gas-leak":
      return "That decision increased the risk around the suspected gas leak.";

    case "high-rise":
      return "The evacuation was not handled quickly enough. The building remains dangerous.";

    case "explosion":
      return "The danger escalated. Your team needs to regain control of the scene.";

    case "wildfire":
      return "The fire line is spreading faster than expected.";

    default:
      return "The situation became more difficult. You need to recover quickly.";
  }
}

export function calculateFirefighterResult(params: {
  mission: FirefighterMission;
  score: number;
  safety: number;
  fireRemaining: number;
  civiliansSaved: number;
  successfulActions: number;
  failedActions: number;
  missionsCompleted: number;
  elapsedSeconds: number;
}) {
  const {
    mission,
    score,
    safety,
    fireRemaining,
    civiliansSaved,
    successfulActions,
    failedActions,
    missionsCompleted,
    elapsedSeconds,
  } = params;

  const safeCivilians = Math.max(
    0,
    Math.min(
      mission.civiliansAtRisk,
      civiliansSaved
    )
  );

  const finalSafety = Math.max(
    0,
    Math.min(100, safety)
  );

  const finalFire = Math.max(
    0,
    Math.min(100, fireRemaining)
  );

  const rescueRatio =
    mission.civiliansAtRisk > 0
      ? safeCivilians /
        mission.civiliansAtRisk
      : 1;

  const responseRatio =
    mission.timeLimit > 0
      ? Math.max(
          0,
          1 -
            elapsedSeconds /
              mission.timeLimit
        )
      : 0;

  const performanceBonus = Math.round(
    rescueRatio * 500 +
      finalSafety * 4 +
      (100 - finalFire) * 3 +
      responseRatio * 500
  );

  const finalScore = Math.max(
    0,
    score + performanceBonus
  );

  const successRate =
    successfulActions + failedActions > 0
      ? successfulActions /
        (successfulActions +
          failedActions)
      : 0;

  const baseCash =
    mission.startingReward +
    Math.round(
      finalScore * 4
    );

  const qualityMultiplier =
    0.65 +
    rescueRatio * 0.25 +
    successRate * 0.2;

  const cash = Math.min(
    mission.maxReward,
    Math.max(
      mission.startingReward,
      Math.round(
        baseCash * qualityMultiplier
      )
    )
  );

  const reputation = Math.max(
    3,
    Math.round(
      5 +
        safeCivilians * 2 +
        finalSafety / 10 +
        finalScore / 250
    )
  );

  let rank = "Emergency Responder";
  let message =
    "You handled the emergency and helped bring the situation under control.";

  if (
    finalScore >= 1600 &&
    rescueRatio >= 0.8 &&
    finalFire <= 20
  ) {
    rank = "Abuja Fire Hero";
    message =
      "Outstanding work. You protected civilians, controlled the fire and led the team like a true fire captain.";
  } else if (
    finalScore >= 1100 &&
    rescueRatio >= 0.6
  ) {
    rank = "Senior Firefighter";
    message =
      "Excellent response. Your decisions saved lives and kept the emergency from becoming worse.";
  } else if (
    finalScore >= 700
  ) {
    rank = "Firefighter";
    message =
      "Solid emergency response. More experience will make you faster and more effective.";
  } else if (
    finalScore < 400
  ) {
    rank = "Trainee Firefighter";
    message =
      "The emergency was difficult. Learn from the mistakes and improve your response next time.";
  }

  return {
    score: finalScore,
    cash,
    reputation,
    civiliansSaved: safeCivilians,
    civiliansAtRisk: mission.civiliansAtRisk,
    fireRemaining: finalFire,
    safety: finalSafety,
    successfulActions,
    failedActions,
    missionsCompleted,
    responseTime: elapsedSeconds,
    rank,
    message,
  };
}
