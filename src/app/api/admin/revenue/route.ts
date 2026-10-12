import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();

    const { data: events, error } = await supabase
      .from("admin_revenue_events")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(100);

    if (error) {
      console.error("Admin revenue GET error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const revenueEvents = events ?? [];

    const completed = revenueEvents.filter(
      (event) => event.status === "completed"
    );

    const pending = revenueEvents.filter(
      (event) => event.status === "pending"
    );

    const refunded = revenueEvents.filter(
      (event) => event.status === "refunded"
    );

    const totalRevenue = completed.reduce(
      (total, event) =>
        total + Number(event.amount ?? 0),
      0
    );

    const pendingRevenue = pending.reduce(
      (total, event) =>
        total + Number(event.amount ?? 0),
      0
    );

    const refundedRevenue = refunded.reduce(
      (total, event) =>
        total + Number(event.amount ?? 0),
      0
    );

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const todayRevenue = completed
      .filter(
        (event) =>
          new Date(event.created_at) >=
          todayStart
      )
      .reduce(
        (total, event) =>
          total + Number(event.amount ?? 0),
        0
      );

    const monthRevenue = completed
      .filter(
        (event) =>
          new Date(event.created_at) >=
          monthStart
      )
      .reduce(
        (total, event) =>
          total + Number(event.amount ?? 0),
        0
      );

    const sourceTotals: Record<string, number> = {};

    for (const event of completed) {
      const source = event.source ?? "other";

      sourceTotals[source] =
        (sourceTotals[source] ?? 0) +
        Number(event.amount ?? 0);
    }

    return NextResponse.json({
      summary: {
        totalRevenue,
        todayRevenue,
        monthRevenue,
        pendingRevenue,
        refundedRevenue,
        completedCount: completed.length,
        pendingCount: pending.length,
        refundedCount: refunded.length,
      },

      sourceTotals,

      events: revenueEvents,
    });
  } catch (error) {
    console.error(
      "Admin revenue access error:",
      error
    );

    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
