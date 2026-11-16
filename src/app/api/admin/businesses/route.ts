import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET   /api/admin/businesses?status=pending_review|active|all
 * PATCH /api/admin/businesses { id, action: "approve" | "reject" | "pause" | "resume" | "comp", reason?, days? }
 */
export async function GET(request: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const status = new URL(request.url).searchParams.get("status") ?? "all";

  let query = admin
    .from("business_listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (status !== "all") query = query.eq("status", status);

  const [{ data: listings }, { data: adPayments }] = await Promise.all([
    query,
    admin
      .from("payment_transactions")
      .select("amount, status, metadata, paid_at")
      .eq("purpose", "business_promotion")
      .eq("status", "success")
      .limit(1000),
  ]);

  const now = Date.now();
  const all = listings ?? [];

  return NextResponse.json({
    listings: all,
    summary: {
      pendingReview: all.filter((l) => l.status === "pending_review").length,
      live: all.filter((l) => l.status === "active" && new Date(l.paid_until).getTime() > now).length,
      adRevenue: (adPayments ?? []).reduce((t, p) => t + Number(p.amount || 0), 0),
      adPayments: (adPayments ?? []).length,
    },
  });
}

async function notifyOwner(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  ownerId: string,
  title: string,
  message: string
) {
  await admin.from("notifications").insert({
    player_id: ownerId,
    type: "system",
    title,
    message,
    action_url: "/advertise/my",
    actor_id: null,
  });
}

export async function PATCH(request: Request) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  const action = String(body?.action ?? "");
  const admin = createAdminSupabaseClient();

  const { data: listing } = await admin
    .from("business_listings")
    .select("id, owner_id, name, status, paid_until")
    .eq("id", id)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  let update: Record<string, unknown> | null = null;
  let note: [string, string] | null = null;

  if (action === "approve") {
    update = { status: "active", reviewed_at: nowIso, reject_reason: null };
    note = [`${listing.name} is now live in Abuja Life 🎉`, "Players can now find and visit your business."];
  } else if (action === "reject") {
    const reason = String(body?.reason ?? "").trim().slice(0, 300) || "Your listing did not meet our guidelines.";
    update = { status: "rejected", reviewed_at: nowIso, reject_reason: reason };
    note = [`${listing.name} was not approved`, reason];
  } else if (action === "pause") {
    update = { status: "paused" };
  } else if (action === "resume") {
    update = { status: "active" };
  } else if (action === "comp") {
    // Gift free days (e.g. launch promo or to make up for downtime).
    const days = Math.round(Number(body?.days));
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: "Enter 1–365 days." }, { status: 400 });
    }
    const base = Math.max(Date.now(), listing.paid_until ? new Date(listing.paid_until).getTime() : 0);
    update = {
      paid_until: new Date(base + days * 86_400_000).toISOString(),
      status: listing.status === "pending_payment" ? "pending_review" : listing.status,
    };
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { error } = await admin.from("business_listings").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (note) await notifyOwner(admin, listing.owner_id, note[0], note[1]);

  console.info("Business listing admin action", { by: adminUser.id, id, action });
  return NextResponse.json({ success: true });
}
