"use client";

export type MakeupArtistDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type MakeupArtistStyle =
  | "natural"
  | "soft-glam"
  | "full-glam"
  | "bridal"
  | "editorial"
  | "celebrity"
  | "nightlife";

export type MakeupArtistAction =
  | "cleanse"
  | "prime"
  | "foundation"
  | "concealer"
  | "contour"
  | "blush"
  | "brows"
  | "eyeshadow"
  | "eyeliner"
  | "lashes"
  | "highlighter"
  | "lip"
  | "setting-spray"
  | "final-check";

export type MakeupClientType =
  | "bride"
  | "birthday"
  | "photoshoot"
  | "corporate"
  | "nightlife"
  | "celebrity"
  | "event";

export type MakeupOutcome =
  | "legendary"
  | "excellent"
  | "good"
  | "mixed"
  | "poor"
  | "disaster";

export interface MakeupClient {
  id: string;
  name: string;
  type: MakeupClientType;
  style: MakeupArtistStyle;
  difficulty: MakeupArtistDifficulty;
  patience: number;
  requiredSteps: MakeupArtistAction[];
  preferredFinish: string;
  rewardMin: number;
  rewardMax: number;
  reputation: number;
  xp: number;
}

export interface MakeupSession {
  id: string;
  title: string;
  location: string;
  description: string;
  difficulty: MakeupArtistDifficulty;
  durationSeconds: number;
  clients: MakeupClient[];
  bonusCash: number;
}

export interface MakeupActionResult {
  success: boolean;
  score: number;
  message: string;
}

export interface MakeupArtistResult {
  outcome: MakeupOutcome;
  cash: number;
  reputation: number;
  xp: number;
  score: number;
  mistakes: number;
  clientsCompleted: number;
  rank: string;
  message: string;
}

const SESSIONS: MakeupSession[] = [
  {
    id: "wuse-birthday-glam",
    title: "Wuse Birthday Glam",
    location: "Wuse 2",
    description:
      "A birthday client wants a polished soft-glam look before her celebration.",
    difficulty: "easy",
    durationSeconds: 95,
    bonusCash: 1500,
    clients: [
      {
        id: "client-amaka",
        name: "Amaka",
        type: "birthday",
        style: "soft-glam",
        difficulty: "easy",
        patience: 90,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "blush",
          "brows",
          "eyeshadow",
          "lashes",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Fresh, glowing and soft",
        rewardMin: 4500,
        rewardMax: 8000,
        reputation: 7,
        xp: 70,
      },
    ],
  },

  {
    id: "jabi-photoshoot",
    title: "Jabi Photoshoot",
    location: "Jabi",
    description:
      "A fashion photoshoot needs a camera-ready editorial makeup look.",
    difficulty: "medium",
    durationSeconds: 120,
    bonusCash: 3500,
    clients: [
      {
        id: "client-zainab",
        name: "Zainab",
        type: "photoshoot",
        style: "editorial",
        difficulty: "medium",
        patience: 82,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "contour",
          "blush",
          "brows",
          "eyeshadow",
          "eyeliner",
          "lashes",
          "highlighter",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Defined and camera-ready",
        rewardMin: 8000,
        rewardMax: 14000,
        reputation: 10,
        xp: 120,
      },
    ],
  },

  {
    id: "maitama-bridal",
    title: "Maitama Bridal Appointment",
    location: "Maitama",
    description:
      "A bride has a major wedding ceremony and expects a flawless bridal finish.",
    difficulty: "hard",
    durationSeconds: 155,
    bonusCash: 6000,
    clients: [
      {
        id: "client-fatima",
        name: "Fatima",
        type: "bride",
        style: "bridal",
        difficulty: "hard",
        patience: 76,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "contour",
          "blush",
          "brows",
          "eyeshadow",
          "eyeliner",
          "lashes",
          "highlighter",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Elegant, long-lasting bridal glam",
        rewardMin: 14000,
        rewardMax: 26000,
        reputation: 18,
        xp: 220,
      },
    ],
  },

  {
    id: "central-abuja-celebrity",
    title: "Celebrity VIP Booking",
    location: "Central Abuja",
    description:
      "A VIP client needs a high-end celebrity look before a major public appearance.",
    difficulty: "extreme",
    durationSeconds: 180,
    bonusCash: 12000,
    clients: [
      {
        id: "client-daniela",
        name: "Daniela",
        type: "celebrity",
        style: "celebrity",
        difficulty: "extreme",
        patience: 68,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "contour",
          "blush",
          "brows",
          "eyeshadow",
          "eyeliner",
          "lashes",
          "highlighter",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Luxury, flawless and camera-perfect",
        rewardMin: 25000,
        rewardMax: 50000,
        reputation: 30,
        xp: 400,
      },
    ],
  },

  {
    id: "garki-nightlife",
    title: "Garki Nightlife Glam",
    location: "Garki",
    description:
      "A client is heading to a major Abuja nightlife event and wants bold glam.",
    difficulty: "medium",
    durationSeconds: 115,
    bonusCash: 3000,
    clients: [
      {
        id: "client-precious",
        name: "Precious",
        type: "nightlife",
        style: "nightlife",
        difficulty: "medium",
        patience: 84,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "contour",
          "blush",
          "brows",
          "eyeshadow",
          "eyeliner",
          "lashes",
          "highlighter",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Bold, glamorous and long-lasting",
        rewardMin: 7500,
        rewardMax: 13500,
        reputation: 11,
        xp: 130,
      },
    ],
  },

  {
    id: "wuse-corporate",
    title: "Executive Corporate Look",
    location: "Wuse",
    description:
      "An executive needs a clean professional makeup look for an important presentation.",
    difficulty: "easy",
    durationSeconds: 90,
    bonusCash: 1200,
    clients: [
      {
        id: "client-grace",
        name: "Grace",
        type: "corporate",
        style: "natural",
        difficulty: "easy",
        patience: 92,
        requiredSteps: [
          "cleanse",
          "prime",
          "foundation",
          "concealer",
          "brows",
          "blush",
          "lip",
          "setting-spray",
          "final-check",
        ],
        preferredFinish: "Professional and natural",
        rewardMin: 4000,
        rewardMax: 7000,
        reputation: 6,
        xp: 60,
      },
    ],
  },
];

const ACTION_LABELS: Record<MakeupArtistAction, string> = {
  cleanse: "Cleanse Skin",
  prime: "Apply Primer",
  foundation: "Apply Foundation",
  concealer: "Apply Concealer",
  contour: "Contour",
  blush: "Apply Blush",
  brows: "Shape Brows",
  eyeshadow: "Apply Eyeshadow",
  eyeliner: "Apply Eyeliner",
  lashes: "Apply Lashes",
  highlighter: "Apply Highlighter",
  lip: "Finish Lips",
  "setting-spray": "Setting Spray",
  "final-check": "Final Check",
};

export function getMakeupActionLabel(
  action: MakeupArtistAction
): string {
  return ACTION_LABELS[action];
}

export function getAllMakeupSessions(): MakeupSession[] {
  return SESSIONS;
}

export function getMakeupSession(
  id: string
): MakeupSession | undefined {
  return SESSIONS.find((session) => session.id === id);
}

export function getRandomMakeupSession(): MakeupSession {
  return SESSIONS[Math.floor(Math.random() * SESSIONS.length)];
}

export function getMakeupClient(
  session: MakeupSession,
  clientId: string
): MakeupClient | undefined {
  return session.clients.find((client) => client.id === clientId);
}

export function getMakeupResponseTime(
  difficulty: MakeupArtistDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 2500;
    case "medium":
      return 2100;
    case "hard":
      return 1750;
    case "extreme":
      return 1400;
  }
}

export function getMakeupActionOutcome(
  client: MakeupClient,
  action: MakeupArtistAction,
  stepIndex: number
): MakeupActionResult {
  const expected = client.requiredSteps[stepIndex];

  if (expected === action) {
    return {
      success: true,
      score: 100,
      message: `Perfect! ${getMakeupActionLabel(action)} was exactly what ${client.name} needed.`,
    };
  }

  const remainingSteps = client.requiredSteps.slice(stepIndex + 1);

  if (remainingSteps.includes(action)) {
    return {
      success: false,
      score: -10,
      message: `${getMakeupActionLabel(action)} is needed later. Follow the makeup sequence.`,
    };
  }

  return {
    success: false,
    score: -20,
    message: `${getMakeupActionLabel(action)} is not needed right now.`,
  };
}

export function getMakeupSuccessMessage(
  outcome: MakeupOutcome
): string {
  switch (outcome) {
    case "legendary":
      return "🔥 Legendary work! Abuja's top clients are starting to know your name.";
    case "excellent":
      return "✨ Excellent makeup artistry. The client is extremely happy.";
    case "good":
      return "💄 Great job. The client loved the final look.";
    case "mixed":
      return "👍 The look came together, but there is room for improvement.";
    case "poor":
      return "😬 The client was not fully satisfied with the result.";
    case "disaster":
      return "🚨 The appointment went badly. Your reputation took a hit.";
  }
}

export function calculateMakeupArtistResult(params: {
  client: MakeupClient;
  score: number;
  correctActions: number;
  mistakes: number;
  completed: boolean;
  timeRemaining: number;
}): MakeupArtistResult {
  const {
    client,
    score,
    correctActions,
    mistakes,
    completed,
    timeRemaining,
  } = params;

  const totalSteps = client.requiredSteps.length;
  const accuracy =
    totalSteps > 0 ? correctActions / totalSteps : 0;

  let outcome: MakeupOutcome;

  if (
    completed &&
    accuracy >= 0.95 &&
    mistakes <= 1 &&
    timeRemaining >= 20
  ) {
    outcome = "legendary";
  } else if (
    completed &&
    accuracy >= 0.85 &&
    mistakes <= 2
  ) {
    outcome = "excellent";
  } else if (
    completed &&
    accuracy >= 0.7
  ) {
    outcome = "good";
  } else if (
    accuracy >= 0.5
  ) {
    outcome = "mixed";
  } else if (
    accuracy >= 0.25
  ) {
    outcome = "poor";
  } else {
    outcome = "disaster";
  }

  const multipliers: Record<MakeupOutcome, number> = {
    legendary: 1.35,
    excellent: 1.2,
    good: 1,
    mixed: 0.75,
    poor: 0.45,
    disaster: 0.2,
  };

  const reputationMultipliers: Record<MakeupOutcome, number> = {
    legendary: 1.5,
    excellent: 1.25,
    good: 1,
    mixed: 0.6,
    poor: 0.25,
    disaster: -0.5,
  };

  const xpMultipliers: Record<MakeupOutcome, number> = {
    legendary: 1.5,
    excellent: 1.25,
    good: 1,
    mixed: 0.7,
    poor: 0.35,
    disaster: 0.1,
  };

  const baseReward =
    client.rewardMin +
    Math.floor(
      Math.random() *
        (client.rewardMax - client.rewardMin + 1)
    );

  const cash = Math.max(
    500,
    Math.round(baseReward * multipliers[outcome])
  );

  const reputation = Math.round(
    client.reputation * reputationMultipliers[outcome]
  );

  const xp = Math.max(
    5,
    Math.round(client.xp * xpMultipliers[outcome])
  );

  return {
    outcome,
    cash,
    reputation,
    xp,
    score: Math.max(0, score),
    mistakes,
    clientsCompleted: completed ? 1 : 0,
    rank: getMakeupArtistRank(xp),
    message: getMakeupSuccessMessage(outcome),
  };
}

export function getMakeupArtistRank(xp: number): string {
  if (xp >= 5000) {
    return "Celebrity Makeup Director";
  }

  if (xp >= 3000) {
    return "Elite Makeup Artist";
  }

  if (xp >= 1800) {
    return "Senior Makeup Artist";
  }

  if (xp >= 900) {
    return "Professional Makeup Artist";
  }

  if (xp >= 300) {
    return "Makeup Artist";
  }

  return "Junior Makeup Artist";
}
