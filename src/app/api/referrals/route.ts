import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/** New accounts can be credited to an inviter within this many days. */
const CLAIM_WINDOW_DAYS = 7;

/**
 * GET  /api/referrals → my invite code, friends invited, rewards earned
 * POST /api/referrals { code } → record who invited me (new accounts only)
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false });

  const admin = createAdminSupabaseClient();

  const [{ data: profile }, { data: invited }, { data: settings }] = await Promise.all([
    admin.from("player_profiles").select("username").eq("id", user.id).maybeSingle(),
    admin
      .from("referrals")
      .select("referred_id, status, referrer_reward, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("admin_game_settings")
      .select("referral_reward_referrer, referral_reward_new_player")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const rows = invited ?? [];
  const ids = rows.map((r) => r.referred_id);
  const { data: names } = ids.length
    ? await admin.from("player_profiles").select("id, display_name, avatar").in("id", ids)
    : { data: [] };
  type NameRow = { id: string; display_name: string | null; avatar: string | null };
  const nameMap = new Map(((names ?? []) as NameRow[]).map((n) => [n.id, n]));

  return NextResponse.json({
    loggedIn: true,
    code: profile?.username ?? null,
    rewardPerFriend: Number(settings?.referral_reward_referrer ?? 5000),
    welcomeBonus: Number(settings?.referral_reward_new_player ?? 2000),
    invited: rows.length,
    active: rows.filter((r) => r.status === "rewarded").length,
    earned: rows.reduce((t, r) => t + Number(r.referrer_reward ?? 0), 0),
    friends: rows.slice(0, 50).map((r) => ({
      name: nameMap.get(r.referred_id)?.display_name ?? "New player",
      avatar: nameMap.get(r.referred_id)?.avatar ?? "🧑🏽",
      status: r.status,
      reward: Number(r.referrer_reward ?? 0),
      joinedAt: r.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const code = String(body?.code ?? "").trim().toLowerCase().replace(/^@/, "");

  if (!/^[a-z0-9_]{3,30}$/.test(code)) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
  }

  // Only brand-new accounts can be credited to an inviter.
  const createdAt = new Date(user.created_at).getTime();
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > CLAIM_WINDOW_DAYS * 86_400_000) {
    return NextResponse.json({ error: "Invite links only work for new accounts." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: referrer } = await admin
    .from("player_profiles")
    .select("id")
    .eq("username", code)
    .maybeSingle();

  if (!referrer) return NextResponse.json({ error: "Invite code not found." }, { status: 404 });
  if (referrer.id === user.id) return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 });

  const { error } = await admin.from("referrals").insert({
    referred_id: user.id,
    referrer_id: referrer.id,
    status: "pending",
  });

  if (error) {
    // Already recorded (primary key on referred_id).
    return NextResponse.json({ success: true, alreadyRecorded: true });
  }

  return NextResponse.json({ success: true });
}
