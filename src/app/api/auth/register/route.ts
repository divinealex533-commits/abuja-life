import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    /*
     * Check the global registration switch using the
     * server-only service-role client.
     */
    const adminSupabase =
      createAdminSupabaseClient();

    const {
      data: settings,
      error: settingsError,
    } = await adminSupabase
      .from("admin_game_settings")
      .select("registrations_enabled")
      .eq("id", 1)
      .single();

    if (settingsError) {
      console.error(
        "Registration settings lookup error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Registration settings could not be verified.",
        },
        { status: 503 }
      );
    }

    /*
     * Admin Settings → Registrations OFF
     */
    if (settings?.registrations_enabled !== true) {
      return NextResponse.json(
        {
          error:
            "New player registrations are currently disabled by Abuja Life administration.",
          code: "REGISTRATIONS_DISABLED",
        },
        { status: 503 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error:
            "Invalid registration request.",
        },
        { status: 400 }
      );
    }

    const email = cleanString(body.email);
    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const displayName =
      cleanString(
        body.displayName ??
          body.display_name ??
          body.username
      );

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (displayName.length > 50) {
      return NextResponse.json(
        {
          error:
            "Display name cannot exceed 50 characters.",
        },
        { status: 400 }
      );
    }

    /*
     * Use the normal Supabase Auth client for account
     * creation. The service-role client is never used
     * to create a password-bearing user.
     */
    const supabase =
      await createServerSupabaseClient();

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name:
            displayName || null,
        },
      },
    });

    if (error) {
      console.error(
        "Supabase registration error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          error:
            "Registration could not be completed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: data.session
          ? {
              access_token:
                data.session.access_token,
              refresh_token:
                data.session.refresh_token,
              expires_at:
                data.session.expires_at,
            }
          : null,
        requiresEmailConfirmation:
          !data.session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration endpoint error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to complete registration.",
      },
      { status: 500 }
    );
  }
}
