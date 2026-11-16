import { NextResponse } from "next/server";

import { BAIL_PER_HOUR, type LawyerTier } from "@/lib/justice/catalog";
import { getLegalStatus, holdTrial, payBail } from "@/lib/justice/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/**
 * GET  /api/court → my cases, jail status
 * POST /api/court { action: "trial", caseId, plea, lawyer } | { action: "bail" }
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false, cases: [] });

  const admin = createAdminSupabaseClient();
  const [status, { data: cases }, { data: state }] = await Promise.all([
    getLegalStatus(admin, user.id),
    admin
      .from("court_cases")
      .select("*")
      .eq("defendant_id", user.id)
      .order("filed_at", { ascending: false })
      .limit(50),
    admin.from("player_game_states").select("cash").eq("user_id", user.id).maybeSingle(),
  ]);

  const bailHours = status.jailed && status.jailedUntil
    ? Math.ceil((new Date(status.jailedUntil).getTime() - Date.now()) / 3_600_000)
    : 0;

  return NextResponse.json({
    loggedIn: true,
    status,
    bail: bailHours * BAIL_PER_HOUR,
    cash: Number(state?.cash ?? 0),
    cases: cases ?? [],
  });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.action === "bail") {
    const result = await payBail(admin, user.id);
    return result.ok
      ? NextResponse.json({ success: true, bail: result.bail })
      : NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (body?.action === "trial") {
    const plea = body?.plea === "guilty" ? "guilty" : "not_guilty";
    const tier = (["legal_aid", "private", "san"].includes(body?.lawyer) ? body.lawyer : "legal_aid") as LawyerTier;
    const result = await holdTrial(admin, user.id, String(body?.caseId ?? ""), plea, tier);
    return result.ok
      ? NextResponse.json({ success: true, outcome: result.outcome })
      : NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
