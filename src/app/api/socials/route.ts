import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import {
  LIVE_PLATFORMS,
  getPlatform,
  isLiveNow,
  normalizeSocials,
  type Socials,
} from "@/lib/social/platforms";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const MISSING_SQL =
  "Socials aren't set up yet. The admin needs to run 20261120_socials_live.sql in Supabase.";

function isMissingColumn(message: string) {
  return /column .* does not exist|schema cache/i.test(message);
}

/**
 * GET → my socials and live status, plus everyone who is live right now.
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false, live: [] });

  const admin = createAdminSupabaseClient();

  const [{ data: me, error: meError }, { data: liveRows, error: liveError }, adminUser] =
    await Promise.all([
      admin
        .from("player_profiles")
        .select("socials, live_platform, live_title, live_started_at")
        .eq("id", user.id)
        .maybeSingle(),
      admin
        .from("player_profiles")
        .select("id, username, display_name, avatar, appearance, socials, live_platform, live_title, live_started_at")
        .not("live_started_at", "is", null)
        .order("live_started_at", { ascending: false })
        .limit(30),
      getAdminUser(),
    ]);

  const error = meError ?? liveError;
  if (error) {
    return NextResponse.json(
      { loggedIn: true, setupMissing: isMissingColumn(error.message), error: MISSING_SQL, live: [] },
      { status: isMissingColumn(error.message) ? 200 : 500 }
    );
  }

  const live = (liveRows ?? [])
    .filter((row) => isLiveNow(row.live_started_at))
    .map((row) => {
      const socials = normalizeSocials(row.socials) as Socials;
      const platform = LIVE_PLATFORMS.find((p) => p.id === row.live_platform);
      const handle = platform ? socials[platform.id] : undefined;
      if (!platform || !handle) return null;
      return {
        id: row.id as string,
        username: row.username as string,
        displayName: (row.display_name as string) || row.username,
        avatar: row.avatar as string,
        appearance: row.appearance,
        platform: platform.id,
        handle,
        title: (row.live_title as string | null) ?? "",
        startedAt: row.live_started_at as string,
        watchUrl: platform.liveUrl(handle),
      };
    })
    .filter(Boolean);

  const myLive = me && isLiveNow(me.live_started_at) ? me.live_platform : null;

  return NextResponse.json({
    loggedIn: true,
    isAdmin: Boolean(adminUser),
    socials: normalizeSocials(me?.socials),
    myLive: myLive
      ? { platform: myLive, title: me?.live_title ?? "", startedAt: me?.live_started_at }
      : null,
    live,
  });
}

/**
 * POST { action: "save", socials }              → save my accounts
 * POST { action: "go-live", platform, title }   → show me as live
 * POST { action: "end-live" }                   → stop showing me as live
 * POST { action: "admin-end-live", playerId }   → admin stops someone's live
 */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  const admin = createAdminSupabaseClient();

  async function update(id: string, values: Record<string, unknown>) {
    const { error } = await admin.from("player_profiles").update(values).eq("id", id);
    if (!error) return null;
    return NextResponse.json(
      { error: isMissingColumn(error.message) ? MISSING_SQL : "Couldn't save. Try again." },
      { status: 500 }
    );
  }

  if (action === "save") {
    const socials = normalizeSocials(body?.socials);
    const failed = await update(user.id, { socials });
    if (failed) return failed;
    return NextResponse.json({ success: true, socials });
  }

  if (action === "go-live") {
    const platform = getPlatform(String(body?.platform ?? ""));
    if (!platform?.liveUrl) {
      return NextResponse.json({ error: "Pick TikTok, Instagram or YouTube." }, { status: 400 });
    }

    const { data: me } = await admin
      .from("player_profiles")
      .select("socials")
      .eq("id", user.id)
      .maybeSingle();

    if (!normalizeSocials(me?.socials)[platform.id]) {
      return NextResponse.json(
        { error: `Add your ${platform.label} username first, then go live.` },
        { status: 400 }
      );
    }

    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 80) : "";
    const failed = await update(user.id, {
      live_platform: platform.id,
      live_title: title || null,
      live_started_at: new Date().toISOString(),
    });
    if (failed) return failed;
    return NextResponse.json({ success: true });
  }

  if (action === "end-live") {
    const failed = await update(user.id, { live_platform: null, live_title: null, live_started_at: null });
    if (failed) return failed;
    return NextResponse.json({ success: true });
  }

  if (action === "admin-end-live") {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    const playerId = String(body?.playerId ?? "");
    if (!playerId) return NextResponse.json({ error: "Missing player." }, { status: 400 });
    const failed = await update(playerId, { live_platform: null, live_title: null, live_started_at: null });
    if (failed) return failed;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
