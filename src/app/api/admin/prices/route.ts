import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { getPricedItem, PRICED_ITEMS, type PriceMethod } from "@/lib/pricing/items";
import { getAllPrices } from "@/lib/pricing/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET   /api/admin/prices → every priced item with its default and current price
 * PATCH /api/admin/prices { itemKey, method, amount, active }  → save a price
 *       /api/admin/prices { itemKey, reset: true }              → back to default
 */
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const prices = await getAllPrices(createAdminSupabaseClient());

  return NextResponse.json({
    items: PRICED_ITEMS.map((item) => ({ ...item, current: prices[item.key] })),
  });
}

export async function PATCH(request: Request) {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const item = getPricedItem(String(body?.itemKey ?? ""));

  if (!item) {
    return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  if (body?.reset === true) {
    await admin.from("price_settings").delete().eq("item_key", item.key);
    return NextResponse.json({ success: true });
  }

  const method = String(body?.method ?? "") as PriceMethod;
  const amount = Math.round(Number(body?.amount));

  if (!item.allowedMethods.includes(method)) {
    return NextResponse.json({ error: "That payment type isn't allowed for this item." }, { status: 400 });
  }

  if (method !== "free" && (!Number.isFinite(amount) || amount <= 0)) {
    return NextResponse.json({ error: "Enter a price above zero." }, { status: 400 });
  }

  if (method === "naira" && (amount < 100 || amount > 10_000_000)) {
    return NextResponse.json(
      { error: "Real-money prices must be between ₦100 and ₦10,000,000." },
      { status: 400 }
    );
  }

  if (method === "cash" && amount > 1_000_000_000) {
    return NextResponse.json({ error: "That price is too high." }, { status: 400 });
  }

  const { error } = await admin.from("price_settings").upsert({
    item_key: item.key,
    method,
    amount: method === "free" ? 0 : amount,
    active: body?.active !== false,
    updated_at: new Date().toISOString(),
    updated_by: adminUser.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
