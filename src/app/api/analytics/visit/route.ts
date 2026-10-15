import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function cleanPath(value: string | null) {
  if (!value) return "/";

  const path = value.trim();

  if (!path.startsWith("/")) {
    return "/";
  }

  return path.slice(0, 500);
}

function cleanVisitorId(value: string | null) {
  if (!value) return null;

  const id = value.trim();

  if (id.length < 10 || id.length > 200) {
    return null;
  }

  return id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const visitorId = cleanVisitorId(body?.visitorId);
    const pagePath = cleanPath(body?.pagePath);

    if (!visitorId) {
      return NextResponse.json(
        { error: "Visitor ID is required." },
        { status: 400 }
      );
    }

    let userId: string | null = null;

    try {
      const supabase = await createServerSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      userId = user?.id ?? null;
    } catch {
      // Anonymous visitors are allowed.
    }

    const supabaseAdmin = createAdminSupabaseClient();

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("site_visitors")
      .select("id, visit_count")
      .eq("visitor_id", visitorId)
      .eq("visit_date", today)
      .maybeSingle();

    if (existingError) {
      console.error("Visitor lookup error:", existingError);

      return NextResponse.json(
        { error: "Unable to record visitor." },
        { status: 500 }
      );
    }

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("site_visitors")
        .update({
          user_id: userId,
          page_path: pagePath,
          last_seen_at: new Date().toISOString(),
          visit_count: Number(existing.visit_count ?? 0) + 1,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Visitor update error:", updateError);

        return NextResponse.json(
          { error: "Unable to update visitor." },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("site_visitors")
        .insert({
          visitor_id: visitorId,
          user_id: userId,
          page_path: pagePath,
          visit_date: today,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          visit_count: 1,
        });

      if (insertError) {
        console.error("Visitor insert error:", insertError);

        return NextResponse.json(
          { error: "Unable to record visitor." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);

    return NextResponse.json(
      { error: "Visitor tracking failed." },
      { status: 500 }
    );
  }
}
