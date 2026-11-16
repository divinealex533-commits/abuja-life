import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { STORE_PRODUCTS, VIP_TIERS, type VipTier } from "@/lib/vip/catalog";

export const dynamic = "force-dynamic";

/**
 * GET   /api/admin/vip  → VIP members, sales by product, weekend settings
 * PATCH /api/admin/vip  → { action: "weekend_settings", ... }
 *                         { action: "grant_vip", userId, tier, days }
 */
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  const [members, fulfillments, settings, weekendClaims] = await Promise.all([
    admin
      .from("vip_memberships")
      .select("user_id, tier, started_at, expires_at")
      .gt("expires_at", nowIso)
      .order("expires_at", { ascending: false })
      .limit(500),
    admin
      .from("payment_fulfillments")
      .select("reference, user_id, product_id, status, error, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    admin
      .from("weekend_reward_settings")
      .select("enabled, saturday_amount, sunday_amount, both_days_bonus, updated_at")
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("weekend_reward_claims")
      .select("amount, claim_date")
      .gte(
        "claim_date",
        new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10)
      ),
  ]);

  const activeMembers = members.data ?? [];
  const delivered = (fulfillments.data ?? []).filter((f) => f.status === "completed");

  const tierCounts: Record<VipTier, number> = { silver: 0, gold: 0, diamond: 0 };
  for (const m of activeMembers) {
    if (m.tier in tierCounts) tierCounts[m.tier as VipTier] += 1;
  }

  const salesByProduct = STORE_PRODUCTS.map((product) => {
    const count = delivered.filter((f) => f.product_id === product.id).length;
    return {
      productId: product.id,
      name: product.name,
      price: product.priceNaira,
      count,
      revenue: count * product.priceNaira,
    };
  });

  return NextResponse.json({
    activeMembers,
    tierCounts,
    salesByProduct,
    totalStoreRevenue: salesByProduct.reduce((t, p) => t + p.revenue, 0),
    failedDeliveries: (fulfillments.data ?? []).filter((f) => f.status === "failed"),
    weekendSettings: settings.data,
    weekendPaidOutLast14Days: (weekendClaims.data ?? []).reduce(
      (t, c) => t + Number(c.amount || 0),
      0
    ),
    weekendClaimsLast14Days: (weekendClaims.data ?? []).length,
  });
}

function toAmount(value: unknown, max: number): number | null {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return n;
}

export async function PATCH(request: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.action === "weekend_settings") {
    const saturday = toAmount(body.saturday_amount, 10_000_000);
    const sunday = toAmount(body.sunday_amount, 10_000_000);
    const bonus = toAmount(body.both_days_bonus, 10_000_000);

    if (saturday === null || sunday === null || bonus === null) {
      return NextResponse.json({ error: "Enter valid amounts." }, { status: 400 });
    }

    const { error } = await admin.from("weekend_reward_settings").upsert({
      id: 1,
      enabled: body.enabled === true,
      saturday_amount: saturday,
      sunday_amount: sunday,
      both_days_bonus: bonus,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (body?.action === "grant_vip") {
    const userId = String(body.userId ?? "").trim();
    const tier = String(body.tier ?? "") as VipTier;
    const days = toAmount(body.days, 365);

    if (!/^[0-9a-f-]{36}$/i.test(userId) || !VIP_TIERS[tier] || !days) {
      return NextResponse.json(
        { error: "Enter a valid player ID, tier and 1–365 days." },
        { status: 400 }
      );
    }

    const { error } = await admin.rpc("abuja_grant_purchase", {
      p_user_id: userId,
      p_tier: tier,
      p_days: days,
      p_cash: 0,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info("Admin granted VIP", { by: adminUser.id, userId, tier, days });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
