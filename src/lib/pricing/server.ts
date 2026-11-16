// Abuja Life — server-side prices (defaults + your admin changes).
// Never import this from a "use client" file.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  defaultPrice,
  getPricedItem,
  PRICED_ITEMS,
  type EffectivePrice,
  type PriceMethod,
} from "@/lib/pricing/items";

type Row = { item_key: string; method: string; amount: number | string; active: boolean };

function merge(row: Row | undefined, key: string): EffectivePrice | null {
  const item = getPricedItem(key);
  if (!item) return null;
  const fallback = defaultPrice(item);
  if (!row) return fallback;

  const method = item.allowedMethods.includes(row.method as PriceMethod)
    ? (row.method as PriceMethod)
    : fallback.method;

  const amount = Number(row.amount);

  return {
    method,
    amount: Number.isFinite(amount) && amount >= 0 ? Math.round(amount) : fallback.amount,
    active: row.active !== false,
  };
}

export async function getAllPrices(
  admin: SupabaseClient
): Promise<Record<string, EffectivePrice>> {
  const { data } = await admin
    .from("price_settings")
    .select("item_key, method, amount, active");

  const rows = new Map<string, Row>(
    ((data as Row[] | null) ?? []).map((row) => [row.item_key, row])
  );

  const prices: Record<string, EffectivePrice> = {};

  for (const item of PRICED_ITEMS) {
    const price = merge(rows.get(item.key), item.key);
    if (price) prices[item.key] = price;
  }

  return prices;
}

export async function getPrice(
  admin: SupabaseClient,
  key: string
): Promise<EffectivePrice | null> {
  if (!getPricedItem(key)) return null;

  const { data } = await admin
    .from("price_settings")
    .select("item_key, method, amount, active")
    .eq("item_key", key)
    .maybeSingle();

  return merge((data as Row | null) ?? undefined, key);
}
