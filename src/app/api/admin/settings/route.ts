import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const BOOLEAN_FIELDS = [
  "maintenance_mode",
  "registrations_enabled",
  "multiplayer_enabled",
  "economy_enabled",
  "announcements_enabled",
  "tasks_enabled",
  "payments_enabled",
] as const;

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_game_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid settings payload." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    for (const field of BOOLEAN_FIELDS) {
      if (field in body) {
        if (typeof body[field] !== "boolean") {
          return NextResponse.json(
            {
              error: `${field} must be true or false.`,
            },
            { status: 400 }
          );
        }

        updates[field] = body[field];
      }
    }

    if ("game_name" in body) {
      if (
        typeof body.game_name !== "string" ||
        !body.game_name.trim()
      ) {
        return NextResponse.json(
          { error: "Game name is required." },
          { status: 400 }
        );
      }

      updates.game_name = body.game_name.trim().slice(0, 100);
    }

    if ("default_player_cash" in body) {
      const value = Number(body.default_player_cash);

      if (!Number.isFinite(value) || value < 0) {
        return NextResponse.json(
          {
            error:
              "Default player cash must be zero or greater.",
          },
          { status: 400 }
        );
      }

      updates.default_player_cash =
        Math.round(value * 100) / 100;
    }

    if ("max_player_energy" in body) {
      const value = Number(body.max_player_energy);

      if (
        !Number.isInteger(value) ||
        value <= 0 ||
        value > 10000
      ) {
        return NextResponse.json(
          {
            error:
              "Maximum player energy must be a positive whole number.",
          },
          { status: 400 }
        );
      }

      updates.max_player_energy = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No settings were supplied." },
        { status: 400 }
      );
    }

    updates.updated_by = admin.id;

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_game_settings")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }
}
