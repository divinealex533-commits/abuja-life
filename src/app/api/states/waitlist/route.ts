import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getState } from "@/lib/world/states";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

/** GET → waitlist counts per state + the states I joined. */
export async function GET() {
  const user = await getRequestUser();
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("state_waitlist").select("state_id, user_id").limit(50000);

  const counts: Record<string, number> = {};
  const mine: string[] = [];
  for (const row of data ?? []) {
    counts[row.state_id] = (counts[row.state_id] ?? 0) + 1;
    if (user && row.user_id === user.id) mine.push(row.state_id);
  }
  return NextResponse.json({ loggedIn: Boolean(user), counts, mine });
}

/** POST { stateId } → join (or leave) the "notify me" list for a coming-soon state. */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Log in to get notified." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const state = getState(String(body?.stateId ?? ""));
  if (!state || state.status === "live") return NextResponse.json({ error: "Pick a coming-soon state." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin
    .from("state_waitlist")
    .select("state_id")
    .eq("state_id", state.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await admin.from("state_waitlist").delete().eq("state_id", state.id).eq("user_id", user.id);
    return NextResponse.json({ success: true, joined: false });
  }

  const { error } = await admin.from("state_waitlist").insert({ state_id: state.id, user_id: user.id });
  if (error) return NextResponse.json({ error: "Couldn't join the list." }, { status: 500 });
  return NextResponse.json({ success: true, joined: true });
}
