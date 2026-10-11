// src/lib/game/eventGameplay.ts

import {
  loadPlayerState,
  savePlayerState,
  spendEnergy,
  type PlayerGameState,
} from "@/lib/game/player";

import {
  addPlayerExperience,
} from "@/lib/game/progression";

import {
  addItem,
  getInventoryItem,
} from "@/lib/game/inventory";

export interface EventChallenge {
  id: string;
  eventId: string;
  title: string;
  description: string;
  icon: string;
  energyCost: number;
  cashReward: number;
  reputationReward: number;
  experienceReward: number;
  itemReward?: string;
  difficulty: "easy" | "medium" | "hard" | "elite";
}

export interface ActiveEvent {
  eventId: string;
  challengeIds: string[];
  currentChallengeIndex: number;
  startedAt: string;
}

export interface EventGameplayResult {
  success: boolean;
  message: string;
  player: PlayerGameState;
  reward?: {
    cash: number;
    reputation: number;
    experience: number;
    itemId?: string;
  };
}

export const EVENT_CHALLENGES: EventChallenge[] = [
  {
    id: "night-market-shopping",
    eventId: "abuja-night-market",
    title: "Explore the Night Market",
    description:
      "Explore the market and find a valuable opportunity.",
    icon: "🌙",
    energyCost: 8,
    cashReward: 1800,
    reputationReward: 2,
    experienceReward: 35,
    difficulty: "easy",
  },

  {
    id: "night-market-vendor",
    eventId: "abuja-night-market",
    title: "Help a Market Vendor",
    description:
      "Help a vendor serve customers during the busy night.",
    icon: "🛍️",
    energyCost: 10,
    cashReward: 2800,
    reputationReward: 4,
    experienceReward: 50,
    difficulty: "medium",
  },

  {
    id: "jabi-lake-social",
    eventId: "jabi-lake-weekend",
    title: "Jabi Lake Social",
    description:
      "Meet people around Jabi Lake and build your social reputation.",
    icon: "🌊",
    energyCost: 8,
    cashReward: 1200,
    reputationReward: 5,
    experienceReward: 40,
    difficulty: "easy",
  },

  {
    id: "jabi-lake-photo",
    eventId: "jabi-lake-weekend",
    title: "Lake Photography Challenge",
    description:
      "Capture the best moment around Jabi Lake.",
    icon: "📷",
    energyCost: 12,
    cashReward: 3500,
    reputationReward: 6,
    experienceReward: 65,
    itemReward: "professional-camera",
    difficulty: "medium",
  },

  {
    id: "wuse-business-networking",
    eventId: "wuse-business-fair",
    title: "Business Networking",
    description:
      "Meet business owners and make useful connections.",
    icon: "🤝",
    energyCost: 10,
    cashReward: 3000,
    reputationReward: 7,
    experienceReward: 60,
    difficulty: "medium",
  },

  {
    id: "wuse-business-deal",
    eventId: "wuse-business-fair",
    title: "Close a Business Deal",
    description:
      "Negotiate a deal and prove your business skills.",
    icon: "💼",
    energyCost: 15,
    cashReward: 6500,
    reputationReward: 10,
    experienceReward: 90,
    difficulty: "hard",
  },

  {
    id: "maitama-car-meet",
    eventId: "maitama-car-meet",
    title: "Join the Car Meet",
    description:
      "Show up at the Maitama car meet and connect with car enthusiasts.",
    icon: "🚘",
    energyCost: 8,
    cashReward: 1800,
    reputationReward: 4,
    experienceReward: 40,
    difficulty: "easy",
  },

  {
    id: "maitama-car-show",
    eventId: "maitama-car-meet",
    title: "Car Show Challenge",
    description:
      "Participate in the competitive car showcase.",
    icon: "🏎️",
    energyCost: 14,
    cashReward: 6000,
    reputationReward: 9,
    experienceReward: 85,
    difficulty: "hard",
  },

  {
    id: "millennium-festival",
    eventId: "millennium-park-festival",
    title: "Festival Activities",
    description:
      "Take part in activities around Millennium Park.",
    icon: "🎪",
    energyCost: 10,
    cashReward: 2200,
    reputationReward: 4,
    experienceReward: 50,
    difficulty: "easy",
  },

  {
    id: "football-challenge",
    eventId: "abuja-football-challenge",
    title: "Football Challenge",
    description:
      "Compete against other players in an Abuja football challenge.",
    icon: "⚽",
    energyCost: 18,
    cashReward: 7000,
    reputationReward: 10,
    experienceReward: 100,
    difficulty: "hard",
  },

  {
    id: "mystery-delivery",
    eventId: "mystery-delivery",
    title: "Mystery Delivery",
    description:
      "Accept a mysterious delivery and get it to the destination.",
    icon: "📦",
    energyCost: 15,
    cashReward: 8500,
    reputationReward: 8,
    experienceReward: 110,
    difficulty: "hard",
  },

  {
    id: "treasure-search",
    eventId: "abuja-treasure-hunt",
    title: "Search for the Treasure",
    description:
      "Follow clues around Abuja and search for hidden treasure.",
    icon: "🗺️",
    energyCost: 20,
    cashReward: 10000,
    reputationReward: 12,
    experienceReward: 140,
    itemReward: "abuja-treasure",
    difficulty: "elite",
  },

  {
    id: "comedy-night",
    eventId: "comedy-night",
    title: "Comedy Night",
    description:
      "Attend comedy night and socialize with the Abuja crowd.",
    icon: "🎤",
    energyCost: 8,
    cashReward: 1500,
    reputationReward: 5,
    experienceReward: 45,
    difficulty: "easy",
  },

  {
    id: "gaming-tournament",
    eventId: "gaming-tournament",
    title: "Gaming Tournament",
    description:
      "Compete in an Abuja gaming tournament.",
    icon: "🎮",
    energyCost: 16,
    cashReward: 7500,
    reputationReward: 10,
    experienceReward: 120,
    difficulty: "hard",
  },

  {
    id: "taste-of-abuja",
    eventId: "taste-of-abuja",
    title: "Taste of Abuja",
    description:
      "Explore food stalls and discover Abuja's best dishes.",
    icon: "🍛",
    energyCost: 8,
    cashReward: 1800,
    reputationReward: 3,
    experienceReward: 40,
    itemReward: "jollof-rice",
    difficulty: "easy",
  },

  {
    id: "keep-abuja-beautiful",
    eventId: "keep-abuja-beautiful",
    title: "Clean the City",
    description:
      "Help keep Abuja clean and improve the city's reputation.",
    icon: "🌳",
    energyCost: 12,
    cashReward: 3000,
    reputationReward: 10,
    experienceReward: 70,
    difficulty: "medium",
  },

  {
    id: "airport-rush",
    eventId: "airport-rush",
    title: "Airport Rush",
    description:
      "Complete a fast-paced airport challenge.",
    icon: "✈️",
    energyCost: 18,
    cashReward: 8500,
    reputationReward: 9,
    experienceReward: 120,
    difficulty: "hard",
  },

  {
    id: "university-week",
    eventId: "abuja-university-week",
    title: "University Week",
    description:
      "Join activities, meet students and explore the event.",
    icon: "🎓",
    energyCost: 10,
    cashReward: 2000,
    reputationReward: 5,
    experienceReward: 55,
    difficulty: "medium",
  },

  {
    id: "city-challenge",
    eventId: "abuja-city-challenge",
    title: "Abuja City Challenge",
    description:
      "Take on one of Abuja's toughest city-wide challenges.",
    icon: "🏆",
    energyCost: 25,
    cashReward: 15000,
    reputationReward: 20,
    experienceReward: 200,
    itemReward: "city-challenge-trophy",
    difficulty: "elite",
  },
];

export function getEventChallenge(
  challengeId: string
): EventChallenge | undefined {
  return EVENT_CHALLENGES.find(
    (challenge) => challenge.id === challengeId
  );
}

export function getEventChallenges(
  eventId: string
): EventChallenge[] {
  return EVENT_CHALLENGES.filter(
    (challenge) => challenge.eventId === eventId
  );
}

export function getChallengesForEvent(
  eventId: string
): EventChallenge[] {
  return getEventChallenges(eventId);
}


    export function getEventsWithGameplay(): string[] {
  return Array.from(
    new Set(
      EVENT_CHALLENGES.map(
        (challenge) => challenge.eventId
      )
    )
  );
}
    []
  


export function canStartEventChallenge(
  challengeId: string
): boolean {
  const challenge = getEventChallenge(challengeId);

  if (!challenge) {
    return false;
  }

  const player = loadPlayerState();

  return player.energy >= challenge.energyCost;
}

export function startEventChallenge(
  challengeId: string
): EventGameplayResult {
  const player = loadPlayerState();

  const challenge =
    getEventChallenge(challengeId);

  if (!challenge) {
    return {
      success: false,
      message: "Event challenge not found.",
      player,
    };
  }

  if (player.energy < challenge.energyCost) {
    return {
      success: false,
      message: `You need ${challenge.energyCost} energy for this challenge.`,
      player,
    };
  }

  return {
    success: true,
    message: `${challenge.title} started.`,
    player,
  };
}

export function completeEventChallenge(
  challengeId: string
): EventGameplayResult {
  const player = loadPlayerState();

  const challenge =
    getEventChallenge(challengeId);

  if (!challenge) {
    return {
      success: false,
      message: "Event challenge not found.",
      player,
    };
  }

  if (player.energy < challenge.energyCost) {
    return {
      success: false,
      message: `You need ${challenge.energyCost} energy to complete this challenge.`,
      player,
    };
  }

  const energySpent = spendEnergy(
    player,
    challenge.energyCost
  );

  if (!energySpent) {
    return {
      success: false,
      message: "You do not have enough energy.",
      player,
    };
  }

  const updatedPlayer: PlayerGameState = {
    ...player,
    energy:
      player.energy - challenge.energyCost,
    cash:
      player.cash + challenge.cashReward,
    reputation:
      player.reputation +
      challenge.reputationReward,
  };

  savePlayerState(updatedPlayer);

  addPlayerExperience(
    challenge.experienceReward
  );

  let itemMessage = "";

  if (challenge.itemReward) {
    const itemAdded = addItem(
      challenge.itemReward,
      1
    );

    if (itemAdded) {
      const item = getInventoryItem(
        challenge.itemReward
      );

      if (item) {
        itemMessage = ` You received ${item.name}.`;
      }
    }
  }

  return {
    success: true,
    message: `${challenge.title} completed! You earned ₦${challenge.cashReward.toLocaleString()}, +${challenge.reputationReward} reputation and +${challenge.experienceReward} XP.${itemMessage}`,
    player: updatedPlayer,
    reward: {
      cash: challenge.cashReward,
      reputation:
        challenge.reputationReward,
      experience:
        challenge.experienceReward,
      itemId: challenge.itemReward,
    },
  };
}

export function calculateEventReward(
  challengeId: string,
  performanceMultiplier = 1
) {
  const challenge =
    getEventChallenge(challengeId);

  if (!challenge) {
    return null;
  }

  const multiplier = Math.max(
    0,
    performanceMultiplier
  );

  return {
    cash: Math.round(
      challenge.cashReward * multiplier
    ),
    reputation: Math.round(
      challenge.reputationReward * multiplier
    ),
    experience: Math.round(
      challenge.experienceReward * multiplier
    ),
  };
}