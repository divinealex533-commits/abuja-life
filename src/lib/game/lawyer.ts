"use client";

export type LawyerDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type LawyerAction =
  | "review-evidence"
  | "question-witness"
  | "cross-examine"
  | "object"
  | "present-evidence"
  | "make-opening"
  | "make-closing"
  | "negotiate"
  | "challenge"
  | "protect-client";

export type LawyerCaseType =
  | "criminal"
  | "civil"
  | "business"
  | "property"
  | "family"
  | "corruption";

export interface LawyerCase {
  id: string;
  title: string;
  type: LawyerCaseType;
  description: string;
  client: string;
  opponent: string;
  court: string;
  difficulty: LawyerDifficulty;
  startingReward: number;
  maxReward: number;
  witnesses: number;
  evidenceCount: number;
  timeLimit: number;
}

export interface LawyerScenario {
  id: string;
  title: string;
  description: string;
  type:
    | "evidence"
    | "witness"
    | "objection"
    | "argument"
    | "negotiation"
    | "courtroom";
  difficulty: LawyerDifficulty;
  correctAction: LawyerAction;
  legalImpact: number;
  reputationImpact: number;
  clientImpact: number;
  reward: number;
}

export interface LawyerResult {
  score: number;
  cash: number;
  reputation: number;
  clientConfidence: number;
  caseStrength: number;
  successfulActions: number;
  failedActions: number;
  evidenceUsed: number;
  witnessesHandled: number;
  objectionsWon: number;
  caseOutcome:
    | "victory"
    | "settlement"
    | "partial-victory"
    | "loss";
  rank:
    | "Legal Intern"
    | "Junior Lawyer"
    | "Associate"
    | "Senior Counsel"
    | "Elite Advocate"
    | "Legendary Barrister";
  message: string;
}

const DIFFICULTY_MULTIPLIER: Record<
  LawyerDifficulty,
  number
> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  extreme: 2.1,
};

const LAWYER_CASES: LawyerCase[] = [
  {
    id: "abuja-property-dispute",
    title: "The Maitama Property Dispute",
    type: "property",
    description:
      "A wealthy client claims that a valuable Maitama property was transferred using forged documents.",
    client: "Emeka Okoro",
    opponent: "Atlas Developments Ltd.",
    court: "Abuja High Court",
    difficulty: "easy",
    startingReward: 4000,
    maxReward: 9000,
    witnesses: 3,
    evidenceCount: 5,
    timeLimit: 100,
  },
  {
    id: "business-contract",
    title: "The Broken Business Contract",
    type: "business",
    description:
      "A major Abuja company is accused of violating a multimillion-naira supply agreement.",
    client: "Nova Trading Group",
    opponent: "Capital Merchants Ltd.",
    court: "Federal High Court Abuja",
    difficulty: "medium",
    startingReward: 6500,
    maxReward: 15000,
    witnesses: 4,
    evidenceCount: 7,
    timeLimit: 120,
  },
  {
    id: "wrongful-arrest",
    title: "The Wrongful Arrest Case",
    type: "civil",
    description:
      "Your client claims their reputation and livelihood were destroyed after an unlawful arrest.",
    client: "Daniel Musa",
    opponent: "State Security Authority",
    court: "Abuja High Court",
    difficulty: "medium",
    startingReward: 7500,
    maxReward: 18000,
    witnesses: 5,
    evidenceCount: 8,
    timeLimit: 130,
  },
  {
    id: "corporate-fraud",
    title: "The Corporate Fraud Trial",
    type: "corruption",
    description:
      "A senior executive has been accused of moving millions through hidden company accounts.",
    client: "Victor Adewale",
    opponent: "Federal Prosecutors",
    court: "Federal High Court Abuja",
    difficulty: "hard",
    startingReward: 11000,
    maxReward: 28000,
    witnesses: 7,
    evidenceCount: 11,
    timeLimit: 150,
  },
  {
    id: "criminal-defense",
    title: "The High-Stakes Criminal Defense",
    type: "criminal",
    description:
      "Your client faces serious criminal charges and the prosecution has assembled a powerful case.",
    client: "Ibrahim Bello",
    opponent: "The State",
    court: "Abuja Criminal Court",
    difficulty: "hard",
    startingReward: 14000,
    maxReward: 35000,
    witnesses: 8,
    evidenceCount: 13,
    timeLimit: 175,
  },
  {
    id: "national-corruption-trial",
    title: "The National Corruption Trial",
    type: "corruption",
    description:
      "A politically sensitive corruption case puts your legal skill and reputation on the line.",
    client: "Chief Daniel Waziri",
    opponent: "Federal Government",
    court: "Federal High Court Abuja",
    difficulty: "extreme",
    startingReward: 22000,
    maxReward: 60000,
    witnesses: 11,
    evidenceCount: 18,
    timeLimit: 210,
  },
];

const LAWYER_SCENARIOS: LawyerScenario[] = [
  {
    id: "evidence-1",
    title: "Questionable Document",
    description:
      "You discover that one of the opponent's documents contains an inconsistent signature.",
    type: "evidence",
    difficulty: "easy",
    correctAction: "review-evidence",
    legalImpact: 12,
    reputationImpact: 5,
    clientImpact: 8,
    reward: 500,
  },
  {
    id: "witness-1",
    title: "Witness Contradiction",
    description:
      "A witness gives testimony that conflicts with their earlier statement.",
    type: "witness",
    difficulty: "medium",
    correctAction: "cross-examine",
    legalImpact: 15,
    reputationImpact: 7,
    clientImpact: 10,
    reward: 700,
  },
  {
    id: "objection-1",
    title: "Leading Question",
    description:
      "The opposing lawyer asks a witness a leading question during direct examination.",
    type: "objection",
    difficulty: "easy",
    correctAction: "object",
    legalImpact: 10,
    reputationImpact: 5,
    clientImpact: 6,
    reward: 450,
  },
  {
    id: "objection-2",
    title: "Irrelevant Evidence",
    description:
      "The opposition attempts to introduce evidence that has little connection to the case.",
    type: "objection",
    difficulty: "medium",
    correctAction: "object",
    legalImpact: 14,
    reputationImpact: 6,
    clientImpact: 8,
    reward: 650,
  },
  {
    id: "argument-1",
    title: "Opening Statement",
    description:
      "The judge asks you to explain why the court should believe your client's version of events.",
    type: "argument",
    difficulty: "medium",
    correctAction: "make-opening",
    legalImpact: 10,
    reputationImpact: 8,
    clientImpact: 10,
    reward: 600,
  },
  {
    id: "argument-2",
    title: "Closing Argument",
    description:
      "The evidence is complete. You must connect the strongest facts and deliver your final argument.",
    type: "argument",
    difficulty: "hard",
    correctAction: "make-closing",
    legalImpact: 20,
    reputationImpact: 12,
    clientImpact: 15,
    reward: 1200,
  },
  {
    id: "negotiation-1",
    title: "Settlement Offer",
    description:
      "The opposing side offers a settlement that could protect your client from a risky trial.",
    type: "negotiation",
    difficulty: "medium",
    correctAction: "negotiate",
    legalImpact: 12,
    reputationImpact: 8,
    clientImpact: 18,
    reward: 900,
  },
  {
    id: "courtroom-1",
    title: "Unexpected Testimony",
    description:
      "A witness suddenly introduces information that could seriously damage your client's case.",
    type: "courtroom",
    difficulty: "hard",
    correctAction: "challenge",
    legalImpact: 18,
    reputationImpact: 10,
    clientImpact: 14,
    reward: 1000,
  },
  {
    id: "courtroom-2",
    title: "Client Under Pressure",
    description:
      "Your client is visibly nervous and appears ready to contradict their own testimony.",
    type: "courtroom",
    difficulty: "hard",
    correctAction: "protect-client",
    legalImpact: 15,
    reputationImpact: 10,
    clientImpact: 20,
    reward: 950,
  },
  {
    id: "evidence-2",
    title: "Hidden Evidence",
    description:
      "A previously overlooked piece of evidence could change the direction of the entire case.",
    type: "evidence",
    difficulty: "hard",
    correctAction: "present-evidence",
    legalImpact: 22,
    reputationImpact: 12,
    clientImpact: 16,
    reward: 1300,
  },
];

export function getLawyerCase(
  caseId: string
): LawyerCase | undefined {
  return LAWYER_CASES.find(
    (legalCase) => legalCase.id === caseId
  );
}

export function getAllLawyerCases(): LawyerCase[] {
  return LAWYER_CASES;
}

export function getRandomLawyerCase(): LawyerCase {
  return LAWYER_CASES[
    Math.floor(Math.random() * LAWYER_CASES.length)
  ];
}

export function getRandomLawyerScenario(
  legalCase?: LawyerCase
): LawyerScenario {
  const available = legalCase
    ? LAWYER_SCENARIOS.filter(
        (scenario) =>
          scenario.difficulty === legalCase.difficulty ||
          scenario.difficulty === "easy" ||
          (legalCase.difficulty === "extreme" &&
            scenario.difficulty === "hard")
      )
    : LAWYER_SCENARIOS;

  return available[
    Math.floor(Math.random() * available.length)
  ];
}

export function getLawyerResponseTime(
  difficulty: LawyerDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 8000;

    case "medium":
      return 6500;

    case "hard":
      return 5000;

    case "extreme":
      return 4000;

    default:
      return 6500;
  }
}

export function getLawyerActionOutcome(
  scenario: LawyerScenario,
  action: LawyerAction
) {
  const correct = scenario.correctAction === action;

  if (correct) {
    return {
      correct: true,
      legalImpact: scenario.legalImpact,
      reputationImpact: scenario.reputationImpact,
      clientImpact: scenario.clientImpact,
      reward: scenario.reward,
      message:
        "Excellent legal decision. You strengthened the case.",
    };
  }

  return {
    correct: false,
    legalImpact: -Math.max(
      5,
      Math.floor(scenario.legalImpact * 0.6)
    ),
    reputationImpact: -Math.max(
      2,
      Math.floor(scenario.reputationImpact * 0.5)
    ),
    clientImpact: -Math.max(
      3,
      Math.floor(scenario.clientImpact * 0.5)
    ),
    reward: 0,
    message:
      "That legal decision weakened your position.",
  };
}

export function getLawyerSuccessMessage(
  action: LawyerAction
): string {
  const messages: Record<LawyerAction, string> = {
    "review-evidence":
      "You spotted a critical detail in the evidence.",
    "question-witness":
      "Your questioning exposed useful information.",
    "cross-examine":
      "Your cross-examination exposed a contradiction.",
    object:
      "Objection sustained. The judge agrees with you.",
    "present-evidence":
      "The evidence was admitted and strengthened your case.",
    "make-opening":
      "Your opening statement established a powerful case theory.",
    "make-closing":
      "Your closing argument connected the strongest facts.",
    negotiate:
      "You negotiated a favorable position for your client.",
    challenge:
      "You challenged the testimony before it could damage the case.",
    "protect-client":
      "You protected your client from a damaging courtroom mistake.",
  };

  return messages[action];
}

export function getLawyerFailureMessage(
  action: LawyerAction
): string {
  const messages: Record<LawyerAction, string> = {
    "review-evidence":
      "You failed to notice an important detail.",
    "question-witness":
      "Your questions did not produce useful information.",
    "cross-examine":
      "The witness survived your cross-examination.",
    object:
      "Objection overruled. The evidence remains.",
    "present-evidence":
      "The evidence did not help your case.",
    "make-opening":
      "Your opening statement failed to establish a clear argument.",
    "make-closing":
      "Your closing argument left important points unanswered.",
    negotiate:
      "The opposing side rejected your negotiation.",
    challenge:
      "Your challenge failed to undermine the testimony.",
    "protect-client":
      "Your client made a damaging courtroom statement.",
  };

  return messages[action];
}

export function calculateLawyerResult(params: {
  legalCase: LawyerCase;
  score: number;
  clientConfidence: number;
  caseStrength: number;
  successfulActions: number;
  failedActions: number;
  evidenceUsed: number;
  witnessesHandled: number;
  objectionsWon: number;
  timeRemaining: number;
}): LawyerResult {
  const {
    legalCase,
    score,
    clientConfidence,
    caseStrength,
    successfulActions,
    failedActions,
    evidenceUsed,
    witnessesHandled,
    objectionsWon,
    timeRemaining,
  } = params;

  const multiplier =
    DIFFICULTY_MULTIPLIER[legalCase.difficulty];

  const performanceRatio =
    successfulActions /
    Math.max(1, successfulActions + failedActions);

  const finalScore = Math.max(
    0,
    Math.round(
      score +
        caseStrength * 2 +
        clientConfidence +
        objectionsWon * 15 +
        evidenceUsed * 8 +
        witnessesHandled * 10 +
        timeRemaining * 1.5
    )
  );

  const rewardBase =
    legalCase.startingReward +
    (legalCase.maxReward - legalCase.startingReward) *
      Math.min(1, performanceRatio);

  const cash = Math.max(
    0,
    Math.round(
      rewardBase *
        multiplier *
        Math.max(0.25, finalScore / 700)
    )
  );

  const reputation = Math.max(
    0,
    Math.round(
      5 +
        finalScore / 55 +
        caseStrength / 15
    )
  );

  let caseOutcome: LawyerResult["caseOutcome"];

  if (
    finalScore >= 800 &&
    caseStrength >= 75 &&
    clientConfidence >= 70
  ) {
    caseOutcome = "victory";
  } else if (
    finalScore >= 600 &&
    caseStrength >= 60
  ) {
    caseOutcome = "partial-victory";
  } else if (
    finalScore >= 450 &&
    clientConfidence >= 55
  ) {
    caseOutcome = "settlement";
  } else {
    caseOutcome = "loss";
  }

  let rank: LawyerResult["rank"];

  if (finalScore >= 1000) {
    rank = "Legendary Barrister";
  } else if (finalScore >= 850) {
    rank = "Elite Advocate";
  } else if (finalScore >= 700) {
    rank = "Senior Counsel";
  } else if (finalScore >= 500) {
    rank = "Associate";
  } else if (finalScore >= 300) {
    rank = "Junior Lawyer";
  } else {
    rank = "Legal Intern";
  }

  const messageMap: Record<
    LawyerResult["caseOutcome"],
    string
  > = {
    victory:
      "Case won. Your courtroom performance was outstanding.",
    "partial-victory":
      "You secured a strong result for your client.",
    settlement:
      "You negotiated a settlement that protected your client.",
    loss:
      "The case was lost. Learn from the mistakes and prepare for the next case.",
  };

  return {
    score: finalScore,
    cash,
    reputation,
    clientConfidence,
    caseStrength,
    successfulActions,
    failedActions,
    evidenceUsed,
    witnessesHandled,
    objectionsWon,
    caseOutcome,
    rank,
    message: messageMap[caseOutcome],
  };
}
