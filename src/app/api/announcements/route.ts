import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase =
      createAdminSupabaseClient();

    /*
     * Check whether announcements are globally enabled.
     */
    const {
      data: settings,
      error: settingsError,
    } = await supabase
      .from("admin_game_settings")
      .select("announcements_enabled")
      .eq("id", 1)
      .single();

    if (settingsError) {
      console.error(
        "Announcement settings lookup error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Announcement settings could not be verified.",
        },
        { status: 503 }
      );
    }

    /*
     * Announcements can remain stored in the database
     * while the Admin switch is OFF.
     *
     * We simply stop serving them publicly.
     */
    if (
      settings?.announcements_enabled !== true
    ) {
      return NextResponse.json(
        {
          announcements: [],
          announcementsEnabled: false,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const {
      data: announcements,
      error,
    } = await supabase
      .from("admin_announcements")
      .select(
        "id, title, message, priority, created_at"
      )
      .eq("is_active", true)
      .or(
        "expires_at.is.null,expires_at.gt." +
          new Date().toISOString()
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (error) {
      console.error(
        "Public announcements GET error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load announcements.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        announcements:
          announcements ?? [],
        announcementsEnabled: true,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Public announcements error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load announcements.",
      },
      { status: 500 }
    );
  }
}
