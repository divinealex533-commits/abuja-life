import { NextResponse } from "next/server";

import { getCareer } from "@/lib/game/careers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { getPrice } from "@/lib/pricing/server";
import {
  applyPlayerDelta,
  type PlayerSnapshot,
  friendlyEconomyError,
  getRequestUser,
  getVipStatus,
} from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/**
 * GET  /api/careers → the player's progress in every advanced career.
 * POST /api/careers { careerId } → take a career as your current job.
 */
export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false, progress: {}, currentJobId: null, unlocked: [] });
  }

  const admin = createAdminSupabaseClient();

  const [{ data: rows }, { data: player }, { data: unlockRows }] = await Promise.all([
    admin
      .from("career_progress")
      .select("career_id, xp, shifts, total_earned, last_shift_at")
      .eq("user_id", user.id),
    admin
      .from("player_game_states")
      .select("current_job_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("career_unlocks")
      .select("career_id")
      .eq("user_id", user.id),
  ]);

  const progress: Record<
    string,
    { xp: number; shifts: number; totalEarned: number; lastShiftAt: string | null }
  > = {};

  for (const row of rows ?? []) {
    progress[row.career_id] = {
      xp: Number(row.xp) || 0,
      shifts: Number(row.shifts) || 0,
      totalEarned: Number(row.total_earned) || 0,
      lastShiftAt: row.last_shift_at,
    };
  }

  return NextResponse.json({
    loggedIn: true,
    progress,
    currentJobId: player?.current_job_id ?? null,
    unlocked: (unlockRows ?? []).map((row) => row.career_id),
  });
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const career = getCareer(String(body?.careerId ?? ""));

  if (!career) {
    return NextResponse.json({ error: "Unknown career." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (career.vipTier) {
    const vip = await getVipStatus(admin, user.id);

    if (!vip.active || !tierAtLeast(vip.tier, career.vipTier)) {
      return NextResponse.json(
        {
          error: `${career.name} is a ${VIP_TIERS[career.vipTier].name} career.`,
          code: "VIP_REQUIRED",
          requiredTier: career.vipTier,
        },
        { status: 403 }
      );
    }
  }

  // ---- Licence fee (set in Admin → Prices) ----
  const { data: unlock } = await admin
    .from("career_unlocks")
    .select("career_id")
    .eq("user_id", user.id)
    .eq("career_id", career.id)
    .maybeSingle();

  let player: PlayerSnapshot | null = null;

  if (!unlock) {
    const price = await getPrice(admin, `career:${career.id}`);

    if (!price || !price.active) {
      return NextResponse.json(
        { error: "This career isn't hiring right now." },
        { status: 400 }
      );
    }

    if (price.method === "naira") {
      return NextResponse.json({ checkout: true, productId: `career:${career.id}` });
    }

    // Claim the unlock first so two clicks can't charge twice.
    const { error: unlockError } = await admin.from("career_unlocks").insert({
      user_id: user.id,
      career_id: career.id,
      method: price.method,
      amount_paid: price.method === "cash" ? price.amount : 0,
    });

    if (unlockError) {
      return NextResponse.json({ error: "Please try again." }, { status: 409 });
    }

    if (price.method === "cash" && price.amount > 0) {
      try {
        player = await applyPlayerDelta(admin, user.id, { cash: -price.amount });
      } catch (error) {
        await admin
          .from("career_unlocks")
          .delete()
          .eq("user_id", user.id)
          .eq("career_id", career.id);

        const message = error instanceof Error ? error.message : "";

        return NextResponse.json(
          {
            error: message.includes("NOT_ENOUGH_CASH")
              ? `The ${career.name} licence costs ₦${price.amount.toLocaleString("en-NG")} game cash. Earn more or buy a cash bundle.`
              : friendlyEconomyError(message),
            code: message.includes("NOT_ENOUGH_CASH") ? "NOT_ENOUGH_CASH" : undefined,
          },
          { status: 400 }
        );
      }
    }
  }

  await admin.rpc("abuja_ensure_player_row", { p_user_id: user.id });

  const { error } = await admin
    .from("player_game_states")
    .update({ current_job_id: career.id })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not take this job." }, { status: 500 });
  }

  return NextResponse.json({ success: true, currentJobId: career.id, player });
}
