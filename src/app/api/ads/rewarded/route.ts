import { NextResponse } from "next/server";

import { bumpListingStat, getLiveListings } from "@/lib/business/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  applyPlayerDelta,
  friendlyEconomyError,
  getRequestUser,
  lagosDateKey,
} from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/** Seconds between two ads for the same player. */
const COOLDOWN_SECONDS = 45;

type AdSettings = {
  rewarded_ads_enabled: boolean;
  rewarded_ad_seconds: number;
  rewarded_ad_daily_limit: number;
  rewarded_ad_cash: number;
  rewarded_ad_energy: number;
};

async function loadSettings(admin: ReturnType<typeof createAdminSupabaseClient>): Promise<AdSettings> {
  const { data } = await admin
    .from("admin_game_settings")
    .select("rewarded_ads_enabled, rewarded_ad_seconds, rewarded_ad_daily_limit, rewarded_ad_cash, rewarded_ad_energy")
    .eq("id", 1)
    .maybeSingle();

  return {
    rewarded_ads_enabled: data?.rewarded_ads_enabled !== false,
    rewarded_ad_seconds: Number(data?.rewarded_ad_seconds ?? 15),
    rewarded_ad_daily_limit: Number(data?.rewarded_ad_daily_limit ?? 5),
    rewarded_ad_cash: Number(data?.rewarded_ad_cash ?? 1000),
    rewarded_ad_energy: Number(data?.rewarded_ad_energy ?? 15),
  };
}

/** Start of today in Abuja, as an ISO timestamp. */
function lagosDayStartIso(): string {
  return new Date(`${lagosDateKey()}T00:00:00+01:00`).toISOString();
}

async function claimedToday(admin: ReturnType<typeof createAdminSupabaseClient>, userId: string) {
  const { count } = await admin
    .from("ad_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("claimed_at", "is", null)
    .gte("claimed_at", lagosDayStartIso());
  return count ?? 0;
}

/** GET /api/ads/rewarded → how many ads are left today and what they pay. */
export async function GET() {
  const user = await getRequestUser();
  const admin = createAdminSupabaseClient();
  const settings = await loadSettings(admin);

  const used = user ? await claimedToday(admin, user.id) : 0;

  return NextResponse.json({
    loggedIn: Boolean(user),
    enabled: settings.rewarded_ads_enabled,
    seconds: settings.rewarded_ad_seconds,
    cash: settings.rewarded_ad_cash,
    energy: settings.rewarded_ad_energy,
    remaining: Math.max(0, settings.rewarded_ad_daily_limit - used),
    limit: settings.rewarded_ad_daily_limit,
  });
}

/**
 * POST /api/ads/rewarded { action: "start" }
 * POST /api/ads/rewarded { action: "claim", sessionId, rewardType: "cash" | "energy" }
 */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Log in to earn rewards." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();
  const settings = await loadSettings(admin);

  if (!settings.rewarded_ads_enabled) {
    return NextResponse.json({ error: "Rewarded ads are off right now." }, { status: 403 });
  }

  if (body?.action === "start") {
    if ((await claimedToday(admin, user.id)) >= settings.rewarded_ad_daily_limit) {
      return NextResponse.json({ error: "You've watched all your ads for today. Come back tomorrow!" }, { status: 429 });
    }

    const { data: last } = await admin
      .from("ad_sessions")
      .select("started_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last && Date.now() - new Date(last.started_at).getTime() < COOLDOWN_SECONDS * 1000) {
      return NextResponse.json({ error: "Take a short break before the next ad." }, { status: 429 });
    }

    // Premium advertisers fill rewarded ads; otherwise show a house ad.
    const premium = await getLiveListings(admin, { minPlan: "premium", limit: 10 });
    const listing = premium[0] ?? null;
    const kind = body?.network === true ? "network" : listing ? "business" : "house";

    const { data: session, error } = await admin
      .from("ad_sessions")
      .insert({ user_id: user.id, listing_id: kind === "business" ? listing?.id : null, kind })
      .select("id, started_at")
      .single();

    if (error) return NextResponse.json({ error: "Could not start the ad." }, { status: 500 });

    return NextResponse.json({
      sessionId: session.id,
      seconds: kind === "network" ? 5 : settings.rewarded_ad_seconds,
      kind,
      listing: kind === "business" ? listing : null,
      cash: settings.rewarded_ad_cash,
      energy: settings.rewarded_ad_energy,
    });
  }

  if (body?.action === "claim") {
    const sessionId = String(body?.sessionId ?? "");
    const rewardType = body?.rewardType === "energy" ? "energy" : "cash";

    const { data: session } = await admin
      .from("ad_sessions")
      .select("id, user_id, listing_id, kind, started_at, claimed_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Ad not found." }, { status: 404 });
    }
    if (session.claimed_at) {
      return NextResponse.json({ error: "Reward already collected." }, { status: 409 });
    }

    const minSeconds = session.kind === "network" ? 5 : settings.rewarded_ad_seconds;
    const watched = (Date.now() - new Date(session.started_at).getTime()) / 1000;
    if (watched < minSeconds - 1) {
      return NextResponse.json({ error: "Watch the whole ad to get the reward." }, { status: 400 });
    }
    if (watched > 15 * 60) {
      return NextResponse.json({ error: "This ad expired. Start a new one." }, { status: 400 });
    }

    if ((await claimedToday(admin, user.id)) >= settings.rewarded_ad_daily_limit) {
      return NextResponse.json({ error: "Daily ad limit reached." }, { status: 429 });
    }

    const reward = rewardType === "energy" ? settings.rewarded_ad_energy : settings.rewarded_ad_cash;

    // Only one request can claim a session.
    const { data: claimed } = await admin
      .from("ad_sessions")
      .update({ claimed_at: new Date().toISOString(), reward_type: rewardType, reward })
      .eq("id", session.id)
      .is("claimed_at", null)
      .select("id");

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ error: "Reward already collected." }, { status: 409 });
    }

    if (session.listing_id) await bumpListingStat(admin, [session.listing_id], "ad_views");

    try {
      const player = await applyPlayerDelta(
        admin,
        user.id,
        rewardType === "energy" ? { energy: reward } : { cash: reward }
      );
      return NextResponse.json({ success: true, rewardType, reward, player });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      return NextResponse.json({ error: friendlyEconomyError(message) }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
