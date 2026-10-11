"use client";

import { createClient } from "@/lib/supabase/client";

export interface LocationChatMessage {
  id: string;
  playerId: string;
  locationId: string;
  message: string;
  createdAt: string;
  username: string;
  displayName: string;
  avatar: string;
}

const supabase = createClient();

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user?.id ?? null;
}

export async function getLocationChatMessages(
  locationId: string
): Promise<LocationChatMessage[]> {
  const { data, error } = await supabase
    .from("location_chat_messages")
    .select("id, player_id, location_id, message, created_at")
    .eq("location_id", locationId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    throw error;
  }

  const messages = data ?? [];

  if (messages.length === 0) {
    return [];
  }

  const playerIds = [
    ...new Set(messages.map((item) => item.player_id)),
  ];

  const { data: profiles, error: profileError } = await supabase
    .from("player_profiles")
    .select("id, username, display_name, avatar")
    .in("id", playerIds);

  if (profileError) {
    throw profileError;
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar ?? "🧑🏽",
      },
    ])
  );

  return messages.map((item) => {
    const profile = profileMap.get(item.player_id);

    return {
      id: item.id,
      playerId: item.player_id,
      locationId: item.location_id,
      message: item.message,
      createdAt: item.created_at,
      username: profile?.username ?? "unknown",
      displayName: profile?.displayName ?? "Unknown Player",
      avatar: profile?.avatar ?? "🧑🏽",
    };
  });
}

export async function sendLocationChatMessage(
  locationId: string,
  message: string
): Promise<void> {
  const playerId = await getCurrentPlayerId();

  if (!playerId) {
    throw new Error("You must be logged in to send a message.");
  }

  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  if (cleanMessage.length > 500) {
    throw new Error("Message is too long. Maximum is 500 characters.");
  }

  const { error } = await supabase
    .from("location_chat_messages")
    .insert({
      player_id: playerId,
      location_id: locationId,
      message: cleanMessage,
    });

  if (error) {
    throw error;
  }
}

export function subscribeToLocationChat(
  locationId: string,
  onMessage: () => void
) {
  const channel = supabase
    .channel(`location-chat-${locationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "location_chat_messages",
        filter: `location_id=eq.${locationId}`,
      },
      () => {
        onMessage();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}