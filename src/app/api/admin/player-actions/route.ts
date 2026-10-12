import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const supabase =
      await createServerSupabaseClient();

    const { searchParams } =
      new URL(request.url);

    const playerId =
      searchParams.get("playerId")?.trim() ?? "";

    const action =
      searchParams.get("action")?.trim() ?? "";

    const requestedLimit = Number(
      searchParams.get("limit") ?? "200"
    );

    const limit = Math.min(
      Math.max(
        Number.isFinite(requestedLimit)
          ? Math.floor(requestedLimit)
          : 200,
        1
      ),
      500
    );

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
        `
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
    } = await query;

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

    const rows = actions ?? [];

    const playerIds = Array.from(
      new Set(
        rows
          .map((item) => item.player_id)
          .filter(Boolean)
      )
    );

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
      } = await supabase
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
        return NextResponse.json(
          {
            error:
              playerError.message,
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

    const result = rows.map((item) => {
      const player = playerMap.get(
        item.player_id
      );

      const adminId =
        item.admin_id ?? null;

      return {
        id: item.id,

        action: item.action,

        reason: item.reason,

        amount:
          item.amount === null
            ? null
            : Number(item.amount),

        beforeValue:
          item.before_value ?? {},

        afterValue:
          item.after_value ?? {},

        metadata:
          item.metadata ?? {},

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

          email: adminId
            ? `Administrator • ${adminId.slice(
                0,
                8
              )}`
            : "Administrator",
        },
      };
    });

    return NextResponse.json({
      actions: result,
      total: result.length,
    });
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
