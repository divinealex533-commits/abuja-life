import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { lagosDateKey } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/**
 * Public game stats for /stats. Only totals and counts — no emails,
 * no balances of individual players.
 */
export async function GET() {
  const admin = createAdminSupabaseClient();
  const now = Date.now();
  const DAY = 86_400_000;
  const todayStart = new Date(`${lagosDateKey()}T00:00:00+01:00`).toISOString();

  const count = async (table: string, build?: (q: any) => any) => {
    try {
      let q: any = admin.from(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count: c, error } = await q;
      return error ? null : ((c as number | null) ?? 0);
    } catch {
      return null;
    }
  };

  const [players, newToday, online, shiftsToday, visitorsToday, liveNow, openElections, businesses] = await Promise.all([
    count("player_profiles"),
    count("player_profiles", (q) => q.gte("created_at", todayStart)),
    count("player_profiles", (q) => q.gte("updated_at", new Date(now - 10 * 60_000).toISOString())),
    count("career_progress", (q) => q.gte("last_shift_at", todayStart)),
    count("site_visitors", (q) => q.gte("last_seen_at", todayStart)),
    count("player_profiles", (q) => q.gte("live_started_at", new Date(now - 4 * 3_600_000).toISOString())),
    count("elections", (q) => q.eq("status", "open")),
    count("business_listings", (q) => q.eq("status", "active")),
  ]);

  // New players per day, last 14 days.
  const since = new Date(now - 13 * DAY);
  const { data: joined } = await admin
    .from("player_profiles")
    .select("created_at")
    .gte("created_at", new Date(`${lagosDateKey(since)}T00:00:00+01:00`).toISOString())
    .limit(20000);
  const daily: { day: string; players: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = lagosDateKey(new Date(now - i * DAY));
    daily.push({ day: key, players: 0 });
  }
  (joined ?? []).forEach((row) => {
    const key = lagosDateKey(new Date(row.created_at));
    const hit = daily.find((d) => d.day === key);
    if (hit) hit.players += 1;
  });

  // Officeholders (public).
  const { data: offices } = await admin
    .from("elections")
    .select("office, winner_id, term_ends_at")
    .eq("status", "closed")
    .not("winner_id", "is", null)
    .gt("term_ends_at", new Date(now).toISOString())
    .limit(5);
  const winnerIds = (offices ?? []).map((o) => o.winner_id);
  const { data: names } = winnerIds.length
    ? await admin.from("player_profiles").select("id, display_name").in("id", winnerIds)
    : { data: [] };

  return NextResponse.json(
    {
      generatedAt: new Date(now).toISOString(),
      players,
      newToday,
      online,
      shiftsToday,
      visitorsToday,
      liveNow,
      openElections,
      businesses,
      daily,
      officeholders: (offices ?? []).map((o) => ({
        office: o.office,
        name: (names ?? []).find((n) => n.id === o.winner_id)?.display_name ?? "Player",
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
