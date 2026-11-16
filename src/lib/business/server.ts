// Abuja Life — business listings, server helpers. Server only.

import type { SupabaseClient } from "@supabase/supabase-js";

import { AD_PLANS, type AdPlanId, type PublicListing } from "@/lib/business/catalog";

export const LISTING_PUBLIC_COLUMNS =
  "id, name, category, district, emoji, description, address, phone, whatsapp, instagram, offer_text, plan";

type ListingRow = {
  id: string;
  name: string;
  category: string;
  district: string;
  emoji: string;
  description: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  offer_text: string | null;
  plan: AdPlanId;
};

export function toPublicListing(row: ListingRow): PublicListing {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    district: row.district,
    emoji: row.emoji,
    description: row.description,
    address: row.address,
    phone: row.phone,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    offerText: row.offer_text,
    plan: row.plan,
  };
}

/** Live listings, best plan first (premium → featured → basic), then shuffled. */
export async function getLiveListings(
  admin: SupabaseClient,
  options: { district?: string; minPlan?: AdPlanId; limit?: number } = {}
): Promise<PublicListing[]> {
  let query = admin
    .from("business_listings")
    .select(LISTING_PUBLIC_COLUMNS)
    .eq("status", "active")
    .gt("paid_until", new Date().toISOString())
    .limit(200);

  if (options.district) query = query.eq("district", options.district);

  if (options.minPlan === "featured") query = query.in("plan", ["featured", "premium"]);
  if (options.minPlan === "premium") query = query.eq("plan", "premium");

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = (data as ListingRow[]).map(toPublicListing);

  // Shuffle so every business in the same plan gets fair exposure.
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  rows.sort((a, b) => AD_PLANS[b.plan].rank - AD_PLANS[a.plan].rank);

  return rows.slice(0, options.limit ?? 50);
}

export async function bumpListingStat(
  admin: SupabaseClient,
  ids: string[],
  stat: "views" | "visits" | "contacts" | "ad_views"
) {
  if (ids.length === 0) return;
  await admin.rpc("abuja_bump_listing_stat", { p_ids: ids, p_stat: stat });
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function cleanPhone(value: unknown): string | null {
  const text = String(value ?? "").replace(/[^0-9+ ]/g, "").trim();
  return text.length >= 7 ? text.slice(0, 20) : null;
}

export function cleanListingInput(body: Record<string, unknown> | null) {
  const instagram = cleanText(body?.instagram, 40).replace(/^@/, "");
  return {
    name: cleanText(body?.name, 60),
    category: cleanText(body?.category, 20),
    district: cleanText(body?.district, 30),
    emoji: cleanText(body?.emoji, 8) || "🏪",
    description: cleanText(body?.description, 300),
    address: cleanText(body?.address, 160),
    phone: cleanPhone(body?.phone),
    whatsapp: cleanPhone(body?.whatsapp),
    instagram: /^[A-Za-z0-9._]{1,30}$/.test(instagram) ? instagram : null,
    offer_text: cleanText(body?.offerText, 120) || null,
  };
}
