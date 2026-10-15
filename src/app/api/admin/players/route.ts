import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

function safeNumber(
  value: unknown,
  fallback = 0
) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function safeDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time)
    ? value
    : null;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const supabase =
      await createServerSupabaseClient();

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() ?? "";

    /*
     * ---------------------------------------------------------
     * TOTAL PLAYER COUNT
     * ---------------------------------------------------------
     *
     * This count is deliberately separate from the search
     * query so the Admin UI can always know the real number
     * of registered player profiles.
     */
    const {
      count: totalPlayerCount,
      error: totalCountError,
    } = await supabase
      .from("player_profiles")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (totalCountError) {
      console.error(
        "Admin player count error:",
        totalCountError
      );

      return NextResponse.json(
        {
          error:
            "Unable to determine total player count.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ---------------------------------------------------------
     * PLAYER PROFILES
     * ---------------------------------------------------------
     */
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
      /*
       * Search username and display name.
       */
      profileQuery = profileQuery.or(
        `username.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const {
      data: profiles,
      error: profileError,
    } = await profileQuery;

    if (profileError) {
      console.error(
        "Admin player profile error:",
        profileError
      );

      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    const playerIds = (
      profiles ?? []
    ).map((player) => player.id);

    /*
     * ---------------------------------------------------------
     * GAME STATES
     * ---------------------------------------------------------
     */
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
        console.error(
          "Admin player game-state error:",
          stateError
        );

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

    /*
     * ---------------------------------------------------------
     * BUILD ADMIN PLAYER RECORDS
     * ---------------------------------------------------------
     */
    const now = Date.now();

    const players = (profiles ?? []).map(
      (profile) => {
        const state =
          stateMap.get(profile.id);

        /*
         * Use the newest timestamp between the
         * profile and persistent game state.
         */
        const profileTime =
          safeDate(profile.updated_at);

        const stateTime =
          safeDate(state?.updated_at);

        const profileTimestamp =
          profileTime
            ? new Date(profileTime).getTime()
            : 0;

        const stateTimestamp =
          stateTime
            ? new Date(stateTime).getTime()
            : 0;

        const newestTimestamp =
          Math.max(
            profileTimestamp,
            stateTimestamp
          );

        const updatedAt =
          newestTimestamp > 0
            ? new Date(
                newestTimestamp
              ).toISOString()
            : new Date().toISOString();

        const recentlyActive =
          newestTimestamp > 0 &&
          now - newestTimestamp <=
            15 * 60 * 1000;

        return {
          id: profile.id,

          username:
            profile.username ?? "unknown",

          displayName:
            profile.display_name ??
            "Unnamed Player",

          avatar:
            profile.avatar ?? "🧑🏾",

          level:
            safeNumber(
              profile.level,
              1
            ),

          experience:
            safeNumber(
              profile.experience,
              0
            ),

          reputation:
            safeNumber(
              state?.reputation ??
                profile.reputation,
              0
            ),

          cash:
            safeNumber(
              state?.cash,
              0
            ),

          energy:
            safeNumber(
              state?.energy,
              0
            ),

          maxEnergy:
            Math.max(
              1,
              safeNumber(
                state?.max_energy,
                100
              )
            ),

          currentJobId:
            state?.current_job_id ??
            null,

          jobExperience:
            safeNumber(
              state?.job_experience,
              0
            ),

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

    /*
     * ---------------------------------------------------------
     * RESPONSE
     * ---------------------------------------------------------
     *
     * `total` = all player profiles.
     *
     * `resultCount` = players returned by the current
     * search/filter.
     */
    return NextResponse.json(
      {
        players,

        total:
          totalPlayerCount ?? 0,

        resultCount:
          players.length,

        search:
          search || null,

        generatedAt:
          new Date().toISOString(),
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
      "Admin players API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
