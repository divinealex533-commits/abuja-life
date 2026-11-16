import { NextResponse } from "next/server";

import { isAdPlan, isDistrict } from "@/lib/business/catalog";
import { bumpListingStat, getLiveListings } from "@/lib/business/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/businesses?district=wuse&minPlan=featured&limit=6
 * Live sponsored businesses for players. Counts a view for each one shown.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const district = url.searchParams.get("district") ?? "";
  const minPlan = url.searchParams.get("minPlan") ?? "";
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));

  try {
    const admin = createAdminSupabaseClient();

    const listings = await getLiveListings(admin, {
      district: isDistrict(district) ? district : undefined,
      minPlan: isAdPlan(minPlan) ? minPlan : undefined,
      limit,
    });

    await bumpListingStat(
      admin,
      listings.map((l) => l.id),
      "views"
    );

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Business listings error:", error);
    return NextResponse.json({ listings: [] });
  }
}
