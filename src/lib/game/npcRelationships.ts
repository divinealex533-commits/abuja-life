"use client";

import { getNPCById } from "@/lib/game/npcWorld";

export type NPCRelationshipLevel =
  | "stranger"
  | "acquaintance"
  | "friendly"
  | "friend"
  | "close_friend"
  | "trusted";

export interface NPCRelationship {
  npcId: string;
  relationshipScore: number;
  interactionCount: number;
  positiveInteractions: number;
  lastInteractionAt: number | null;
  firstMetAt: number;
  favoriteLocationId?: string;
  notes: string[];
}

export interface NPCRelationshipSummary {
  npcId: string;
  npcName: string;
  score: number;
  level: NPCRelationshipLevel;
  interactionCount: number;
  positiveInteractions: number;
  nextLevelAt: number;
  progressPercent: number;
  unlockedInteractions: string[];
}

export interface NPCRelationshipResult {
  success: boolean;
  relationship: NPCRelationship;
  level: NPCRelationshipLevel;
  levelChanged: boolean;
  previousLevel: NPCRelationshipLevel;
  scoreGained: number;
  message: string;
  unlockedInteractions: string[];
}

const STORAGE_KEY =
  "abujaLifeNPCRelationships";

const LEVELS: {
  level: NPCRelationshipLevel;
  minimumScore: number;
}[] = [
  {
    level: "stranger",
    minimumScore: 0,
  },
  {
    level: "acquaintance",
    minimumScore: 10,
  },
  {
    level: "friendly",
    minimumScore: 25,
  },
  {
    level: "friend",
    minimumScore: 50,
  },
  {
    level: "close_friend",
    minimumScore: 100,
  },
  {
    level: "trusted",
    minimumScore: 175,
  },
];

const INTERACTION_UNLOCKS: Record<
  NPCRelationshipLevel,
  string[]
> = {
  stranger: [
    "greet",
    "talk",
    "ask_about_abuja",
  ],

  acquaintance: [
    "ask_about_jobs",
    "ask_about_location",
  ],

  friendly: [
    "invite_hangout",
    "socialize",
  ],

  friend: [
    "follow",
    "trade",
  ],

  close_friend: [
    "special_hangout",
    "gift",
  ],

  trusted: [
    "private_invitation",
    "exclusive_help",
  ],
};

const LEVEL_MESSAGES: Record<
  NPCRelationshipLevel,
  string
> = {
  stranger:
    "You are still strangers.",
  acquaintance:
    "You are starting to recognize each other.",
  friendly:
    "This NPC now considers you friendly.",
  friend:
    "You have become friends.",
  close_friend:
    "You are now close friends.",
  trusted:
    "This NPC trusts you.",
};

function loadAllRelationships(): Record<
  string,
  NPCRelationship
> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function saveAllRelationships(
  relationships: Record<
    string,
    NPCRelationship
  >
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(relationships)
  );
}

function clampScore(score: number): number {
  return Math.max(
    0,
    Math.min(250, Math.round(score))
  );
}

export function getNPCRelationshipLevel(
  score: number
): NPCRelationshipLevel {
  let current: NPCRelationshipLevel =
    "stranger";

  for (const level of LEVELS) {
    if (score >= level.minimumScore) {
      current = level.level;
    }
  }

  return current;
}

export function getNPCRelationship(
  npcId: string
): NPCRelationship | null {
  const relationships =
    loadAllRelationships();

  return relationships[npcId] ?? null;
}

export function getOrCreateNPCRelationship(
  npcId: string
): NPCRelationship {
  const relationships =
    loadAllRelationships();

  const existing =
    relationships[npcId];

  if (existing) {
    return existing;
  }

  const relationship: NPCRelationship = {
    npcId,
    relationshipScore: 0,
    interactionCount: 0,
    positiveInteractions: 0,
    lastInteractionAt: null,
    firstMetAt: Date.now(),
    notes: [],
  };

  relationships[npcId] = relationship;

  saveAllRelationships(relationships);

  return relationship;
}

export function getNextRelationshipLevel(
  score: number
): {
  level: NPCRelationshipLevel | null;
  requiredScore: number;
} {
  const current =
    getNPCRelationshipLevel(score);

  const currentIndex =
    LEVELS.findIndex(
      (entry) =>
        entry.level === current
    );

  const next =
    LEVELS[currentIndex + 1];

  if (!next) {
    return {
      level: null,
      requiredScore: score,
    };
  }

  return {
    level: next.level,
    requiredScore: next.minimumScore,
  };
}

export function getRelationshipProgressPercent(
  score: number
): number {
  const current =
    getNPCRelationshipLevel(score);

  const currentIndex =
    LEVELS.findIndex(
      (entry) =>
        entry.level === current
    );

  const currentMinimum =
    LEVELS[currentIndex]?.minimumScore ?? 0;

  const next =
    LEVELS[currentIndex + 1];

  if (!next) {
    return 100;
  }

  const range =
    next.minimumScore -
    currentMinimum;

  if (range <= 0) {
    return 100;
  }

  const progress =
    ((score - currentMinimum) /
      range) *
    100;

  return Math.max(
    0,
    Math.min(100, Math.round(progress))
  );
}

export function getUnlockedNPCInteractions(
  npcId: string
): string[] {
  const relationship =
    getOrCreateNPCRelationship(npcId);

  const level =
    getNPCRelationshipLevel(
      relationship.relationshipScore
    );

  const levelIndex =
    LEVELS.findIndex(
      (entry) =>
        entry.level === level
    );

  const unlocked = new Set<string>();

  for (
    let index = 0;
    index <= levelIndex;
    index++
  ) {
    const levelEntry =
      LEVELS[index];

    if (!levelEntry) {
      continue;
    }

    for (const interaction of
      INTERACTION_UNLOCKS[
        levelEntry.level
      ]) {
      unlocked.add(interaction);
    }
  }

  return Array.from(unlocked);
}

export function getNPCRelationshipSummary(
  npcId: string
): NPCRelationshipSummary | null {
  const npc = getNPCById(npcId);

  if (!npc) {
    return null;
  }

  const relationship =
    getOrCreateNPCRelationship(npcId);

  const level =
    getNPCRelationshipLevel(
      relationship.relationshipScore
    );

  const next =
    getNextRelationshipLevel(
      relationship.relationshipScore
    );

  return {
    npcId,
    npcName: npc.name,
    score: relationship.relationshipScore,
    level,
    interactionCount:
      relationship.interactionCount,
    positiveInteractions:
      relationship.positiveInteractions,
    nextLevelAt: next.requiredScore,
    progressPercent:
      getRelationshipProgressPercent(
        relationship.relationshipScore
      ),
    unlockedInteractions:
      getUnlockedNPCInteractions(
        npcId
      ),
  };
}

export function addNPCRelationshipScore(
  npcId: string,
  scoreAmount: number,
  note?: string
): NPCRelationshipResult {
  const npc = getNPCById(npcId);

  if (!npc) {
    const fallback: NPCRelationship = {
      npcId,
      relationshipScore: 0,
      interactionCount: 0,
      positiveInteractions: 0,
      lastInteractionAt: null,
      firstMetAt: Date.now(),
      notes: [],
    };

    return {
      success: false,
      relationship: fallback,
      level: "stranger",
      levelChanged: false,
      previousLevel: "stranger",
      scoreGained: 0,
      message: "NPC not found.",
      unlockedInteractions: [],
    };
  }

  const relationships =
    loadAllRelationships();

  const existing =
    relationships[npcId] ??
    getOrCreateNPCRelationship(npcId);

  const previousLevel =
    getNPCRelationshipLevel(
      existing.relationshipScore
    );

  const safeAmount = Math.round(
    scoreAmount
  );

  const positive =
    safeAmount > 0;

  const updated: NPCRelationship = {
    ...existing,
    relationshipScore:
      clampScore(
        existing.relationshipScore +
          safeAmount
      ),
    interactionCount:
      existing.interactionCount + 1,
    positiveInteractions:
      existing.positiveInteractions +
      (positive ? 1 : 0),
    lastInteractionAt: Date.now(),
    notes: note
      ? [
          ...existing.notes,
          note,
        ].slice(-20)
      : existing.notes,
  };

  const newLevel =
    getNPCRelationshipLevel(
      updated.relationshipScore
    );

  relationships[npcId] = updated;

  saveAllRelationships(
    relationships
  );

  const levelChanged =
    previousLevel !== newLevel;

  const unlockedInteractions =
    getUnlockedNPCInteractions(
      npcId
    );

  let message = positive
    ? `${npc.name} likes you a little more.`
    : `${npc.name} seems less comfortable with you.`;

  if (levelChanged) {
    message += ` ${LEVEL_MESSAGES[newLevel]}`;
  }

  return {
    success: true,
    relationship: updated,
    level: newLevel,
    levelChanged,
    previousLevel,
    scoreGained: safeAmount,
    message,
    unlockedInteractions,
  };
}

export function recordNPCInteraction(
  npcId: string,
  interactionType: string,
  scoreAmount = 3
): NPCRelationshipResult {
  return addNPCRelationshipScore(
    npcId,
    scoreAmount,
    `Interaction: ${interactionType}`
  );
}

export function getAllNPCRelationships(): NPCRelationship[] {
  return Object.values(
    loadAllRelationships()
  );
}

export function getFriends(): NPCRelationship[] {
  return getAllNPCRelationships().filter(
    (relationship) =>
      relationship.relationshipScore >= 50
  );
}

export function getCloseFriends(): NPCRelationship[] {
  return getAllNPCRelationships().filter(
    (relationship) =>
      relationship.relationshipScore >= 100
  );
}

export function isNPCFriend(
  npcId: string
): boolean {
  const relationship =
    getNPCRelationship(npcId);

  return Boolean(
    relationship &&
      relationship.relationshipScore >= 50
  );
}

export function isNPCTrusted(
  npcId: string
): boolean {
  const relationship =
    getNPCRelationship(npcId);

  return Boolean(
    relationship &&
      relationship.relationshipScore >= 175
  );
}

export function canUseRelationshipInteraction(
  npcId: string,
  interactionId: string
): boolean {
  return getUnlockedNPCInteractions(
    npcId
  ).includes(interactionId);
}

export function addRelationshipNote(
  npcId: string,
  note: string
): boolean {
  if (!note.trim()) {
    return false;
  }

  const relationships =
    loadAllRelationships();

  const existing =
    relationships[npcId] ??
    getOrCreateNPCRelationship(npcId);

  relationships[npcId] = {
    ...existing,
    notes: [
      ...existing.notes,
      note.trim(),
    ].slice(-20),
  };

  saveAllRelationships(
    relationships
  );

  return true;
}

export function resetNPCRelationship(
  npcId: string
): void {
  const relationships =
    loadAllRelationships();

  delete relationships[npcId];

  saveAllRelationships(
    relationships
  );
}

export function resetAllNPCRelationships(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}