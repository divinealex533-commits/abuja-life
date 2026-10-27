// Abuja Life — Paramedic Job System
// Emergency-response gameplay engine.

export type EmergencyDifficulty = "easy" | "medium" | "hard" | "critical";

export type PatientCondition =
  | "dehydration"
  | "injury"
  | "asthma"
  | "heatstroke"
  | "accident"
  | "chest-pain"
  | "unconscious";

export type TreatmentType =
  | "water"
  | "bandage"
  | "inhaler"
  | "cooling"
  | "stabilize"
  | "oxygen"
  | "cpr";

export interface EmergencyCall {
  id: string;
  title: string;
  location: string;
  distance: string;
  description: string;
  condition: PatientCondition;
  difficulty: EmergencyDifficulty;
  timeLimit: number;
  baseReward: number;
  reputation: number;
  requiredTreatment: TreatmentType;
  wrongTreatmentPenalty: number;
  bonusForFastResponse: number;
}

export interface TreatmentOption {
  id: TreatmentType;
  name: string;
  icon: string;
  description: string;
}

export interface ParamedicResult {
  success: boolean;
  score: number;
  reward: number;
  reputation: number;
  responseTime: number;
  treatmentCorrect: boolean;
  message: string;
}

export const PARAMEDIC_TREATMENTS: TreatmentOption[] = [
  {
    id: "water",
    name: "Give Water",
    icon: "💧",
    description: "Help a dehydrated patient recover.",
  },
  {
    id: "bandage",
    name: "Apply Bandage",
    icon: "🩹",
    description: "Treat bleeding and minor injuries.",
  },
  {
    id: "inhaler",
    name: "Use Inhaler",
    icon: "🫁",
    description: "Help a patient experiencing breathing difficulty.",
  },
  {
    id: "cooling",
    name: "Cool the Patient",
    icon: "🧊",
    description: "Lower the temperature of an overheated patient.",
  },
  {
    id: "stabilize",
    name: "Stabilize Patient",
    icon: "🛏️",
    description: "Stabilize a seriously injured patient.",
  },
  {
    id: "oxygen",
    name: "Give Oxygen",
    icon: "🫧",
    description: "Support a patient struggling to breathe.",
  },
  {
    id: "cpr",
    name: "Start CPR",
    icon: "❤️",
    description: "Attempt to revive an unconscious patient.",
  },
];

export const PARAMEDIC_EMERGENCIES: EmergencyCall[] = [
  {
    id: "wuse-dehydration",
    title: "Collapsed Commuter",
    location: "Wuse Market",
    distance: "1.4 km",
    description:
      "A commuter has collapsed after spending hours in the heat and appears severely dehydrated.",
    condition: "dehydration",
    difficulty: "easy",
    timeLimit: 35,
    baseReward: 4500,
    reputation: 7,
    requiredTreatment: "water",
    wrongTreatmentPenalty: 900,
    bonusForFastResponse: 1800,
  },

  {
    id: "jabi-road-injury",
    title: "Roadside Injury",
    location: "Jabi",
    distance: "2.7 km",
    description:
      "A cyclist has suffered a deep cut after a road accident. The patient is conscious but bleeding.",
    condition: "injury",
    difficulty: "medium",
    timeLimit: 32,
    baseReward: 6500,
    reputation: 9,
    requiredTreatment: "bandage",
    wrongTreatmentPenalty: 1300,
    bonusForFastResponse: 2500,
  },

  {
    id: "maitama-asthma",
    title: "Breathing Emergency",
    location: "Maitama",
    distance: "4.1 km",
    description:
      "A resident is struggling to breathe and reports a history of asthma.",
    condition: "asthma",
    difficulty: "medium",
    timeLimit: 30,
    baseReward: 7500,
    reputation: 10,
    requiredTreatment: "inhaler",
    wrongTreatmentPenalty: 1600,
    bonusForFastResponse: 2800,
  },

  {
    id: "garki-heatstroke",
    title: "Heatstroke Alert",
    location: "Garki",
    distance: "3.2 km",
    description:
      "A construction worker has become extremely overheated and confused during afternoon work.",
    condition: "heatstroke",
    difficulty: "medium",
    timeLimit: 28,
    baseReward: 8000,
    reputation: 10,
    requiredTreatment: "cooling",
    wrongTreatmentPenalty: 1800,
    bonusForFastResponse: 3000,
  },

  {
    id: "wuse-accident",
    title: "Major Road Crash",
    location: "Wuse 2",
    distance: "5.8 km",
    description:
      "A serious traffic collision has occurred. One patient has significant injuries and needs immediate stabilization.",
    condition: "accident",
    difficulty: "hard",
    timeLimit: 35,
    baseReward: 11000,
    reputation: 13,
    requiredTreatment: "stabilize",
    wrongTreatmentPenalty: 2500,
    bonusForFastResponse: 4500,
  },

  {
    id: "cbd-chest-pain",
    title: "Sudden Chest Pain",
    location: "Central Business District",
    distance: "6.4 km",
    description:
      "A business executive suddenly experiences severe chest discomfort and difficulty breathing.",
    condition: "chest-pain",
    difficulty: "hard",
    timeLimit: 38,
    baseReward: 13000,
    reputation: 15,
    requiredTreatment: "oxygen",
    wrongTreatmentPenalty: 3200,
    bonusForFastResponse: 5000,
  },

  {
    id: "jabi-unconscious",
    title: "Unconscious Patient",
    location: "Jabi Lake",
    distance: "7.2 km",
    description:
      "A person has suddenly collapsed and is unresponsive. This is a critical emergency.",
    condition: "unconscious",
    difficulty: "critical",
    timeLimit: 42,
    baseReward: 17000,
    reputation: 20,
    requiredTreatment: "cpr",
    wrongTreatmentPenalty: 4500,
    bonusForFastResponse: 7000,
  },
];

export function getParamedicEmergency(
  id: string
): EmergencyCall | undefined {
  return PARAMEDIC_EMERGENCIES.find(
    (emergency) => emergency.id === id
  );
}

export function getParamedicDifficultyLabel(
  difficulty: EmergencyDifficulty
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

export function calculateParamedicResult(
  emergency: EmergencyCall,
  selectedTreatment: TreatmentType,
  elapsedSeconds: number
): ParamedicResult {
  const treatmentCorrect =
    selectedTreatment === emergency.requiredTreatment;

  const responseTime = Math.max(
    0,
    Math.min(emergency.timeLimit, elapsedSeconds)
  );

  const timeRemaining = Math.max(
    0,
    emergency.timeLimit - responseTime
  );

  const fastResponse =
    timeRemaining >= Math.ceil(emergency.timeLimit * 0.35);

  if (!treatmentCorrect) {
    const reward = Math.max(
      500,
      Math.round(
        emergency.baseReward -
          emergency.wrongTreatmentPenalty
      )
    );

    return {
      success: false,
      score: Math.max(10, Math.round((reward / emergency.baseReward) * 100)),
      reward,
      reputation: Math.max(1, Math.floor(emergency.reputation / 3)),
      responseTime,
      treatmentCorrect: false,
      message:
        "The patient was not treated correctly. Emergency response failed.",
    };
  }

  let reward = emergency.baseReward;
  let reputation = emergency.reputation;
  let score = 70;

  if (fastResponse) {
    reward += emergency.bonusForFastResponse;
    reputation += 3;
    score += 20;
  } else {
    score += 10;
  }

  if (responseTime <= Math.ceil(emergency.timeLimit * 0.2)) {
    reward += Math.round(emergency.bonusForFastResponse * 0.5);
    reputation += 2;
    score += 10;
  }

  return {
    success: true,
    score: Math.min(100, score),
    reward,
    reputation,
    responseTime,
    treatmentCorrect: true,
    message: fastResponse
      ? "Excellent emergency response! You stabilized the patient quickly."
      : "Patient stabilized successfully. Good emergency response.",
  };
}
