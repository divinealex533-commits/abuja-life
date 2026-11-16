import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { describeReward, getPerk } from "@/lib/vip/perks";
import {
  applyPlayerDelta,
  friendlyEconomyError,
  getRequestUser,
  getVipStatus,
  lagosDateKey,
} from "@/lib/vip/server";

/**
 * POST /api/vip/perks  { perkId }
 * Claim a VIP perk. Tier, daily limit and reward are all checked
 * and applied on the server.
 */
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in first." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const perk = getPerk(String(body?.perkId ?? ""));

  if (!perk) {
    return NextResponse.json({ error: "Unknown perk." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const vip = await getVipStatus(admin, user.id);

  if (!vip.active || !vip.tier || !tierAtLeast(vip.tier, perk.minTier)) {
    return NextResponse.json(
      {
        error: `${perk.name} needs ${VIP_TIERS[perk.minTier].name} or higher.`,
        code: "VIP_REQUIRED",
        requiredTier: perk.minTier,
      },
      { status: 403 }
    );
  }

  const today = lagosDateKey();
  const limit = perk.usesPerDay(vip.tier);

  // ---- Reserve one use for today (race-safe) ----
  const { data: existing } = await admin
    .from("vip_perk_claims")
    .select("uses")
    .eq("user_id", user.id)
    .eq("perk_id", perk.id)
    .eq("claim_date", today)
    .maybeSingle();

  const usedSoFar = Number(existing?.uses ?? 0);

  if (usedSoFar >= limit) {
    return NextResponse.json(
      {
        error: "You've used this perk for today. Come back tomorrow!",
        code: "LIMIT_REACHED",
      },
      { status: 429 }
    );
  }

  let reserved = false;

  if (!existing) {
    const { error } = await admin.from("vip_perk_claims").insert({
      user_id: user.id,
      perk_id: perk.id,
      claim_date: today,
      uses: 1,
    });
    reserved = !error;
  } else {
    const { data } = await admin
      .from("vip_perk_claims")
      .update({ uses: usedSoFar + 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("perk_id", perk.id)
      .eq("claim_date", today)
      .eq("uses", usedSoFar)
      .select("uses");
    reserved = Boolean(data && data.length > 0);
  }

  if (!reserved) {
    return NextResponse.json(
      { error: "Please try again.", code: "BUSY" },
      { status: 409 }
    );
  }

  // ---- Apply the reward ----
  const reward = perk.reward(vip.tier);

  try {
    const player = await applyPlayerDelta(admin, user.id, reward);

    return NextResponse.json({
      success: true,
      perkId: perk.id,
      rewardText: describeReward(reward),
      usesToday: usedSoFar + 1,
      usesLimit: limit,
      player,
    });
  } catch (error) {
    // Give the use back if the reward could not be applied.
    if (usedSoFar === 0) {
      await admin
        .from("vip_perk_claims")
        .delete()
        .eq("user_id", user.id)
        .eq("perk_id", perk.id)
        .eq("claim_date", today);
    } else {
      await admin
        .from("vip_perk_claims")
        .update({ uses: usedSoFar })
        .eq("user_id", user.id)
        .eq("perk_id", perk.id)
        .eq("claim_date", today);
    }

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: friendlyEconomyError(message) },
      { status: 400 }
    );
  }
}
