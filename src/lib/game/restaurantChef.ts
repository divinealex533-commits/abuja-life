"use client";

export type ChefDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type ChefAction =
  | "prep"
  | "chop"
  | "season"
  | "fry"
  | "grill"
  | "boil"
  | "bake"
  | "plate"
  | "serve"
  | "check-order";

export type ChefOrderType =
  | "breakfast"
  | "street-food"
  | "local-dish"
  | "continental"
  | "dessert"
  | "banquet";

export type ChefOutcome =
  | "perfect"
  | "excellent"
  | "good"
  | "mixed"
  | "poor"
  | "disaster";

export interface ChefOrder {
  id: string;
  name: string;
  type: ChefOrderType;
  difficulty: ChefDifficulty;
  description: string;
  customer: string;
  restaurant: string;
  ingredients: number;
  steps: number;
  targetCustomers: number;
  minReward: number;
  maxReward: number;
  timeLimit: number;
  reputation: number;
}

export interface ChefScenario {
  id: string;
  orderId: string;
  title: string;
  instruction: string;
  action: ChefAction;
  correctActions: ChefAction[];
  difficulty: ChefDifficulty;
  timeLimit: number;
  successPoints: number;
  failurePoints: number;
}

export interface ChefActionResult {
  success: boolean;
  points: number;
  message: string;
}

export interface ChefResult {
  score: number;
  cash: number;
  reputation: number;
  customerSatisfaction: number;
  correctSteps: number;
  mistakes: number;
  ordersCompleted: number;
  outcome: ChefOutcome;
  rank: string;
}

export const CHEF_ORDERS: ChefOrder[] = [
  {
    id: "abuja-breakfast-rush",
    name: "Abuja Breakfast Rush",
    type: "breakfast",
    difficulty: "easy",
    description:
      "Handle the morning rush and prepare a fast, satisfying breakfast service.",
    customer: "Office Workers",
    restaurant: "Wuse Morning Kitchen",
    ingredients: 7,
    steps: 6,
    targetCustomers: 18,
    minReward: 3000,
    maxReward: 7500,
    timeLimit: 85,
    reputation: 6,
  },
  {
    id: "jabi-street-food",
    name: "Jabi Street Food Festival",
    type: "street-food",
    difficulty: "easy",
    description:
      "Serve a busy Jabi food festival without letting the queue get out of control.",
    customer: "Festival Crowd",
    restaurant: "Jabi Food Arena",
    ingredients: 9,
    steps: 7,
    targetCustomers: 30,
    minReward: 4000,
    maxReward: 10000,
    timeLimit: 100,
    reputation: 8,
  },
  {
    id: "garki-jollof-challenge",
    name: "Garki Jollof Challenge",
    type: "local-dish",
    difficulty: "medium",
    description:
      "Prepare a signature Abuja jollof dish for a demanding group of customers.",
    customer: "Food Critics",
    restaurant: "Garki Signature Kitchen",
    ingredients: 11,
    steps: 9,
    targetCustomers: 24,
    minReward: 5500,
    maxReward: 14000,
    timeLimit: 115,
    reputation: 10,
  },
  {
    id: "maitama-dinner",
    name: "Maitama Private Dinner",
    type: "continental",
    difficulty: "medium",
    description:
      "Prepare an elegant multi-course dinner for a high-profile private client.",
    customer: "VIP Client",
    restaurant: "Maitama Private Kitchen",
    ingredients: 13,
    steps: 10,
    targetCustomers: 8,
    minReward: 7000,
    maxReward: 18000,
    timeLimit: 130,
    reputation: 12,
  },
  {
    id: "luxury-dessert-night",
    name: "Luxury Dessert Night",
    type: "dessert",
    difficulty: "hard",
    description:
      "Create premium desserts while maintaining perfect timing and presentation.",
    customer: "Luxury Guests",
    restaurant: "CBD Dessert Lounge",
    ingredients: 15,
    steps: 11,
    targetCustomers: 20,
    minReward: 8500,
    maxReward: 22000,
    timeLimit: 145,
    reputation: 14,
  },
  {
    id: "abuja-wedding-banquet",
    name: "Abuja Wedding Banquet",
    type: "banquet",
    difficulty: "hard",
    description:
      "Run a huge wedding kitchen with hundreds of meals and almost no room for mistakes.",
    customer: "Wedding Guests",
    restaurant: "Maitama Grand Hall",
    ingredients: 18,
    steps: 13,
    targetCustomers: 160,
    minReward: 12000,
    maxReward: 32000,
    timeLimit: 175,
    reputation: 18,
  },
  {
    id: "presidential-dinner",
    name: "Presidential Dinner",
    type: "continental",
    difficulty: "extreme",
    description:
      "Prepare an extremely high-profile dinner where timing, precision and presentation must be perfect.",
    customer: "National VIP Delegation",
    restaurant: "Executive Dining Hall",
    ingredients: 22,
    steps: 16,
    targetCustomers: 14,
    minReward: 18000,
    maxReward: 50000,
    timeLimit: 210,
    reputation: 25,
  },
];

export const CHEF_SCENARIOS: ChefScenario[] = [
  {
    id: "prepare-station",
    orderId: "abuja-breakfast-rush",
    title: "Kitchen Opening",
    instruction:
      "The breakfast rush is starting. What should you do first?",
    action: "prep",
    correctActions: ["prep"],
    difficulty: "easy",
    timeLimit: 8,
    successPoints: 80,
    failurePoints: -25,
  },
  {
    id: "chop-vegetables",
    orderId: "abuja-breakfast-rush",
    title: "Vegetable Preparation",
    instruction:
      "The vegetables need to be prepared before the main cooking begins.",
    action: "chop",
    correctActions: ["chop"],
    difficulty: "easy",
    timeLimit: 7,
    successPoints: 75,
    failurePoints: -20,
  },
  {
    id: "season-jollof",
    orderId: "garki-jollof-challenge",
    title: "Jollof Seasoning",
    instruction:
      "The sauce is ready. Season it carefully before adding the rice.",
    action: "season",
    correctActions: ["season"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 100,
    failurePoints: -35,
  },
  {
    id: "fry-protein",
    orderId: "jabi-street-food",
    title: "Protein Station",
    instruction:
      "The protein needs to be cooked quickly for the growing queue.",
    action: "fry",
    correctActions: ["fry", "grill"],
    difficulty: "easy",
    timeLimit: 7,
    successPoints: 90,
    failurePoints: -30,
  },
  {
    id: "boil-rice",
    orderId: "garki-jollof-challenge",
    title: "Rice Cooking",
    instruction:
      "The rice needs to cook evenly without becoming soggy.",
    action: "boil",
    correctActions: ["boil"],
    difficulty: "medium",
    timeLimit: 8,
    successPoints: 110,
    failurePoints: -40,
  },
  {
    id: "grill-main",
    orderId: "maitama-dinner",
    title: "Main Course",
    instruction:
      "The VIP main course is ready for the grill.",
    action: "grill",
    correctActions: ["grill"],
    difficulty: "medium",
    timeLimit: 8,
    successPoints: 120,
    failurePoints: -45,
  },
  {
    id: "bake-dessert",
    orderId: "luxury-dessert-night",
    title: "Dessert Oven",
    instruction:
      "The premium dessert mixture is ready. It must be baked precisely.",
    action: "bake",
    correctActions: ["bake"],
    difficulty: "hard",
    timeLimit: 8,
    successPoints: 140,
    failurePoints: -50,
  },
  {
    id: "plate-dish",
    orderId: "maitama-dinner",
    title: "Perfect Presentation",
    instruction:
      "The food is cooked. Plate it beautifully before serving.",
    action: "plate",
    correctActions: ["plate"],
    difficulty: "medium",
    timeLimit: 7,
    successPoints: 130,
    failurePoints: -40,
  },
  {
    id: "check-order",
    orderId: "abuja-wedding-banquet",
    title: "Banquet Quality Check",
    instruction:
      "Hundreds of guests are waiting. Verify the order before it leaves the kitchen.",
    action: "check-order",
    correctActions: ["check-order"],
    difficulty: "hard",
    timeLimit: 7,
    successPoints: 150,
    failurePoints: -60,
  },
  {
    id: "serve-guests",
    orderId: "abuja-wedding-banquet",
    title: "Dinner Service",
    instruction:
      "The banquet is ready. Serve the guests before the food gets cold.",
    action: "serve",
    correctActions: ["serve"],
    difficulty: "hard",
    timeLimit: 7,
    successPoints: 160,
    failurePoints: -65,
  },
  {
    id: "presidential-prep",
    orderId: "presidential-dinner",
    title: "Executive Kitchen",
    instruction:
      "The presidential dinner begins soon. Prepare the kitchen before anything else.",
    action: "prep",
    correctActions: ["prep"],
    difficulty: "extreme",
    timeLimit: 6,
    successPoints: 180,
    failurePoints: -80,
  },
  {
    id: "presidential-plate",
    orderId: "presidential-dinner",
    title: "Executive Presentation",
    instruction:
      "Every plate will be inspected. Present the final dish with precision.",
    action: "plate",
    correctActions: ["plate"],
    difficulty: "extreme",
    timeLimit: 6,
    successPoints: 220,
    failurePoints: -90,
  },
];

export function getChefOrder(orderId: string): ChefOrder | undefined {
  return CHEF_ORDERS.find((order) => order.id === orderId);
}

export function getAllChefOrders(): ChefOrder[] {
  return CHEF_ORDERS;
}

export function getRandomChefOrder(): ChefOrder {
  return CHEF_ORDERS[
    Math.floor(Math.random() * CHEF_ORDERS.length)
  ];
}

export function getChefScenarios(
  orderId: string
): ChefScenario[] {
  const orderScenarios = CHEF_SCENARIOS.filter(
    (scenario) => scenario.orderId === orderId
  );

  if (orderScenarios.length > 0) {
    return orderScenarios;
  }

  return CHEF_SCENARIOS;
}

export function getRandomChefScenario(
  orderId: string
): ChefScenario {
  const scenarios = getChefScenarios(orderId);

  return scenarios[
    Math.floor(Math.random() * scenarios.length)
  ];
}

export function getChefResponseTime(
  scenario: ChefScenario
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

export function getChefActionOutcome(
  scenario: ChefScenario,
  action: ChefAction
): ChefActionResult {
  const success = scenario.correctActions.includes(action);

  if (success) {
    return {
      success: true,
      points: scenario.successPoints,
      message: getChefSuccessMessage(action),
    };
  }

  return {
    success: false,
    points: scenario.failurePoints,
    message: getChefFailureMessage(action),
  };
}

export function getChefSuccessMessage(
  action: ChefAction
): string {
  switch (action) {
    case "prep":
      return "Kitchen prepared perfectly. Your station is ready.";

    case "chop":
      return "Clean knife work! The ingredients are perfectly prepared.";

    case "season":
      return "Excellent seasoning. The flavors are coming together.";

    case "fry":
      return "Perfect frying. Crispy outside and juicy inside.";

    case "grill":
      return "Great grill control. The main course is cooked beautifully.";

    case "boil":
      return "Perfect timing. The ingredients are cooked just right.";

    case "bake":
      return "Excellent bake. The dessert has the perfect texture.";

    case "plate":
      return "Beautiful presentation. The customer will love this.";

    case "serve":
      return "Fast service! The food reached the guests at the perfect time.";

    case "check-order":
      return "Quality check complete. The order is ready to leave the kitchen.";

    default:
      return "Great kitchen decision.";
  }
}

export function getChefFailureMessage(
  action: ChefAction
): string {
  switch (action) {
    case "prep":
      return "You rushed the kitchen setup. The station is not ready.";

    case "chop":
      return "The ingredients were prepared incorrectly.";

    case "season":
      return "The seasoning was off. The dish needs better balance.";

    case "fry":
      return "The frying went wrong. Some of the food is overcooked.";

    case "grill":
      return "The grill timing was poor. The main course suffered.";

    case "boil":
      return "The cooking time was wrong. The texture is not right.";

    case "bake":
      return "The dessert was not baked correctly.";

    case "plate":
      return "The presentation is messy and does not meet the standard.";

    case "serve":
      return "Service was too slow. Some guests received cold food.";

    case "check-order":
      return "You skipped an important quality check.";

    default:
      return "That was the wrong kitchen decision.";
  }
}

function calculateCustomerSatisfaction(
  score: number,
  mistakes: number,
  totalSteps: number
): number {
  if (totalSteps <= 0) {
    return 0;
  }

  const accuracy = Math.max(
    0,
    Math.min(100, (score / (totalSteps * 120)) * 100)
  );

  const penalty = mistakes * 6;

  return Math.round(
    Math.max(0, Math.min(100, accuracy - penalty))
  );
}

function calculateChefOutcome(
  score: number,
  satisfaction: number
): ChefOutcome {
  if (score >= 1200 && satisfaction >= 92) {
    return "perfect";
  }

  if (score >= 950 && satisfaction >= 82) {
    return "excellent";
  }

  if (score >= 700 && satisfaction >= 70) {
    return "good";
  }

  if (score >= 450 && satisfaction >= 55) {
    return "mixed";
  }

  if (score >= 200 && satisfaction >= 35) {
    return "poor";
  }

  return "disaster";
}

function calculateChefRank(
  score: number,
  satisfaction: number
): string {
  if (score >= 1400 && satisfaction >= 95) {
    return "Legendary Chef";
  }

  if (score >= 1150 && satisfaction >= 88) {
    return "Executive Chef";
  }

  if (score >= 900 && satisfaction >= 78) {
    return "Head Chef";
  }

  if (score >= 650 && satisfaction >= 68) {
    return "Sous Chef";
  }

  if (score >= 400 && satisfaction >= 55) {
    return "Line Chef";
  }

  return "Kitchen Trainee";
}

export function calculateChefResult(params: {
  order: ChefOrder;
  score: number;
  correctSteps: number;
  mistakes: number;
  ordersCompleted?: number;
}): ChefResult {
  const {
    order,
    score,
    correctSteps,
    mistakes,
    ordersCompleted = 1,
  } = params;

  const satisfaction = calculateCustomerSatisfaction(
    score,
    mistakes,
    Math.max(order.steps, correctSteps + mistakes)
  );

  const normalizedScore = Math.max(0, score);

  const progress = Math.max(
    0,
    Math.min(1, normalizedScore / 1400)
  );

  const cashRange =
    order.maxReward - order.minReward;

  const cash = Math.round(
    order.minReward + cashRange * progress
  );

  const outcome = calculateChefOutcome(
    normalizedScore,
    satisfaction
  );

  const outcomeMultiplier =
    outcome === "perfect"
      ? 1.15
      : outcome === "excellent"
        ? 1.05
        : outcome === "good"
          ? 1
          : outcome === "mixed"
            ? 0.8
            : outcome === "poor"
              ? 0.55
              : 0.25;

  const finalCash = Math.round(
    cash * outcomeMultiplier
  );

  const reputationMultiplier =
    outcome === "perfect"
      ? 1.5
      : outcome === "excellent"
        ? 1.3
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
      order.reputation * reputationMultiplier
    )
  );

  return {
    score: normalizedScore,
    cash: finalCash,
    reputation,
    customerSatisfaction: satisfaction,
    correctSteps,
    mistakes,
    ordersCompleted,
    outcome,
    rank: calculateChefRank(
      normalizedScore,
      satisfaction
    ),
  };
}
