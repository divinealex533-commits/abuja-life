import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const NUMBER_FIELDS: Record<string, [number, number]> = {
  marketplace_fee_percent: [0, 30],
  rewarded_ad_seconds: [5, 120],
  rewarded_ad_daily_limit: [0, 50],
  rewarded_ad_cash: [0, 1_000_000],
  rewarded_ad_energy: [0, 200],
  referral_reward_referrer: [0, 10_000_000],
  referral_reward_new_player: [0, 10_000_000],
};

const SETTINGS_SELECT = `rewarded_ads_enabled, ${Object.keys(NUMBER_FIELDS).join(", ")}`;

/**
 * GET   /api/admin/earnings → earning settings + stats
 * PATCH /api/admin/earnings → update settings
 */
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [settings, revenue, fees, adsWatched, referrals, rewardedReferrals, cosmetics] = await Promise.all([
    admin.from("admin_game_settings").select(SETTINGS_SELECT).eq("id", 1).maybeSingle(),
    admin.from("payment_transactions").select("amount, purpose, metadata").eq("status", "success").gte("created_at", since30).limit(5000),
    admin.from("marketplace_fees").select("fee").gte("created_at", since30).limit(5000),
    admin.from("ad_sessions").select("id", { count: "exact", head: true }).not("claimed_at", "is", null).gte("started_at", since30),
    admin.from("referrals").select("referred_id", { count: "exact", head: true }),
    admin.from("referrals").select("referred_id", { count: "exact", head: true }).eq("status", "rewarded"),
    admin.from("player_cosmetics").select("user_id", { count: "exact", head: true }),
  ]);

  const byType: Record<string, number> = {};
  for (const p of revenue.data ?? []) {
    const productId = String((p.metadata as Record<string, unknown> | null)?.product_id ?? "");
    const type = productId.startsWith("ad:")
      ? "Business ads"
      : productId.startsWith("cosmetic:")
        ? "Style shop"
        : productId.startsWith("vip_") || productId === "starter_pack"
          ? "VIP"
          : productId.startsWith("cash_bundle")
            ? "Cash bundles"
            : productId.startsWith("venue:")
              ? "VIP places"
              : productId.startsWith("career:") || productId.startsWith("job:")
                ? "Job licences"
                : "Other";
    byType[type] = (byType[type] ?? 0) + Number(p.amount || 0);
  }

  return NextResponse.json({
    settings: settings.data,
    stats: {
      revenue30d: Object.values(byType).reduce((a, b) => a + b, 0),
      revenueByType: byType,
      marketplaceFees30d: (fees.data ?? []).reduce((t, f) => t + Number(f.fee || 0), 0),
      adsWatched30d: adsWatched.count ?? 0,
      referrals: referrals.count ?? 0,
      referralsRewarded: rewardedReferrals.count ?? 0,
      cosmeticsSold: cosmetics.count ?? 0,
    },
  });
}

export async function PATCH(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  for (const [field, [min, max]] of Object.entries(NUMBER_FIELDS)) {
    if (body && field in body) {
      const value = Math.round(Number(body[field]));
      if (!Number.isFinite(value) || value < min || value > max) {
        return NextResponse.json({ error: `${field} must be between ${min} and ${max}.` }, { status: 400 });
      }
      updates[field] = value;
    }
  }

  if (body && "rewarded_ads_enabled" in body) {
    updates.rewarded_ads_enabled = body.rewarded_ads_enabled === true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  updates.updated_by = adminUser.id;

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("admin_game_settings").update(updates).eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
