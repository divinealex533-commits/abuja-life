import { NextResponse } from "next/server";

import { getAllPrices } from "@/lib/pricing/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET /api/prices → current price of every item (public). */
export async function GET() {
  try {
    const prices = await getAllPrices(createAdminSupabaseClient());
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Prices load error:", error);
    return NextResponse.json({ prices: {} }, { status: 500 });
  }
}
