import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          isFrozen: false,
        },
        {
          status: 401,
        }
      );
    }

    const { data, error } = await supabase
      .from("player_game_states")
      .select("is_frozen")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      isFrozen: data?.is_frozen === true,
    });
  } catch (error) {
    console.error(
      "Freeze status error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to check account status.",
      },
      {
        status: 500,
      }
    );
  }
}
