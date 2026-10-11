"use client";

import { createClient } from "@/lib/supabase/client";

export interface NearbyPlayer {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  currentLocationId: string;
  onlineAt: string;
}

const supabase = createClient();

export async function updatePlayerLocation(
  playerId: string,
  locationId: string
) {
  const { error } = await supabase
    .from("player_profiles")
    .update({
      current_location_id: locationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId);

  if (error) {
    throw error;
  }
}

export async function getNearbyPlayers(
  locationId: string,
  currentPlayerId?: string
): Promise<NearbyPlayer[]> {
  let query = supabase
    .from("player_profiles")
    .select(
      "id, username, display_name, avatar, current_location_id, updated_at"
    )
    .eq("current_location_id", locationId)
    .order("updated_at", { ascending: false });

  if (currentPlayerId) {
    query = query.neq("id", currentPlayerId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((player) => ({
    id: player.id,
    username: player.username,
    displayName: player.display_name,
    avatar: player.avatar ?? "🧑🏽",
    currentLocationId: player.current_location_id,
    onlineAt: player.updated_at,
  }));
}