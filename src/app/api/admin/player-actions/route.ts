import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);

    const playerId =
      searchParams.get("playerId")?.trim() ?? "";

    const action =
      searchParams.get("action")?.trim() ?? "";

    const limitParam = Number(
      searchParams.get("limit") ?? "200"
    );

    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 200, 1),
      500
    );

    let query = supabase
      .from("admin_player_actions")
      .select(
        `
        id,
        admin_user_id,
        target_user_id,
        action,
        reason,
        amount,
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
        "target_user_id",
        playerId
      );
    }

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query;

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

    const actions = data ?? [];

    const playerIds = Array.from(
      new Set(
        actions
          .map((item) => item.target_user_id)
          .filter(Boolean)
      )
    );

    const adminIds = Array.from(
      new Set(
        actions
          .map((item) => item.admin_user_id)
          .filter(Boolean)
      )
    );

    let players: any[] = [];
    let admins: any[] = [];

    if (playerIds.length > 0) {
      const { data: playerProfiles } =
        await supabase
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

      players = playerProfiles ?? [];
    }

    if (adminIds.length > 0) {
      const { data: adminUsers } =
        await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (!adminUsers.error) {
        admins = (adminUsers.users ?? []).filter(
          (user) => adminIds.includes(user.id)
        );
      }
    }

    const playerMap = new Map(
      players.map((player) => [
        player.id,
        player,
      ])
    );

    const adminMap = new Map(
      admins.map((admin) => [
        admin.id,
        admin,
      ])
    );

    const result = actions.map((item) => {
      const player = playerMap.get(
        item.target_user_id
      );

      const admin = adminMap.get(
        item.admin_user_id
      );

      return {
        id: item.id,

        action: item.action,

        reason: item.reason,

        amount: item.amount,

        metadata: item.metadata ?? {},

        createdAt: item.created_at,

        player: {
          id: item.target_user_id,

          username:
            player?.username ?? "Unknown",

          displayName:
            player?.display_name ??
            "Unknown Player",

          avatar:
            player?.avatar ?? "🧑🏽",
        },

        admin: {
          id: item.admin_user_id,

          email:
            admin?.email ??
            "Administrator",
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
        error: "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
