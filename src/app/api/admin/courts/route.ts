import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
}

/** GET /api/admin/courts → all cases (newest first) + jailed players. */
export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const admin = createAdminSupabaseClient();
  const [{ data: cases }, { data: jailed }] = await Promise.all([
    admin.from("court_cases").select("*").order("filed_at", { ascending: false }).limit(200),
    admin.from("player_game_states").select("user_id, jailed_until").gt("jailed_until", new Date().toISOString()).limit(200),
  ]);

  const ids = [...new Set([...(cases ?? []).map((c) => c.defendant_id), ...(jailed ?? []).map((j) => j.user_id)])];
  const { data: profiles } = ids.length
    ? await admin.from("player_profiles").select("id, display_name, username").in("id", ids)
    : { data: [] as { id: string; display_name: string; username: string }[] };
  const names = Object.fromEntries((profiles ?? []).map((p) => [p.id, `${p.display_name} (@${p.username})`]));

  return NextResponse.json({
    cases: (cases ?? []).map((c) => ({ ...c, defendant: names[c.defendant_id] ?? c.defendant_id })),
    jailed: (jailed ?? []).map((j) => ({ ...j, name: names[j.user_id] ?? j.user_id })),
  });
}

/**
 * POST /api/admin/courts
 *  { action: "pardon" | "dismiss", caseId }  → close a case in the player's favour
 *  { action: "release", userId }             → let someone out of jail now
 */
export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.action === "release" && body?.userId) {
    const { error } = await admin.from("player_game_states").update({ jailed_until: null }).eq("user_id", body.userId);
    return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true });
  }

  if ((body?.action === "pardon" || body?.action === "dismiss") && body?.caseId) {
    const { data: courtCase } = await admin.from("court_cases").select("defendant_id, status").eq("id", body.caseId).maybeSingle();
    if (!courtCase) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    const status = body.action === "pardon" ? "pardoned" : "dismissed";
    await admin
      .from("court_cases")
      .update({
        status,
        verdict: body.action === "pardon" ? "Pardoned by the Presidency." : "Case dismissed by the court for lack of evidence.",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", body.caseId);

    if (body.action === "pardon") {
      await admin.from("player_game_states").update({ jailed_until: null }).eq("user_id", courtCase.defendant_id);
    }

    await admin.from("notifications").insert({
      player_id: courtCase.defendant_id,
      type: "system",
      title: body.action === "pardon" ? "🕊️ You've been pardoned" : "⚖️ Your case was dismissed",
      message: "You're free. Stay out of trouble!",
      action_url: "/court",
      actor_id: null,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
