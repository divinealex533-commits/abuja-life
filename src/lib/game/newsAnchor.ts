"use client";

export type NewsAnchorDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type NewsAnchorAction =
  | "verify-source"
  | "read-headline"
  | "ask-question"
  | "challenge-guest"
  | "clarify"
  | "break-news"
  | "correct-error"
  | "give-analysis"
  | "take-interview"
  | "close-broadcast";

export type NewsStoryType =
  | "breaking"
  | "politics"
  | "business"
  | "crime"
  | "weather"
  | "sports"
  | "entertainment"
  | "community";

export type NewsAnchorOutcome =
  | "excellent"
  | "good"
  | "mixed"
  | "poor"
  | "disaster";

export interface NewsStory {
  id: string;
  title: string;
  description: string;
  type: NewsStoryType;
  difficulty: NewsAnchorDifficulty;
  basePay: number;
  maxPay: number;
  audienceTarget: number;
  credibilityRisk: number;
  sourcesRequired: number;
  interviewRequired: boolean;
  durationSeconds: number;
}

export interface NewsScenario {
  id: string;
  storyId: string;
  type:
    | "source"
    | "headline"
    | "interview"
    | "fact-check"
    | "breaking"
    | "correction"
    | "analysis"
    | "closing";
  prompt: string;
  correctAction: NewsAnchorAction;
  acceptableActions?: NewsAnchorAction[];
  successMessage: string;
  failureMessage: string;
  audienceImpact: number;
  credibilityImpact: number;
}

export interface NewsAnchorResult {
  storyId: string;
  score: number;
  cash: number;
  reputation: number;
  audienceRating: number;
  credibility: number;
  successfulDecisions: number;
  failedDecisions: number;
  outcome: NewsAnchorOutcome;
  rank: string;
}

const NEWS_STORIES: NewsStory[] = [
  {
    id: "abuja-fuel-crisis",
    title: "Fuel Supply Disruption Hits Abuja",
    description:
      "Several filling stations across Abuja report unusually long queues as motorists react to a sudden fuel supply disruption.",
    type: "breaking",
    difficulty: "easy",
    basePay: 3500,
    maxPay: 8500,
    audienceTarget: 25000,
    credibilityRisk: 20,
    sourcesRequired: 3,
    interviewRequired: true,
    durationSeconds: 90,
  },
  {
    id: "wuse-market-expansion",
    title: "Wuse Market Expansion Announced",
    description:
      "A major commercial development is announced around Wuse, creating opportunities and concerns for traders.",
    type: "business",
    difficulty: "easy",
    basePay: 4000,
    maxPay: 10000,
    audienceTarget: 32000,
    credibilityRisk: 18,
    sourcesRequired: 3,
    interviewRequired: true,
    durationSeconds: 95,
  },
  {
    id: "jabi-road-accident",
    title: "Major Traffic Incident Near Jabi",
    description:
      "A serious traffic incident causes delays around Jabi. Initial reports from social media conflict with eyewitness accounts.",
    type: "crime",
    difficulty: "medium",
    basePay: 5500,
    maxPay: 14000,
    audienceTarget: 50000,
    credibilityRisk: 35,
    sourcesRequired: 4,
    interviewRequired: true,
    durationSeconds: 110,
  },
  {
    id: "abuja-storm-warning",
    title: "Severe Storm Warning Issued",
    description:
      "Weather officials issue a warning as a major storm system approaches Abuja.",
    type: "weather",
    difficulty: "medium",
    basePay: 6000,
    maxPay: 15000,
    audienceTarget: 65000,
    credibilityRisk: 40,
    sourcesRequired: 4,
    interviewRequired: false,
    durationSeconds: 115,
  },
  {
    id: "corporate-investigation",
    title: "Major Company Faces Investigation",
    description:
      "A major Abuja-based company comes under investigation after allegations of financial misconduct emerge.",
    type: "business",
    difficulty: "hard",
    basePay: 8500,
    maxPay: 22000,
    audienceTarget: 90000,
    credibilityRisk: 55,
    sourcesRequired: 6,
    interviewRequired: true,
    durationSeconds: 140,
  },
  {
    id: "national-election-special",
    title: "National Election Special",
    description:
      "Your newsroom receives conflicting reports during a major election night broadcast.",
    type: "politics",
    difficulty: "hard",
    basePay: 12000,
    maxPay: 32000,
    audienceTarget: 180000,
    credibilityRisk: 70,
    sourcesRequired: 8,
    interviewRequired: true,
    durationSeconds: 170,
  },
  {
    id: "national-security-alert",
    title: "National Security Alert",
    description:
      "A sensitive security situation develops while your station is live on air.",
    type: "crime",
    difficulty: "extreme",
    basePay: 18000,
    maxPay: 50000,
    audienceTarget: 250000,
    credibilityRisk: 90,
    sourcesRequired: 10,
    interviewRequired: true,
    durationSeconds: 210,
  },
  {
    id: "abuja-entertainment-awards",
    title: "Abuja Entertainment Awards",
    description:
      "Major entertainment personalities arrive in Abuja for a highly anticipated awards event.",
    type: "entertainment",
    difficulty: "medium",
    basePay: 5000,
    maxPay: 13000,
    audienceTarget: 75000,
    credibilityRisk: 15,
    sourcesRequired: 3,
    interviewRequired: true,
    durationSeconds: 100,
  },
];

const NEWS_SCENARIOS: NewsScenario[] = [
  {
    id: "verify-before-air",
    storyId: "abuja-fuel-crisis",
    type: "source",
    prompt:
      "A viral post claims that every fuel station in Abuja has completely run out of petrol. What do you do before reporting it?",
    correctAction: "verify-source",
    successMessage:
      "You verify the claim with multiple independent sources before going live.",
    failureMessage:
      "You repeat an unverified viral claim and risk misleading viewers.",
    audienceImpact: 5,
    credibilityImpact: 12,
  },
  {
    id: "headline-fuel",
    storyId: "abuja-fuel-crisis",
    type: "headline",
    prompt:
      "You have confirmed supply problems at several stations, but not all stations. Which approach should you take?",
    correctAction: "read-headline",
    successMessage:
      "Your headline is urgent but accurately reflects what has been confirmed.",
    failureMessage:
      "Your headline exaggerates the situation beyond what your sources confirm.",
    audienceImpact: 8,
    credibilityImpact: 10,
  },
  {
    id: "market-interview",
    storyId: "wuse-market-expansion",
    type: "interview",
    prompt:
      "A trader says the expansion will destroy small businesses. What is your best next move?",
    correctAction: "ask-question",
    successMessage:
      "You ask a focused follow-up question and allow the trader to explain the concern.",
    failureMessage:
      "You interrupt or make assumptions instead of investigating the claim.",
    audienceImpact: 6,
    credibilityImpact: 8,
  },
  {
    id: "jabi-conflicting-reports",
    storyId: "jabi-road-accident",
    type: "fact-check",
    prompt:
      "Social media reports claim there are dozens of casualties, but emergency officials have not confirmed the number.",
    correctAction: "verify-source",
    successMessage:
      "You refuse to broadcast an unconfirmed casualty figure.",
    failureMessage:
      "You repeat an unconfirmed casualty figure during a sensitive live report.",
    audienceImpact: 10,
    credibilityImpact: 18,
  },
  {
    id: "jabi-eyewitness",
    storyId: "jabi-road-accident",
    type: "interview",
    prompt:
      "An eyewitness gives an emotional account but admits they did not see the entire incident.",
    correctAction: "clarify",
    successMessage:
      "You clearly distinguish eyewitness testimony from confirmed facts.",
    failureMessage:
      "You present an incomplete eyewitness account as established fact.",
    audienceImpact: 7,
    credibilityImpact: 14,
  },
  {
    id: "storm-warning",
    storyId: "abuja-storm-warning",
    type: "breaking",
    prompt:
      "A weather alert arrives moments before your broadcast. What should happen first?",
    correctAction: "break-news",
    successMessage:
      "You quickly deliver the verified warning and explain what residents should know.",
    failureMessage:
      "You delay the verified warning while focusing on less important material.",
    audienceImpact: 14,
    credibilityImpact: 10,
  },
  {
    id: "corporate-allegation",
    storyId: "corporate-investigation",
    type: "source",
    prompt:
      "An anonymous document accuses a company executive of fraud. What should you do?",
    correctAction: "verify-source",
    successMessage:
      "You authenticate the document and seek an official response before broadcasting.",
    failureMessage:
      "You treat an anonymous document as proof of wrongdoing.",
    audienceImpact: 12,
    credibilityImpact: 22,
  },
  {
    id: "corporate-executive",
    storyId: "corporate-investigation",
    type: "interview",
    prompt:
      "The company executive denies the allegations. How should you proceed?",
    correctAction: "challenge-guest",
    successMessage:
      "You challenge the response with specific verified evidence and remain professional.",
    failureMessage:
      "You either accept the denial without scrutiny or turn the interview into an argument.",
    audienceImpact: 12,
    credibilityImpact: 12,
  },
  {
    id: "election-night",
    storyId: "national-election-special",
    type: "breaking",
    prompt:
      "Two unofficial sources report different winners. What should you say on air?",
    correctAction: "verify-source",
    successMessage:
      "You explain that the result is not yet verified and avoid declaring a winner.",
    failureMessage:
      "You announce an unverified result and risk creating serious misinformation.",
    audienceImpact: 18,
    credibilityImpact: 30,
  },
  {
    id: "election-analysis",
    storyId: "national-election-special",
    type: "analysis",
    prompt:
      "Viewers want your prediction while official results are still incomplete.",
    correctAction: "give-analysis",
    successMessage:
      "You provide clearly labeled analysis without presenting speculation as fact.",
    failureMessage:
      "You blur the line between analysis and confirmed election results.",
    audienceImpact: 14,
    credibilityImpact: 20,
  },
  {
    id: "security-alert",
    storyId: "national-security-alert",
    type: "breaking",
    prompt:
      "A sensitive security alert arrives. Some details are still unverified. What is your priority?",
    correctAction: "verify-source",
    successMessage:
      "You protect the public from misinformation while quickly confirming critical facts.",
    failureMessage:
      "You rush sensitive information onto air before it has been properly verified.",
    audienceImpact: 20,
    credibilityImpact: 35,
  },
  {
    id: "security-interview",
    storyId: "national-security-alert",
    type: "interview",
    prompt:
      "A security official joins the broadcast but cannot discuss operational details.",
    correctAction: "ask-question",
    successMessage:
      "You ask useful public-safety questions without pressuring the guest to reveal sensitive information.",
    failureMessage:
      "You push for sensitive operational details that should not be broadcast.",
    audienceImpact: 12,
    credibilityImpact: 18,
  },
  {
    id: "entertainment-interview",
    storyId: "abuja-entertainment-awards",
    type: "interview",
    prompt:
      "A celebrity arrives for a live interview. What is your strongest opening?",
    correctAction: "take-interview",
    successMessage:
      "You begin with a relevant question that immediately engages the audience.",
    failureMessage:
      "Your opening is unfocused and wastes valuable live airtime.",
    audienceImpact: 10,
    credibilityImpact: 4,
  },
];

export function getNewsStory(id: string): NewsStory | null {
  return NEWS_STORIES.find((story) => story.id === id) ?? null;
}

export function getAllNewsStories(): NewsStory[] {
  return [...NEWS_STORIES];
}

export function getRandomNewsStory(): NewsStory {
  return NEWS_STORIES[Math.floor(Math.random() * NEWS_STORIES.length)];
}

export function getNewsScenarios(storyId: string): NewsScenario[] {
  return NEWS_SCENARIOS.filter((scenario) => scenario.storyId === storyId);
}

export function getRandomNewsScenario(
  storyId: string
): NewsScenario | null {
  const scenarios = getNewsScenarios(storyId);

  if (scenarios.length === 0) {
    return null;
  }

  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

export function getNewsResponseTime(
  difficulty: NewsAnchorDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 12;
    case "medium":
      return 10;
    case "hard":
      return 8;
    case "extreme":
      return 6;
    default:
      return 10;
  }
}

export function getNewsActionOutcome(
  scenario: NewsScenario,
  action: NewsAnchorAction
): {
  success: boolean;
  audienceImpact: number;
  credibilityImpact: number;
  message: string;
} {
  const success =
    action === scenario.correctAction ||
    scenario.acceptableActions?.includes(action) === true;

  if (success) {
    return {
      success: true,
      audienceImpact: scenario.audienceImpact,
      credibilityImpact: scenario.credibilityImpact,
      message: scenario.successMessage,
    };
  }

  return {
    success: false,
    audienceImpact: Math.round(scenario.audienceImpact * 0.45),
    credibilityImpact: -Math.abs(scenario.credibilityImpact),
    message: scenario.failureMessage,
  };
}

export function getNewsSuccessMessage(
  outcome: NewsAnchorOutcome
): string {
  switch (outcome) {
    case "excellent":
      return "Outstanding broadcast. Viewers trusted you and your newsroom dominated the coverage.";
    case "good":
      return "Strong broadcast. You delivered useful reporting and kept audience confidence high.";
    case "mixed":
      return "Mixed broadcast. You had some strong moments, but there were avoidable mistakes.";
    case "poor":
      return "Weak broadcast. Your decisions hurt audience confidence and newsroom credibility.";
    case "disaster":
      return "Broadcast disaster. Major reporting mistakes seriously damaged your credibility.";
    default:
      return "Broadcast complete.";
  }
}

export function getNewsFailureMessage(
  failedDecisions: number
): string {
  if (failedDecisions >= 5) {
    return "Too many critical mistakes. The newsroom has serious concerns about your performance.";
  }

  if (failedDecisions >= 3) {
    return "Several reporting mistakes damaged the broadcast.";
  }

  if (failedDecisions >= 1) {
    return "You made some mistakes, but the broadcast can still be recovered.";
  }

  return "Excellent newsroom discipline.";
}

export function calculateNewsAnchorResult(params: {
  story: NewsStory;
  score: number;
  audienceRating: number;
  credibility: number;
  successfulDecisions: number;
  failedDecisions: number;
}): NewsAnchorResult {
  const {
    story,
    score,
    audienceRating,
    credibility,
    successfulDecisions,
    failedDecisions,
  } = params;

  const safeAudience = Math.max(
    0,
    Math.min(100, audienceRating)
  );

  const safeCredibility = Math.max(
    0,
    Math.min(100, credibility)
  );

  const decisionScore =
    successfulDecisions * 90 -
    failedDecisions * 120;

  const finalScore = Math.max(
    0,
    Math.round(
      score +
        decisionScore +
        safeAudience * 3 +
        safeCredibility * 4
    )
  );

  let outcome: NewsAnchorOutcome;

  if (
    finalScore >= 1000 &&
    safeCredibility >= 85 &&
    safeAudience >= 85
  ) {
    outcome = "excellent";
  } else if (
    finalScore >= 750 &&
    safeCredibility >= 70
  ) {
    outcome = "good";
  } else if (
    finalScore >= 500 &&
    safeCredibility >= 50
  ) {
    outcome = "mixed";
  } else if (
    finalScore >= 250 &&
    safeCredibility >= 30
  ) {
    outcome = "poor";
  } else {
    outcome = "disaster";
  }

  const outcomeMultiplier: Record<
    NewsAnchorOutcome,
    number
  > = {
    excellent: 1.5,
    good: 1.2,
    mixed: 0.9,
    poor: 0.55,
    disaster: 0.25,
  };

  const multiplier = outcomeMultiplier[outcome];

  const rawCash =
    story.basePay +
    Math.round(
      (story.maxPay - story.basePay) *
        Math.min(finalScore / 1500, 1)
    );

  const cash = Math.max(
    500,
    Math.round(rawCash * multiplier)
  );

  const reputation = Math.max(
    -20,
    Math.round(
      (safeCredibility - 50) / 4 +
        successfulDecisions * 2 -
        failedDecisions * 4
    )
  );

  let rank = "Junior Reporter";

  if (
    finalScore >= 1400 &&
    safeCredibility >= 90
  ) {
    rank = "Legendary News Anchor";
  } else if (
    finalScore >= 1100 &&
    safeCredibility >= 82
  ) {
    rank = "Prime-Time Anchor";
  } else if (
    finalScore >= 850 &&
    safeCredibility >= 72
  ) {
    rank = "Senior News Anchor";
  } else if (
    finalScore >= 600 &&
    safeCredibility >= 60
  ) {
    rank = "News Anchor";
  } else if (
    finalScore >= 350 &&
    safeCredibility >= 45
  ) {
    rank = "Field Correspondent";
  }

  return {
    storyId: story.id,
    score: finalScore,
    cash,
    reputation,
    audienceRating: safeAudience,
    credibility: safeCredibility,
    successfulDecisions,
    failedDecisions,
    outcome,
    rank,
  };
}
