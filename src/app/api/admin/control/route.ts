import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { CAREERS } from "@/lib/game/careers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { closeElection, settleDueElections, type ElectionRow } from "@/lib/world/elections";

export const dynamic = "force-dynamic";

const SETUP = "Run 20261122_control_room.sql in Supabase first.";

function missing(message: string | undefined) {
  return Boolean(message && /does not exist|schema cache|Could not find the function/i.test(message));
}

function fail(message: string | undefined, fallback = "That didn't work.") {
  return NextResponse.json({ error: missing(message) ? SETUP : message || fallback }, { status: missing(message) ? 503 : 400 });
}

/** GET → everything the World Controls page shows. */
export async function GET() {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  void adminUser;

  const admin = createAdminSupabaseClient();
  await settleDueElections(admin).catch(() => null);

  const [pay, boards, elections, log] = await Promise.all([
    admin.from("career_pay_settings").select("career_id, pay_multiplier"),
    admin.from("billboards").select("*").order("created_at", { ascending: false }).limit(30),
    admin.from("elections").select("*").order("created_at", { ascending: false }).limit(10),
    admin.from("admin_control_log").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const setupMissing = [pay.error, boards.error, elections.error].some((e) => missing(e?.message));

  // Candidate + vote counts for each election, and winner names.
  const electionList = (elections.data ?? []) as ElectionRow[];
  const ids = electionList.map((e) => e.id);
  const [{ data: cands }, { data: votes }] = ids.length
    ? await Promise.all([
        admin.from("election_candidates").select("election_id, user_id, slogan").in("election_id", ids),
        admin.from("election_votes").select("election_id, candidate_id").in("election_id", ids),
      ])
    : [{ data: [] }, { data: [] }];

  const userIds = new Set<string>();
  (cands ?? []).forEach((c) => userIds.add(c.user_id));
  electionList.forEach((e) => e.winner_id && userIds.add(e.winner_id));
  const { data: profiles } = userIds.size
    ? await admin.from("player_profiles").select("id, display_name, username").in("id", [...userIds])
    : { data: [] };
  const name = (id: string | null) =>
    (profiles ?? []).find((p) => p.id === id)?.display_name ?? (id ? "Player" : null);

  return NextResponse.json({
    setupMissing,
    careers: CAREERS.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      basePay: c.basePay,
      multiplier: Number((pay.data ?? []).find((p) => p.career_id === c.id)?.pay_multiplier ?? 1),
    })),
    billboards: boards.data ?? [],
    elections: electionList.map((e) => ({
      ...e,
      winnerName: name(e.winner_id),
      candidates: (cands ?? [])
        .filter((c) => c.election_id === e.id)
        .map((c) => ({
          userId: c.user_id,
          name: name(c.user_id),
          slogan: c.slogan,
          votes: (votes ?? []).filter((v) => v.election_id === e.id && v.candidate_id === c.user_id).length,
        }))
        .sort((a, b) => b.votes - a.votes),
    })),
    log: log.data ?? [],
  });
}

/** POST { action, ... } → run a world control. */
export async function POST(request: Request) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const admin = createAdminSupabaseClient();
  const num = (v: unknown) => Math.round(Number(v));

  const logIt = (detail: Record<string, unknown>) =>
    admin
      .from("admin_control_log")
      .insert({ admin_id: adminUser.id, action, detail })
      .then(
        () => null,
        () => null
      );

  switch (action) {
    case "credit-all": {
      const amount = num(body?.amount);
      if (!Number.isFinite(amount) || amount === 0) return fail("Enter an amount.");
      const { data, error } = await admin.rpc("abuja_admin_credit_all", { p_amount: amount });
      if (error) return fail(error.message);
      const reason = String(body?.reason ?? "").slice(0, 120);
      if (body?.announce) {
        await admin
          .from("admin_announcements")
          .insert({
            title: amount > 0 ? `🎁 Everyone got ₦${amount.toLocaleString()}!` : "Balance adjustment",
            message: reason || (amount > 0 ? "A gift from Abuja Life. Enjoy!" : "Balances were adjusted."),
            priority: "important",
            created_by: adminUser.id,
          })
          .then(
            () => null,
            () => null
          );
      }
      await logIt({ amount, reason, players: data });
      return NextResponse.json({ success: true, message: `Done: ${data} players ${amount > 0 ? "got" : "lost"} ₦${Math.abs(amount).toLocaleString()}.` });
    }

    case "cap-cash": {
      const cap = num(body?.cap);
      const resetTo = num(body?.resetTo);
      if (!(cap >= 0) || !(resetTo >= 0)) return fail("Enter valid amounts.");
      const { data, error } = await admin.rpc("abuja_admin_cap_cash", { p_cap: cap, p_reset_to: resetTo });
      if (error) return fail(error.message);
      await logIt({ cap, resetTo, players: data });
      return NextResponse.json({ success: true, message: `${data} player(s) above ₦${cap.toLocaleString()} were reset to ₦${resetTo.toLocaleString()}.` });
    }

    case "set-pay": {
      const careerId = String(body?.careerId ?? "");
      const multiplier = Math.round(Number(body?.multiplier) * 100) / 100;
      if (!CAREERS.some((c) => c.id === careerId)) return fail("Unknown job.");
      if (!(multiplier >= 0.1 && multiplier <= 10)) return fail("Pay must be between 0.1× and 10×.");
      const { error } = await admin
        .from("career_pay_settings")
        .upsert({ career_id: careerId, pay_multiplier: multiplier, updated_at: new Date().toISOString() });
      if (error) return fail(error.message);
      await logIt({ careerId, multiplier });
      return NextResponse.json({ success: true, message: "Job pay updated." });
    }

    case "billboard-create": {
      const headline = String(body?.headline ?? "").trim().slice(0, 60);
      const advertiser = String(body?.advertiser ?? "").trim().slice(0, 60);
      if (!headline || !advertiser) return fail("Add the advertiser name and headline.");
      const days = num(body?.days);
      const link = String(body?.linkUrl ?? "").trim();
      const { error } = await admin.from("billboards").insert({
        advertiser,
        headline,
        subtext: String(body?.subtext ?? "").trim().slice(0, 90),
        link_url: /^https?:\/\//i.test(link) ? link : null,
        color: /^#[0-9a-f]{6}$/i.test(String(body?.color)) ? String(body?.color) : "#f59e0b",
        slot: Math.min(6, Math.max(1, num(body?.slot) || 1)),
        price_paid: Math.max(0, num(body?.pricePaid) || 0),
        ends_at: days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
      });
      if (error) return fail(error.message);
      await logIt({ advertiser, headline, days });
      return NextResponse.json({ success: true, message: "Billboard is up." });
    }

    case "billboard-toggle":
    case "billboard-delete": {
      const id = String(body?.id ?? "");
      const query =
        action === "billboard-delete"
          ? admin.from("billboards").delete().eq("id", id)
          : admin.from("billboards").update({ active: Boolean(body?.active) }).eq("id", id);
      const { error } = await query;
      if (error) return fail(error.message);
      await logIt({ id, active: body?.active });
      return NextResponse.json({ success: true, message: action === "billboard-delete" ? "Billboard removed." : "Billboard updated." });
    }

    case "election-create": {
      const office = String(body?.office ?? "").trim().slice(0, 60);
      const hours = num(body?.hours);
      if (!office) return fail("Name the office, e.g. FCT Governor.");
      if (!(hours >= 1 && hours <= 24 * 14)) return fail("Voting must last 1 hour to 14 days.");
      const { error } = await admin.from("elections").insert({
        office,
        description: String(body?.description ?? "").trim().slice(0, 200),
        daily_salary: Math.max(0, num(body?.dailySalary) || 0),
        term_days: Math.min(60, Math.max(1, num(body?.termDays) || 7)),
        ends_at: new Date(Date.now() + hours * 3_600_000).toISOString(),
      });
      if (error) return fail(error.message);
      await logIt({ office, hours });
      return NextResponse.json({ success: true, message: `Election for ${office} is open.` });
    }

    case "election-close": {
      const { data, error } = await admin.from("elections").select("*").eq("id", String(body?.id ?? "")).maybeSingle();
      if (error || !data) return fail(error?.message, "Election not found.");
      if (data.status !== "open") return fail("That election is already closed.");
      const winner = await closeElection(admin, data as ElectionRow);
      await logIt({ id: data.id, winner });
      return NextResponse.json({ success: true, message: winner ? "Election closed. Winner announced." : "Closed with no votes." });
    }

    case "election-remove-winner": {
      const { error } = await admin
        .from("elections")
        .update({ term_ends_at: new Date().toISOString() })
        .eq("id", String(body?.id ?? ""));
      if (error) return fail(error.message);
      await logIt({ id: body?.id });
      return NextResponse.json({ success: true, message: "Term ended. They no longer get a salary." });
    }

    default:
      return fail("Unknown action.");
  }
}
