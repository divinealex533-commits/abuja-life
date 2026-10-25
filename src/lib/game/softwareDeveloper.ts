export type DevelopmentStack =
  | "javascript"
  | "typescript"
  | "python"
  | "react"
  | "node";

export type DevelopmentTask =
  | "website"
  | "mobile-app"
  | "api"
  | "dashboard"
  | "bug-fix";

export type DevelopmentDifficulty = "easy" | "medium" | "hard";

export interface DeveloperContract {
  id: string;
  client: string;
  project: string;
  description: string;
  task: DevelopmentTask;
  preferredStack: DevelopmentStack;
  budget: number;
  difficulty: DevelopmentDifficulty;
  deadlineMinutes: number;
}

export interface DeveloperResult {
  basePayment: number;
  stackBonus: number;
  qualityBonus: number;
  speedBonus: number;
  tip: number;
  totalPayment: number;
  codeQuality: number;
  clientSatisfaction: number;
  reputationGain: number;
  energyCost: number;
  message: string;
}

export const DEVELOPER_CONTRACTS: DeveloperContract[] = [
  {
    id: "dev-restaurant-site",
    client: "Jabi Restaurant",
    project: "Restaurant Website",
    description:
      "Build a clean website where customers can view meals and contact the restaurant.",
    task: "website",
    preferredStack: "react",
    budget: 7000,
    difficulty: "easy",
    deadlineMinutes: 15,
  },
  {
    id: "dev-school-dashboard",
    client: "Abuja Academy",
    project: "Student Dashboard",
    description:
      "Create a dashboard for students to view results, attendance and announcements.",
    task: "dashboard",
    preferredStack: "typescript",
    budget: 10000,
    difficulty: "medium",
    deadlineMinutes: 20,
  },
  {
    id: "dev-delivery-api",
    client: "Abuja Express",
    project: "Delivery API",
    description:
      "Build an API that handles delivery orders and updates their status.",
    task: "api",
    preferredStack: "node",
    budget: 12000,
    difficulty: "medium",
    deadlineMinutes: 18,
  },
  {
    id: "dev-fashion-app",
    client: "Abuja Fashion House",
    project: "Fashion Mobile App",
    description:
      "Develop a mobile shopping experience for a growing fashion brand.",
    task: "mobile-app",
    preferredStack: "javascript",
    budget: 15000,
    difficulty: "hard",
    deadlineMinutes: 25,
  },
  {
    id: "dev-bank-bug",
    client: "Capital Finance",
    project: "Payment Bug Fix",
    description:
      "Find and fix a critical payment calculation bug before customers are affected.",
    task: "bug-fix",
    preferredStack: "python",
    budget: 18000,
    difficulty: "hard",
    deadlineMinutes: 12,
  },
  {
    id: "dev-event-dashboard",
    client: "Abuja Events",
    project: "Event Dashboard",
    description:
      "Build an event management dashboard for tickets, guests and schedules.",
    task: "dashboard",
    preferredStack: "react",
    budget: 13500,
    difficulty: "hard",
    deadlineMinutes: 22,
  },
];

export function getDeveloperContract(
  id: string
): DeveloperContract | undefined {
  return DEVELOPER_CONTRACTS.find((contract) => contract.id === id);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculateDeveloperResult(
  contract: DeveloperContract,
  selectedStack: DevelopmentStack,
  debugging: number,
  codeQuality: number,
  speed: number
): DeveloperResult {
  const debuggingScore = clamp(debugging, 0, 1);
  const qualityScore = clamp(codeQuality, 0, 1);
  const speedScore = clamp(speed, 0, 1);

  const stackMatch = selectedStack === contract.preferredStack;

  const overallQuality =
    debuggingScore * 0.35 +
    qualityScore * 0.4 +
    speedScore * 0.25;

  const finalQuality = Math.round(overallQuality * 100);

  const stackBonus = stackMatch ? 1200 : 0;

  const qualityBonus = Math.round(
    contract.budget * 0.35 * overallQuality
  );

  const speedBonus =
    speedScore >= 0.9
      ? Math.round(contract.budget * 0.12)
      : speedScore >= 0.75
        ? Math.round(contract.budget * 0.06)
        : 0;

  const clientSatisfaction = clamp(
    Math.round(
      finalQuality * 0.65 +
        (stackMatch ? 20 : 0) +
        (speedScore >= 0.8 ? 15 : 0)
    ),
    0,
    100
  );

  const tip =
    clientSatisfaction >= 90
      ? Math.round(contract.budget * 0.2)
      : clientSatisfaction >= 75
        ? Math.round(contract.budget * 0.1)
        : clientSatisfaction >= 60
          ? Math.round(contract.budget * 0.04)
          : 0;

  const totalPayment =
    contract.budget +
    stackBonus +
    qualityBonus +
    speedBonus +
    tip;

  const reputationGain =
    clientSatisfaction >= 90
      ? 9
      : clientSatisfaction >= 75
        ? 7
        : clientSatisfaction >= 60
          ? 4
          : 1;

  const energyCost =
    contract.difficulty === "hard"
      ? 22
      : contract.difficulty === "medium"
        ? 18
        : 14;

  let message =
    "The client accepted the project but expected better technical work.";

  if (clientSatisfaction >= 90) {
    message =
      "Excellent development work! The client wants to work with you again.";
  } else if (clientSatisfaction >= 75) {
    message =
      "Great job! The project was delivered successfully.";
  } else if (clientSatisfaction >= 60) {
    message =
      "The project works, but the client requested improvements.";
  }

  return {
    basePayment: contract.budget,
    stackBonus,
    qualityBonus,
    speedBonus,
    tip,
    totalPayment,
    codeQuality: finalQuality,
    clientSatisfaction,
    reputationGain,
    energyCost,
    message,
  };
}
