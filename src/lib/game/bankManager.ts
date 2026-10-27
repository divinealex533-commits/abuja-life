"use client";

export type BankDifficulty = "easy" | "medium" | "hard" | "extreme";

export type BankAction =
  | "approve"
  | "reject"
  | "verify"
  | "serve"
  | "investigate"
  | "security"
  | "loan";

export type BankEventType =
  | "deposit"
  | "withdrawal"
  | "loan"
  | "fraud"
  | "vip"
  | "angry"
  | "security"
  | "target"
  | "bonus";

export interface BankScenario {
  id: string;
  title: string;
  description: string;
  customer: string;
  type: BankEventType;
  difficulty: BankDifficulty;
  amount: number;
  correctAction: BankAction;
  reward: number;
  reputation: number;
}

export interface BankResult {
  score: number;
  cash: number;
  reputation: number;
  customersServed: number;
  successfulDecisions: number;
  failedDecisions: number;
  fraudStopped: number;
  loansApproved: number;
  totalProcessed: number;
  branchRating: number;
  rank: string;
  message: string;
}

export const BANK_SCENARIOS: BankScenario[] = [
  {
    id: "salary-deposit",
    title: "Salary Deposit",
    description:
      "A customer wants to deposit their monthly salary into their account.",
    customer: "Amina Bello",
    type: "deposit",
    difficulty: "easy",
    amount: 180000,
    correctAction: "serve",
    reward: 1200,
    reputation: 2,
  },
  {
    id: "large-withdrawal",
    title: "Large Withdrawal",
    description:
      "A customer requests a large cash withdrawal. Verify the transaction before releasing the money.",
    customer: "Emeka Okoro",
    type: "withdrawal",
    difficulty: "medium",
    amount: 850000,
    correctAction: "verify",
    reward: 1800,
    reputation: 3,
  },
  {
    id: "suspicious-transfer",
    title: "Suspicious Transfer",
    description:
      "A transfer has unusual activity and does not match the customer's normal transaction pattern.",
    customer: "Unknown Account",
    type: "fraud",
    difficulty: "hard",
    amount: 2400000,
    correctAction: "investigate",
    reward: 3500,
    reputation: 6,
  },
  {
    id: "vip-customer",
    title: "VIP Customer",
    description:
      "A high-value customer needs urgent assistance with a legitimate transaction.",
    customer: "Ibrahim Musa",
    type: "vip",
    difficulty: "medium",
    amount: 1200000,
    correctAction: "serve",
    reward: 2500,
    reputation: 5,
  },
  {
    id: "loan-request",
    title: "Business Loan",
    description:
      "A customer requests a business loan. Their documents and repayment history are strong.",
    customer: "Chinedu Motors",
    type: "loan",
    difficulty: "medium",
    amount: 3500000,
    correctAction: "loan",
    reward: 3200,
    reputation: 5,
  },
  {
    id: "fake-documents",
    title: "Suspicious Documents",
    description:
      "A customer presents documents that appear altered. Do not approve the transaction until it is investigated.",
    customer: "Unknown Customer",
    type: "fraud",
    difficulty: "hard",
    amount: 1750000,
    correctAction: "investigate",
    reward: 4000,
    reputation: 7,
  },
  {
    id: "angry-customer",
    title: "Angry Customer",
    description:
      "A frustrated customer is complaining loudly about a delayed transfer.",
    customer: "Ngozi Eze",
    type: "angry",
    difficulty: "medium",
    amount: 95000,
    correctAction: "serve",
    reward: 1400,
    reputation: 4,
  },
  {
    id: "security-alert",
    title: "Security Alert",
    description:
      "The branch security system detects suspicious activity near the cash area.",
    customer: "Branch Security",
    type: "security",
    difficulty: "hard",
    amount: 500000,
    correctAction: "security",
    reward: 3800,
    reputation: 7,
  },
  {
    id: "loan-risk",
    title: "High-Risk Loan",
    description:
      "A customer wants a large loan but their repayment history is poor.",
    customer: "Fast Cash Enterprise",
    type: "loan",
    difficulty: "hard",
    amount: 5000000,
    correctAction: "reject",
    reward: 3000,
    reputation: 6,
  },
  {
    id: "daily-target",
    title: "Branch Target",
    description:
      "Your branch is behind its daily transaction target. Process a legitimate customer request efficiently.",
    customer: "Walk-in Customer",
    type: "target",
    difficulty: "easy",
    amount: 250000,
    correctAction: "serve",
    reward: 2200,
    reputation: 3,
  },
  {
    id: "account-verification",
    title: "Account Verification",
    description:
      "A customer wants to make a high-value transaction but their identity needs to be confirmed.",
    customer: "Daniel Yusuf",
    type: "withdrawal",
    difficulty: "medium",
    amount: 600000,
    correctAction: "verify",
    reward: 1700,
    reputation: 3,
  },
  {
    id: "bonus-client",
    title: "Major Client",
    description:
      "A major Abuja business wants to move funds through your branch.",
    customer: "Abuja Holdings",
    type: "bonus",
    difficulty: "hard",
    amount: 8500000,
    correctAction: "verify",
    reward: 5000,
    reputation: 8,
  },
];

const DIFFICULTY_MULTIPLIER: Record<BankDifficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  extreme: 2,
};

export function getBankScenarioById(
  id: string
): BankScenario | undefined {
  return BANK_SCENARIOS.find((scenario) => scenario.id === id);
}

export function getRandomBankScenario(
  usedIds: string[] = []
): BankScenario {
  const available = BANK_SCENARIOS.filter(
    (scenario) => !usedIds.includes(scenario.id)
  );

  const pool =
    available.length > 0 ? available : BANK_SCENARIOS;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getBankShiftDuration(
  difficulty: BankDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 90;
    case "medium":
      return 120;
    case "hard":
      return 150;
    case "extreme":
      return 180;
  }
}

export function getActionOutcome(
  scenario: BankScenario,
  action: BankAction
): {
  correct: boolean;
  score: number;
  cash: number;
  reputation: number;
  message: string;
} {
  const multiplier = DIFFICULTY_MULTIPLIER[scenario.difficulty];

  if (action === scenario.correctAction) {
    return {
      correct: true,
      score: Math.round(100 * multiplier),
      cash: Math.round(scenario.reward * multiplier),
      reputation: scenario.reputation,
      message: getSuccessMessage(scenario),
    };
  }

  return {
    correct: false,
    score: -Math.round(60 * multiplier),
    cash: -Math.round(scenario.reward * 0.35),
    reputation: -Math.max(1, Math.round(scenario.reputation / 2)),
    message: getFailureMessage(scenario, action),
  };
}

function getSuccessMessage(
  scenario: BankScenario
): string {
  switch (scenario.type) {
    case "fraud":
      return "Excellent catch. Suspicious activity was stopped before funds were released.";

    case "security":
      return "Security protocol activated. The branch is safe.";

    case "loan":
      return "Loan decision recorded successfully.";

    case "vip":
      return "VIP customer handled professionally.";

    case "angry":
      return "Customer issue resolved and service restored.";

    default:
      return "Transaction completed successfully.";
  }
}

function getFailureMessage(
  scenario: BankScenario,
  action: BankAction
): string {
  if (
    scenario.type === "fraud" &&
    action !== "investigate"
  ) {
    return "You missed a suspicious transaction. The compliance team flagged your decision.";
  }

  if (
    scenario.type === "security" &&
    action !== "security"
  ) {
    return "Security protocol was not followed. Branch security has been compromised.";
  }

  if (
    scenario.type === "loan" &&
    action === "loan"
  ) {
    return "That loan decision was too risky for the bank.";
  }

  return "That was not the best decision. The branch lost money and reputation.";
}

export function calculateBankResult(params: {
  score: number;
  customersServed: number;
  successfulDecisions: number;
  failedDecisions: number;
  fraudStopped: number;
  loansApproved: number;
  totalProcessed: number;
  elapsedSeconds: number;
  difficulty: BankDifficulty;
}): BankResult {
  const {
    score,
    customersServed,
    successfulDecisions,
    failedDecisions,
    fraudStopped,
    loansApproved,
    totalProcessed,
    elapsedSeconds,
    difficulty,
  } = params;

  const accuracy =
    customersServed > 0
      ? successfulDecisions / customersServed
      : 0;

  const speedBonus =
    elapsedSeconds <= getBankShiftDuration(difficulty) * 0.65
      ? 15
      : elapsedSeconds <= getBankShiftDuration(difficulty) * 0.85
        ? 8
        : 0;

  const fraudBonus = fraudStopped * 20;
  const loanBonus = loansApproved * 10;

  const finalScore = Math.max(
    0,
    Math.round(
      score +
        accuracy * 100 +
        speedBonus +
        fraudBonus +
        loanBonus
    )
  );

  const branchRating = Math.max(
    1,
    Math.min(
      5,
      Number((1 + accuracy * 4).toFixed(1))
    )
  );

  let rank = "Trainee Manager";

  if (finalScore >= 600) {
    rank = "Bank Director";
  } else if (finalScore >= 450) {
    rank = "Senior Manager";
  } else if (finalScore >= 300) {
    rank = "Branch Manager";
  } else if (finalScore >= 180) {
    rank = "Assistant Manager";
  }

  const cash = Math.max(
    0,
    Math.round(
      2500 +
        finalScore * 7 +
        totalProcessed * 0.00035
    )
  );

  const reputation = Math.max(
    0,
    Math.round(
      successfulDecisions * 2 +
        fraudStopped * 4 +
        accuracy * 5 -
        failedDecisions
    )
  );

  let message =
    "Your shift is complete. The branch needs more consistency.";

  if (branchRating >= 4.5) {
    message =
      "Outstanding shift! You managed the branch like a true banking professional.";
  } else if (branchRating >= 3.5) {
    message =
      "Strong performance. The branch finished the shift in good shape.";
  } else if (branchRating >= 2.5) {
    message =
      "Decent shift, but several decisions cost the branch money.";
  }

  return {
    score: finalScore,
    cash,
    reputation,
    customersServed,
    successfulDecisions,
    failedDecisions,
    fraudStopped,
    loansApproved,
    totalProcessed,
    branchRating,
    rank,
    message,
  };
}
