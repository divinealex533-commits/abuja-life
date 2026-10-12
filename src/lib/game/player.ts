"use client";

import { createClient } from "@/lib/supabase/client";

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

const supabase = createClient();

function normalizeState(
  value: Partial<PlayerGameState> | null | undefined
): PlayerGameState {
  return {
    cash:
      typeof value?.cash === "number"
        ? Math.max(0, value.cash)
        : DEFAULT_PLAYER_STATE.cash,

    energy:
      typeof value?.energy === "number"
        ? Math.max(0, value.energy)
        : DEFAULT_PLAYER_STATE.energy,

    maxEnergy:
      typeof value?.maxEnergy === "number"
        ? Math.max(1, value.maxEnergy)
        : DEFAULT_PLAYER_STATE.maxEnergy,

    reputation:
      typeof value?.reputation === "number"
        ? value.reputation
        : DEFAULT_PLAYER_STATE.reputation,

    currentJobId:
      typeof value?.currentJobId === "string"
        ? value.currentJobId
        : null,

    jobExperience:
      typeof value?.jobExperience === "number"
        ? Math.max(0, value.jobExperience)
        : DEFAULT_PLAYER_STATE.jobExperience,

    currentLocationId:
      typeof value?.currentLocationId === "string" &&
      value.currentLocationId.length > 0
        ? value.currentLocationId
        : DEFAULT_PLAYER_STATE.currentLocationId,
  };
}

/**
 * Local fallback.
 * Kept so existing game components do not break during
 * server synchronization.
 */
export function loadPlayerState(): PlayerGameState {
  if (typeof window === "undefined") {
    return DEFAULT_PLAYER_STATE;
  }

  try {
    const saved = localStorage.getItem(PLAYER_STORAGE_KEY);

    if (!saved) {
      return DEFAULT_PLAYER_STATE;
    }

    return normalizeState(JSON.parse(saved));
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

  const normalized = normalizeState(player);

  try {
    localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch {
    // Ignore local storage errors.
  }
}

/**
 * Load the authenticated player's persistent state.
 *
 * If the player has never had a server state, create one
 * using the existing local state where possible.
 */
export async function loadPersistentPlayerState(): Promise<PlayerGameState> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return loadPlayerState();
  }

  const { data, error } = await supabase
    .from("player_game_states")
    .select(
      "cash, energy, max_energy, reputation, current_job_id, job_experience, current_location_id"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load persistent player state:",
      error.message
    );

    return loadPlayerState();
  }

  if (data) {
    const state = normalizeState({
      cash: Number(data.cash),
      energy: data.energy,
      maxEnergy: data.max_energy,
      reputation: data.reputation,
      currentJobId: data.current_job_id,
      jobExperience: data.job_experience,
      currentLocationId: data.current_location_id,
    });

    savePlayerState(state);

    return state;
  }

  const localState = loadPlayerState();

  const { data: created, error: createError } =
    await supabase
      .from("player_game_states")
      .insert({
        user_id: user.id,
        cash: localState.cash,
        energy: localState.energy,
        max_energy: localState.maxEnergy,
        reputation: localState.reputation,
        current_job_id: localState.currentJobId,
        job_experience: localState.jobExperience,
        current_location_id:
          localState.currentLocationId,
      })
      .select(
        "cash, energy, max_energy, reputation, current_job_id, job_experience, current_location_id"
      )
      .single();

  if (createError || !created) {
    console.error(
      "Failed to create persistent player state:",
      createError?.message
    );

    return localState;
  }

  const state = normalizeState({
    cash: Number(created.cash),
    energy: created.energy,
    maxEnergy: created.max_energy,
    reputation: created.reputation,
    currentJobId: created.current_job_id,
    jobExperience: created.job_experience,
    currentLocationId: created.current_location_id,
  });

  savePlayerState(state);

  return state;
}

/**
 * Save the player's complete game state to Supabase.
 */
export async function savePersistentPlayerState(
  player: PlayerGameState
): Promise<boolean> {
  const normalized = normalizeState(player);

  savePlayerState(normalized);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const { error } = await supabase
    .from("player_game_states")
    .upsert(
      {
        user_id: user.id,
        cash: normalized.cash,
        energy: normalized.energy,
        max_energy: normalized.maxEnergy,
        reputation: normalized.reputation,
        current_job_id: normalized.currentJobId,
        job_experience: normalized.jobExperience,
        current_location_id:
          normalized.currentLocationId,
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error(
      "Failed to save persistent player state:",
      error.message
    );

    return false;
  }

  return true;
}

export async function resetPersistentPlayerState(): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(PLAYER_STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("player_game_states")
    .delete()
    .eq("user_id", user.id);
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
    energy: Math.max(
      0,
      player.energy - energyCost
    ),
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
    cash:
      player.cash + Math.max(0, reward),

    reputation:
      player.reputation +
      Math.max(0, reputationGain),

    jobExperience:
      player.jobExperience +
      Math.max(0, experienceGain),
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
