export type SkillId =
  | "driving"
  | "business"
  | "social"
  | "cooking"
  | "creative"
  | "technology"
  | "fitness";

export interface PlayerSkill {
  id: SkillId;
  name: string;
  description: string;
  icon: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export interface PlayerSkillsState {
  skills: Record<SkillId, PlayerSkill>;
}

const STORAGE_KEY = "abujaLifeSkills";

const SKILL_DEFINITIONS: Record<
  SkillId,
  Omit<PlayerSkill, "level" | "experience" | "experienceToNextLevel">
> = {
  driving: {
    id: "driving",
    name: "Driving",
    description:
      "Improves vehicle control, driving missions and transport work.",
    icon: "🚗",
  },
  business: {
    id: "business",
    name: "Business",
    description:
      "Improves contracts, businesses, negotiations and commercial activities.",
    icon: "💼",
  },
  social: {
    id: "social",
    name: "Social",
    description:
      "Improves networking, friendships, events and social activities.",
    icon: "🤝",
  },
  cooking: {
    id: "cooking",
    name: "Cooking",
    description:
      "Improves food jobs, restaurants, cooking missions and food businesses.",
    icon: "🍳",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description:
      "Improves photography, fashion, design, media and creative work.",
    icon: "🎨",
  },
  technology: {
    id: "technology",
    name: "Technology",
    description:
      "Improves software, tech contracts and technology businesses.",
    icon: "💻",
  },
  fitness: {
    id: "fitness",
    name: "Fitness",
    description:
      "Improves fitness activities, sports and physical challenges.",
    icon: "🏃",
  },
};

const SKILL_IDS = Object.keys(
  SKILL_DEFINITIONS
) as SkillId[];

export function getSkillExperienceRequired(
  level: number
): number {
  return Math.floor(75 * Math.pow(level, 1.3));
}

function createDefaultSkill(
  id: SkillId
): PlayerSkill {
  const definition = SKILL_DEFINITIONS[id];

  return {
    ...definition,
    level: 1,
    experience: 0,
    experienceToNextLevel:
      getSkillExperienceRequired(1),
  };
}

export function createDefaultSkills(): PlayerSkillsState {
  const skills = {} as Record<SkillId, PlayerSkill>;

  for (const id of SKILL_IDS) {
    skills[id] = createDefaultSkill(id);
  }

  return { skills };
}

export function loadSkills(): PlayerSkillsState {
  if (typeof window === "undefined") {
    return createDefaultSkills();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return createDefaultSkills();
    }

    const parsed = JSON.parse(stored);
    const defaults = createDefaultSkills();

    for (const id of SKILL_IDS) {
      const saved = parsed?.skills?.[id];

      if (!saved) continue;

      defaults.skills[id] = {
        ...defaults.skills[id],
        level:
          typeof saved.level === "number"
            ? Math.max(1, Math.floor(saved.level))
            : 1,
        experience:
          typeof saved.experience === "number"
            ? Math.max(0, Math.floor(saved.experience))
            : 0,
        experienceToNextLevel:
          typeof saved.experienceToNextLevel ===
          "number"
            ? Math.max(
                1,
                Math.floor(saved.experienceToNextLevel)
              )
            : getSkillExperienceRequired(
                typeof saved.level === "number"
                  ? Math.max(1, Math.floor(saved.level))
                  : 1
              ),
      };
    }

    return defaults;
  } catch {
    return createDefaultSkills();
  }
}

export function saveSkills(
  skills: PlayerSkillsState
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(skills)
  );
}

export interface SkillExperienceResult {
  skills: PlayerSkillsState;
  skill: PlayerSkill;
  experienceGained: number;
  levelsGained: number;
}

export function addSkillExperience(
  state: PlayerSkillsState,
  skillId: SkillId,
  amount: number
): SkillExperienceResult {
  const skill = state.skills[skillId];

  if (!skill) {
    throw new Error(`Unknown skill: ${skillId}`);
  }

  const safeAmount = Math.max(
    0,
    Math.floor(amount)
  );

  let level = skill.level;
  let experience = skill.experience + safeAmount;
  let levelsGained = 0;

  let required =
    getSkillExperienceRequired(level);

  while (experience >= required) {
    experience -= required;
    level += 1;
    levelsGained += 1;

    required =
      getSkillExperienceRequired(level);
  }

  const updatedSkill: PlayerSkill = {
    ...skill,
    level,
    experience,
    experienceToNextLevel: required,
  };

  const updatedState: PlayerSkillsState = {
    ...state,
    skills: {
      ...state.skills,
      [skillId]: updatedSkill,
    },
  };

  saveSkills(updatedState);

  return {
    skills: updatedState,
    skill: updatedSkill,
    experienceGained: safeAmount,
    levelsGained,
  };
}

export function addPlayerSkillExperience(
  skillId: SkillId,
  amount: number
): SkillExperienceResult {
  return addSkillExperience(
    loadSkills(),
    skillId,
    amount
  );
}

export function getSkill(
  skillId: SkillId
): PlayerSkill {
  return loadSkills().skills[skillId];
}

export function getSkillLevel(
  skillId: SkillId
): number {
  return getSkill(skillId).level;
}

export function getSkillProgressPercent(
  skill: PlayerSkill
): number {
  if (skill.experienceToNextLevel <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (skill.experience /
        skill.experienceToNextLevel) *
        100
    )
  );
}

export function getAllSkills(): PlayerSkill[] {
  const state = loadSkills();

  return SKILL_IDS.map(
    (id) => state.skills[id]
  );
}

export function resetSkills(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}