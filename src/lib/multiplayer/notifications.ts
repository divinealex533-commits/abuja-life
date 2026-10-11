"use client";

import { createClient } from "@/lib/supabase/client";

export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "friend_declined"
  | "private_message"
  | "voice_note"
  | "event"
  | "job_reward"
  | "business_reward"
  | "competition"
  | "city_event"
  | "system";

export interface GameNotification {
  id: string;
  playerId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  actionUrl: string | null;
  actorId: string | null;
  readAt: string | null;
  createdAt: string;
}

const supabase = createClient();

function mapNotification(item: {
  id: string;
  player_id: string;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
}): GameNotification {
  return {
    id: item.id,
    playerId: item.player_id,
    type: item.type,
    title: item.title,
    message: item.message,
    actionUrl: item.action_url,
    actorId: item.actor_id,
    readAt: item.read_at,
    createdAt: item.created_at,
  };
}

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
   NOTIFICATION CREATION
───────────────────────────────────────────── */

/**
 * Create a notification for a player.
 *
 * This is intentionally kept separate from the read/delete
 * notification functions so other game systems can create
 * notifications without creating another notification system.
 */
export async function createNotification(input: {
  playerId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actorId?: string | null;
}): Promise<GameNotification> {
  if (!input.playerId) {
    throw new Error("A notification recipient is required.");
  }

  if (!input.title.trim()) {
    throw new Error("A notification title is required.");
  }

  if (!input.message.trim()) {
    throw new Error("A notification message is required.");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      player_id: input.playerId,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.actionUrl ?? null,
      actor_id: input.actorId ?? null,
    })
    .select(
      `
      id,
      player_id,
      type,
      title,
      message,
      action_url,
      actor_id,
      read_at,
      created_at
      `
    )
    .single();

  if (error) {
    throw error;
  }

  return mapNotification(data);
}

/**
 * Notify a player that they received a friend request.
 */
export async function createFriendRequestNotification(
  recipientId: string,
  senderId: string
): Promise<GameNotification> {
  return createNotification({
    playerId: recipientId,
    type: "friend_request",
    title: "New Friend Request",
    message: "You have received a new friend request.",
    actionUrl: "/friends",
    actorId: senderId,
  });
}

/**
 * Notify a player that their friend request was accepted.
 */
export async function createFriendAcceptedNotification(
  senderId: string,
  recipientId: string
): Promise<GameNotification> {
  return createNotification({
    playerId: senderId,
    type: "friend_accepted",
    title: "Friend Request Accepted",
    message: "Your friend request has been accepted.",
    actionUrl: "/friends",
    actorId: recipientId,
  });
}

/**
 * Notify a player that their friend request was declined.
 */
export async function createFriendDeclinedNotification(
  senderId: string,
  recipientId: string
): Promise<GameNotification> {
  return createNotification({
    playerId: senderId,
    type: "friend_declined",
    title: "Friend Request Declined",
    message: "Your friend request was declined.",
    actionUrl: "/friends",
    actorId: recipientId,
  });
}

/* ─────────────────────────────────────────────
   NOTIFICATION QUERIES
───────────────────────────────────────────── */

/**
 * Get the current player's notifications.
 */
export async function getNotifications(
  limit = 50
): Promise<GameNotification[]> {
  const userId = await getCurrentUserId();

  const safeLimit = Math.max(
    1,
    Math.min(limit, 100)
  );

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      player_id,
      type,
      title,
      message,
      action_url,
      actor_id,
      read_at,
      created_at
      `
    )
    .eq("player_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(safeLimit);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNotification);
}

/**
 * Get unread notification count.
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const userId = await getCurrentUserId();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("player_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

/**
 * Mark one notification as read.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("player_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

/**
 * Mark every notification as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("player_id", userId)
    .is("read_at", null);

  if (error) {
    throw error;
  }
}

/**
 * Delete one notification.
 */
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("player_id", userId);

  if (error) {
    throw error;
  }
}

/* ─────────────────────────────────────────────
   REALTIME NOTIFICATIONS
───────────────────────────────────────────── */

export function subscribeToNotifications(
  onNotification: (
    notification: GameNotification
  ) => void
) {
  let currentUserId = "";

  const channel = supabase
    .channel(`notifications-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
      },
      async (payload) => {
        const item = payload.new as {
          id: string;
          player_id: string;
          type: string;
          title: string;
          message: string;
          action_url: string | null;
          actor_id: string | null;
          read_at: string | null;
          created_at: string;
        };

        if (!currentUserId) {
          try {
            currentUserId =
              await getCurrentUserId();
          } catch {
            return;
          }
        }

        if (item.player_id !== currentUserId) {
          return;
        }

        onNotification(
          mapNotification(item)
        );
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}