import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";

    let profileQuery = supabase
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
      .order("updated_at", {
        ascending: false,
      })
      .limit(500);

    if (search) {
      profileQuery = profileQuery.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const {
      data: profiles,
      error: profileError,
    } = await profileQuery;

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    const playerIds = (profiles ?? []).map(
      (player) => player.id
    );

    let gameStates: Array<{
      user_id: string;
      cash: number;
      energy: number;
      max_energy: number;
      reputation: number;
      current_job_id: string | null;
      job_experience: number;
      current_location_id: string;
      is_frozen: boolean;
      updated_at: string;
    }> = [];

    if (playerIds.length > 0) {
      const {
        data,
        error: stateError,
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
          updated_at
          `
        )
        .in("user_id", playerIds);

      if (stateError) {
        return NextResponse.json(
          {
            error: stateError.message,
          },
          {
            status: 500,
          }
        );
      }

      gameStates = data ?? [];
    }

    const stateMap = new Map(
      gameStates.map((state) => [
        state.user_id,
        state,
      ])
    );

    const players = (profiles ?? []).map(
      (profile) => {
        const state = stateMap.get(profile.id);

        const updatedAt =
          state?.updated_at ??
          profile.updated_at;

        const updatedTime =
          new Date(updatedAt).getTime();

        const recentlyActive =
          Number.isFinite(updatedTime) &&
          Date.now() - updatedTime <=
            15 * 60 * 1000;

        return {
          id: profile.id,

          username: profile.username,

          displayName:
            profile.display_name,

          avatar:
            profile.avatar ?? "🧑🏽",

          level:
            profile.level ?? 1,

          experience:
            profile.experience ?? 0,

          reputation:
            state?.reputation ??
            profile.reputation ??
            0,

          cash:
            Number(state?.cash ?? 0),

          energy:
            state?.energy ?? 0,

          maxEnergy:
            state?.max_energy ?? 100,

          currentJobId:
            state?.current_job_id ?? null,

          jobExperience:
            state?.job_experience ?? 0,

          currentLocationId:
            state?.current_location_id ??
            profile.current_location_id ??
            "garki",

          isFrozen:
            state?.is_frozen === true,

          recentlyActive,

          createdAt:
            profile.created_at,

          updatedAt,
        };
      }
    );

    return NextResponse.json({
      players,
      total: players.length,
    });
  } catch (error) {
    console.error(
      "Admin players API error:",
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
