import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET() {
  try {
    await requireAdmin();

    const supabase =
      await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("player_profiles")
      .select(
        "id, username, display_name, avatar, current_location_id, level, reputation"
      )
      .order("display_name", {
        ascending: true,
      })
      .limit(500);

    if (error) {
      console.error(
        "Admin chat players error:",
        error
      );

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
      players: data ?? [],
    });
  } catch (error) {
    console.error(
      "Admin chat player access error:",
      error
    );

    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
