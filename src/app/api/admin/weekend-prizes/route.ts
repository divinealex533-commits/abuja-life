import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { getLeaderboard, getPrizeSettings } from "@/lib/rewards/weekendCompetition";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  isWeekendKey,
  lastFinishedWeekendKey,
  weekendHasEnded,
  weekendKeyFor,
} from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const WINNER_SELECT =
  "weekend_key, user_id, place, points, prize_naira, status, bank_name, account_number, account_name, details_submitted_at, paid_at, paid_reference, notes";

/**
 * GET   /api/admin/weekend-prizes?weekend=YYYY-MM-DD
 * POST  { action: "finalize", weekendKey }
 * PATCH { action: "mark_paid" | "cancel", weekendKey, place, reference? }
 *       { action: "settings", prizesEnabled, prizeAmounts: number[] }
 */
export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const url = new URL(request.url);
  const requested = url.searchParams.get("weekend") ?? "";
  const weekendKey = isWeekendKey(requested) ? requested : lastFinishedWeekendKey();

  const [settings, leaderboard, winners, recent] = await Promise.all([
    getPrizeSettings(admin),
    getLeaderboard(admin, weekendKey, 50),
    admin.from("weekend_winners").select(WINNER_SELECT).eq("weekend_key", weekendKey).order("place"),
    admin
      .from("weekend_winners")
      .select("weekend_key, prize_naira, status")
      .order("weekend_key", { ascending: false })
      .limit(200),
  ]);

  const owed = (recent.data ?? [])
    .filter((w) => w.status === "awaiting_details" || w.status === "ready_to_pay")
    .reduce((t, w) => t + Number(w.prize_naira || 0), 0);

  const paidTotal = (recent.data ?? [])
    .filter((w) => w.status === "paid")
    .reduce((t, w) => t + Number(w.prize_naira || 0), 0);

  return NextResponse.json({
    weekendKey,
    liveWeekendKey: weekendKeyFor(),
    hasEnded: weekendHasEnded(weekendKey),
    settings,
    leaderboard,
    winners: winners.data ?? [],
    owed,
    paidTotal,
    recentWeekends: [...new Set((recent.data ?? []).map((w) => w.weekend_key))].slice(0, 12),
  });
}

export async function POST(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const weekendKey = String(body?.weekendKey ?? "");

  if (body?.action !== "finalize" || !isWeekendKey(weekendKey)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!weekendHasEnded(weekendKey)) {
    return NextResponse.json(
      { error: "This weekend isn't over yet. Finalize it on Monday." },
      { status: 400 }
    );
  }

  const admin = createAdminSupabaseClient();

  const { count } = await admin
    .from("weekend_winners")
    .select("place", { count: "exact", head: true })
    .eq("weekend_key", weekendKey);

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Winners for this weekend were already chosen." }, { status: 409 });
  }

  const { prizeAmounts } = await getPrizeSettings(admin);
  const top = await getLeaderboard(admin, weekendKey, prizeAmounts.length);

  if (top.length === 0) {
    return NextResponse.json({ error: "Nobody scored points that weekend." }, { status: 400 });
  }

  const { error } = await admin.from("weekend_winners").insert(
    top.map((row, index) => ({
      weekend_key: weekendKey,
      user_id: row.userId,
      place: index + 1,
      points: row.points,
      prize_naira: prizeAmounts[index],
      status: "awaiting_details",
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("Weekend finalized", { by: adminUser.id, weekendKey, winners: top.length });
  return NextResponse.json({ success: true, winners: top.length });
}

export async function PATCH(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.action === "settings") {
    const amounts = Array.isArray(body.prizeAmounts)
      ? body.prizeAmounts.map((n: unknown) => Math.round(Number(n))).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    if (amounts.length === 0 || amounts.length > 20 || amounts.some((n: number) => n > 10_000_000)) {
      return NextResponse.json(
        { error: "Enter between 1 and 20 prize amounts (max ₦10,000,000 each)." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("weekend_reward_settings")
      .update({
        prizes_enabled: body.prizesEnabled === true,
        prize_amounts: amounts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true });
  }

  const weekendKey = String(body?.weekendKey ?? "");
  const place = Math.round(Number(body?.place));

  if (!isWeekendKey(weekendKey) || !Number.isFinite(place) || place < 1) {
    return NextResponse.json({ error: "Invalid winner." }, { status: 400 });
  }

  if (body?.action === "mark_paid") {
    const reference = String(body?.reference ?? "").trim().slice(0, 120);
    if (!reference) {
      return NextResponse.json(
        { error: "Enter the bank transfer reference so you have a record." },
        { status: 400 }
      );
    }

    const { data, error } = await admin
      .from("weekend_winners")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_reference: reference })
      .eq("weekend_key", weekendKey)
      .eq("place", place)
      .eq("status", "ready_to_pay")
      .select("place");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Only winners who have sent bank details can be marked paid." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  }

  if (body?.action === "cancel") {
    const { error } = await admin
      .from("weekend_winners")
      .update({ status: "cancelled", notes: String(body?.reason ?? "").slice(0, 300) || null })
      .eq("weekend_key", weekendKey)
      .eq("place", place)
      .neq("status", "paid");

    return error
      ? NextResponse.json({ error: error.message }, { status: 500 })
      : NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
