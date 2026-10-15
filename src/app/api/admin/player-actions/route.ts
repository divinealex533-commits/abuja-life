import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_ACTIONS = new Set([
  "freeze",
  "unfreeze",
  "cash",
  "energy",
  "reputation",
  "experience",
  "location",
  "reset",
]);

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();

    const { searchParams } = new URL(request.url);

    const playerId =
      searchParams.get("playerId")?.trim() ?? "";

    const action =
      searchParams.get("action")?.trim() ?? "";

    const requestedLimit = safeNumber(
      searchParams.get("limit") ?? "200",
      200
    );

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      500
    );

    /*
     * Validate player UUID before sending it to Supabase.
     * This prevents malformed filter requests from producing
     * unnecessary database errors.
     */
    if (playerId) {
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuidPattern.test(playerId)) {
        return NextResponse.json(
          {
            error: "Invalid player UUID.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (action && !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        {
          error: "Invalid player action filter.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Fetch the filtered audit rows.
     */
    let query = supabase
      .from("admin_player_actions")
      .select(
        `
          id,
          player_id,
          admin_id,
          action,
          reason,
          amount,
          before_value,
          after_value,
          metadata,
          created_at
        `,
        {
          count: "exact",
        }
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(limit);

    if (playerId) {
      query = query.eq(
        "player_id",
        playerId
      );
    }

    if (action) {
      query = query.eq(
        "action",
        action
      );
    }

    const {
      data: actions,
      error,
      count,
    } = await query;

    if (error) {
      console.error(
        "Admin player actions database error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to load player action history.",
        },
        {
          status: 500,
        }
      );
    }

    const rows = actions ?? [];

    /*
     * Collect player IDs and admin IDs so we can resolve
     * their identities in batches instead of querying once
     * per audit row.
     */
    const playerIds = Array.from(
      new Set(
        rows
          .map((item) => item.player_id)
          .filter(Boolean)
      )
    );

    const adminIds = Array.from(
      new Set(
        rows
          .map((item) => item.admin_id)
          .filter(Boolean)
      )
    );

    /*
     * Resolve player profiles.
     */
    let players: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar: string;
    }> = [];

    if (playerIds.length > 0) {
      const {
        data: playerProfiles,
        error: playerError,
      } = await adminSupabase
        .from("player_profiles")
        .select(
          `
            id,
            username,
            display_name,
            avatar
          `
        )
        .in("id", playerIds);

      if (playerError) {
        console.error(
          "Admin player profile lookup error:",
          playerError
        );

        return NextResponse.json(
          {
            error:
              "Unable to resolve player information.",
          },
          {
            status: 500,
          }
        );
      }

      players = playerProfiles ?? [];
    }

    const playerMap = new Map(
      players.map((player) => [
        player.id,
        player,
      ])
    );

    /*
     * Resolve admin emails using the service-role client.
     * Auth users are not exposed through normal table queries.
     */
    const adminEmailMap = new Map<
      string,
      string
    >();

    for (const adminId of adminIds) {
      try {
        const {
          data: authUser,
          error: authError,
        } =
          await adminSupabase.auth.admin.getUserById(
            adminId
          );

        if (
          !authError &&
          authUser?.user?.email
        ) {
          adminEmailMap.set(
            adminId,
            authUser.user.email
          );
        }
      } catch (error) {
        console.error(
          "Admin identity lookup error:",
          error
        );
      }
    }

    /*
     * Build the API response.
     */
    const result = rows.map((item) => {
      const player = playerMap.get(
        item.player_id
      );

      const adminId =
        item.admin_id ?? null;

      const adminEmail = adminId
        ? adminEmailMap.get(adminId) ??
          `Administrator • ${adminId.slice(
            0,
            8
          )}`
        : "Administrator";

      return {
        id: item.id,

        action: item.action,

        reason:
          item.reason ?? null,

        amount:
          item.amount === null
            ? null
            : safeNumber(
                item.amount,
                0
              ),

        beforeValue:
          item.before_value &&
          typeof item.before_value ===
            "object"
            ? item.before_value
            : {},

        afterValue:
          item.after_value &&
          typeof item.after_value ===
            "object"
            ? item.after_value
            : {},

        metadata:
          item.metadata &&
          typeof item.metadata ===
            "object"
            ? item.metadata
            : {},

        createdAt:
          item.created_at,

        player: {
          id: item.player_id,

          username:
            player?.username ??
            "Unknown",

          displayName:
            player?.display_name ??
            "Unknown Player",

          avatar:
            player?.avatar ??
            "🧑🏽",
        },

        admin: {
          id: adminId,
          email: adminEmail,
        },
      };
    });

    return NextResponse.json(
      {
        actions: result,

        /*
         * `total` represents the total number of matching
         * records, not merely the number returned by the
         * current page.
         */
        total:
          typeof count === "number"
            ? count
            : result.length,

        resultCount: result.length,

        limit,

        filters: {
          playerId:
            playerId || null,

          action:
            action || null,
        },

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
      "Admin player action history error:",
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
