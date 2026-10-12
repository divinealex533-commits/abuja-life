import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET() {
  try {
    await requireAdmin();

    const supabase =
      await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

    if (error) {
      console.error(
        "Admin announcement GET error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      announcements: data ?? [],
    });
  } catch (error) {
    console.error(
      "Admin announcement access error:",
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

export async function POST(
  request: Request
) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();

    const title = String(
      body.title ?? ""
    ).trim();

    const message = String(
      body.message ?? ""
    ).trim();

    const priority =
      body.priority === "urgent" ||
      body.priority === "important"
        ? body.priority
        : "normal";

    if (!title || !message) {
      return NextResponse.json(
        {
          error:
            "Title and message are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (title.length > 120) {
      return NextResponse.json(
        {
          error:
            "Title cannot exceed 120 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Message cannot exceed 1000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .insert({
        title,
        message,
        priority,
        is_active: true,
        created_by: admin.id,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Announcement creation error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        announcement: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Admin announcement POST error:",
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
