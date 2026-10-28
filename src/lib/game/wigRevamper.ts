"use client";

export type WigRevamperDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type WigProblem =
  | "tangled"
  | "dry"
  | "shedding"
  | "damaged-lace"
  | "bad-color"
  | "frizzy"
  | "old-style"
  | "dirty";

export type WigAction =
  | "inspect"
  | "wash"
  | "condition"
  | "detangle"
  | "deep-treatment"
  | "repair-lace"
  | "fix-shedding"
  | "color-correction"
  | "bleach-lace"
  | "plucking"
  | "style-wig"
  | "curl-wig"
  | "straighten-wig"
  | "trim-wig"
  | "install-wig"
  | "quality-check"
  | "package";

export type WigType =
  | "human-hair"
  | "frontal"
  | "closure"
  | "bob"
  | "bone-straight"
  | "curly"
  | "water-wave"
  | "colored"
  | "luxury";

export type WigOutcome =
  | "legendary"
  | "excellent"
  | "good"
  | "mixed"
  | "poor"
  | "disaster";

export interface WigOrder {
  id: string;
  customerName: string;
  title: string;
  location: string;
  wigType: WigType;
  problem: WigProblem;
  difficulty: WigRevamperDifficulty;
  requiredSteps: WigAction[];
  description: string;
  rewardMin: number;
  rewardMax: number;
  reputation: number;
  xp: number;
  deadlineSeconds: number;
}

export interface WigActionResult {
  success: boolean;
  score: number;
  message: string;
}

export interface WigRevamperResult {
  outcome: WigOutcome;
  cash: number;
  reputation: number;
  xp: number;
  score: number;
  mistakes: number;
  ordersCompleted: number;
  rank: string;
  message: string;
}

const WIG_ORDERS: WigOrder[] = [
  {
    id: "wuse-tangled-bob",
    customerName: "Chidinma",
    title: "Tangled Bob Revival",
    location: "Wuse 2",
    wigType: "bob",
    problem: "tangled",
    difficulty: "easy",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "detangle",
      "trim-wig",
      "style-wig",
      "quality-check",
      "package",
    ],
    description:
      "A customer's bob wig has become heavily tangled after months of use. Restore it without damaging the hair.",
    rewardMin: 5000,
    rewardMax: 9000,
    reputation: 7,
    xp: 70,
    deadlineSeconds: 100,
  },

  {
    id: "jabi-dry-human-hair",
    customerName: "Blessing",
    title: "Human Hair Restoration",
    location: "Jabi",
    wigType: "human-hair",
    problem: "dry",
    difficulty: "medium",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "deep-treatment",
      "detangle",
      "trim-wig",
      "style-wig",
      "quality-check",
      "package",
    ],
    description:
      "This human-hair wig is extremely dry and dull. Bring back its softness, movement and shine.",
    rewardMin: 9000,
    rewardMax: 16000,
    reputation: 11,
    xp: 120,
    deadlineSeconds: 125,
  },

  {
    id: "maitama-lace-repair",
    customerName: "Aisha",
    title: "Luxury Lace Repair",
    location: "Maitama",
    wigType: "frontal",
    problem: "damaged-lace",
    difficulty: "hard",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "repair-lace",
      "bleach-lace",
      "plucking",
      "style-wig",
      "quality-check",
      "package",
    ],
    description:
      "A premium frontal has damaged lace. Carefully repair and customize the hairline while preserving the wig.",
    rewardMin: 15000,
    rewardMax: 28000,
    reputation: 18,
    xp: 220,
    deadlineSeconds: 150,
  },

  {
    id: "garki-shedding-repair",
    customerName: "Precious",
    title: "Shedding Emergency",
    location: "Garki",
    wigType: "closure",
    problem: "shedding",
    difficulty: "medium",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "fix-shedding",
      "deep-treatment",
      "style-wig",
      "quality-check",
      "package",
    ],
    description:
      "The customer's closure wig is shedding badly. Stabilize the hair before styling it.",
    rewardMin: 8500,
    rewardMax: 15000,
    reputation: 10,
    xp: 130,
    deadlineSeconds: 115,
  },

  {
    id: "central-color-correction",
    customerName: "Tolu",
    title: "Luxury Color Correction",
    location: "Central Abuja",
    wigType: "colored",
    problem: "bad-color",
    difficulty: "hard",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "color-correction",
      "deep-treatment",
      "trim-wig",
      "style-wig",
      "quality-check",
      "package",
    ],
    description:
      "A previous color job went wrong. Correct the tone and restore the wig's finish.",
    rewardMin: 18000,
    rewardMax: 32000,
    reputation: 20,
    xp: 260,
    deadlineSeconds: 160,
  },

  {
    id: "wuse-frizzy-wave",
    customerName: "Mary",
    title: "Water Wave Revival",
    location: "Wuse",
    wigType: "water-wave",
    problem: "frizzy",
    difficulty: "medium",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "deep-treatment",
      "detangle",
      "curl-wig",
      "quality-check",
      "package",
    ],
    description:
      "Restore the definition of a frizzy water-wave wig and bring its curls back to life.",
    rewardMin: 8000,
    rewardMax: 15000,
    reputation: 11,
    xp: 125,
    deadlineSeconds: 120,
  },

  {
    id: "maitama-luxury-revamp",
    customerName: "Zainab",
    title: "Maitama Luxury Wig Revamp",
    location: "Maitama",
    wigType: "luxury",
    problem: "old-style",
    difficulty: "extreme",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "deep-treatment",
      "detangle",
      "repair-lace",
      "bleach-lace",
      "plucking",
      "trim-wig",
      "style-wig",
      "install-wig",
      "quality-check",
      "package",
    ],
    description:
      "A premium wig needs a complete luxury transformation before a major Abuja event.",
    rewardMin: 28000,
    rewardMax: 55000,
    reputation: 32,
    xp: 420,
    deadlineSeconds: 200,
  },

  {
    id: "vip-bone-straight",
    customerName: "Daniela",
    title: "VIP Bone Straight Makeover",
    location: "Asokoro",
    wigType: "bone-straight",
    problem: "old-style",
    difficulty: "extreme",
    requiredSteps: [
      "inspect",
      "wash",
      "condition",
      "deep-treatment",
      "detangle",
      "repair-lace",
      "bleach-lace",
      "plucking",
      "straighten-wig",
      "trim-wig",
      "install-wig",
      "quality-check",
      "package",
    ],
    description:
      "A VIP client wants an old bone-straight wig completely refreshed for an exclusive event.",
    rewardMin: 30000,
    rewardMax: 60000,
    reputation: 35,
    xp: 450,
    deadlineSeconds: 210,
  },
];

const ACTION_LABELS: Record<WigAction, string> = {
  inspect: "Inspect Wig",
  wash: "Wash Wig",
  condition: "Condition",
  detangle: "Detangle",
  "deep-treatment": "Deep Treatment",
  "repair-lace": "Repair Lace",
  "fix-shedding": "Fix Shedding",
  "color-correction": "Correct Color",
  "bleach-lace": "Bleach Lace",
  plucking: "Customize Hairline",
  "style-wig": "Style Wig",
  "curl-wig": "Restore Curls",
  "straighten-wig": "Straighten Wig",
  "trim-wig": "Trim Wig",
  "install-wig": "Install Wig",
  "quality-check": "Quality Check",
  package: "Package Order",
};

export function getWigActionLabel(action: WigAction): string {
  return ACTION_LABELS[action];
}

export function getAllWigOrders(): WigOrder[] {
  return WIG_ORDERS;
}

export function getWigOrder(id: string): WigOrder | undefined {
  return WIG_ORDERS.find((order) => order.id === id);
}

export function getRandomWigOrder(): WigOrder {
  return WIG_ORDERS[
    Math.floor(Math.random() * WIG_ORDERS.length)
  ];
}

export function getWigResponseTime(
  difficulty: WigRevamperDifficulty
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

export function getWigActionOutcome(
  order: WigOrder,
  action: WigAction,
  stepIndex: number
): WigActionResult {
  const expected = order.requiredSteps[stepIndex];

  if (expected === action) {
    return {
      success: true,
      score: 100,
      message: `Perfect! ${getWigActionLabel(
        action
      )} was the correct step.`,
    };
  }

  const laterSteps = order.requiredSteps.slice(stepIndex + 1);

  if (laterSteps.includes(action)) {
    return {
      success: false,
      score: -10,
      message: `${getWigActionLabel(
        action
      )} is needed later. Follow the restoration process.`,
    };
  }

  return {
    success: false,
    score: -20,
    message: `${getWigActionLabel(
      action
    )} is not the correct treatment right now.`,
  };
}

export function getWigSuccessMessage(
  outcome: WigOutcome
): string {
  switch (outcome) {
    case "legendary":
      return "👑 Legendary revamp! Your beauty business is becoming one of Abuja's best.";
    case "excellent":
      return "✨ Excellent restoration. The customer is extremely happy.";
    case "good":
      return "💇🏾‍♀️ Great work. The wig looks fresh and ready to wear.";
    case "mixed":
      return "👍 The wig was restored, but the finish could be better.";
    case "poor":
      return "😬 The customer noticed several problems with the revamp.";
    case "disaster":
      return "🚨 The restoration went badly. The customer was not satisfied.";
  }
}

export function calculateWigRevamperResult(params: {
  order: WigOrder;
  score: number;
  correctActions: number;
  mistakes: number;
  completed: boolean;
  timeRemaining: number;
}): WigRevamperResult {
  const {
    order,
    score,
    correctActions,
    mistakes,
    completed,
    timeRemaining,
  } = params;

  const totalSteps = order.requiredSteps.length;

  const accuracy =
    totalSteps > 0 ? correctActions / totalSteps : 0;

  let outcome: WigOutcome;

  if (
    completed &&
    accuracy >= 0.95 &&
    mistakes <= 1 &&
    timeRemaining >= 25
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
  } else if (accuracy >= 0.5) {
    outcome = "mixed";
  } else if (accuracy >= 0.25) {
    outcome = "poor";
  } else {
    outcome = "disaster";
  }

  const cashMultipliers: Record<WigOutcome, number> = {
    legendary: 1.4,
    excellent: 1.22,
    good: 1,
    mixed: 0.75,
    poor: 0.45,
    disaster: 0.2,
  };

  const reputationMultipliers: Record<WigOutcome, number> = {
    legendary: 1.5,
    excellent: 1.25,
    good: 1,
    mixed: 0.6,
    poor: 0.25,
    disaster: -0.5,
  };

  const xpMultipliers: Record<WigOutcome, number> = {
    legendary: 1.5,
    excellent: 1.25,
    good: 1,
    mixed: 0.7,
    poor: 0.35,
    disaster: 0.1,
  };

  const baseReward =
    order.rewardMin +
    Math.floor(
      Math.random() *
        (order.rewardMax - order.rewardMin + 1)
    );

  const cash = Math.max(
    500,
    Math.round(
      baseReward * cashMultipliers[outcome]
    )
  );

  const reputation = Math.round(
    order.reputation *
      reputationMultipliers[outcome]
  );

  const xp = Math.max(
    5,
    Math.round(order.xp * xpMultipliers[outcome])
  );

  return {
    outcome,
    cash,
    reputation,
    xp,
    score: Math.max(0, score),
    mistakes,
    ordersCompleted: completed ? 1 : 0,
    rank: getWigRevamperRank(xp),
    message: getWigSuccessMessage(outcome),
  };
}

export function getWigRevamperRank(xp: number): string {
  if (xp >= 5000) {
    return "Luxury Wig Business Owner";
  }

  if (xp >= 3000) {
    return "Elite Wig Revamper";
  }

  if (xp >= 1800) {
    return "Senior Wig Stylist";
  }

  if (xp >= 900) {
    return "Professional Wig Revamper";
  }

  if (xp >= 300) {
    return "Wig Revamper";
  }

  return "Junior Wig Stylist";
}
