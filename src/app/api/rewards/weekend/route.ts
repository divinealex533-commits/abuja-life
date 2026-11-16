import { NextResponse } from "next/server";

import {
  getLeaderboard,
  getMyStanding,
  getPrizeSettings,
} from "@/lib/rewards/weekendCompetition";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  applyPlayerDelta,
  friendlyEconomyError,
  getRequestUser,
  getVipStatus,
  lagosDateKey,
  lagosWeekday,
  lastFinishedWeekendKey,
  weekendKeyFor,
} from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/*
 * Weekend rewards — in-game cash every Saturday and Sunday (Abuja time).
 * VIP multiplies the reward. Claiming both days gives a bonus on Sunday.
 * Amounts are set by the admin in weekend_reward_settings.
 */

type Settings = {
  enabled: boolean;
  saturday_amount: number;
  sunday_amount: number;
  both_days_bonus: number;
};

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  saturday_amount: 5000,
  sunday_amount: 7500,
  both_days_bonus: 5000,
};

async function loadState(userId: string) {
  const admin = createAdminSupabaseClient();
  const now = new Date();
  const weekday = lagosWeekday(now);
  const isWeekend = weekday === 6 || weekday === 0;
  const today = lagosDateKey(now);
  const saturdayKey =
    weekday === 0 ? lagosDateKey(new Date(now.getTime() - 86_400_000)) : today;

  const [{ data: settingsRow }, vip, { data: claims }] = await Promise.all([
    admin
      .from("weekend_reward_settings")
      .select("enabled, saturday_amount, sunday_amount, both_days_bonus")
      .eq("id", 1)
      .maybeSingle(),
    getVipStatus(admin, userId),
    admin
      .from("weekend_reward_claims")
      .select("claim_date, amount")
      .eq("user_id", userId)
      .in("claim_date", [today, saturdayKey]),
  ]);

  const settings: Settings = settingsRow ?? DEFAULT_SETTINGS;
  const multiplier = vip.active && vip.info ? vip.info.weekendMultiplier : 1;

  const claimedToday = (claims ?? []).some((c) => c.claim_date === today);
  const claimedSaturday =
    weekday === 0 && (claims ?? []).some((c) => c.claim_date === saturdayKey);

  const base =
    weekday === 6
      ? settings.saturday_amount
      : weekday === 0
        ? settings.sunday_amount
        : 0;

  const bonus = claimedSaturday ? settings.both_days_bonus : 0;
  const amount = Math.round((base + bonus) * multiplier);

  // Days until Saturday (for the countdown when it isn't the weekend).
  const daysUntilSaturday = isWeekend ? 0 : 6 - weekday;

  return {
    admin,
    today,
    weekday,
    isWeekend,
    enabled: settings.enabled,
    claimedToday,
    claimedSaturday,
    base,
    bonus,
    multiplier,
    amount,
    vipTier: vip.active ? vip.tier : null,
    daysUntilSaturday,
    settings,
  };
}

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }

  try {
    const { admin, ...state } = await loadState(user.id);

    // ---- Weekend competition (real-money prizes) ----
    const liveKey = weekendKeyFor();
    const competitionKey = liveKey ?? lastFinishedWeekendKey();

    const [prizeSettings, leaderboard, standing, { data: wins }] = await Promise.all([
      getPrizeSettings(admin),
      getLeaderboard(admin, competitionKey, 10),
      getMyStanding(admin, competitionKey, user.id),
      admin
        .from("weekend_winners")
        .select("weekend_key, place, prize_naira, status, account_number")
        .eq("user_id", user.id)
        .in("status", ["awaiting_details", "ready_to_pay", "paid"])
        .order("weekend_key", { ascending: false })
        .limit(5),
    ]);

    return NextResponse.json({
      loggedIn: true,
      ...state,
      competition: {
        ...prizeSettings,
        weekendKey: competitionKey,
        isLive: Boolean(liveKey),
        leaderboard: leaderboard.map(({ userId, ...row }) => ({
          ...row,
          isMe: userId === user.id,
        })),
        myPoints: standing.points,
        myRank: standing.rank,
        myWins: (wins ?? []).map((w) => ({
          weekendKey: w.weekend_key,
          place: w.place,
          prizeNaira: Number(w.prize_naira),
          status: w.status,
          accountLast4: w.account_number ? String(w.account_number).slice(-4) : null,
        })),
      },
    });
  } catch (error) {
    console.error("Weekend reward status error:", error);
    return NextResponse.json(
      { error: "Weekend rewards are unavailable right now." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const state = await loadState(user.id);

  if (!state.enabled) {
    return NextResponse.json(
      { error: "Weekend rewards are paused by the admin." },
      { status: 403 }
    );
  }

  if (!state.isWeekend) {
    return NextResponse.json(
      { error: "Weekend rewards open on Saturday and Sunday." },
      { status: 403 }
    );
  }

  if (state.claimedToday || state.amount <= 0) {
    return NextResponse.json(
      { error: "You've already claimed today's weekend reward." },
      { status: 409 }
    );
  }

  // The primary key (user_id, claim_date) blocks double claims.
  const { error: claimError } = await state.admin
    .from("weekend_reward_claims")
    .insert({
      user_id: user.id,
      claim_date: state.today,
      amount: state.amount,
      multiplier: state.multiplier,
      vip_tier: state.vipTier,
    });

  if (claimError) {
    return NextResponse.json(
      { error: "You've already claimed today's weekend reward." },
      { status: 409 }
    );
  }

  try {
    const player = await applyPlayerDelta(state.admin, user.id, {
      cash: state.amount,
    });

    return NextResponse.json({
      success: true,
      amount: state.amount,
      multiplier: state.multiplier,
      bonus: state.bonus,
      player,
    });
  } catch (error) {
    await state.admin
      .from("weekend_reward_claims")
      .delete()
      .eq("user_id", user.id)
      .eq("claim_date", state.today);

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      { error: friendlyEconomyError(message) },
      { status: 400 }
    );
  }
}
