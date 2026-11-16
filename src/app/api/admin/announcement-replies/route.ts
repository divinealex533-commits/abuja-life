import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET   /api/admin/announcement-replies?filter=unread|unanswered|all&announcementId=
 * PATCH { id, adminReply?, markRead? }   (also { markAllRead: true })
 */
export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const announcementId = url.searchParams.get("announcementId");

  let query = admin
    .from("announcement_replies")
    .select("id, announcement_id, user_id, message, admin_reply, admin_replied_at, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (filter === "unread") query = query.eq("is_read", false);
  if (filter === "unanswered") query = query.is("admin_reply", null);
  if (announcementId) query = query.eq("announcement_id", announcementId);

  const [{ data: replies, error }, { data: announcements }, { count: unread }] = await Promise.all([
    query,
    admin
      .from("admin_announcements")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("announcement_replies")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((replies ?? []).map((r) => r.user_id))];

  const { data: profiles } = userIds.length
    ? await admin.from("player_profiles").select("id, username, display_name, avatar").in("id", userIds)
    : { data: [] };

  type Profile = { id: string; username: string | null; display_name: string | null; avatar: string | null };
  const people = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
  const titles = new Map(
    ((announcements ?? []) as Array<{ id: string; title: string }>).map((a) => [a.id, a.title])
  );

  return NextResponse.json({
    unread: unread ?? 0,
    announcements: announcements ?? [],
    replies: (replies ?? []).map((r) => ({
      ...r,
      announcement_title: titles.get(r.announcement_id) ?? "Announcement",
      player_name: people.get(r.user_id)?.display_name || people.get(r.user_id)?.username || "Player",
      player_username: people.get(r.user_id)?.username ?? null,
      player_avatar: people.get(r.user_id)?.avatar ?? "🧑🏽",
    })),
  });
}

export async function PATCH(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.markAllRead === true) {
    await admin.from("announcement_replies").update({ is_read: true }).eq("is_read", false);
    return NextResponse.json({ success: true });
  }

  const id = String(body?.id ?? "");
  const { data: reply } = await admin
    .from("announcement_replies")
    .select("id, user_id, announcement_id")
    .eq("id", id)
    .maybeSingle();

  if (!reply) {
    return NextResponse.json({ error: "Reply not found." }, { status: 404 });
  }

  const update: Record<string, unknown> = { is_read: true };

  if (typeof body?.adminReply === "string") {
    const text = body.adminReply.trim();
    if (!text || text.length > 1000) {
      return NextResponse.json({ error: "Write an answer (max 1000 characters)." }, { status: 400 });
    }
    update.admin_reply = text;
    update.admin_replied_at = new Date().toISOString();
  }

  const { error } = await admin.from("announcement_replies").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Let the player know the admin answered (uses the game's notification bell).
  if (update.admin_reply) {
    await admin.from("notifications").insert({
      player_id: reply.user_id,
      type: "system",
      title: "Abuja Life admin replied to you",
      message: String(update.admin_reply).slice(0, 200),
      action_url: "/announcements",
      actor_id: null,
    });
  }

  return NextResponse.json({ success: true });
}
