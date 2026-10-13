"use client";

import { createClient } from "@/lib/supabase/client";

export interface PrivateMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  createdAt: string;
}

const supabase = createClient();

export async function getCurrentUserId(): Promise<string> {
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

export async function getPrivateMessages(
  otherPlayerId: string
): Promise<PrivateMessage[]> {
  const currentUserId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("private_messages")
    .select(
      "id, sender_id, recipient_id, message, created_at"
    )
    .or(
      `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherPlayerId}),and(sender_id.eq.${otherPlayerId},recipient_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    senderId: item.sender_id,
    recipientId: item.recipient_id,
    message: item.message,
    createdAt: item.created_at,
  }));
}

export async function sendPrivateMessage(
  recipientId: string,
  message: string
): Promise<PrivateMessage> {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  const response = await fetch(
    "/api/multiplayer/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientId,
        message: cleanMessage,
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ||
        "Unable to send message."
    );
  }

  if (!data?.message) {
    throw new Error(
      "Invalid message response."
    );
  }

  return data.message;
}

export function subscribeToPrivateMessages(
  otherPlayerId: string,
  onMessage: (incomingMessage: PrivateMessage) => void
) {
  let currentUserId = "";

  const channel = supabase
    .channel(`private-chat-${otherPlayerId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "private_messages",
      },
      async (payload) => {
        const newMessage = payload.new as {
          id: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          created_at: string;
        };

        if (!currentUserId) {
          try {
            currentUserId = await getCurrentUserId();
          } catch {
            return;
          }
        }

        const isConversationMessage =
          (newMessage.sender_id === currentUserId &&
            newMessage.recipient_id === otherPlayerId) ||
          (newMessage.sender_id === otherPlayerId &&
            newMessage.recipient_id === currentUserId);

        if (!isConversationMessage) {
          return;
        }

        onMessage({
          id: newMessage.id,
          senderId: newMessage.sender_id,
          recipientId: newMessage.recipient_id,
          message: newMessage.message,
          createdAt: newMessage.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
