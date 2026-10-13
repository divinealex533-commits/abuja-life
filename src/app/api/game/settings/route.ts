import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_game_settings")
      .select(
        [
          "game_name",
          "maintenance_mode",
          "registrations_enabled",
          "multiplayer_enabled",
          "economy_enabled",
          "announcements_enabled",
          "tasks_enabled",
          "payments_enabled",
        ].join(", ")
      )
      .eq("id", 1)
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Could not load game settings.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        settings: data,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: "Could not load game settings.",
      },
      { status: 500 }
    );
  }
}
