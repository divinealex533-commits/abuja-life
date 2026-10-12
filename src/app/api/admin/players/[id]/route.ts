import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }

    const supabase =
      await createServerSupabaseClient();

    const { data: profile, error: profileError } =
      await supabase
        .from("player_profiles")
        .select(
          `
          id,
          username,
          display_name,
          avatar,
          current_location_id,
          reputation,
          level,
          experience,
          created_at,
          updated_at
        `
        )
        .eq("id", id)
        .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Player not found." },
        { status: 404 }
      );
    }

    const {
      data: gameState,
      error: gameStateError,
    } = await supabase
      .from("player_game_states")
      .select(
        `
        user_id,
        cash,
        energy,
        max_energy,
        reputation,
        current_job_id,
        job_experience,
        current_location_id,
        is_frozen,
        created_at,
        updated_at
        `
      )
      .eq("user_id", id)
      .maybeSingle();

    if (gameStateError) {
      return NextResponse.json(
        { error: gameStateError.message },
        { status: 500 }
      );
    }

    const player = {
      id: profile.id,
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar,

      level: Number(profile.level ?? 1),
      experience: Number(
        profile.experience ?? 0
      ),

      reputation: Number(
        profile.reputation ??
          gameState?.reputation ??
          0
      ),

      cash: Number(
        gameState?.cash ?? 0
      ),

      energy: Number(
        gameState?.energy ?? 0
      ),

      maxEnergy: Number(
        gameState?.max_energy ?? 100
      ),

      currentJobId:
        gameState?.current_job_id ?? null,

      jobExperience: Number(
        gameState?.job_experience ?? 0
      ),

      currentLocationId:
        gameState?.current_location_id ??
        profile.current_location_id ??
        "garki",

      isFrozen:
        gameState?.is_frozen === true,

      createdAt:
        profile.created_at,

      updatedAt:
        gameState?.updated_at ??
        profile.updated_at,
    };

    return NextResponse.json({
      player,
    });
  } catch (error) {
    console.error(
      "Admin player detail error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Admin access required.",
      },
      { status: 403 }
    );
  }
}
