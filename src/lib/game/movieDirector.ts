"use client";

export type MovieDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type MovieAction =
  | "cast"
  | "shoot"
  | "retake"
  | "direct"
  | "marketing"
  | "protect"
  | "premiere";

export type MovieEventType =
  | "casting"
  | "production"
  | "actor"
  | "budget"
  | "viral"
  | "marketing"
  | "problem"
  | "premiere"
  | "award";

export interface MovieProject {
  id: string;
  title: string;
  genre: string;
  description: string;
  emoji: string;
  difficulty: MovieDifficulty;
  startingBudget: number;
  expectedRevenue: number;
  audienceTarget: number;
  productionDays: number;
}

export interface MovieScenario {
  id: string;
  title: string;
  description: string;
  type: MovieEventType;
  difficulty: MovieDifficulty;
  correctAction: MovieAction;
  budgetImpact: number;
  qualityImpact: number;
  hypeImpact: number;
  reward: number;
}

export interface MovieResult {
  score: number;
  cash: number;
  reputation: number;
  movieQuality: number;
  audienceHype: number;
  boxOffice: number;
  scenesCompleted: number;
  successfulDecisions: number;
  failedDecisions: number;
  productionBudgetUsed: number;
  awardChance: number;
  rating: number;
  rank: string;
  message: string;
}

export const MOVIE_PROJECTS: MovieProject[] = [
  {
    id: "abuja-nights",
    title: "Abuja Nights",
    genre: "Drama",
    description:
      "A young entrepreneur tries to build a new life in Abuja while facing friendship, family and ambition.",
    emoji: "🌃",
    difficulty: "medium",
    startingBudget: 2500000,
    expectedRevenue: 6500000,
    audienceTarget: 15000,
    productionDays: 5,
  },
  {
    id: "jabi-heist",
    title: "The Jabi Heist",
    genre: "Crime Thriller",
    description:
      "A group of ambitious criminals plan a dangerous operation that goes completely off script.",
    emoji: "💰",
    difficulty: "hard",
    startingBudget: 5000000,
    expectedRevenue: 14000000,
    audienceTarget: 35000,
    productionDays: 7,
  },
  {
    id: "love-in-maitama",
    title: "Love in Maitama",
    genre: "Romance",
    description:
      "Two people from completely different worlds meet in Abuja and discover that love comes with a price.",
    emoji: "❤️",
    difficulty: "easy",
    startingBudget: 1800000,
    expectedRevenue: 5000000,
    audienceTarget: 12000,
    productionDays: 4,
  },
  {
    id: "wuse-warriors",
    title: "Wuse Warriors",
    genre: "Action",
    description:
      "A street crew must protect their neighbourhood when a powerful criminal organisation moves into Wuse.",
    emoji: "🔥",
    difficulty: "hard",
    startingBudget: 6500000,
    expectedRevenue: 18000000,
    audienceTarget: 50000,
    productionDays: 8,
  },
  {
    id: "abuja-2050",
    title: "Abuja 2050",
    genre: "Sci-Fi",
    description:
      "A futuristic Abuja faces a mysterious technology crisis that could change the entire city.",
    emoji: "🚀",
    difficulty: "extreme",
    startingBudget: 12000000,
    expectedRevenue: 35000000,
    audienceTarget: 100000,
    productionDays: 10,
  },
  {
    id: "night-market",
    title: "Night Market",
    genre: "Comedy",
    description:
      "One chaotic night at Abuja's busiest market turns into the funniest disaster the city has ever seen.",
    emoji: "😂",
    difficulty: "easy",
    startingBudget: 1500000,
    expectedRevenue: 4200000,
    audienceTarget: 10000,
    productionDays: 4,
  },
];

export const MOVIE_SCENARIOS: MovieScenario[] = [
  {
    id: "lead-actor",
    title: "Choose Your Lead",
    description:
      "You have two actors available. One is experienced but expensive. The other is unknown but talented.",
    type: "casting",
    difficulty: "medium",
    correctAction: "cast",
    budgetImpact: -350000,
    qualityImpact: 10,
    hypeImpact: 5,
    reward: 1200,
  },
  {
    id: "bad-take",
    title: "The Scene Went Wrong",
    description:
      "The lead actor completely missed an important scene. Do you shoot another take?",
    type: "production",
    difficulty: "easy",
    correctAction: "retake",
    budgetImpact: -180000,
    qualityImpact: 12,
    hypeImpact: 2,
    reward: 900,
  },
  {
    id: "actor-drama",
    title: "Actor Argument",
    description:
      "Two major actors are arguing on set and production has stopped.",
    type: "actor",
    difficulty: "hard",
    correctAction: "direct",
    budgetImpact: -100000,
    qualityImpact: 8,
    hypeImpact: 3,
    reward: 1500,
  },
  {
    id: "budget-crisis",
    title: "Production Budget Crisis",
    description:
      "Your production budget is running low. You must control spending without destroying the movie.",
    type: "budget",
    difficulty: "hard",
    correctAction: "protect",
    budgetImpact: 250000,
    qualityImpact: 2,
    hypeImpact: -2,
    reward: 1800,
  },
  {
    id: "viral-trailer",
    title: "Trailer Goes Viral",
    description:
      "Your trailer suddenly starts trending across Abuja. This is your chance to push the movie harder.",
    type: "viral",
    difficulty: "medium",
    correctAction: "marketing",
    budgetImpact: -250000,
    qualityImpact: 3,
    hypeImpact: 25,
    reward: 3000,
  },
  {
    id: "social-campaign",
    title: "Marketing Opportunity",
    description:
      "A major creator offers to promote your movie to their audience for a fee.",
    type: "marketing",
    difficulty: "medium",
    correctAction: "marketing",
    budgetImpact: -400000,
    qualityImpact: 0,
    hypeImpact: 20,
    reward: 2200,
  },
  {
    id: "equipment-failure",
    title: "Camera Failure",
    description:
      "Your main camera suddenly stops working during an expensive night shoot.",
    type: "problem",
    difficulty: "hard",
    correctAction: "protect",
    budgetImpact: -500000,
    qualityImpact: 5,
    hypeImpact: 0,
    reward: 2000,
  },
  {
    id: "final-scene",
    title: "The Final Scene",
    description:
      "The final scene is the most important moment of the movie. You have one chance to get it right.",
    type: "production",
    difficulty: "hard",
    correctAction: "direct",
    budgetImpact: -250000,
    qualityImpact: 20,
    hypeImpact: 8,
    reward: 3000,
  },
  {
    id: "premiere-choice",
    title: "Premiere Strategy",
    description:
      "The movie is finished. Choose how aggressively you want to launch the premiere.",
    type: "premiere",
    difficulty: "medium",
    correctAction: "premiere",
    budgetImpact: -300000,
    qualityImpact: 2,
    hypeImpact: 18,
    reward: 3500,
  },
  {
    id: "award-season",
    title: "Award Nomination",
    description:
      "Your movie has been nominated for a major award. A strong final campaign could push it over the line.",
    type: "award",
    difficulty: "extreme",
    correctAction: "marketing",
    budgetImpact: -500000,
    qualityImpact: 5,
    hypeImpact: 15,
    reward: 6000,
  },
];

const DIFFICULTY_MULTIPLIER: Record<
  MovieDifficulty,
  number
> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  extreme: 2,
};

export function getMovieProjectById(
  id: string
): MovieProject | undefined {
  return MOVIE_PROJECTS.find(
    (project) => project.id === id
  );
}

export function getRandomMovieScenario(
  usedIds: string[] = []
): MovieScenario {
  const available = MOVIE_SCENARIOS.filter(
    (scenario) => !usedIds.includes(scenario.id)
  );

  const pool =
    available.length > 0
      ? available
      : MOVIE_SCENARIOS;

  return pool[
    Math.floor(Math.random() * pool.length)
  ];
}

export function getMovieProductionDuration(
  difficulty: MovieDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 120;

    case "medium":
      return 150;

    case "hard":
      return 180;

    case "extreme":
      return 210;
  }
}

export function getMovieActionOutcome(
  scenario: MovieScenario,
  action: MovieAction
): {
  correct: boolean;
  score: number;
  cash: number;
  budgetImpact: number;
  qualityImpact: number;
  hypeImpact: number;
  message: string;
} {
  const multiplier =
    DIFFICULTY_MULTIPLIER[scenario.difficulty];

  if (action === scenario.correctAction) {
    return {
      correct: true,
      score: Math.round(100 * multiplier),
      cash: Math.round(
        scenario.reward * multiplier
      ),
      budgetImpact: scenario.budgetImpact,
      qualityImpact: scenario.qualityImpact,
      hypeImpact: scenario.hypeImpact,
      message: getSuccessMessage(scenario),
    };
  }

  return {
    correct: false,
    score: -Math.round(60 * multiplier),
    cash: -Math.round(
      scenario.reward * 0.4
    ),
    budgetImpact:
      scenario.budgetImpact < 0
        ? scenario.budgetImpact * 1.5
        : -Math.abs(scenario.budgetImpact),
    qualityImpact: -Math.max(
      3,
      Math.round(scenario.qualityImpact / 2)
    ),
    hypeImpact: -Math.max(
      2,
      Math.round(
        Math.abs(scenario.hypeImpact) / 2
      )
    ),
    message: getFailureMessage(
      scenario,
      action
    ),
  };
}

function getSuccessMessage(
  scenario: MovieScenario
): string {
  switch (scenario.type) {
    case "casting":
      return "Great casting decision. The production just gained a stronger lead.";

    case "production":
      return "Excellent direction. The scene is looking much better.";

    case "actor":
      return "You took control of the set and got everyone focused again.";

    case "budget":
      return "Smart management. You protected the production budget.";

    case "viral":
      return "The trailer is exploding! Audience hype is climbing fast.";

    case "marketing":
      return "Marketing campaign launched successfully.";

    case "problem":
      return "Production survived the problem without losing the project.";

    case "premiere":
      return "The premiere is live. Abuja is talking about your movie.";

    case "award":
      return "The campaign is gaining attention from the awards committee.";

    default:
      return "Production decision completed successfully.";
  }
}

function getFailureMessage(
  scenario: MovieScenario,
  action: MovieAction
): string {
  if (
    scenario.type === "budget" &&
    action !== "protect"
  ) {
    return "You spent too aggressively and the production budget took a serious hit.";
  }

  if (
    scenario.type === "viral" &&
    action !== "marketing"
  ) {
    return "You failed to capitalize on the viral moment.";
  }

  if (
    scenario.type === "problem" &&
    action !== "protect"
  ) {
    return "The production problem became more expensive.";
  }

  return "That decision hurt the production. The movie lost quality and momentum.";
}

export function calculateMovieResult(params: {
  project: MovieProject;
  score: number;
  movieQuality: number;
  audienceHype: number;
  scenesCompleted: number;
  successfulDecisions: number;
  failedDecisions: number;
  productionBudgetUsed: number;
  elapsedSeconds: number;
}): MovieResult {
  const {
    project,
    score,
    movieQuality,
    audienceHype,
    scenesCompleted,
    successfulDecisions,
    failedDecisions,
    productionBudgetUsed,
    elapsedSeconds,
  } = params;

  const totalDecisions =
    successfulDecisions + failedDecisions;

  const accuracy =
    totalDecisions > 0
      ? successfulDecisions / totalDecisions
      : 0;

  const productionSpeedBonus =
    elapsedSeconds <=
    getMovieProductionDuration(
      project.difficulty
    ) *
      0.65
      ? 20
      : elapsedSeconds <=
          getMovieProductionDuration(
            project.difficulty
          ) *
            0.85
        ? 10
        : 0;

  const finalQuality = Math.max(
    0,
    Math.min(100, movieQuality)
  );

  const finalHype = Math.max(
    0,
    Math.min(100, audienceHype)
  );

  const qualityScore = finalQuality * 2;
  const hypeScore = finalHype * 1.5;
  const accuracyScore = accuracy * 100;

  const finalScore = Math.max(
    0,
    Math.round(
      score +
        qualityScore +
        hypeScore +
        accuracyScore +
        productionSpeedBonus
    )
  );

  const rating = Math.max(
    1,
    Math.min(
      5,
      Number(
        (
          finalQuality * 0.035 +
          finalHype * 0.015 +
          accuracy * 1.2
        ).toFixed(1)
      )
    )
  );

  const revenueMultiplier =
    0.35 +
    finalQuality / 100 * 0.35 +
    finalHype / 100 * 0.5 +
    accuracy * 0.3;

  const boxOffice = Math.max(
    0,
    Math.round(
      project.expectedRevenue *
        revenueMultiplier
    )
  );

  const profit =
    boxOffice - productionBudgetUsed;

  const cashReward = Math.max(
    3000,
    Math.round(
      3500 +
        profit * 0.18 +
        finalScore * 8
    )
  );

  const reputation = Math.max(
    0,
    Math.round(
      finalQuality * 0.08 +
        finalHype * 0.05 +
        accuracy * 12 +
        (rating >= 4.5 ? 10 : 0) -
        failedDecisions
    )
  );

  const awardChance = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        finalQuality * 0.55 +
          finalHype * 0.25 +
          accuracy * 20
      )
    )
  );

  let rank = "Indie Director";

  if (finalScore >= 850) {
    rank = "Legendary Director";
  } else if (finalScore >= 650) {
    rank = "Blockbuster Director";
  } else if (finalScore >= 450) {
    rank = "Successful Director";
  } else if (finalScore >= 280) {
    rank = "Rising Director";
  }

  let message =
    "The movie is complete, but the audience reaction could have been stronger.";

  if (rating >= 4.5) {
    message =
      "Blockbuster! You delivered an outstanding movie and Abuja cannot stop talking about it.";
  } else if (rating >= 3.8) {
    message =
      "Excellent production. The movie performed strongly and your reputation is growing.";
  } else if (rating >= 3) {
    message =
      "Solid production. You delivered a respectable movie and learned valuable lessons.";
  }

  return {
    score: finalScore,
    cash: cashReward,
    reputation,
    movieQuality: finalQuality,
    audienceHype: finalHype,
    boxOffice,
    scenesCompleted,
    successfulDecisions,
    failedDecisions,
    productionBudgetUsed,
    awardChance,
    rating,
    rank,
    message,
  };
}
