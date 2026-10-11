import {
  getNPCById,
  getNPCsAtLocation,
} from "@/lib/game/npcWorld";
import {
  loadPlayerState,
  savePlayerState,
  PlayerGameState,
} from "@/lib/game/player";
import {
  addItem,
  getInventoryItem,
} from "@/lib/game/inventory";

import {
  recordNPCInteraction,
  canUseRelationshipInteraction,
} from "@/lib/game/npcRelationships";

export type NPCInteractionType =
  | "greet"
  | "talk"
  | "ask_about_abuja"
  | "ask_about_jobs"
  | "ask_about_location"
  | "invite_hangout"
  | "socialize"
  | "trade"
  | "hire"
  | "follow"
  | "leave";

export interface NPCInteractionOption {
  id: NPCInteractionType;
  name: string;
  description: string;
  icon: string;
  energyCost: number;
  cashCost: number;
  reputationGain: number;
  experienceGain: number;
  skillId?: string;
  requiredRole?: string[];
  requiredActivity?: string[];
  rewardCash?: number;
  rewardItemId?: string;
}

export interface NPCInteractionResult {
  success: boolean;
  message: string;
  interactionType: NPCInteractionType;
  npcId: string;
  npcName: string;
  player: PlayerGameState;
  cashEarned: number;
  cashSpent: number;
  reputationGained: number;
  experienceGained: number;
  skillExperienceGained: number;
  itemRewardId?: string;
  itemRewardName?: string;
}

const INTERACTION_HISTORY_KEY = "abujaLifeNPCInteractionHistory";

interface InteractionHistoryEntry {
  npcId: string;
  interactionType: NPCInteractionType;
  timestamp: number;
}

const INTERACTIONS: NPCInteractionOption[] = [
  {
    id: "greet",
    name: "Greet",
    description: "Give the NPC a friendly greeting.",
    icon: "👋",
    energyCost: 1,
    cashCost: 0,
    reputationGain: 1,
    experienceGain: 5,
    skillId: "social",
  },
  {
    id: "talk",
    name: "Talk",
    description: "Have a proper conversation with the NPC.",
    icon: "💬",
    energyCost: 2,
    cashCost: 0,
    reputationGain: 2,
    experienceGain: 10,
    skillId: "social",
  },
  {
    id: "ask_about_abuja",
    name: "Ask About Abuja",
    description: "Learn something interesting about the city.",
    icon: "🏙️",
    energyCost: 1,
    cashCost: 0,
    reputationGain: 1,
    experienceGain: 8,
    skillId: "social",
  },
  {
    id: "ask_about_jobs",
    name: "Ask About Jobs",
    description: "Ask the NPC if they know about work opportunities.",
    icon: "💼",
    energyCost: 1,
    cashCost: 0,
    reputationGain: 1,
    experienceGain: 8,
    skillId: "social",
  },
  {
    id: "ask_about_location",
    name: "Ask About This Area",
    description: "Ask the NPC what is happening around the area.",
    icon: "📍",
    energyCost: 1,
    cashCost: 0,
    reputationGain: 1,
    experienceGain: 8,
    skillId: "social",
  },
  {
    id: "invite_hangout",
    name: "Invite to Hangout",
    description: "Invite the NPC to spend some time together.",
    icon: "🍹",
    energyCost: 3,
    cashCost: 800,
    reputationGain: 3,
    experienceGain: 15,
    skillId: "social",
  },
  {
    id: "socialize",
    name: "Socialize",
    description: "Spend time together and improve your social reputation.",
    icon: "🎉",
    energyCost: 4,
    cashCost: 500,
    reputationGain: 4,
    experienceGain: 20,
    skillId: "social",
  },
  {
    id: "trade",
    name: "Trade / Buy",
    description: "Interact with the NPC as a vendor or business person.",
    icon: "🛍️",
    energyCost: 1,
    cashCost: 0,
    reputationGain: 1,
    experienceGain: 10,
    skillId: "business",
    requiredRole: ["vendor", "business_owner"],
  },
  {
    id: "hire",
    name: "Hire",
    description: "Hire this NPC for a small service.",
    icon: "🤝",
    energyCost: 2,
    cashCost: 2500,
    reputationGain: 3,
    experienceGain: 20,
    skillId: "business",
    requiredRole: ["worker", "vendor", "driver", "service"],
  },
  {
    id: "follow",
    name: "Follow",
    description: "Follow the NPC to their next activity or destination.",
    icon: "🚶",
    energyCost: 2,
    cashCost: 0,
    reputationGain: 0,
    experienceGain: 12,
    skillId: "exploration",
  },
  {
    id: "leave",
    name: "Leave",
    description: "End the interaction.",
    icon: "🚪",
    energyCost: 0,
    cashCost: 0,
    reputationGain: 0,
    experienceGain: 0,
  },
];

const NPC_DIALOGUE: Record<
  NPCInteractionType,
  string[]
> = {
  greet: [
    "Nice to meet you! Abuja has been lively today.",
    "Hey! Good to see you around.",
    "Welcome to Abuja. Hope you're enjoying the city.",
  ],
  talk: [
    "There is always something happening somewhere in Abuja.",
    "You should explore more of the city. You never know who you'll meet.",
    "Business has been moving lately. There are plenty of opportunities if you know where to look.",
  ],
  ask_about_abuja: [
    "Jabi gets really busy around the lake on weekends.",
    "Wuse is one of the busiest places if you're looking for business opportunities.",
    "Maitama is where you'll find some of the city's luxury lifestyle.",
    "Garki is always active because of the markets and businesses.",
    "Kado is becoming a serious place for cars and new developments.",
  ],
  ask_about_jobs: [
    "Check the jobs around Wuse and Garki. There is usually work there.",
    "If you have good skills, technology and creative jobs can pay really well.",
    "Delivery and transport jobs are good when you need quick cash.",
    "Networking can lead to better jobs than simply waiting around.",
  ],
  ask_about_location: [
    "This area can get really busy later in the day.",
    "Keep exploring. There are usually businesses and activities nearby.",
    "You picked a good place to meet people.",
    "Watch the city activity because things can change throughout the day.",
  ],
  invite_hangout: [
    "Sure, let's hang out for a bit.",
    "Sounds good. Let's enjoy the city.",
    "Why not? Abuja has plenty of places to check out.",
  ],
  socialize: [
    "That was fun. We should do this again.",
    "It's always better exploring the city with someone.",
    "Good vibes. Abuja needs more days like this.",
  ],
  trade: [
    "Take a look at what I have available.",
    "Business is business. Let's see what we can work out.",
    "I might have something useful for you.",
  ],
  hire: [
    "I can help you with that.",
    "Deal. Let's get started.",
    "You've got yourself some help.",
  ],
  follow: [
    "Alright, you can come along.",
    "I'm heading somewhere nearby. Follow me.",
    "Let's move.",
  ],
  leave: [
    "See you around Abuja.",
    "Take care.",
    "Catch you later.",
  ],
};

function loadInteractionHistory(): InteractionHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(
      INTERACTION_HISTORY_KEY
    );

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInteractionHistory(
  history: InteractionHistoryEntry[]
) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    INTERACTION_HISTORY_KEY,
    JSON.stringify(history.slice(-200))
  );
}

function recordInteraction(
  npcId: string,
  interactionType: NPCInteractionType
) {
  const history = loadInteractionHistory();

  history.push({
    npcId,
    interactionType,
    timestamp: Date.now(),
  });

  saveInteractionHistory(history);
}

function wasRecentlyUsed(
  npcId: string,
  interactionType: NPCInteractionType,
  cooldownMs = 30000
): boolean {
  const history = loadInteractionHistory();

  const now = Date.now();

  return history.some(
    (entry) =>
      entry.npcId === npcId &&
      entry.interactionType === interactionType &&
      now - entry.timestamp < cooldownMs
  );
}

export function getNPCInteractions(
  npcId: string
): NPCInteractionOption[] {
  const npc = getNPCById(npcId);

  if (!npc) return [];

  return INTERACTIONS.filter((interaction) => {
    if (
      interaction.requiredRole &&
      !interaction.requiredRole.includes(npc.role)
    ) {
      return false;
    }

    if (
      interaction.requiredActivity &&
      !interaction.requiredActivity.includes(
        npc.activity
      )
    ) {
      return false;
    }

    return true;
  });
}

export function getNPCInteraction(
  interactionType: NPCInteractionType
): NPCInteractionOption | undefined {
  return INTERACTIONS.find(
    (interaction) =>
      interaction.id === interactionType
  );
}

export function canInteractWithNPC(
  npcId: string,
  interactionType: NPCInteractionType
): {
  allowed: boolean;
  reason?: string;
} {
  const npc = getNPCById(npcId);

  if (!npc) {
    return {
      allowed: false,
      reason: "NPC not found.",
    };
  }

  const interaction =
    getNPCInteraction(interactionType);

  if (!interaction) {
    return {
      allowed: false,
      reason: "Interaction not found.",
    };
  }

  if (
  !canUseRelationshipInteraction(
    npcId,
    interactionType
  )
) {
  return {
    allowed: false,
    reason:
      "You haven't built enough of a relationship with this NPC to do that yet.",
  };
}

  if (
    interaction.requiredRole &&
    !interaction.requiredRole.includes(npc.role)
  ) {
    return {
      allowed: false,
      reason: "This NPC cannot perform this interaction.",
    };
  }

  const player = loadPlayerState();

  if (player.energy < interaction.energyCost) {
    return {
      allowed: false,
      reason: `You need ${interaction.energyCost} energy.`,
    };
  }

  if (player.cash < interaction.cashCost) {
    return {
      allowed: false,
      reason: `You need ₦${interaction.cashCost.toLocaleString()}.`,
    };
  }

  if (
    interactionType !== "leave" &&
    wasRecentlyUsed(npcId, interactionType)
  ) {
    return {
      allowed: false,
      reason:
        "You just did this. Give the conversation some time.",
    };
  }

  return {
    allowed: true,
  };
}

function getDialogue(
  interactionType: NPCInteractionType
): string {
  const lines = NPC_DIALOGUE[interactionType];

  if (!lines?.length) {
    return "The NPC looks at you.";
  }

  return lines[
    Math.floor(Math.random() * lines.length)
  ];
}

function getSpecialReward(
  interactionType: NPCInteractionType,
  npcRole: string
): {
  cash: number;
  itemId?: string;
} {
  if (interactionType === "trade") {
    if (npcRole === "vendor") {
      return {
        cash: 0,
      };
    }

    return {
      cash: 250,
    };
  }

  if (interactionType === "ask_about_abuja") {
    return {
      cash: 100,
    };
  }

  if (interactionType === "ask_about_jobs") {
    return {
      cash: 150,
    };
  }

  if (interactionType === "follow") {
    return {
      cash: 200,
    };
  }

  if (interactionType === "hire") {
    return {
      cash: 0,
    };
  }

  return {
    cash: 0,
  };
}

function spendInteractionCost(
  player: PlayerGameState,
  interaction: NPCInteractionOption
): PlayerGameState {
  return {
    ...player,
    cash: player.cash - interaction.cashCost,
    energy: Math.max(
      0,
      player.energy - interaction.energyCost
    ),
    reputation:
      player.reputation + interaction.reputationGain,
  };
}

function rewardInventoryItem(
  itemId: string | undefined
): {
  itemRewardId?: string;
  itemRewardName?: string;
} {
  if (!itemId) {
    return {};
  }

  const item = getInventoryItem(itemId);

  if (!item) {
    return {};
  }

  addItem(itemId, 1);

  return {
    itemRewardId: itemId,
    itemRewardName: item.name,
  };
}

function getRelationshipScoreForInteraction(
  interactionType: NPCInteractionType
): number {
  switch (interactionType) {
    case "greet":
      return 2;

    case "talk":
      return 4;

    case "ask_about_abuja":
    case "ask_about_jobs":
    case "ask_about_location":
      return 3;

    case "invite_hangout":
      return 8;

    case "socialize":
      return 10;

    case "trade":
      return 4;

    case "hire":
      return 6;

    case "follow":
      return 5;

    default:
      return 0;
  }
}

export function performNPCInteraction(
  npcId: string,
  interactionType: NPCInteractionType
): NPCInteractionResult {
  const npc = getNPCById(npcId);

  if (!npc) {
    const player = loadPlayerState();

    return {
      success: false,
      message: "NPC not found.",
      interactionType,
      npcId,
      npcName: "Unknown NPC",
      player,
      cashEarned: 0,
      cashSpent: 0,
      reputationGained: 0,
      experienceGained: 0,
      skillExperienceGained: 0,
    };
  }

  const interaction =
    getNPCInteraction(interactionType);

  const player = loadPlayerState();

  if (!interaction) {
    return {
      success: false,
      message: "That interaction is not available.",
      interactionType,
      npcId,
      npcName: npc.name,
      player,
      cashEarned: 0,
      cashSpent: 0,
      reputationGained: 0,
      experienceGained: 0,
      skillExperienceGained: 0,
    };
  }

  const permission = canInteractWithNPC(
    npcId,
    interactionType
  );

  if (!permission.allowed) {
    return {
      success: false,
      message:
        permission.reason ??
        "You cannot do that right now.",
      interactionType,
      npcId,
      npcName: npc.name,
      player,
      cashEarned: 0,
      cashSpent: 0,
      reputationGained: 0,
      experienceGained: 0,
      skillExperienceGained: 0,
    };
  }

  if (interactionType === "leave") {
    return {
      success: true,
      message: getDialogue("leave"),
      interactionType,
      npcId,
      npcName: npc.name,
      player,
      cashEarned: 0,
      cashSpent: 0,
      reputationGained: 0,
      experienceGained: 0,
      skillExperienceGained: 0,
    };
  }

  const updatedPlayer = spendInteractionCost(
    player,
    interaction
  );

  const specialReward = getSpecialReward(
    interactionType,
    npc.role
  );

  updatedPlayer.cash +=
    interaction.rewardCash ?? specialReward.cash;

  savePlayerState(updatedPlayer);

  const skillExperienceGained = 0;

  let itemRewardId:
    | string
    | undefined;

  if (
    interactionType === "talk" &&
    npc.role === "event_guest"
  ) {
    itemRewardId = "event-pass";
  }

  const itemReward = rewardInventoryItem(
    itemRewardId
  );

  recordInteraction(npcId, interactionType);

  const relationshipResult =
  recordNPCInteraction(
    npcId,
    interactionType,
    getRelationshipScoreForInteraction(
      interactionType
    )
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("abujaLifePlayerUpdated")
    );

    window.dispatchEvent(
      new Event("abujaLifeProgressionUpdated")
    );

    if (interaction.skillId) {
      window.dispatchEvent(
        new Event("abujaLifeSkillsUpdated")
      );
    }
  }

  const earnedCash =
    interaction.rewardCash ?? specialReward.cash;

  const cashSpent = interaction.cashCost;

  let message = getDialogue(interactionType);

  if (relationshipResult.levelChanged) {
  message += ` ❤️ ${relationshipResult.message}`;
}

  if (earnedCash > 0) {
    message += ` You earned ₦${earnedCash.toLocaleString()}.`;
  }

  if (itemReward.itemRewardName) {
    message += ` You received ${itemReward.itemRewardName}.`;
  }

  if (
    interactionType === "follow" &&
    npc.destinationLocationId
  ) {
    message += ` ${npc.name} is heading somewhere nearby.`;
  }

  if (interaction.skillId) {
  message += ` ${interaction.skillId} skill improved.`;
}

  return {
    success: true,
    message,
    interactionType,
    npcId,
    npcName: npc.name,
    player: updatedPlayer,
    cashEarned: earnedCash,
    cashSpent,
    reputationGained:
      interaction.reputationGain,
    experienceGained:
      interaction.experienceGain,
    skillExperienceGained,
    ...itemReward,
  };
}

export function getNearbyInteractableNPCs(
  locationId: string
) {
  return getNPCsAtLocation(locationId);
}

export function getNPCInteractionHistory(
  npcId?: string
): InteractionHistoryEntry[] {
  const history = loadInteractionHistory();

  if (!npcId) {
    return history;
  }

  return history.filter(
    (entry) => entry.npcId === npcId
  );
}

export function clearNPCInteractionHistory() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(
    INTERACTION_HISTORY_KEY
  );
}