import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, friendlyEconomyError, getRequestUser, lagosDateKey } from "@/lib/vip/server";
import { settleDueElections, type ElectionRow } from "@/lib/world/elections";

export const dynamic = "force-dynamic";

const SETUP = "Elections aren't set up yet. The admin needs to run 20261122_control_room.sql.";

/** GET → open elections with candidates and vote counts, and current officeholders. */
export async function GET() {
  const user = await getRequestUser();
  const admin = createAdminSupabaseClient();

  await settleDueElections(admin).catch(() => null);

  const { data: rows, error } = await admin
    .from("elections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ setupMissing: true, open: [], officeholders: [] });

  const elections = (rows ?? []) as ElectionRow[];
  const open = elections.filter((e) => e.status === "open");
  const nowIso = new Date().toISOString();
  const serving = elections.filter((e) => e.status === "closed" && e.winner_id && e.term_ends_at && e.term_ends_at > nowIso);

  const ids = open.map((e) => e.id);
  const [{ data: cands }, { data: votes }] = ids.length
    ? await Promise.all([
        admin.from("election_candidates").select("election_id, user_id, slogan").in("election_id", ids),
        admin.from("election_votes").select("election_id, voter_id, candidate_id").in("election_id", ids),
      ])
    : [{ data: [] }, { data: [] }];

  const userIds = new Set<string>();
  (cands ?? []).forEach((c) => userIds.add(c.user_id));
  serving.forEach((e) => userIds.add(e.winner_id!));
  const { data: profiles } = userIds.size
    ? await admin.from("player_profiles").select("id, display_name, username, appearance").in("id", [...userIds])
    : { data: [] };
  const who = (id: string) => (profiles ?? []).find((p) => p.id === id);

  const today = lagosDateKey();
  const { data: claims } =
    user && serving.length
      ? await admin
          .from("election_salary_claims")
          .select("election_id")
          .eq("user_id", user.id)
          .eq("day_key", today)
      : { data: [] };

  return NextResponse.json({
    loggedIn: Boolean(user),
    me: user?.id ?? null,
    open: open.map((e) => ({
      id: e.id,
      office: e.office,
      description: e.description,
      dailySalary: e.daily_salary,
      termDays: e.term_days,
      endsAt: e.ends_at,
      myVote: (votes ?? []).find((v) => v.election_id === e.id && v.voter_id === user?.id)?.candidate_id ?? null,
      imRunning: (cands ?? []).some((c) => c.election_id === e.id && c.user_id === user?.id),
      totalVotes: (votes ?? []).filter((v) => v.election_id === e.id).length,
      candidates: (cands ?? [])
        .filter((c) => c.election_id === e.id)
        .map((c) => ({
          userId: c.user_id,
          name: who(c.user_id)?.display_name ?? "Player",
          username: who(c.user_id)?.username ?? "",
          appearance: who(c.user_id)?.appearance ?? null,
          slogan: c.slogan,
          votes: (votes ?? []).filter((v) => v.election_id === e.id && v.candidate_id === c.user_id).length,
        }))
        .sort((a, b) => b.votes - a.votes),
    })),
    officeholders: serving.map((e) => ({
      electionId: e.id,
      office: e.office,
      userId: e.winner_id,
      name: who(e.winner_id!)?.display_name ?? "Player",
      appearance: who(e.winner_id!)?.appearance ?? null,
      dailySalary: e.daily_salary,
      termEndsAt: e.term_ends_at,
      canClaim: user?.id === e.winner_id && !(claims ?? []).some((c) => c.election_id === e.id),
    })),
  });
}

/**
 * POST { action: "run", electionId, slogan }
 * POST { action: "vote", electionId, candidateId }
 * POST { action: "claim", electionId }   → officeholder's daily salary
 */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const electionId = String(body?.electionId ?? "");
  const admin = createAdminSupabaseClient();

  const { data: election, error } = await admin.from("elections").select("*").eq("id", electionId).maybeSingle();
  if (error) return NextResponse.json({ error: SETUP }, { status: 503 });
  if (!election) return NextResponse.json({ error: "Election not found." }, { status: 404 });

  const votingOpen = election.status === "open" && new Date(election.ends_at).getTime() > Date.now();

  if (action === "run") {
    if (!votingOpen) return NextResponse.json({ error: "This election is closed." }, { status: 400 });
    const slogan = String(body?.slogan ?? "").trim().slice(0, 80);
    const { error: insertError } = await admin
      .from("election_candidates")
      .insert({ election_id: electionId, user_id: user.id, slogan });
    if (insertError) {
      return NextResponse.json(
        { error: insertError.code === "23505" ? "You're already on the ballot." : "Couldn't register you." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: "You're on the ballot! Go and campaign." });
  }

  if (action === "vote") {
    if (!votingOpen) return NextResponse.json({ error: "Voting has ended." }, { status: 400 });
    const candidateId = String(body?.candidateId ?? "");
    const { data: candidate } = await admin
      .from("election_candidates")
      .select("user_id")
      .eq("election_id", electionId)
      .eq("user_id", candidateId)
      .maybeSingle();
    if (!candidate) return NextResponse.json({ error: "That candidate isn't on the ballot." }, { status: 400 });
    const { error: voteError } = await admin
      .from("election_votes")
      .insert({ election_id: electionId, voter_id: user.id, candidate_id: candidateId });
    if (voteError) {
      return NextResponse.json(
        { error: voteError.code === "23505" ? "You've already voted in this election." : "Couldn't record your vote." },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, message: "Vote cast! 🗳️" });
  }

  if (action === "claim") {
    const serving =
      election.winner_id === user.id && election.term_ends_at && new Date(election.term_ends_at).getTime() > Date.now();
    if (!serving) return NextResponse.json({ error: "Only the current officeholder can claim this." }, { status: 403 });

    const amount = Number(election.daily_salary) || 0;
    const { error: claimError } = await admin
      .from("election_salary_claims")
      .insert({ election_id: electionId, user_id: user.id, day_key: lagosDateKey(), amount });
    if (claimError) return NextResponse.json({ error: "You've already collected today's salary." }, { status: 400 });

    try {
      const snapshot = await applyPlayerDelta(admin, user.id, { cash: amount, reputation: 2 });
      return NextResponse.json({ success: true, player: snapshot, message: `+₦${amount.toLocaleString()} salary collected.` });
    } catch (err) {
      await admin
        .from("election_salary_claims")
        .delete()
        .eq("election_id", electionId)
        .eq("user_id", user.id)
        .eq("day_key", lagosDateKey());
      return NextResponse.json({ error: friendlyEconomyError(err instanceof Error ? err.message : "") }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
