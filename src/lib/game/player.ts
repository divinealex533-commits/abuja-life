// Abuja Life — Player Game State
// Handles the player's current job, money, energy, reputation and location.
// Local persistence for now.
// Later we can move this to Supabase when the multiplayer database is ready.

export interface PlayerGameState {
  cash: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  currentJobId: string | null;
  jobExperience: number;
  currentLocationId: string;
}

export const DEFAULT_PLAYER_STATE: PlayerGameState = {
  cash: 10000,
  energy: 100,
  maxEnergy: 100,
  reputation: 0,
  currentJobId: null,
  jobExperience: 0,
  currentLocationId: "garki",
};

const PLAYER_STORAGE_KEY = "abujaLifePlayerState";

export function loadPlayerState(): PlayerGameState {
  if (typeof window === "undefined") {
    return DEFAULT_PLAYER_STATE;
  }

  try {
    const saved = localStorage.getItem(PLAYER_STORAGE_KEY);

    if (!saved) {
      return DEFAULT_PLAYER_STATE;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PLAYER_STATE,
      ...parsed,
      currentLocationId:
        parsed.currentLocationId ??
        DEFAULT_PLAYER_STATE.currentLocationId,
    };
  } catch {
    return DEFAULT_PLAYER_STATE;
  }
}

export function savePlayerState(
  player: PlayerGameState
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify(player)
    );
  } catch {
    // Ignore storage errors.
  }
}

export function resetPlayerState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(PLAYER_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function canAffordEnergy(
  player: PlayerGameState,
  energyCost: number
): boolean {
  return player.energy >= energyCost;
}

export function spendEnergy(
  player: PlayerGameState,
  energyCost: number
): PlayerGameState {
  if (!canAffordEnergy(player, energyCost)) {
    return player;
  }

  return {
    ...player,
    energy: Math.max(0, player.energy - energyCost),
  };
}

export function restoreEnergy(
  player: PlayerGameState,
  amount: number
): PlayerGameState {
  return {
    ...player,
    energy: Math.min(
      player.maxEnergy,
      player.energy + Math.max(0, amount)
    ),
  };
}

export function applyJob(
  player: PlayerGameState,
  jobId: string
): PlayerGameState {
  return {
    ...player,
    currentJobId: jobId,
  };
}

export function completeJob(
  player: PlayerGameState,
  reward: number,
  reputationGain: number,
  experienceGain = 1
): PlayerGameState {
  return {
    ...player,
    cash: player.cash + Math.max(0, reward),
    reputation:
      player.reputation + Math.max(0, reputationGain),
    jobExperience:
      player.jobExperience + Math.max(0, experienceGain),
  };
}

export function movePlayer(
  player: PlayerGameState,
  locationId: string
): PlayerGameState {
  return {
    ...player,
    currentLocationId: locationId,
  };
}