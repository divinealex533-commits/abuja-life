export type BarberStyle =
  | "low-cut"
  | "fade"
  | "taper"
  | "afro"
  | "dread-maintenance"
  | "beard-trim";

export type BarberCustomer = {
  id: string;
  customer: string;
  requestedStyle: BarberStyle;
  styleName: string;
  emoji: string;
  basePrice: number;
  patience: number;
  difficulty: "easy" | "medium" | "hard";
};

export type BarberResult = {
 payment: number;
 tip: number;
 reputation: number;
 satisfaction: number;
 energyCost: number;
 message: string;
};

export const BARBER_CUSTOMERS: BarberCustomer[] = [
  {
    id: "barber-1",
    customer: "Emeka",
    requestedStyle: "low-cut",
    styleName: "Clean Low Cut",
    emoji: "✂️",
    basePrice: 1800,
    patience: 82,
    difficulty: "easy",
  },
  {
    id: "barber-2",
    customer: "Tunde",
    requestedStyle: "fade",
    styleName: "Fresh Fade",
    emoji: "💈",
    basePrice: 3000,
    patience: 74,
    difficulty: "medium",
  },
  {
    id: "barber-3",
    customer: "Chinedu",
    requestedStyle: "taper",
    styleName: "Sharp Taper",
    emoji: "🪒",
    basePrice: 2800,
    patience: 76,
    difficulty: "medium",
  },
  {
    id: "barber-4",
    customer: "Yusuf",
    requestedStyle: "afro",
    styleName: "Afro Shape-Up",
    emoji: "💇🏾",
    basePrice: 3500,
    patience: 68,
    difficulty: "medium",
  },
  {
    id: "barber-5",
    customer: "David",
    requestedStyle: "dread-maintenance",
    styleName: "Dread Maintenance",
    emoji: "🧔🏽",
    basePrice: 5000,
    patience: 62,
    difficulty: "hard",
  },
  {
    id: "barber-6",
    customer: "Ibrahim",
    requestedStyle: "beard-trim",
    styleName: "Premium Beard Trim",
    emoji: "🪒",
    basePrice: 2200,
    patience: 80,
    difficulty: "easy",
  },
];

export function getBarberCustomer(id: string) {
  return (
    BARBER_CUSTOMERS.find(
      (customer) => customer.id === id
    ) ?? null
  );
}

export function calculateBarberResult(
  customer: BarberCustomer,
  precision: number,
  styleMatch: number
): BarberResult {
  const safePrecision = Math.max(
    0,
    Math.min(100, precision)
  );

  const safeStyleMatch = Math.max(
    0,
    Math.min(100, styleMatch)
  );

  let satisfaction = Math.round(
    safePrecision * 0.65 +
      safeStyleMatch * 0.35
  );

  if (customer.difficulty === "hard") {
    satisfaction -= 5;
  }

  satisfaction = Math.max(
    0,
    Math.min(100, satisfaction)
  );

  const tip =
    satisfaction >= 95
      ? Math.round(customer.basePrice * 0.15)
      : satisfaction >= 85
        ? Math.round(customer.basePrice * 0.09)
        : satisfaction >= 75
          ? Math.round(customer.basePrice * 0.04)
          : 0;

  const payment =
    satisfaction >= 90
      ? Math.round(customer.basePrice * 1.1)
      : satisfaction >= 70
        ? customer.basePrice
        : Math.round(customer.basePrice * 0.75);

  const reputation =
    satisfaction >= 90
      ? 5
      : satisfaction >= 75
        ? 3
        : satisfaction >= 55
          ? 1
          : 0;

  const energyCost =
    customer.difficulty === "hard"
      ? 18
      : customer.difficulty === "medium"
        ? 14
        : 10;

  let message =
    "Haircut completed.";

  if (satisfaction >= 90) {
    message =
      "Excellent work! The customer loves the new look.";
  } else if (satisfaction >= 75) {
    message =
      "Good job! The customer is happy with the haircut.";
  } else if (satisfaction >= 55) {
    message =
      "The haircut is acceptable, but the customer expected more.";
  } else {
    message =
      "The customer is unhappy with the final result.";
  }

  return {
    payment,
    tip,
    reputation,
    satisfaction,
    energyCost,
    message,
  };
}
