import type { SupabaseClient } from "@supabase/supabase-js";

import { addToNeeds, decayNeeds, normalizeNeeds, type Needs } from "@/lib/life/needs";

export interface LifeRow {
  /** False when 20261121_playable_life.sql hasn't been run yet. */
  ready: boolean;
  needs: Needs;
  cash: number;
  energy: number;
  maxEnergy: number;
  locationId: string;
}

/** Read the player's needs (with time-decay applied) and core stats. */
export async function loadLife(admin: SupabaseClient, userId: string): Promise<LifeRow> {
  const { data, error } = await admin
    .from("player_game_states")
    .select("cash, energy, max_energy, current_location_id, needs, needs_updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Needs columns missing: fall back to the basics so nothing breaks.
    const { data: basic } = await admin
      .from("player_game_states")
      .select("cash, energy, max_energy, current_location_id")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      ready: false,
      needs: normalizeNeeds(null),
      cash: Number(basic?.cash ?? 0),
      energy: Number(basic?.energy ?? 0),
      maxEnergy: Number(basic?.max_energy ?? 100),
      locationId: String(basic?.current_location_id ?? "garki"),
    };
  }

  return {
    ready: true,
    needs: decayNeeds(normalizeNeeds(data?.needs), data?.needs_updated_at ?? null),
    cash: Number(data?.cash ?? 0),
    energy: Number(data?.energy ?? 0),
    maxEnergy: Number(data?.max_energy ?? 100),
    locationId: String(data?.current_location_id ?? "garki"),
  };
}

/** Save needs as of now. Returns false if the columns don't exist yet. */
export async function saveNeeds(admin: SupabaseClient, userId: string, needs: Needs): Promise<boolean> {
  const { error } = await admin
    .from("player_game_states")
    .update({ needs, needs_updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return !error;
}

/** Apply a change to needs (e.g. after a shift). Quietly does nothing if not set up. */
export async function changeNeeds(admin: SupabaseClient, userId: string, change: Partial<Needs>) {
  const life = await loadLife(admin, userId);
  if (!life.ready) return null;
  const next = addToNeeds(life.needs, change);
  await saveNeeds(admin, userId, next);
  return next;
}
