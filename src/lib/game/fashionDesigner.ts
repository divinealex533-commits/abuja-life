export type FashionStyle =
  | "traditional"
  | "streetwear"
  | "formal"
  | "casual"
  | "luxury";

export type FashionFabric =
  | "ankara"
  | "lace"
  | "cotton"
  | "silk"
  | "denim";

export type FashionDifficulty = "easy" | "medium" | "hard";

export interface FashionCustomer {
  id: string;
  name: string;
  request: string;
  preferredStyle: FashionStyle;
  preferredFabric: FashionFabric;
  budget: number;
  difficulty: FashionDifficulty;
}

export interface FashionDesignResult {
  basePrice: number;
  fabricBonus: number;
  styleBonus: number;
  qualityBonus: number;
  tip: number;
  totalPayment: number;
  satisfaction: number;
  reputationGain: number;
  energyCost: number;
  message: string;
}

export const FASHION_CUSTOMERS: FashionCustomer[] = [
  {
    id: "fashion-amaka",
    name: "Amaka",
    request: "Create a stylish Ankara outfit for a weekend event.",
    preferredStyle: "traditional",
    preferredFabric: "ankara",
    budget: 4500,
    difficulty: "easy",
  },
  {
    id: "fashion-tunde",
    name: "Tunde",
    request: "Design a clean modern streetwear outfit.",
    preferredStyle: "streetwear",
    preferredFabric: "denim",
    budget: 6000,
    difficulty: "medium",
  },
  {
    id: "fashion-aisha",
    name: "Aisha",
    request: "Make an elegant lace outfit for a formal occasion.",
    preferredStyle: "formal",
    preferredFabric: "lace",
    budget: 8000,
    difficulty: "medium",
  },
  {
    id: "fashion-david",
    name: "David",
    request: "Create a premium casual outfit with a luxury finish.",
    preferredStyle: "casual",
    preferredFabric: "cotton",
    budget: 7000,
    difficulty: "medium",
  },
  {
    id: "fashion-blessing",
    name: "Blessing",
    request: "Design a luxury silk outfit for a major Abuja event.",
    preferredStyle: "luxury",
    preferredFabric: "silk",
    budget: 12000,
    difficulty: "hard",
  },
  {
    id: "fashion-fatima",
    name: "Fatima",
    request: "Create a bold Ankara streetwear combination.",
    preferredStyle: "streetwear",
    preferredFabric: "ankara",
    budget: 6500,
    difficulty: "hard",
  },
];

export function getFashionCustomer(
  id: string
): FashionCustomer | undefined {
  return FASHION_CUSTOMERS.find((customer) => customer.id === id);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculateFashionResult(
  customer: FashionCustomer,
  selectedStyle: FashionStyle,
  selectedFabric: FashionFabric,
  designAccuracy: number,
  finishing: number
): FashionDesignResult {
  const accuracy = clamp(designAccuracy, 0, 1);
  const finish = clamp(finishing, 0, 1);

  const styleMatch = selectedStyle === customer.preferredStyle;
  const fabricMatch = selectedFabric === customer.preferredFabric;

  const styleBonus = styleMatch ? 900 : 0;
  const fabricBonus = fabricMatch ? 900 : 0;

  const qualityScore = (accuracy + finish) / 2;

  const qualityBonus = Math.round(
    customer.budget * 0.25 * qualityScore
  );

  let satisfaction = Math.round(
    45 +
      accuracy * 25 +
      finish * 15 +
      (styleMatch ? 8 : 0) +
      (fabricMatch ? 7 : 0)
  );

  satisfaction = clamp(satisfaction, 0, 100);

  const tip =
    satisfaction >= 90
      ? Math.round(customer.budget * 0.18)
      : satisfaction >= 75
        ? Math.round(customer.budget * 0.1)
        : satisfaction >= 60
          ? Math.round(customer.budget * 0.04)
          : 0;

  const totalPayment =
    customer.budget +
    styleBonus +
    fabricBonus +
    qualityBonus +
    tip;

  const reputationGain =
    satisfaction >= 90
      ? 7
      : satisfaction >= 75
        ? 5
        : satisfaction >= 60
          ? 3
          : 1;

  const energyCost =
    customer.difficulty === "hard"
      ? 20
      : customer.difficulty === "medium"
        ? 16
        : 12;

  let message = "The customer was not fully satisfied.";

  if (satisfaction >= 90) {
    message = "Excellent design! The customer loved the final outfit.";
  } else if (satisfaction >= 75) {
    message = "Great work! The customer is happy with the design.";
  } else if (satisfaction >= 60) {
    message = "The customer accepted the outfit, but there is room to improve.";
  }

  return {
    basePrice: customer.budget,
    fabricBonus,
    styleBonus,
    qualityBonus,
    tip,
    totalPayment,
    satisfaction,
    reputationGain,
    energyCost,
    message,
  };
}
