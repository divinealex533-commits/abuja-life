import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/court/efcc → wanted list (open EFCC/Customs cases) and recent judgments. */
export async function GET() {
  const admin = createAdminSupabaseClient();

  const [{ data: open }, { data: judged }] = await Promise.all([
    admin
      .from("court_cases")
      .select("defendant_id, charge, agency, filed_at, deadline_at, fine_max")
      .eq("status", "awaiting_trial")
      .in("agency", ["efcc", "customs"])
      .order("fine_max", { ascending: false })
      .limit(20),
    admin
      .from("court_cases")
      .select("defendant_id, charge, agency, status, fine_paid, jail_hours, resolved_at")
      .in("status", ["acquitted", "fined", "jailed", "convicted_absentia"])
      .order("resolved_at", { ascending: false })
      .limit(20),
  ]);

  const ids = [...new Set([...(open ?? []), ...(judged ?? [])].map((c) => c.defendant_id))];
  const { data: profiles } = ids.length
    ? await admin.from("player_profiles").select("id, display_name, avatar").in("id", ids)
    : { data: [] };

  type Profile = { id: string; display_name: string; avatar: string };
  const names = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
  const who = (id: string) => ({
    name: names.get(id)?.display_name ?? "Unknown suspect",
    avatar: names.get(id)?.avatar ?? "🧑🏽",
  });

  return NextResponse.json({
    wanted: (open ?? []).map((c) => ({ ...who(c.defendant_id), charge: c.charge, agency: c.agency, filedAt: c.filed_at, overdue: new Date(c.deadline_at).getTime() < Date.now() })),
    judgments: (judged ?? []).map((c) => ({ ...who(c.defendant_id), charge: c.charge, agency: c.agency, status: c.status, fine: c.fine_paid, jailHours: c.jail_hours, at: c.resolved_at })),
  });
}
