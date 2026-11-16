import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 500;
const MAX_PER_ANNOUNCEMENT = 10;

/**
 * GET  /api/announcements/replies → my replies (and the admin's answers)
 * POST /api/announcements/replies { announcementId, message }
 * Replies are private: only the player and the admin can see them.
 */
export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ loggedIn: false, replies: [] });
  }

  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from("announcement_replies")
    .select("id, announcement_id, message, admin_reply, admin_replied_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(200);

  return NextResponse.json({ loggedIn: true, replies: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in to reply." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const announcementId = String(body?.announcementId ?? "");
  const message = String(body?.message ?? "").trim();

  if (!message) {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }

  if (message.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Keep it under ${MAX_LENGTH} characters.` }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data: announcement } = await admin
    .from("admin_announcements")
    .select("id, is_active")
    .eq("id", announcementId)
    .maybeSingle();

  if (!announcement || announcement.is_active !== true) {
    return NextResponse.json({ error: "This announcement is closed." }, { status: 404 });
  }

  // Anti-spam: one reply every 30 seconds, max 10 per announcement.
  const since = new Date(Date.now() - 30_000).toISOString();

  const [{ count: recent }, { count: total }] = await Promise.all([
    admin
      .from("announcement_replies")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", since),
    admin
      .from("announcement_replies")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("announcement_id", announcementId),
  ]);

  if ((recent ?? 0) > 0) {
    return NextResponse.json({ error: "Please wait a few seconds before sending again." }, { status: 429 });
  }

  if ((total ?? 0) >= MAX_PER_ANNOUNCEMENT) {
    return NextResponse.json(
      { error: "You've sent the maximum replies to this announcement." },
      { status: 429 }
    );
  }

  const { data, error } = await admin
    .from("announcement_replies")
    .insert({ announcement_id: announcementId, user_id: user.id, message })
    .select("id, announcement_id, message, admin_reply, admin_replied_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not send your reply." }, { status: 500 });
  }

  return NextResponse.json({ success: true, reply: data });
}
