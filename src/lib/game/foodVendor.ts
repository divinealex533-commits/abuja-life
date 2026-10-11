// Abuja Life — Food Vendor Gameplay System
// Actual playable Food Vendor mini-game.
// The player receives an order, chooses a meal,
// prepares it, serves the customer and earns money.

export type FoodDishStyle =
  | "jollof"
  | "fried-rice"
  | "suya"
  | "shawarma"
  | "pounded-yam";

export type CookingQuality =
  | "poor"
  | "okay"
  | "good"
  | "excellent";

export interface FoodOrder {
  id: string;
  customer: string;
  dish: FoodDishStyle;
  customerMood: string;
  basePrice: number;
  patience: number;
  energyCost: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface FoodPreparation {
  ingredientScore: number;
  cookingScore: number;
  presentationScore: number;
}

export interface FoodOrderResult {
  payment: number;
  tip: number;
  reputation: number;
  satisfaction: number;
  energyCost: number;
  quality: CookingQuality;
  message: string;
}

export const FOOD_DISHES: Record<
  FoodDishStyle,
  {
    name: string;
    emoji: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    basePrice: number;
  }
> = {
  jollof: {
    name: "Jollof Rice",
    emoji: "🍚",
    description:
      "A classic Abuja favourite. Get the seasoning and cooking right.",
    difficulty: "easy",
    basePrice: 2500,
  },

  "fried-rice": {
    name: "Fried Rice",
    emoji: "🍛",
    description:
      "Prepare colourful fried rice with the right balance of vegetables and seasoning.",
    difficulty: "medium",
    basePrice: 3000,
  },

  suya: {
    name: "Suya",
    emoji: "🥩",
    description:
      "Grill spicy suya and keep the customer satisfied without burning it.",
    difficulty: "medium",
    basePrice: 3200,
  },

  shawarma: {
    name: "Shawarma",
    emoji: "🌯",
    description:
      "Build a tasty shawarma with the right filling, sauce and presentation.",
    difficulty: "medium",
    basePrice: 3500,
  },

  "pounded-yam": {
    name: "Pounded Yam & Soup",
    emoji: "🍲",
    description:
      "Prepare a proper local meal for a hungry Abuja customer.",
    difficulty: "hard",
    basePrice: 4500,
  },
};

export const FOOD_ORDERS: FoodOrder[] = [
  {
    id: "food-order-001",
    customer: "Amaka",
    dish: "jollof",
    customerMood: "hungry",
    basePrice: 2500,
    patience: 80,
    energyCost: 12,
    difficulty: "easy",
  },

  {
    id: "food-order-002",
    customer: "Daniel",
    dish: "fried-rice",
    customerMood: "in a hurry",
    basePrice: 3000,
    patience: 65,
    energyCost: 14,
    difficulty: "medium",
  },

  {
    id: "food-order-003",
    customer: "Ibrahim",
    dish: "suya",
    customerMood: "very hungry",
    basePrice: 3200,
    patience: 75,
    energyCost: 15,
    difficulty: "medium",
  },

  {
    id: "food-order-004",
    customer: "Teni",
    dish: "shawarma",
    customerMood: "excited",
    basePrice: 3500,
    patience: 70,
    energyCost: 15,
    difficulty: "medium",
  },

  {
    id: "food-order-005",
    customer: "Chinedu",
    dish: "pounded-yam",
    customerMood: "very hungry",
    basePrice: 4500,
    patience: 90,
    energyCost: 20,
    difficulty: "hard",
  },
];

export function getFoodDish(
  dish: FoodDishStyle
) {
  return FOOD_DISHES[dish];
}

export function getFoodOrderById(
  orderId: string
): FoodOrder | undefined {
  return FOOD_ORDERS.find(
    (order) => order.id === orderId
  );
}

export function calculateFoodQuality(
  preparation: FoodPreparation
): CookingQuality {
  const average =
    (preparation.ingredientScore +
      preparation.cookingScore +
      preparation.presentationScore) /
    3;

  if (average >= 90) {
    return "excellent";
  }

  if (average >= 75) {
    return "good";
  }

  if (average >= 55) {
    return "okay";
  }

  return "poor";
}

export function calculateFoodOrder(
  order: FoodOrder,
  preparation: FoodPreparation
): FoodOrderResult {
  const quality =
    calculateFoodQuality(preparation);

  const averageScore =
    (preparation.ingredientScore +
      preparation.cookingScore +
      preparation.presentationScore) /
    3;

  const clampedScore = Math.max(
    0,
    Math.min(100, averageScore)
  );

  const satisfaction = Math.round(
    clampedScore
  );

  let paymentMultiplier = 0.6;

  if (quality === "okay") {
    paymentMultiplier = 0.8;
  }

  if (quality === "good") {
    paymentMultiplier = 1;
  }

  if (quality === "excellent") {
    paymentMultiplier = 1.15;
  }

  const payment = Math.round(
    order.basePrice * paymentMultiplier
  );

  let tip = 0;

  if (satisfaction >= 90) {
    tip = Math.round(payment * 0.3);
  } else if (satisfaction >= 75) {
    tip = Math.round(payment * 0.15);
  } else if (satisfaction >= 60) {
    tip = Math.round(payment * 0.05);
  }

  let reputation = 1;

  if (satisfaction >= 90) {
    reputation = 5;
  } else if (satisfaction >= 75) {
    reputation = 3;
  } else if (satisfaction >= 60) {
    reputation = 2;
  }

  let message =
    "The customer accepted the meal.";

  if (quality === "excellent") {
    message =
      "🔥 Excellent meal! The customer loved it and left a generous tip.";
  } else if (quality === "good") {
    message =
      "😋 Great job! The customer enjoyed the meal.";
  } else if (quality === "okay") {
    message =
      "🙂 The customer finished the meal, but it could have been better.";
  } else {
    message =
      "😬 The meal wasn't your best work. The customer was disappointed.";
  }

  return {
    payment,
    tip,
    reputation,
    satisfaction,
    energyCost: order.energyCost,
    quality,
    message,
  };
}