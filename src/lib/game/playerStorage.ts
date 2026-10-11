// Abuja Life — Player Storage
// Saves and loads the player's local game progress.
// Later this can be replaced with Supabase persistence.

import {
  DEFAULT_PLAYER_STATE,
  PlayerGameState,
} from "./player";

const PLAYER_STORAGE_KEY = "abujaLifePlayerState";

export function loadPlayerState(): PlayerGameState {
  if (typeof window === "undefined") {
    return DEFAULT_PLAYER_STATE;
  }

  try {
    const saved = window.localStorage.getItem(
      PLAYER_STORAGE_KEY
    );

    if (!saved) {
      return DEFAULT_PLAYER_STATE;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_PLAYER_STATE,
      ...parsed,
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
    window.localStorage.setItem(
      PLAYER_STORAGE_KEY,
      JSON.stringify(player)
    );
  } catch {
    // Ignore storage errors so the game can continue running.
  }
}

export function resetPlayerState(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      PLAYER_STORAGE_KEY
    );
  } catch {
    // Ignore storage errors.
  }
}