import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  NO_VIP,
  getRequestUser,
  getVipStatus,
  lagosDateKey,
} from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/vip/status
 * The player's VIP tier plus how many times each perk was used today.
 */
export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({
      loggedIn: false,
      vip: NO_VIP,
      perkUsesToday: {},
    });
  }

  try {
    const admin = createAdminSupabaseClient();

    const [vip, claimsResult] = await Promise.all([
      getVipStatus(admin, user.id),
      admin
        .from("vip_perk_claims")
        .select("perk_id, uses")
        .eq("user_id", user.id)
        .eq("claim_date", lagosDateKey()),
    ]);

    const perkUsesToday: Record<string, number> = {};

    for (const row of claimsResult.data ?? []) {
      perkUsesToday[row.perk_id] = Number(row.uses) || 0;
    }

    return NextResponse.json({
      loggedIn: true,
      vip,
      perkUsesToday,
    });
  } catch (error) {
    console.error("VIP status error:", error);

    return NextResponse.json(
      { loggedIn: true, vip: NO_VIP, perkUsesToday: {} },
      { status: 200 }
    );
  }
}
