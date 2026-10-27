// Abuja Life — Police Officer Job System

export type PoliceDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "critical";

export type PoliceCallType =
  | "patrol"
  | "theft"
  | "robbery"
  | "traffic"
  | "missing-person"
  | "pursuit"
  | "crime-scene";

export type PoliceDecision =
  | "warn"
  | "question"
  | "arrest"
  | "pursue"
  | "secure-scene"
  | "search-area"
  | "call-backup";

export interface PoliceCall {
  id: string;
  title: string;
  type: PoliceCallType;
  location: string;
  description: string;
  suspect?: string;
  difficulty: PoliceDifficulty;
  timeLimit: number;
  baseReward: number;
  reputation: number;
  correctDecision: PoliceDecision;
  bonusForFastResponse: number;
  penaltyForWrongDecision: number;
}

export interface PoliceDecisionOption {
  id: PoliceDecision;
  name: string;
  icon: string;
  description: string;
}

export interface PoliceResult {
  success: boolean;
  score: number;
  reward: number;
  reputation: number;
  responseTime: number;
  correctDecision: boolean;
  message: string;
}

export const POLICE_DECISIONS: PoliceDecisionOption[] = [
  {
    id: "warn",
    name: "Issue Warning",
    icon: "⚠️",
    description:
      "Give the person a warning when the situation does not require an arrest.",
  },
  {
    id: "question",
    name: "Question Suspect",
    icon: "🗣️",
    description:
      "Question the person and gather more information before acting.",
  },
  {
    id: "arrest",
    name: "Make Arrest",
    icon: "🚔",
    description:
      "Arrest the suspect when there is enough evidence.",
  },
  {
    id: "pursue",
    name: "Begin Pursuit",
    icon: "🚨",
    description:
      "Chase a fleeing suspect before they escape.",
  },
  {
    id: "secure-scene",
    name: "Secure Crime Scene",
    icon: "🚧",
    description:
      "Protect the scene and prevent evidence from being disturbed.",
  },
  {
    id: "search-area",
    name: "Search Area",
    icon: "🔎",
    description:
      "Search the surrounding area for a missing person or clues.",
  },
  {
    id: "call-backup",
    name: "Call Backup",
    icon: "📻",
    description:
      "Request additional officers when the situation is dangerous.",
  },
];

export const POLICE_CALLS: PoliceCall[] = [
  {
    id: "wuse-market-theft",
    title: "Market Theft",
    type: "theft",
    location: "Wuse Market",
    description:
      "A shop owner reports that an expensive phone was stolen. A nervous customer is still nearby and may have information.",
    suspect: "Nervous Customer",
    difficulty: "easy",
    timeLimit: 35,
    baseReward: 4000,
    reputation: 7,
    correctDecision: "question",
    bonusForFastResponse: 1600,
    penaltyForWrongDecision: 800,
  },

  {
    id: "garki-traffic",
    title: "Dangerous Driving",
    type: "traffic",
    location: "Garki",
    description:
      "A driver has been reported for repeatedly speeding through a crowded area. Nobody has been injured.",
    suspect: "Speeding Driver",
    difficulty: "easy",
    timeLimit: 30,
    baseReward: 3800,
    reputation: 6,
    correctDecision: "warn",
    bonusForFastResponse: 1400,
    penaltyForWrongDecision: 700,
  },

  {
    id: "jabi-robbery",
    title: "Jabi Robbery Alert",
    type: "robbery",
    location: "Jabi",
    description:
      "A robbery has just been reported near a busy shopping area. Witnesses saw a suspect running toward a side street.",
    suspect: "Fleeing Suspect",
    difficulty: "medium",
    timeLimit: 32,
    baseReward: 6500,
    reputation: 10,
    correctDecision: "pursue",
    bonusForFastResponse: 2600,
    penaltyForWrongDecision: 1500,
  },

  {
    id: "maitama-missing-person",
    title: "Missing Person",
    type: "missing-person",
    location: "Maitama",
    description:
      "A teenager has gone missing after leaving home. A witness believes they were last seen near a nearby park.",
    difficulty: "medium",
    timeLimit: 40,
    baseReward: 7000,
    reputation: 11,
    correctDecision: "search-area",
    bonusForFastResponse: 2800,
    penaltyForWrongDecision: 1400,
  },

  {
    id: "wuse-crime-scene",
    title: "Crime Scene",
    type: "crime-scene",
    location: "Wuse 2",
    description:
      "Officers arrive at a suspected break-in. Several objects may contain evidence and a crowd is gathering outside.",
    difficulty: "hard",
    timeLimit: 38,
    baseReward: 9500,
    reputation: 13,
    correctDecision: "secure-scene",
    bonusForFastResponse: 3600,
    penaltyForWrongDecision: 2200,
  },

  {
    id: "cbd-dangerous-suspect",
    title: "Dangerous Suspect",
    type: "robbery",
    location: "Central Business District",
    description:
      "A robbery suspect has been spotted carrying what witnesses believe may be a weapon. The area is crowded.",
    suspect: "Armed Suspect",
    difficulty: "hard",
    timeLimit: 35,
    baseReward: 12000,
    reputation: 16,
    correctDecision: "call-backup",
    bonusForFastResponse: 4500,
    penaltyForWrongDecision: 3000,
  },

  {
    id: "jabi-night-pursuit",
    title: "Night Pursuit",
    type: "pursuit",
    location: "Jabi",
    description:
      "A suspect vehicle has ignored several police signals and is attempting to escape through busy streets.",
    suspect: "Suspect Vehicle",
    difficulty: "critical",
    timeLimit: 42,
    baseReward: 17000,
    reputation: 21,
    correctDecision: "pursue",
    bonusForFastResponse: 6500,
    penaltyForWrongDecision: 4500,
  },
];

export function getPoliceCall(
  id: string
): PoliceCall | undefined {
  return POLICE_CALLS.find((call) => call.id === id);
}

export function getPoliceDifficultyLabel(
  difficulty: PoliceDifficulty
): string {
  switch (difficulty) {
    case "easy":
      return "Easy";

    case "medium":
      return "Medium";

    case "hard":
      return "Hard";

    case "critical":
      return "CRITICAL";

    default:
      return "Unknown";
  }
}

export function calculatePoliceResult(
  policeCall: PoliceCall,
  selectedDecision: PoliceDecision,
  elapsedSeconds: number
): PoliceResult {
  const correctDecision =
    selectedDecision === policeCall.correctDecision;

  const responseTime = Math.max(
    0,
    Math.min(policeCall.timeLimit, elapsedSeconds)
  );

  const timeRemaining = Math.max(
    0,
    policeCall.timeLimit - responseTime
  );

  const fastResponse =
    timeRemaining >=
    Math.ceil(policeCall.timeLimit * 0.35);

  if (!correctDecision) {
    const reward = Math.max(
      500,
      policeCall.baseReward -
        policeCall.penaltyForWrongDecision
    );

    return {
      success: false,
      score: Math.max(
        10,
        Math.round(
          (reward / policeCall.baseReward) * 100
        )
      ),
      reward,
      reputation: Math.max(
        1,
        Math.floor(policeCall.reputation / 3)
      ),
      responseTime,
      correctDecision: false,
      message:
        "The decision was not appropriate for the situation. The case was handled poorly.",
    };
  }

  let reward = policeCall.baseReward;
  let reputation = policeCall.reputation;
  let score = 70;

  if (fastResponse) {
    reward += policeCall.bonusForFastResponse;
    reputation += 3;
    score += 20;
  } else {
    score += 10;
  }

  if (
    responseTime <=
    Math.ceil(policeCall.timeLimit * 0.2)
  ) {
    reward += Math.round(
      policeCall.bonusForFastResponse * 0.5
    );

    reputation += 2;
    score += 10;
  }

  return {
    success: true,
    score: Math.min(100, score),
    reward,
    reputation,
    responseTime,
    correctDecision: true,
    message: fastResponse
      ? "Outstanding police response! You handled the situation quickly and professionally."
      : "Good police work. The situation was brought under control.",
  };
}
