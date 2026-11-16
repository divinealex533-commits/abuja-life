import { NextResponse } from "next/server";

import { isCategory, isDistrict } from "@/lib/business/catalog";
import { cleanListingInput } from "@/lib/business/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const MAX_LISTINGS_PER_OWNER = 10;

/**
 * GET  /api/businesses/listings → my business listings with stats
 * POST /api/businesses/listings → create a listing (then pay to publish)
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false, listings: [] });

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("business_listings")
    .select(
      "id, name, category, district, emoji, description, address, phone, whatsapp, instagram, offer_text, plan, status, paid_until, reject_reason, views, visits, contacts, ad_views, created_at"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ loggedIn: true, listings: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in or create an account first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = cleanListingInput(body);

  if (input.name.length < 2) {
    return NextResponse.json({ error: "Enter your business name." }, { status: 400 });
  }
  if (!isCategory(input.category)) {
    return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  }
  if (!isDistrict(input.district)) {
    return NextResponse.json({ error: "Choose your district." }, { status: 400 });
  }
  if (input.description.length < 10) {
    return NextResponse.json({ error: "Describe your business (at least 10 characters)." }, { status: 400 });
  }
  if (!input.whatsapp && !input.phone) {
    return NextResponse.json({ error: "Add a WhatsApp or phone number so players can reach you." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { count } = await admin
    .from("business_listings")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if ((count ?? 0) >= MAX_LISTINGS_PER_OWNER) {
    return NextResponse.json({ error: "You've reached the maximum number of listings." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("business_listings")
    .insert({ ...input, owner_id: user.id, status: "pending_payment" })
    .select("id")
    .single();

  if (error) {
    console.error("Create listing error:", error);
    return NextResponse.json({ error: "Could not save your business." }, { status: 500 });
  }

  return NextResponse.json({ success: true, listingId: data.id });
}
