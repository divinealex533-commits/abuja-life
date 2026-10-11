"use client";

import { createClient } from "@/lib/supabase/client";

export interface VoiceNote {
  id: string;
  senderId: string;
  recipientId: string;
  storagePath: string;
  durationSeconds: number;
  createdAt: string;
}

const supabase = createClient();

export async function sendVoiceNote(
  recipientId: string,
  audioBlob: Blob,
  durationSeconds: number
): Promise<VoiceNote> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to send a voice note.");
  }

  const extension = audioBlob.type.includes("mp4")
    ? "m4a"
    : audioBlob.type.includes("ogg")
      ? "ogg"
      : "webm";

  const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("voice-notes")
    .upload(storagePath, audioBlob, {
      contentType: audioBlob.type || "audio/webm",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("private_voice_notes")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      storage_path: storagePath,
      duration_seconds: Math.max(1, Math.round(durationSeconds)),
    })
    .select(
      "id, sender_id, recipient_id, storage_path, duration_seconds, created_at"
    )
    .single();

  if (error) {
    await supabase.storage
      .from("voice-notes")
      .remove([storagePath]);

    throw error;
  }

  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    storagePath: data.storage_path,
    durationSeconds: data.duration_seconds,
    createdAt: data.created_at,
  };
}

export async function getPrivateVoiceNotes(
  otherPlayerId: string
): Promise<VoiceNote[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in to view voice notes.");
  }

  const { data, error } = await supabase
    .from("private_voice_notes")
    .select(
      "id, sender_id, recipient_id, storage_path, duration_seconds, created_at"
    )
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherPlayerId}),and(sender_id.eq.${otherPlayerId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    senderId: item.sender_id,
    recipientId: item.recipient_id,
    storagePath: item.storage_path,
    durationSeconds: item.duration_seconds,
    createdAt: item.created_at,
  }));
}

export async function getVoiceNoteUrl(
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("voice-notes")
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}