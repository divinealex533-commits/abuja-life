import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { lagosDateKey } from "@/lib/vip/server";
import { STATES } from "@/lib/world/states";

export const dynamic = "force-dynamic";

type FeedItem = { at: string; icon: string; text: string; tone: "money" | "player" | "law" | "work" | "chat" | "biz" | "error" };

/**
 * GET /api/admin/overview → everything the Command Center shows:
 * live counters, money, economy, alerts and a merged activity feed.
 * Every query is independent: one missing table never breaks the page.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const now = Date.now();
  const todayStart = new Date(`${lagosDateKey()}T00:00:00+01:00`).toISOString();
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const DAY = 86_400_000;

  const safe = async <T,>(fn: () => PromiseLike<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };
  const count = (table: string, build?: (q: any) => any) =>
    safe(async () => {
      let q: any = admin.from(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count: c, error } = await q;
      return error ? null : (c as number | null) ?? 0;
    }, null as number | null);
  const rows = <T,>(table: string, select: string, build?: (q: any) => any) =>
    safe(async () => {
      let q: any = admin.from(table).select(select);
      if (build) q = build(q);
      const { data, error } = await q;
      return error ? ([] as T[]) : ((data ?? []) as T[]);
    }, [] as T[]);

  const [
    totalPlayers, newToday, online, workedToday, chatToday,
    activeVips, liveBusinesses, pendingReviews, openCases, jailed, errors24h, failedDeliveries, winnersAwaiting,
    payments30, richest, cashRows,
    recentPlayers, recentPayments, recentCases, recentVerdicts, recentChat, recentBiz, recentShifts, recentErrors, waitlist,
  ] = await Promise.all([
    count("player_profiles"),
    count("player_profiles", (q) => q.gte("created_at", todayStart)),
    count("player_profiles", (q) => q.gte("updated_at", ago(5 * 60_000))),
    count("career_progress", (q) => q.gte("last_shift_at", todayStart)),
    count("location_chat_messages", (q) => q.gte("created_at", todayStart)),

    count("vip_memberships", (q) => q.gt("expires_at", new Date(now).toISOString())),
    count("business_listings", (q) => q.eq("status", "active")),
    count("business_listings", (q) => q.eq("status", "pending_review")),
    count("court_cases", (q) => q.eq("status", "awaiting_trial")),
    count("player_game_states", (q) => q.gt("jailed_until", new Date(now).toISOString())),
    count("error_logs", (q) => q.eq("resolved", false).gte("last_seen_at", ago(DAY))),
    count("payment_fulfillments", (q) => q.eq("status", "failed")),
    count("weekend_winners", (q) => q.neq("status", "paid")),

    rows<{ amount: number; created_at: string }>("payment_transactions", "amount, created_at", (q) => q.eq("status", "success").gte("created_at", ago(30 * DAY)).limit(10000)),
    rows<{ user_id: string; cash: number }>("player_game_states", "user_id, cash", (q) => q.order("cash", { ascending: false }).limit(5)),
    rows<{ cash: number }>("player_game_states", "cash", (q) => q.limit(20000)),

    rows<{ id: string; display_name: string; created_at: string }>("player_profiles", "id, display_name, created_at", (q) => q.order("created_at", { ascending: false }).limit(8)),
    rows<{ user_id: string; amount: number; metadata: any; created_at: string }>("payment_transactions", "user_id, amount, metadata, created_at", (q) => q.eq("status", "success").order("created_at", { ascending: false }).limit(8)),
    rows<{ defendant_id: string; charge: string; agency: string; filed_at: string }>("court_cases", "defendant_id, charge, agency, filed_at", (q) => q.order("filed_at", { ascending: false }).limit(8)),
    rows<{ defendant_id: string; charge: string; status: string; resolved_at: string }>("court_cases", "defendant_id, charge, status, resolved_at", (q) => q.not("resolved_at", "is", null).order("resolved_at", { ascending: false }).limit(6)),
    rows<{ player_id: string; location_id: string; message: string; created_at: string }>("location_chat_messages", "player_id, location_id, message, created_at", (q) => q.order("created_at", { ascending: false }).limit(8)),
    rows<{ owner_id: string; name: string; status: string; created_at: string }>("business_listings", "owner_id, name, status, created_at", (q) => q.order("created_at", { ascending: false }).limit(6)),
    rows<{ user_id: string; career_id: string; last_shift_at: string }>("career_progress", "user_id, career_id, last_shift_at", (q) => q.not("last_shift_at", "is", null).order("last_shift_at", { ascending: false }).limit(8)),
    rows<{ source: string; message: string; last_seen_at: string; occurrences: number }>("error_logs", "source, message, last_seen_at, occurrences", (q) => q.eq("resolved", false).order("last_seen_at", { ascending: false }).limit(5)),
    rows<{ state_id: string }>("state_waitlist", "state_id", (q) => q.limit(50000)),
  ]);

  // Revenue windows
  const sumSince = (iso: string) => payments30.filter((p) => p.created_at >= iso).reduce((a, p) => a + Number(p.amount || 0), 0);
  const revenue = { today: sumSince(todayStart), week: sumSince(ago(7 * DAY)), month: sumSince(ago(30 * DAY)) };

  // Revenue per day (last 14 days) for the chart
  const daily: { day: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = lagosDateKey(new Date(now - i * DAY));
    daily.push({ day: key, amount: 0 });
  }
  for (const p of payments30) {
    const key = lagosDateKey(new Date(p.created_at));
    const slot = daily.find((d) => d.day === key);
    if (slot) slot.amount += Number(p.amount || 0);
  }

  // Names for everyone mentioned
  const ids = new Set<string>();
  richest.forEach((r) => ids.add(r.user_id));
  recentPayments.forEach((r) => ids.add(r.user_id));
  recentCases.forEach((r) => ids.add(r.defendant_id));
  recentVerdicts.forEach((r) => ids.add(r.defendant_id));
  recentChat.forEach((r) => ids.add(r.player_id));
  recentBiz.forEach((r) => ids.add(r.owner_id));
  recentShifts.forEach((r) => ids.add(r.user_id));
  const names = new Map<string, string>();
  if (ids.size) {
    const profiles = await rows<{ id: string; display_name: string }>("player_profiles", "id, display_name", (q) => q.in("id", [...ids].slice(0, 300)));
    profiles.forEach((p) => names.set(p.id, p.display_name));
  }
  const n = (id: string) => names.get(id) ?? "A player";
  const naira = (v: number) => `₦${Math.round(v).toLocaleString("en-NG")}`;

  const feed: FeedItem[] = [
    ...recentPlayers.map((p) => ({ at: p.created_at, icon: "🆕", text: `${p.display_name} joined Abuja Life`, tone: "player" as const })),
    ...recentPayments.map((p) => ({ at: p.created_at, icon: "💰", text: `${n(p.user_id)} paid ${naira(p.amount)} for ${p.metadata?.product_id ?? "a purchase"}`, tone: "money" as const })),
    ...recentCases.map((c) => ({ at: c.filed_at, icon: c.agency === "efcc" ? "🕵🏾" : "🚓", text: `${n(c.defendant_id)} charged: ${c.charge} (${c.agency.toUpperCase()})`, tone: "law" as const })),
    ...recentVerdicts.map((c) => ({ at: c.resolved_at, icon: "⚖️", text: `${n(c.defendant_id)}: ${c.status.replace("_", " ")} for ${c.charge}`, tone: "law" as const })),
    ...recentChat.map((c) => ({ at: c.created_at, icon: "💬", text: `${n(c.player_id)} in ${c.location_id}: "${c.message.slice(0, 60)}"`, tone: "chat" as const })),
    ...recentBiz.map((b) => ({ at: b.created_at, icon: "🏪", text: `${n(b.owner_id)} listed ${b.name} (${b.status.replace("_", " ")})`, tone: "biz" as const })),
    ...recentShifts.map((s) => ({ at: s.last_shift_at, icon: "💼", text: `${n(s.user_id)} worked a ${s.career_id.replace(/[-_]/g, " ")} shift`, tone: "work" as const })),
    ...recentErrors.map((e) => ({ at: e.last_seen_at, icon: "🐞", text: `Error in ${e.source}: ${e.message.slice(0, 70)} (×${e.occurrences})`, tone: "error" as const })),
  ]
    .filter((f) => f.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 40);

  // Alerts
  const alerts: { level: "red" | "amber"; text: string; href: string }[] = [];
  if (failedDeliveries) alerts.push({ level: "red", text: `${failedDeliveries} paid purchase(s) failed to deliver`, href: "/admin/payments" });
  if ((errors24h ?? 0) >= 10) alerts.push({ level: "red", text: `${errors24h} unresolved errors in the last 24h`, href: "/admin/testing" });
  else if (errors24h) alerts.push({ level: "amber", text: `${errors24h} unresolved error(s) in the last 24h`, href: "/admin/testing" });
  if (pendingReviews) alerts.push({ level: "amber", text: `${pendingReviews} business ad(s) waiting for your review`, href: "/admin/businesses" });
  if (winnersAwaiting) alerts.push({ level: "amber", text: `${winnersAwaiting} weekend winner(s) waiting to be paid`, href: "/admin/weekend-prizes" });
  if (totalPlayers === null) alerts.push({ level: "red", text: "Database not responding: check Supabase", href: "/admin/testing" });

  const cashTotal = cashRows.reduce((a, r) => a + Number(r.cash || 0), 0);
  const waitCounts: Record<string, number> = {};
  waitlist.forEach((w) => (waitCounts[w.state_id] = (waitCounts[w.state_id] ?? 0) + 1));

  return NextResponse.json({
    generatedAt: new Date(now).toISOString(),
    players: { total: totalPlayers, newToday, online, workedToday, chatToday },
    revenue,
    daily,
    world: { activeVips, liveBusinesses, pendingReviews, openCases, jailed, errors24h },
    economy: {
      cashInCirculation: cashTotal,
      averageCash: cashRows.length ? Math.round(cashTotal / cashRows.length) : 0,
      richest: richest.map((r) => ({ name: n(r.user_id), cash: Number(r.cash || 0) })),
    },
    waitlist: STATES.filter((s) => s.status !== "live")
      .map((s) => ({ id: s.id, name: s.name, count: waitCounts[s.id] ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    alerts,
    feed,
  });
}
