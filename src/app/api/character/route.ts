import { NextResponse } from "next/server";

import { normalizeAppearance } from "@/lib/character/appearance";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/** GET → my saved look (and whether I've designed one yet). */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false });

  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("player_profiles")
    .select("display_name, appearance")
    .eq("id", user.id)
    .maybeSingle();

  const saved = data?.appearance && Object.keys(data.appearance).length > 0;
  return NextResponse.json({
    loggedIn: true,
    name: data?.display_name ?? "Player",
    designed: Boolean(saved),
    appearance: normalizeAppearance(data?.appearance),
  });
}

/** POST { appearance } → save my look. */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const appearance = normalizeAppearance(body?.appearance);

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("player_profiles").update({ appearance }).eq("id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't save your look. Try again." }, { status: 500 });

  return NextResponse.json({ success: true, appearance });
}
