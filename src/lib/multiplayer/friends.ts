"use client";

import { createClient } from "@/lib/supabase/client";
import {
  createFriendAcceptedNotification,
  createFriendDeclinedNotification,
  createFriendRequestNotification,
} from "@/lib/multiplayer/notifications";

export type FriendRequestStatus =
  | "pending"
  | "accepted"
  | "declined";

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt: string | null;
}

export interface Friendship {
  id: string;
  playerOneId: string;
  playerTwoId: string;
  createdAt: string;
}

export interface FriendPlayer {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  currentLocationId: string;
  reputation: number;
  level: number;
  experience: number;
}

export type FriendRelationshipStatus =
  | "self"
  | "friends"
  | "incoming"
  | "outgoing"
  | "none";

const supabase = createClient();

/* ─────────────────────────────────────────────
   AUTH
───────────────────────────────────────────── */

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return user.id;
}

/* ─────────────────────────────────────────────
   NORMALIZATION
───────────────────────────────────────────── */

function mapFriendRequest(item: {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
}): FriendRequest {
  return {
    id: item.id,
    senderId: item.sender_id,
    recipientId: item.recipient_id,
    status: item.status,
    createdAt: item.created_at,
    respondedAt: item.responded_at,
  };
}

function mapFriendship(item: {
  id: string;
  player_one_id: string;
  player_two_id: string;
  created_at: string;
}): Friendship {
  return {
    id: item.id,
    playerOneId: item.player_one_id,
    playerTwoId: item.player_two_id,
    createdAt: item.created_at,
  };
}

function normalizePlayer(
  player: {
    id: string;
    username: string;
    display_name: string;
    avatar: string | null;
    current_location_id: string | null;
    reputation: number | null;
    level: number | null;
    experience: number | null;
  }
): FriendPlayer {
  return {
    id: player.id,
    username: player.username,
    displayName: player.display_name,
    avatar: player.avatar ?? "🧑🏽",
    currentLocationId: player.current_location_id ?? "garki",
    reputation: player.reputation ?? 0,
    level: player.level ?? 1,
    experience: player.experience ?? 0,
  };
}

/* ─────────────────────────────────────────────
   FRIEND REQUESTS
───────────────────────────────────────────── */

export async function sendFriendRequest(
  recipientId: string
): Promise<FriendRequest> {
  const senderId = await getCurrentUserId();

  if (!recipientId) {
    throw new Error("A recipient is required.");
  }

  if (senderId === recipientId) {
    throw new Error("You cannot send yourself a friend request.");
  }

  const existingFriendship = await areFriends(recipientId);

  if (existingFriendship) {
    throw new Error("You are already friends with this player.");
  }

  const { data: existingRequest, error: existingError } =
    await supabase
      .from("friend_requests")
      .select(
        "id, sender_id, recipient_id, status, created_at, responded_at"
      )
      .or(
        `and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`
      )
      .eq("status", "pending")
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingRequest) {
    if (existingRequest.sender_id === recipientId) {
      throw new Error(
        "This player has already sent you a friend request."
      );
    }

    throw new Error("A friend request already exists.");
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      status: "pending",
    })
    .select(
      "id, sender_id, recipient_id, status, created_at, responded_at"
    )
    .single();

  if (error) {
    throw error;
  }

  const request = mapFriendRequest(data);

  /*
   * Notification is intentionally best-effort.
   * A notification/RLS problem must never undo
   * a successfully-created friend request.
   */
  try {
    await createFriendRequestNotification(
      recipientId,
      senderId
    );
  } catch (notificationError) {
    console.warn(
      "Friend request notification could not be created:",
      notificationError
    );
  }

  return request;
}

export async function getIncomingFriendRequests(): Promise<
  FriendRequest[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, recipient_id, status, created_at, responded_at"
    )
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapFriendRequest);
}

export async function getOutgoingFriendRequests(): Promise<
  FriendRequest[]
> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, recipient_id, status, created_at, responded_at"
    )
    .eq("sender_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapFriendRequest);
}

export async function getFriendRequestBetween(
  otherPlayerId: string
): Promise<FriendRequest | null> {
  const userId = await getCurrentUserId();

  if (!otherPlayerId || userId === otherPlayerId) {
    return null;
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, recipient_id, status, created_at, responded_at"
    )
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherPlayerId}),and(sender_id.eq.${otherPlayerId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapFriendRequest(data) : null;
}

export async function getFriendRequestStatus(
  otherPlayerId: string
): Promise<FriendRelationshipStatus> {
  const userId = await getCurrentUserId();

  if (userId === otherPlayerId) {
    return "self";
  }

  if (await areFriends(otherPlayerId)) {
    return "friends";
  }

  const request = await getFriendRequestBetween(otherPlayerId);

  if (!request || request.status !== "pending") {
    return "none";
  }

  if (request.senderId === userId) {
    return "outgoing";
  }

  return "incoming";
}

export async function acceptFriendRequest(
  requestId: string
): Promise<Friendship> {
  const userId = await getCurrentUserId();

  const { data: request, error: requestError } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, recipient_id, status, created_at, responded_at"
    )
    .eq("id", requestId)
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .single();

  if (requestError) {
    throw requestError;
  }

  const playerOneId =
    request.sender_id < request.recipient_id
      ? request.sender_id
      : request.recipient_id;

  const playerTwoId =
    request.sender_id < request.recipient_id
      ? request.recipient_id
      : request.sender_id;

  const { data: existingFriendship, error: existingError } =
    await supabase
      .from("friendships")
      .select(
        "id, player_one_id, player_two_id, created_at"
      )
      .eq("player_one_id", playerOneId)
      .eq("player_two_id", playerTwoId)
      .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingFriendship) {
    const { error: updateExistingError } =
      await supabase
        .from("friend_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .eq("recipient_id", userId);

    if (updateExistingError) {
      throw updateExistingError;
    }

    try {
      await createFriendAcceptedNotification(
        request.sender_id,
        request.recipient_id
      );
    } catch (notificationError) {
      console.warn(
        "Friend accepted notification could not be created:",
        notificationError
      );
    }

    return mapFriendship(existingFriendship);
  }

  const { data: friendship, error: friendshipError } =
    await supabase
      .from("friendships")
      .insert({
        player_one_id: playerOneId,
        player_two_id: playerTwoId,
      })
      .select(
        "id, player_one_id, player_two_id, created_at"
      )
      .single();

  if (friendshipError) {
    throw friendshipError;
  }

  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("recipient_id", userId)
    .eq("status", "pending");

  if (updateError) {
    throw updateError;
  }

  try {
    await createFriendAcceptedNotification(
      request.sender_id,
      request.recipient_id
    );
  } catch (notificationError) {
    console.warn(
      "Friend accepted notification could not be created:",
      notificationError
    );
  }

  return mapFriendship(friendship);
}

export async function declineFriendRequest(
  requestId: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { data: request, error: requestError } =
    await supabase
      .from("friend_requests")
      .select(
        "id, sender_id, recipient_id, status, created_at, responded_at"
      )
      .eq("id", requestId)
      .eq("recipient_id", userId)
      .eq("status", "pending")
      .single();

  if (requestError) {
    throw requestError;
  }

  const { error } = await supabase
    .from("friend_requests")
    .update({
      status: "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("recipient_id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  try {
    await createFriendDeclinedNotification(
      request.sender_id,
      request.recipient_id
    );
  } catch (notificationError) {
    console.warn(
      "Friend declined notification could not be created:",
      notificationError
    );
  }
}

export async function cancelFriendRequest(
  requestId: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

/* ─────────────────────────────────────────────
   FRIENDSHIPS
───────────────────────────────────────────── */

export async function areFriends(
  otherPlayerId: string
): Promise<boolean> {
  const userId = await getCurrentUserId();

  if (!otherPlayerId || userId === otherPlayerId) {
    return false;
  }

  const playerOneId =
    userId < otherPlayerId ? userId : otherPlayerId;

  const playerTwoId =
    userId < otherPlayerId ? otherPlayerId : userId;

  const { data, error } = await supabase
    .from("friendships")
    .select("id")
    .eq("player_one_id", playerOneId)
    .eq("player_two_id", playerTwoId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function getFriendship(
  otherPlayerId: string
): Promise<Friendship | null> {
  const userId = await getCurrentUserId();

  if (!otherPlayerId || userId === otherPlayerId) {
    return null;
  }

  const playerOneId =
    userId < otherPlayerId ? userId : otherPlayerId;

  const playerTwoId =
    userId < otherPlayerId ? otherPlayerId : userId;

  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, player_one_id, player_two_id, created_at"
    )
    .eq("player_one_id", playerOneId)
    .eq("player_two_id", playerTwoId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapFriendship(data) : null;
}

export async function getMyFriendships(): Promise<Friendship[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, player_one_id, player_two_id, created_at"
    )
    .or(
      `player_one_id.eq.${userId},player_two_id.eq.${userId}`
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapFriendship);
}

export async function removeFriend(
  otherPlayerId: string
): Promise<void> {
  const userId = await getCurrentUserId();

  if (!otherPlayerId || userId === otherPlayerId) {
    return;
  }

  const playerOneId =
    userId < otherPlayerId ? userId : otherPlayerId;

  const playerTwoId =
    userId < otherPlayerId ? otherPlayerId : userId;

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("player_one_id", playerOneId)
    .eq("player_two_id", playerTwoId);

  if (error) {
    throw error;
  }
}

/* ─────────────────────────────────────────────
   FRIEND PROFILES
───────────────────────────────────────────── */

export async function getMyFriends(): Promise<FriendPlayer[]> {
  const userId = await getCurrentUserId();

  const friendships = await getMyFriendships();

  const friendIds = friendships.map((friendship) =>
    friendship.playerOneId === userId
      ? friendship.playerTwoId
      : friendship.playerOneId
  );

  if (friendIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .select(
      "id, username, display_name, avatar, current_location_id, reputation, level, experience"
    )
    .in("id", friendIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizePlayer);
}

export async function getFriendById(
  playerId: string
): Promise<FriendPlayer | null> {
  if (!playerId) {
    return null;
  }

  const { data, error } = await supabase
    .from("player_profiles")
    .select(
      "id, username, display_name, avatar, current_location_id, reputation, level, experience"
    )
    .eq("id", playerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizePlayer(data) : null;
}

export async function getFriendsAtLocation(
  locationId: string
): Promise<FriendPlayer[]> {
  if (!locationId) {
    return [];
  }

  const friends = await getMyFriends();

  return friends.filter(
    (friend) => friend.currentLocationId === locationId
  );
}

export async function getFriendCount(): Promise<number> {
  const friends = await getMyFriends();
  return friends.length;
}

/* ─────────────────────────────────────────────
   REALTIME FRIEND REQUESTS
───────────────────────────────────────────── */

export function subscribeToFriendRequests(
  onRequest: (request: FriendRequest) => void
) {
  let currentUserId = "";

  const channel = supabase
    .channel(`friend-requests-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "friend_requests",
      },
      async (payload) => {
        const item = payload.new as {
          id: string;
          sender_id: string;
          recipient_id: string;
          status: FriendRequestStatus;
          created_at: string;
          responded_at: string | null;
        };

        if (!currentUserId) {
          try {
            currentUserId = await getCurrentUserId();
          } catch {
            return;
          }
        }

        if (item.recipient_id !== currentUserId) {
          return;
        }

        if (item.status !== "pending") {
          return;
        }

        onRequest(mapFriendRequest(item));
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/* ─────────────────────────────────────────────
   REALTIME FRIENDSHIP CHANGES
───────────────────────────────────────────── */

export function subscribeToFriendships(
  onChange: (friendship: Friendship) => void
) {
  const channel = supabase
    .channel(`friendships-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "friendships",
      },
      async (payload) => {
        const item = payload.new as {
          id: string;
          player_one_id: string;
          player_two_id: string;
          created_at: string;
        };

        try {
          const userId = await getCurrentUserId();

          if (
            item.player_one_id !== userId &&
            item.player_two_id !== userId
          ) {
            return;
          }

          onChange(mapFriendship(item));
        } catch {
          return;
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}