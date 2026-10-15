import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function startOfTodayUTC() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  ).toISOString();
}

function startOfMonthUTC() {
  const now = new Date();

  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
}

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    const todayStart = startOfTodayUTC();
    const monthStart = startOfMonthUTC();

    const [
      totalResult,
      todayResult,
      monthResult,
      recentResult,
    ] = await Promise.all([
      supabase
        .from("site_visitors")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("site_visitors")
        .select("id", { count: "exact", head: true })
        .gte("first_seen_at", todayStart),

      supabase
        .from("site_visitors")
        .select("id", { count: "exact", head: true })
        .gte("first_seen_at", monthStart),

      supabase
        .from("site_visitors")
        .select(
          "id, visitor_id, user_id, page_path, visit_date, first_seen_at, last_seen_at, visit_count"
        )
        .order("last_seen_at", { ascending: false })
        .limit(100),
    ]);

    if (totalResult.error) {
      throw totalResult.error;
    }

    if (todayResult.error) {
      throw todayResult.error;
    }

    if (monthResult.error) {
      throw monthResult.error;
    }

    if (recentResult.error) {
      throw recentResult.error;
    }

    return NextResponse.json({
      totalVisitors: totalResult.count ?? 0,
      visitorsToday: todayResult.count ?? 0,
      visitorsThisMonth: monthResult.count ?? 0,
      recentVisitors: recentResult.data ?? [],
    });
  } catch (error) {
    console.error("Admin visitors error:", error);

    return NextResponse.json(
      {
        error: "Unable to load visitor analytics.",
      },
      {
        status: 500,
      }
    );
  }
}
