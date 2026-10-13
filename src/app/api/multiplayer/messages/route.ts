import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authSupabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const adminSupabase =
      createAdminSupabaseClient();

    const { data: settings, error: settingsError } =
      await adminSupabase
        .from("admin_game_settings")
        .select("multiplayer_enabled")
        .eq("id", 1)
        .single();

    if (settingsError) {
      console.error(
        "Multiplayer settings lookup error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Multiplayer settings could not be verified.",
        },
        { status: 503 }
      );
    }

    if (settings?.multiplayer_enabled !== true) {
      return NextResponse.json(
        {
          error:
            "Multiplayer is currently disabled by Abuja Life administration.",
          code: "MULTIPLAYER_DISABLED",
        },
        { status: 503 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const recipientId =
      typeof body?.recipientId === "string"
        ? body.recipientId.trim()
        : "";

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!recipientId) {
      return NextResponse.json(
        {
          error: "Recipient is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error: "Message cannot be empty.",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          error:
            "Message cannot exceed 2000 characters.",
        },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        {
          error:
            "You cannot send a private message to yourself.",
        },
        { status: 400 }
      );
    }

    const { data, error } =
      await adminSupabase
        .from("private_messages")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          message,
        })
        .select(
          "id, sender_id, recipient_id, message, created_at"
        )
        .single();

    if (error) {
      console.error(
        "Private message insert error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to send message.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: {
        id: data.id,
        senderId: data.sender_id,
        recipientId: data.recipient_id,
        message: data.message,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error(
      "Multiplayer message error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to send message.",
      },
      { status: 500 }
    );
  }
}
