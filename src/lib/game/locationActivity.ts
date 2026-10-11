import {
  loadPlayerState,
  savePlayerState,
  spendEnergy,
  restoreEnergy,
  type PlayerGameState,
} from "@/lib/game/player";
import type { LocationWorldActivity } from "@/lib/game/locationWorld";
import {
  addExperience,
  loadProgression,
} from "@/lib/game/progression";
import {
  addSkillExperience,
  loadSkills,
  type SkillId,
} from "@/lib/game/skills";

const ACTIVITY_SKILLS: Record<string, SkillId> = {
  socialize: "social",
  networking: "business",
  explore: "fitness",
  photograph: "creative",
  "business-deal": "business",
  "business-meeting": "business",
  "food-tasting": "cooking",
  cooking: "cooking",
  "food-market": "cooking",
  "car-meet": "driving",
  "test-drive": "driving",
  "fashion-shopping": "creative",
  photography: "creative",
  design: "creative",
  "fitness-training": "fitness",
  sports: "fitness",
  coding: "technology",
  technology: "technology",
};

function getActivitySkill(
  activity: LocationWorldActivity
): SkillId | undefined {
  if (ACTIVITY_SKILLS[activity.id]) {
    return ACTIVITY_SKILLS[activity.id];
  }

  const text = [
    activity.id,
    activity.name,
    activity.description,
    ...activity.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("drive") ||
    text.includes("car") ||
    text.includes("vehicle") ||
    text.includes("taxi")
  ) {
    return "driving";
  }

  if (
    text.includes("business") ||
    text.includes("deal") ||
    text.includes("network") ||
    text.includes("meeting")
  ) {
    return "business";
  }

  if (
    text.includes("social") ||
    text.includes("friend") ||
    text.includes("party") ||
    text.includes("club")
  ) {
    return "social";
  }

  if (
    text.includes("food") ||
    text.includes("cook") ||
    text.includes("restaurant") ||
    text.includes("taste")
  ) {
    return "cooking";
  }

  if (
    text.includes("photo") ||
    text.includes("fashion") ||
    text.includes("design") ||
    text.includes("creative")
  ) {
    return "creative";
  }

  if (
    text.includes("tech") ||
    text.includes("software") ||
    text.includes("computer") ||
    text.includes("coding")
  ) {
    return "technology";
  }

  if (
    text.includes("fitness") ||
    text.includes("sport") ||
    text.includes("gym") ||
    text.includes("run")
  ) {
    return "fitness";
  }

  return undefined;
}

export interface LocationActivityResult {
  success: boolean;
  message: string;
  player: PlayerGameState;
  reward: number;
  reputationGain: number;
  experienceGain: number;
  level: number;
  levelsGained: number;
  skillId?: SkillId;
  skillLevel?: number;
  skillLevelsGained?: number;
}

export function canPerformLocationActivity(
  player: PlayerGameState,
  activity: LocationWorldActivity
): boolean {
  return player.energy >= activity.energyCost;
}

export function performLocationActivity(
  player: PlayerGameState,
  activity: LocationWorldActivity
): LocationActivityResult {
  if (!canPerformLocationActivity(player, activity)) {
    const progression = loadProgression();

    return {
      success: false,
      message: `Not enough energy. You need ${activity.energyCost} energy.`,
      player,
      reward: 0,
      reputationGain: 0,
      experienceGain: 0,
      level: progression.level,
      levelsGained: 0,
    };
  }

  const updatedPlayer = spendEnergy(
    player,
    activity.energyCost
  );

  const rewardedPlayer: PlayerGameState = {
    ...updatedPlayer,
    cash:
      updatedPlayer.cash + activity.reward,
    reputation:
      updatedPlayer.reputation +
      activity.reputationGain,
  };

  const experienceResult = addExperience(
    loadProgression(),
    activity.experienceGain
  );

  const skillId = getActivitySkill(activity);

  let skillLevel: number | undefined;
  let skillLevelsGained = 0;

  if (skillId) {
    const skillResult = addSkillExperience(
      loadSkills(),
      skillId,
      activity.experienceGain
    );

    skillLevel = skillResult.skill.level;
    skillLevelsGained =
      skillResult.levelsGained;
  }

  savePlayerState(rewardedPlayer);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("abujaLifePlayerUpdated")
    );

    window.dispatchEvent(
      new Event("abujaLifeProgressionUpdated")
    );

    window.dispatchEvent(
      new Event("abujaLifeSkillsUpdated")
    );
  }

  const levelMessage =
    experienceResult.levelsGained > 0
      ? ` Level up! You reached Level ${experienceResult.progression.level}.`
      : "";

  const skillMessage =
    skillId && skillLevelsGained > 0
      ? ` ${skillId} skill reached Level ${skillLevel}.`
      : "";

  return {
    success: true,
    message:
      `${activity.name} completed! ` +
      `You earned ₦${activity.reward.toLocaleString()}, ` +
      `gained ${activity.reputationGain} reputation ` +
      `and ${activity.experienceGain} XP.` +
      levelMessage +
      skillMessage,
    player: rewardedPlayer,
    reward: activity.reward,
    reputationGain: activity.reputationGain,
    experienceGain: activity.experienceGain,
    level:
      experienceResult.progression.level,
    levelsGained:
      experienceResult.levelsGained,
    skillId,
    skillLevel,
    skillLevelsGained,
  };
}

export function performLocationActivityFromStorage(
  activity: LocationWorldActivity
): LocationActivityResult {
  return performLocationActivity(
    loadPlayerState(),
    activity
  );
}

export function restoreLocationActivityEnergy(
  player: PlayerGameState,
  amount: number
): PlayerGameState {
  const updatedPlayer = restoreEnergy(
    player,
    amount
  );

  savePlayerState(updatedPlayer);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("abujaLifePlayerUpdated")
    );
  }

  return updatedPlayer;
}