"use client";

import { createClient } from "@/lib/supabase/client";

export interface MultiplayerProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  currentLocationId: string;
  reputation: number;
  level: number;
  experience: number;
}

const supabase = createClient();

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

function cleanUsername(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 18);
}

export async function getMyProfile(): Promise<MultiplayerProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .select(
      "id, username, display_name, avatar, current_location_id, reputation, level, experience"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatar: data.avatar ?? "🧑🏽",
    currentLocationId: data.current_location_id ?? "garki",
    reputation: data.reputation ?? 0,
    level: data.level ?? 1,
    experience: data.experience ?? 0,
  };
}

export async function createMyProfile(
  username: string,
  displayName: string,
  avatar = "🧑🏽"
): Promise<MultiplayerProfile> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in to create a player profile.");
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      avatar,
      current_location_id: "garki",
    })
    .select(
      "id, username, display_name, avatar, current_location_id, reputation, level, experience"
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatar: data.avatar ?? "🧑🏽",
    currentLocationId: data.current_location_id ?? "garki",
    reputation: data.reputation ?? 0,
    level: data.level ?? 1,
    experience: data.experience ?? 0,
  };
}

export async function ensureMyProfile(
  locationId = "garki"
): Promise<MultiplayerProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const existing = await getMyProfile();

  if (existing) {
    if (existing.currentLocationId !== locationId) {
      const { data, error } = await supabase
        .from("player_profiles")
        .update({
          current_location_id: locationId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select(
          "id, username, display_name, avatar, current_location_id, reputation, level, experience"
        )
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatar: data.avatar ?? "🧑🏽",
        currentLocationId: data.current_location_id ?? "garki",
        reputation: data.reputation ?? 0,
        level: data.level ?? 1,
        experience: data.experience ?? 0,
      };
    }

    return existing;
  }

  const metadata = user.user_metadata ?? {};

  const rawName =
    metadata.display_name ??
    metadata.full_name ??
    metadata.name ??
    user.email?.split("@")[0] ??
    "Player";

  const baseUsername = cleanUsername(
    metadata.username ??
      user.email?.split("@")[0] ??
      `player${user.id.slice(0, 8)}`
  );

  const username =
    baseUsername.length > 0
      ? `${baseUsername}_${user.id.slice(0, 6)}`
      : `player_${user.id.slice(0, 8)}`;

  const displayName = String(rawName).slice(0, 40);

  const avatar =
    typeof metadata.avatar === "string"
      ? metadata.avatar
      : "🧑🏽";

  const { data, error } = await supabase
    .from("player_profiles")
    .insert({
      id: user.id,
      username,
      display_name: displayName,
      avatar,
      current_location_id: locationId,
    })
    .select(
      "id, username, display_name, avatar, current_location_id, reputation, level, experience"
    )
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatar: data.avatar ?? "🧑🏽",
    currentLocationId: data.current_location_id ?? locationId,
    reputation: data.reputation ?? 0,
    level: data.level ?? 1,
    experience: data.experience ?? 0,
  };
}