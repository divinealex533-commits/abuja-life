import { NextResponse } from "next/server";

import { getCareer } from "@/lib/game/careers";
import {
  computeShift,
  SHIFT_COOLDOWN_SECONDS,
  validateDecisions,
  rankIndexForXp,
} from "@/lib/game/careers/engine";
import type { ShiftDecision } from "@/lib/game/careers/types";
import { payReferralIfDue } from "@/lib/referrals/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import {
  applyPlayerDelta,
  friendlyEconomyError,
  getRequestUser,
  getVipStatus,
  weekendKeyFor,
} from "@/lib/vip/server";

/**
 * POST /api/careers/shift { careerId, decisions: [{ scenarioId, choiceId }] }
 *
 * The browser sends only the player's choices. Pay, risk rolls,
 * city events, VIP bonus, energy and promotions are all decided
 * here on the server.
 */
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

  const decisions: ShiftDecision[] = Array.isArray(body?.decisions)
    ? body.decisions.map((d: { scenarioId?: unknown; choiceId?: unknown }) => ({
        scenarioId: String(d?.scenarioId ?? ""),
        choiceId: String(d?.choiceId ?? ""),
      }))
    : [];

  const admin = createAdminSupabaseClient();

  // ---- Must currently work this job ----
  const { data: player } = await admin
    .from("player_game_states")
    .select("current_job_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (player?.current_job_id !== career.id) {
    return NextResponse.json(
      { error: `You need to take the ${career.name} job first.`, code: "NOT_EMPLOYED" },
      { status: 403 }
    );
  }

  // ---- VIP careers ----
  const vip = await getVipStatus(admin, user.id);

  if (career.vipTier && (!vip.active || !tierAtLeast(vip.tier, career.vipTier))) {
    return NextResponse.json(
      {
        error: `Your VIP has expired. ${career.name} needs ${VIP_TIERS[career.vipTier].name}.`,
        code: "VIP_REQUIRED",
        requiredTier: career.vipTier,
      },
      { status: 403 }
    );
  }

  // ---- Progress + cooldown ----
  const { data: progressRow } = await admin
    .from("career_progress")
    .select("xp, shifts, total_earned, last_shift_at")
    .eq("user_id", user.id)
    .eq("career_id", career.id)
    .maybeSingle();

  const careerXp = Number(progressRow?.xp ?? 0);
  const rankIndex = rankIndexForXp(career, careerXp);

  const invalid = validateDecisions(career, decisions, rankIndex);

  if (invalid) {
    return NextResponse.json(
      { error: "Those shift choices aren't valid.", code: invalid },
      { status: 400 }
    );
  }

  const previousShiftAt = progressRow?.last_shift_at ?? null;

  if (previousShiftAt) {
    const secondsSince = (Date.now() - new Date(previousShiftAt).getTime()) / 1000;

    if (secondsSince < SHIFT_COOLDOWN_SECONDS) {
      return NextResponse.json(
        {
          error: `Take a short break — next shift in ${Math.ceil(
            SHIFT_COOLDOWN_SECONDS - secondsSince
          )}s.`,
          code: "COOLDOWN",
        },
        { status: 429 }
      );
    }
  }

  // Claim this shift slot (blocks two shifts submitted at once).
  const nowIso = new Date().toISOString();
  let claimed = false;

  if (!progressRow) {
    const { error } = await admin.from("career_progress").insert({
      user_id: user.id,
      career_id: career.id,
      xp: 0,
      shifts: 0,
      total_earned: 0,
      last_shift_at: nowIso,
    });
    claimed = !error;
  } else {
    let query = admin
      .from("career_progress")
      .update({ last_shift_at: nowIso })
      .eq("user_id", user.id)
      .eq("career_id", career.id);

    query = previousShiftAt
      ? query.eq("last_shift_at", previousShiftAt)
      : query.is("last_shift_at", null);

    const { data } = await query.select("career_id");
    claimed = Boolean(data && data.length > 0);
  }

  if (!claimed) {
    return NextResponse.json(
      { error: "A shift is already being processed.", code: "BUSY" },
      { status: 409 }
    );
  }

  // ---- Work out the shift ----
  const vipPayBonus = vip.active && vip.info ? vip.info.jobPayBonus : 0;
  const result = computeShift(career, decisions, careerXp, vipPayBonus);

  try {
    const snapshot = await applyPlayerDelta(admin, user.id, {
      cash: result.totalPay,
      energy: -career.energyCost,
      reputation: result.reputation,
      experience: result.xp,
    });

    await admin
      .from("career_progress")
      .update({
        xp: careerXp + result.xp,
        shifts: Number(progressRow?.shifts ?? 0) + 1,
        total_earned: Number(progressRow?.total_earned ?? 0) + result.totalPay,
      })
      .eq("user_id", user.id)
      .eq("career_id", career.id);

    // Referral reward: the first shift of an invited player pays both.
    const referralBonus = await payReferralIfDue(admin, user.id);

    // Weekend competition: XP earned on Sat/Sun counts as points.
    // (VIP pay bonus does not change XP, so prizes stay fair.)
    const weekendKey = weekendKeyFor();
    let weekendPoints = 0;

    if (weekendKey && result.xp > 0) {
      const { error: pointsError } = await admin.rpc("abuja_add_weekend_points", {
        p_user_id: user.id,
        p_weekend_key: weekendKey,
        p_points: result.xp,
      });
      if (!pointsError) weekendPoints = result.xp;
    }

    return NextResponse.json({
      success: true,
      weekendPoints,
      referralBonus,
      result,
      careerXp: careerXp + result.xp,
      rankTitle: career.ranks[result.rankAfter].title,
      player: referralBonus
        ? { ...snapshot, cash: snapshot.cash + referralBonus }
        : snapshot,
    });
  } catch (error) {
    // Shift didn't happen (e.g. not enough energy): release the slot.
    await admin
      .from("career_progress")
      .update({ last_shift_at: previousShiftAt })
      .eq("user_id", user.id)
      .eq("career_id", career.id);

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: friendlyEconomyError(message) },
      { status: 400 }
    );
  }
}
