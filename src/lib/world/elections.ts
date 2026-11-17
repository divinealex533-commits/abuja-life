import type { SupabaseClient } from "@supabase/supabase-js";

export interface ElectionRow {
  id: string;
  office: string;
  description: string;
  daily_salary: number;
  status: "open" | "closed";
  ends_at: string;
  term_days: number;
  winner_id: string | null;
  term_ends_at: string | null;
  created_at: string;
}

/** Count votes and crown a winner. Ties go to whoever registered first. */
export async function closeElection(admin: SupabaseClient, election: ElectionRow) {
  const [{ data: votes }, { data: candidates }] = await Promise.all([
    admin.from("election_votes").select("candidate_id").eq("election_id", election.id),
    admin
      .from("election_candidates")
      .select("user_id, created_at")
      .eq("election_id", election.id)
      .order("created_at", { ascending: true }),
  ]);

  const tally = new Map<string, number>();
  (votes ?? []).forEach((v) => tally.set(v.candidate_id, (tally.get(v.candidate_id) ?? 0) + 1));

  let winner: string | null = null;
  let best = 0;
  for (const c of candidates ?? []) {
    const n = tally.get(c.user_id) ?? 0;
    if (n > best) {
      best = n;
      winner = c.user_id;
    }
  }

  const termEnds = new Date(Date.now() + election.term_days * 86_400_000).toISOString();
  await admin
    .from("elections")
    .update({ status: "closed", winner_id: winner, term_ends_at: winner ? termEnds : null })
    .eq("id", election.id)
    .eq("status", "open");

  if (winner) {
    await admin
      .from("notifications")
      .insert({
        player_id: winner,
        type: "system",
        title: `🗳️ You won: ${election.office}!`,
        message: `Congratulations! Claim your ₦${election.daily_salary.toLocaleString()} daily salary on the Elections page.`,
        action_url: "/elections",
        actor_id: null,
      })
      .then(
        () => null,
        () => null
      );
  }

  return winner;
}

/** Close any open elections whose voting time is over. */
export async function settleDueElections(admin: SupabaseClient) {
  const { data } = await admin
    .from("elections")
    .select("*")
    .eq("status", "open")
    .lte("ends_at", new Date().toISOString());
  for (const election of (data ?? []) as ElectionRow[]) {
    await closeElection(admin, election);
  }
}
