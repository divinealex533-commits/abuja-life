// Abuja Life — weekend competition (real-money prizes). Server only.
//
// Players earn points (career XP) on Saturday and Sunday. After the
// weekend the admin finalizes the results; winners enter their bank
// details in the game; the admin sends the money and marks it paid.

import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_PRIZES = [20_000, 10_000, 5_000];

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  username: string | null;
  points: number;
}

export async function getPrizeSettings(admin: SupabaseClient) {
  const { data } = await admin
    .from("weekend_reward_settings")
    .select("prizes_enabled, prize_amounts")
    .eq("id", 1)
    .maybeSingle();

  const amounts = Array.isArray(data?.prize_amounts)
    ? (data.prize_amounts as unknown[]).map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : DEFAULT_PRIZES;

  return {
    prizesEnabled: data?.prizes_enabled !== false,
    prizeAmounts: amounts.length > 0 ? amounts : DEFAULT_PRIZES,
  };
}

export async function getLeaderboard(
  admin: SupabaseClient,
  weekendKey: string,
  limit = 10
): Promise<LeaderboardRow[]> {
  const { data: scores } = await admin
    .from("weekend_scores")
    .select("user_id, points, updated_at")
    .eq("weekend_key", weekendKey)
    .gt("points", 0)
    .order("points", { ascending: false })
    .order("updated_at", { ascending: true }) // tie → whoever got there first
    .limit(limit);

  const rows = (scores ?? []) as Array<{ user_id: string; points: number }>;
  if (rows.length === 0) return [];

  const { data: profiles } = await admin
    .from("player_profiles")
    .select("id, username, display_name")
    .in(
      "id",
      rows.map((r) => r.user_id)
    );

  const names = new Map(
    ((profiles ?? []) as Array<{ id: string; username: string | null; display_name: string | null }>).map(
      (p) => [p.id, p]
    )
  );

  return rows.map((row, index) => {
    const profile = names.get(row.user_id);
    return {
      rank: index + 1,
      userId: row.user_id,
      name: profile?.display_name || profile?.username || "Abuja Player",
      username: profile?.username ?? null,
      points: Number(row.points) || 0,
    };
  });
}

export async function getMyStanding(
  admin: SupabaseClient,
  weekendKey: string,
  userId: string
): Promise<{ points: number; rank: number | null }> {
  const { data: mine } = await admin
    .from("weekend_scores")
    .select("points")
    .eq("weekend_key", weekendKey)
    .eq("user_id", userId)
    .maybeSingle();

  const points = Number(mine?.points ?? 0);
  if (points <= 0) return { points: 0, rank: null };

  const { count } = await admin
    .from("weekend_scores")
    .select("user_id", { count: "exact", head: true })
    .eq("weekend_key", weekendKey)
    .gt("points", points);

  return { points, rank: (count ?? 0) + 1 };
}
