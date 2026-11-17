import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET → billboards currently showing in the city. Public. */
export async function GET() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("billboards")
    .select("id, advertiser, headline, subtext, link_url, color, slot, ends_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ billboards: [] });

  const now = Date.now();
  const showing = (data ?? []).filter((b) => !b.ends_at || new Date(b.ends_at).getTime() > now);

  return NextResponse.json(
    { billboards: showing },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
