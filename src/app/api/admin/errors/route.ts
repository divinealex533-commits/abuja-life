import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function guard() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
}

/** GET /api/admin/errors?show=open|all → error log, newest first. */
export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const show = new URL(request.url).searchParams.get("show");
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("error_logs")
    .select("id, source, message, stack, path, user_id, user_agent, occurrences, first_seen_at, last_seen_at, resolved")
    .order("last_seen_at", { ascending: false })
    .limit(200);
  if (show !== "all") query = query.eq("resolved", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, errors: [] }, { status: 500 });
  return NextResponse.json({ errors: data ?? [] });
}

/** POST /api/admin/errors { id } or { all: true } → mark fixed. */
export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();
  let query = admin.from("error_logs").update({ resolved: true });
  query = body?.all ? query.eq("resolved", false) : query.eq("id", String(body?.id ?? ""));
  const { error } = await query;
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true });
}
