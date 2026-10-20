export type DeliveryPackageType =
  | "food"
  | "document"
  | "parcel"
  | "fragile"
  | "express";

export type DeliveryTraffic = "light" | "normal" | "heavy";

export type DeliveryMission = {
  id: string;
  packageType: DeliveryPackageType;
  packageName: string;
  emoji: string;
  pickup: string;
  destination: string;
  customer: string;
  basePay: number;
  distanceKm: number;
  estimatedMinutes: number;
  traffic: DeliveryTraffic;
  difficulty: "easy" | "medium" | "hard";
  urgency: "normal" | "urgent";
};

export type DeliveryResult = {
  pay: number;
  tip: number;
  reputation: number;
  satisfaction: number;
  energyCost: number;
  message: string;
};

export const DELIVERY_MISSIONS: DeliveryMission[] = [
  {
    id: "delivery-1",
    packageType: "food",
    packageName: "Restaurant Food Order",
    emoji: "🍱",
    pickup: "Wuse 2",
    destination: "Maitama",
    customer: "Aisha",
    basePay: 1800,
    distanceKm: 7,
    estimatedMinutes: 18,
    traffic: "normal",
    difficulty: "easy",
    urgency: "urgent",
  },
  {
    id: "delivery-2",
    packageType: "document",
    packageName: "Business Documents",
    emoji: "📄",
    pickup: "Central Business District",
    destination: "Garki",
    customer: "Chinedu",
    basePay: 2200,
    distanceKm: 8,
    estimatedMinutes: 20,
    traffic: "light",
    difficulty: "easy",
    urgency: "normal",
  },
  {
    id: "delivery-3",
    packageType: "parcel",
    packageName: "Small Parcel",
    emoji: "📦",
    pickup: "Jabi",
    destination: "Wuse",
    customer: "Fatima",
    basePay: 2500,
    distanceKm: 9,
    estimatedMinutes: 23,
    traffic: "normal",
    difficulty: "medium",
    urgency: "normal",
  },
  {
    id: "delivery-4",
    packageType: "fragile",
    packageName: "Fragile Electronics",
    emoji: "📱",
    pickup: "Gwarinpa",
    destination: "Maitama",
    customer: "David",
    basePay: 3200,
    distanceKm: 14,
    estimatedMinutes: 31,
    traffic: "heavy",
    difficulty: "medium",
    urgency: "normal",
  },
  {
    id: "delivery-5",
    packageType: "express",
    packageName: "Express Package",
    emoji: "⚡",
    pickup: "Airport Road",
    destination: "Central Business District",
    customer: "Michael",
    basePay: 4800,
    distanceKm: 24,
    estimatedMinutes: 38,
    traffic: "heavy",
    difficulty: "hard",
    urgency: "urgent",
  },
  {
    id: "delivery-6",
    packageType: "food",
    packageName: "Large Catering Order",
    emoji: "🍲",
    pickup: "Garki",
    destination: "Jabi",
    customer: "Blessing",
    basePay: 3600,
    distanceKm: 11,
    estimatedMinutes: 27,
    traffic: "normal",
    difficulty: "medium",
    urgency: "urgent",
  },
];

export function getDeliveryMission(id: string) {
  return (
    DELIVERY_MISSIONS.find((mission) => mission.id === id) ?? null
  );
}

export function calculateDeliveryResult(
  mission: DeliveryMission,
  performance: number,
  deliveryMinutes: number
): DeliveryResult {
  const safePerformance = Math.max(
    0,
    Math.min(1, performance)
  );

  const onTimeRatio =
    mission.estimatedMinutes / Math.max(1, deliveryMinutes);

  let satisfaction = Math.round(safePerformance * 65);

  if (onTimeRatio >= 1.15) {
    satisfaction += 30;
  } else if (onTimeRatio >= 0.95) {
    satisfaction += 22;
  } else if (onTimeRatio >= 0.8) {
    satisfaction += 10;
  } else {
    satisfaction -= 12;
  }

  if (mission.urgency === "urgent") {
    if (onTimeRatio >= 0.95) {
      satisfaction += 8;
    } else {
      satisfaction -= 10;
    }
  }

  if (mission.traffic === "heavy") {
    satisfaction += 3;
  }

  satisfaction = Math.max(
    0,
    Math.min(100, satisfaction)
  );

  const performanceBonus =
    satisfaction >= 90
      ? 0.15
      : satisfaction >= 75
        ? 0.08
        : 0;

  const pay = Math.round(
    mission.basePay * (1 + performanceBonus)
  );

  const tip =
    satisfaction >= 95
      ? Math.round(pay * 0.12)
      : satisfaction >= 85
        ? Math.round(pay * 0.07)
        : satisfaction >= 75
          ? Math.round(pay * 0.03)
          : 0;

  const reputation =
    satisfaction >= 90
      ? 4
      : satisfaction >= 75
        ? 3
        : satisfaction >= 55
          ? 1
          : 0;

  const energyCost = Math.max(
    8,
    Math.round(
      7 +
        mission.distanceKm * 0.45 +
        (mission.traffic === "heavy" ? 4 : 0)
    )
  );

  let message = "Delivery completed.";

  if (satisfaction >= 90) {
    message = "Excellent delivery! The customer was very impressed.";
  } else if (satisfaction >= 75) {
    message = "Good delivery. The customer was satisfied.";
  } else if (satisfaction >= 55) {
    message = "Delivery completed, but the customer expected better service.";
  } else {
    message = "The delivery was completed, but the customer was unhappy.";
  }

  return {
    pay,
    tip,
    reputation,
    satisfaction,
    energyCost,
    message,
  };
}
