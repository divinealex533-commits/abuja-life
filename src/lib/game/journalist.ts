export type JournalistBeat =
  | "politics"
  | "business"
  | "entertainment"
  | "sports"
  | "community";

export type JournalistStoryType =
  | "breaking-news"
  | "investigation"
  | "interview"
  | "feature"
  | "event-report";

export type JournalistDifficulty = "easy" | "medium" | "hard";

export interface JournalistAssignment {
  id: string;
  title: string;
  location: string;
  beat: JournalistBeat;
  type: JournalistStoryType;
  difficulty: JournalistDifficulty;
  deadline: number;
  basePay: number;
  description: string;
}

export interface JournalistResult {
  storyScore: number;
  accuracy: number;
  research: number;
  writing: number;
  speed: number;
  payment: number;
  reputation: number;
  experience: number;
  energyUsed: number;
  bonus: number;
  headline: string;
  verdict: string;
}

export const JOURNALIST_ASSIGNMENTS: JournalistAssignment[] = [
  {
    id: "wuse-market-prices",
    title: "Wuse Market Price Watch",
    location: "Wuse Market",
    beat: "business",
    type: "feature",
    difficulty: "easy",
    deadline: 70,
    basePay: 3000,
    description:
      "Investigate changing prices at Wuse Market and produce a clear consumer story.",
  },
  {
    id: "jabi-night-report",
    title: "Jabi Night Report",
    location: "Jabi",
    beat: "entertainment",
    type: "event-report",
    difficulty: "easy",
    deadline: 60,
    basePay: 3500,
    description:
      "Cover a busy night event around Jabi and report what happened accurately.",
  },
  {
    id: "abuja-business-profile",
    title: "Abuja Business Rising",
    location: "Maitama",
    beat: "business",
    type: "interview",
    difficulty: "medium",
    deadline: 90,
    basePay: 5500,
    description:
      "Interview a growing Abuja entrepreneur and turn the conversation into a strong profile.",
  },
  {
    id: "community-investigation",
    title: "Community Investigation",
    location: "Garki",
    beat: "community",
    type: "investigation",
    difficulty: "medium",
    deadline: 110,
    basePay: 7000,
    description:
      "Investigate a community complaint and separate verified facts from rumors.",
  },
  {
    id: "capital-sports-story",
    title: "Capital Sports Story",
    location: "Wuse 2",
    beat: "sports",
    type: "breaking-news",
    difficulty: "medium",
    deadline: 75,
    basePay: 6500,
    description:
      "Report breaking sports news while keeping the story accurate and fast.",
  },
  {
    id: "abuja-policy-investigation",
    title: "Capital Policy Investigation",
    location: "CBD",
    beat: "politics",
    type: "investigation",
    difficulty: "hard",
    deadline: 140,
    basePay: 9500,
    description:
      "Investigate a major policy story using multiple sources and careful verification.",
  },
  {
    id: "abuja-city-feature",
    title: "The New Abuja",
    location: "Maitama",
    beat: "community",
    type: "feature",
    difficulty: "hard",
    deadline: 130,
    basePay: 9000,
    description:
      "Create a detailed feature showing how Abuja is changing and growing.",
  },
];

const DIFFICULTY_MULTIPLIER: Record<JournalistDifficulty, number> = {
  easy: 1,
  medium: 1.18,
  hard: 1.4,
};

const DIFFICULTY_ENERGY: Record<JournalistDifficulty, number> = {
  easy: 10,
  medium: 14,
  hard: 18,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function getJournalistAssignment(id: string) {
  return JOURNALIST_ASSIGNMENTS.find((assignment) => assignment.id === id);
}

export function calculateJournalistResult(
  assignment: JournalistAssignment,
  research: number,
  accuracy: number,
  writing: number,
  speed: number
): JournalistResult {
  const safeResearch = clamp(research);
  const safeAccuracy = clamp(accuracy);
  const safeWriting = clamp(writing);
  const safeSpeed = clamp(speed);

  const difficulty = DIFFICULTY_MULTIPLIER[assignment.difficulty];

  const storyScore = Math.round(
    safeResearch * 0.3 +
      safeAccuracy * 0.35 +
      safeWriting * 0.25 +
      safeSpeed * 0.1
  );

  const accuracyBonus = safeAccuracy >= 85 ? 1800 : safeAccuracy >= 70 ? 900 : 0;
  const researchBonus = safeResearch >= 85 ? 1400 : safeResearch >= 70 ? 700 : 0;
  const writingBonus = safeWriting >= 85 ? 1200 : safeWriting >= 70 ? 600 : 0;

  const speedBonus =
    safeSpeed >= 90
      ? 1500
      : safeSpeed >= 75
        ? 800
        : safeSpeed >= 60
          ? 300
          : 0;

  const bonus = accuracyBonus + researchBonus + writingBonus + speedBonus;

  const satisfaction = Math.round(
    clamp(
      storyScore +
        (safeAccuracy >= 80 ? 5 : 0) +
        (safeResearch >= 80 ? 4 : 0)
    )
  );

  const payment = Math.round(
    assignment.basePay * difficulty + bonus * 0.65 + satisfaction * 25
  );

  const reputation = Math.max(
    1,
    Math.round(
      3 +
        storyScore / 18 +
        (safeAccuracy >= 85 ? 3 : 0) +
        (assignment.type === "investigation" ? 3 : 0)
    )
  );

  const experience = Math.max(
    20,
    Math.round(
      35 +
        storyScore * 0.65 +
        (assignment.difficulty === "hard" ? 20 : 0)
    )
  );

  let headline = "Story published";
  let verdict = "Your report was published, but there is room to improve.";

  if (storyScore >= 90) {
    headline = "Front-page journalist";
    verdict =
      "Outstanding reporting. Your sources, accuracy and writing made the story stand out.";
  } else if (storyScore >= 75) {
    headline = "Strong newsroom report";
    verdict =
      "A strong piece of journalism with solid research and reliable reporting.";
  } else if (storyScore >= 60) {
    headline = "Published with edits";
    verdict =
      "The story made publication, but the editor requested several improvements.";
  } else {
    headline = "Needs an editor";
    verdict =
      "The report lacked enough verification and required significant editorial work.";
  }

  return {
    storyScore,
    accuracy: safeAccuracy,
    research: safeResearch,
    writing: safeWriting,
    speed: safeSpeed,
    payment,
    reputation,
    experience,
    energyUsed: DIFFICULTY_ENERGY[assignment.difficulty],
    bonus,
    headline,
    verdict,
  };
}
