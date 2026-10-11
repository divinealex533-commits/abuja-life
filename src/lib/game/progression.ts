export interface PlayerProgression {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  skillPoints: number;
  totalExperience: number;
}

const STORAGE_KEY = "abujaLifeProgression";

export const DEFAULT_PROGRESSION: PlayerProgression = {
  level: 1,
  experience: 0,
  experienceToNextLevel: 100,
  skillPoints: 0,
  totalExperience: 0,
};

export function getExperienceRequired(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.35));
}

export function loadProgression(): PlayerProgression {
  if (typeof window === "undefined") {
    return { ...DEFAULT_PROGRESSION };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { ...DEFAULT_PROGRESSION };
    }

    const parsed = JSON.parse(stored);

    return {
      level:
        typeof parsed.level === "number"
          ? parsed.level
          : DEFAULT_PROGRESSION.level,

      experience:
        typeof parsed.experience === "number"
          ? parsed.experience
          : DEFAULT_PROGRESSION.experience,

      experienceToNextLevel:
        typeof parsed.experienceToNextLevel === "number"
          ? parsed.experienceToNextLevel
          : DEFAULT_PROGRESSION.experienceToNextLevel,

      skillPoints:
        typeof parsed.skillPoints === "number"
          ? parsed.skillPoints
          : DEFAULT_PROGRESSION.skillPoints,

      totalExperience:
        typeof parsed.totalExperience === "number"
          ? parsed.totalExperience
          : DEFAULT_PROGRESSION.totalExperience,
    };
  } catch {
    return { ...DEFAULT_PROGRESSION };
  }
}

export function saveProgression(
  progression: PlayerProgression
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progression)
  );
}

export interface ExperienceResult {
  progression: PlayerProgression;
  experienceGained: number;
  levelsGained: number;
}

export function addExperience(
  progression: PlayerProgression,
  amount: number
): ExperienceResult {
  const safeAmount = Math.max(0, Math.floor(amount));

  let level = progression.level;
  let experience = progression.experience + safeAmount;
  let skillPoints = progression.skillPoints;
  let levelsGained = 0;

  let experienceToNextLevel = getExperienceRequired(level);

  while (experience >= experienceToNextLevel) {
    experience -= experienceToNextLevel;

    level += 1;
    levelsGained += 1;
    skillPoints += 1;

    experienceToNextLevel = getExperienceRequired(level);
  }

  const updatedProgression: PlayerProgression = {
    level,
    experience,
    experienceToNextLevel,
    skillPoints,
    totalExperience:
      progression.totalExperience + safeAmount,
  };

  saveProgression(updatedProgression);

  return {
    progression: updatedProgression,
    experienceGained: safeAmount,
    levelsGained,
  };
}

export function addPlayerExperience(
  amount: number
): ExperienceResult {
  const progression = loadProgression();

  return addExperience(progression, amount);
}

export function getProgressionPercent(
  progression: PlayerProgression
): number {
  if (progression.experienceToNextLevel <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (progression.experience /
        progression.experienceToNextLevel) *
        100
    )
  );
}

export function getPlayerLevel(): number {
  return loadProgression().level;
}

export function getPlayerExperience(): number {
  return loadProgression().experience;
}

export function getPlayerSkillPoints(): number {
  return loadProgression().skillPoints;
}

export function resetProgression(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}