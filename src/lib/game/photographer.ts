export type PhotographyStyle =
  | "portrait"
  | "event"
  | "street"
  | "product"
  | "landscape";

export type PhotographyLighting =
  | "natural"
  | "studio"
  | "golden-hour"
  | "night";

export type PhotographyDifficulty = "easy" | "medium" | "hard";

export interface PhotographyClient {
  id: string;
  name: string;
  request: string;
  preferredStyle: PhotographyStyle;
  preferredLighting: PhotographyLighting;
  budget: number;
  difficulty: PhotographyDifficulty;
  location: string;
}

export interface PhotographyResult {
  basePayment: number;
  styleBonus: number;
  lightingBonus: number;
  qualityBonus: number;
  tip: number;
  totalPayment: number;
  quality: number;
  satisfaction: number;
  reputationGain: number;
  energyCost: number;
  message: string;
}

export const PHOTOGRAPHY_CLIENTS: PhotographyClient[] = [
  {
    id: "photo-amaka",
    name: "Amaka",
    request: "Capture a beautiful portrait for a professional profile.",
    preferredStyle: "portrait",
    preferredLighting: "natural",
    budget: 5000,
    difficulty: "easy",
    location: "Maitama",
  },
  {
    id: "photo-tunde",
    name: "Tunde",
    request: "Cover a lively Abuja street event and capture the atmosphere.",
    preferredStyle: "event",
    preferredLighting: "golden-hour",
    budget: 7500,
    difficulty: "medium",
    location: "Wuse",
  },
  {
    id: "photo-aisha",
    name: "Aisha",
    request: "Create stylish fashion portraits for a new clothing collection.",
    preferredStyle: "portrait",
    preferredLighting: "studio",
    budget: 9000,
    difficulty: "medium",
    location: "Wuse 2",
  },
  {
    id: "photo-david",
    name: "David",
    request: "Photograph products for an online business catalogue.",
    preferredStyle: "product",
    preferredLighting: "studio",
    budget: 8500,
    difficulty: "medium",
    location: "CBD",
  },
  {
    id: "photo-blessing",
    name: "Blessing",
    request: "Capture a premium evening event with dramatic photographs.",
    preferredStyle: "event",
    preferredLighting: "night",
    budget: 12000,
    difficulty: "hard",
    location: "Jabi",
  },
  {
    id: "photo-michael",
    name: "Michael",
    request: "Capture the beauty of Abuja during golden hour.",
    preferredStyle: "landscape",
    preferredLighting: "golden-hour",
    budget: 11000,
    difficulty: "hard",
    location: "Jabi Lake",
  },
  {
    id: "photo-fatima",
    name: "Fatima",
    request: "Create an authentic street photography collection.",
    preferredStyle: "street",
    preferredLighting: "natural",
    budget: 7000,
    difficulty: "medium",
    location: "Garki",
  },
];

export function getPhotographyClient(
  id: string
): PhotographyClient | undefined {
  return PHOTOGRAPHY_CLIENTS.find((client) => client.id === id);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculatePhotographyResult(
  client: PhotographyClient,
  selectedStyle: PhotographyStyle,
  selectedLighting: PhotographyLighting,
  focus: number,
  composition: number,
  exposure: number
): PhotographyResult {
  const focusScore = clamp(focus, 0, 1);
  const compositionScore = clamp(composition, 0, 1);
  const exposureScore = clamp(exposure, 0, 1);

  const styleMatch = selectedStyle === client.preferredStyle;
  const lightingMatch =
    selectedLighting === client.preferredLighting;

  const quality = Math.round(
    ((focusScore + compositionScore + exposureScore) / 3) * 100
  );

  const styleBonus = styleMatch ? 1000 : 0;
  const lightingBonus = lightingMatch ? 900 : 0;

  const qualityBonus = Math.round(
    client.budget * 0.3 * (quality / 100)
  );

  const satisfaction = clamp(
    Math.round(
      quality * 0.65 +
        (styleMatch ? 18 : 0) +
        (lightingMatch ? 17 : 0)
    ),
    0,
    100
  );

  const tip =
    satisfaction >= 90
      ? Math.round(client.budget * 0.18)
      : satisfaction >= 75
        ? Math.round(client.budget * 0.1)
        : satisfaction >= 60
          ? Math.round(client.budget * 0.04)
          : 0;

  const totalPayment =
    client.budget +
    styleBonus +
    lightingBonus +
    qualityBonus +
    tip;

  const reputationGain =
    satisfaction >= 90
      ? 8
      : satisfaction >= 75
        ? 6
        : satisfaction >= 60
          ? 4
          : 1;

  const energyCost =
    client.difficulty === "hard"
      ? 20
      : client.difficulty === "medium"
        ? 16
        : 12;

  let message = "The client wanted better photographs.";

  if (satisfaction >= 90) {
    message = "Outstanding shoot! The client loved the photographs.";
  } else if (satisfaction >= 75) {
    message = "Great shoot! The client is very happy.";
  } else if (satisfaction >= 60) {
    message = "The client accepted the photographs, but there is room to improve.";
  }

  return {
    basePayment: client.budget,
    styleBonus,
    lightingBonus,
    qualityBonus,
    tip,
    totalPayment,
    quality,
    satisfaction,
    reputationGain,
    energyCost,
    message,
  };
}
