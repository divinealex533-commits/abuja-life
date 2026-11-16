import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { CHARGES } from "@/lib/justice/catalog";
import { fileCase, getLegalStatus } from "@/lib/justice/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/system/errors";
import { applyPlayerDelta } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/**
 * Test-player tools. They only ever touch the ADMIN'S OWN account,
 * so you can play-test the game without affecting real players.
 *
 * GET  → your test account snapshot
 * POST { action } → give_cash | refill_energy | sample_case | jail_me | clear_legal | test_error | reset_character
 */
export async function GET() {
  let me;
  try {
    me = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const admin = createAdminSupabaseClient();
  await admin.rpc("abuja_ensure_player_row", { p_user_id: me.id }).then(() => undefined, () => undefined);

  const [{ data: state }, { data: profile }, legal] = await Promise.all([
    admin.from("player_game_states").select("*").eq("user_id", me.id).maybeSingle(),
    admin.from("player_profiles").select("display_name, username, appearance").eq("id", me.id).maybeSingle(),
    getLegalStatus(admin, me.id).catch(() => null),
  ]);

  return NextResponse.json({
    userId: me.id,
    email: me.email,
    hasProfile: Boolean(profile),
    profile,
    state,
    legal,
  });
}

export async function POST(request: Request) {
  let me;
  try {
    me = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();
  const action = String(body?.action ?? "");

  try {
    switch (action) {
      case "give_cash": {
        await applyPlayerDelta(admin, me.id, { cash: 1_000_000 });
        return NextResponse.json({ success: true, message: "Added ₦1,000,000 game cash to your test account." });
      }
      case "refill_energy": {
        await applyPlayerDelta(admin, me.id, { refillEnergy: true });
        return NextResponse.json({ success: true, message: "Energy refilled." });
      }
      case "sample_case": {
        const keys = Object.keys(CHARGES);
        const key = keys[Math.floor(Math.random() * keys.length)];
        const filed = await fileCase(admin, me.id, key, null);
        return NextResponse.json({
          success: true,
          message: filed ? `You've been charged with "${filed.charge}". Open /court to test the trial.` : "You already have that charge open. Try again.",
        });
      }
      case "jail_me": {
        await admin.from("player_game_states").update({ jailed_until: new Date(Date.now() + 2 * 3_600_000).toISOString() }).eq("user_id", me.id);
        return NextResponse.json({ success: true, message: "You're in jail for 2 hours. Try working a shift, then pay bail on /court." });
      }
      case "clear_legal": {
        await admin.from("court_cases").delete().eq("defendant_id", me.id);
        await admin.from("player_game_states").update({ jailed_until: null }).eq("user_id", me.id);
        return NextResponse.json({ success: true, message: "Your cases are deleted and you're out of jail." });
      }
      case "test_error": {
        await logError({
          source: "server",
          message: `Test error from the Test Center (${new Date().toLocaleTimeString("en-NG")})`,
          stack: null,
          path: "/admin/testing",
          userId: me.id,
          userAgent: request.headers.get("user-agent"),
        });
        return NextResponse.json({ success: true, message: "A test error was logged. It should appear in the error log below." });
      }
      case "reset_character": {
        await admin.from("player_profiles").update({ appearance: {} }).eq("id", me.id);
        return NextResponse.json({ success: true, message: "Character look reset. Open /character?new=1 to test the creator." });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed." }, { status: 500 });
  }
}
