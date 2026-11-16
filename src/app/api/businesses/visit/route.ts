import { NextResponse } from "next/server";

import { bumpListingStat } from "@/lib/business/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, getRequestUser, lagosDateKey } from "@/lib/vip/server";

const VISIT_REWARD = { energy: 5, reputation: 1 };

/**
 * POST /api/businesses/visit { listingId, action: "visit" | "contact" }
 * "visit": player checks in at the business (small reward, once a day each).
 * "contact": player tapped WhatsApp/phone/Instagram (counted for the owner).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const listingId = String(body?.listingId ?? "");
  const action = body?.action === "contact" ? "contact" : "visit";

  if (!/^[0-9a-f-]{36}$/i.test(listingId)) {
    return NextResponse.json({ error: "Unknown business." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: listing } = await admin
    .from("business_listings")
    .select("id, name, status, paid_until")
    .eq("id", listingId)
    .maybeSingle();

  const live =
    listing && listing.status === "active" && new Date(listing.paid_until).getTime() > Date.now();

  if (!live) {
    return NextResponse.json({ error: "This business isn't available." }, { status: 404 });
  }

  if (action === "contact") {
    await bumpListingStat(admin, [listingId], "contacts");
    return NextResponse.json({ success: true });
  }

  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Log in to check in." }, { status: 401 });
  }

  // Once per player, per business, per day.
  const { error: visitError } = await admin.from("business_listing_visits").insert({
    listing_id: listingId,
    user_id: user.id,
    visit_date: lagosDateKey(),
  });

  if (visitError) {
    return NextResponse.json(
      { error: `You already checked in at ${listing.name} today.` },
      { status: 429 }
    );
  }

  await bumpListingStat(admin, [listingId], "visits");

  try {
    const player = await applyPlayerDelta(admin, user.id, VISIT_REWARD);
    return NextResponse.json({
      success: true,
      rewardText: `+${VISIT_REWARD.energy} energy · +${VISIT_REWARD.reputation} reputation`,
      player,
    });
  } catch {
    return NextResponse.json({ success: true, rewardText: "Checked in!" });
  }
}
