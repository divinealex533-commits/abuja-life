import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ALLOWED_PRIORITIES = new Set([
  "normal",
  "important",
  "urgent",
]);

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1000;

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .select(
        `
          id,
          title,
          message,
          type,
          priority,
          is_active,
          created_by,
          created_at,
          expires_at
        `
      )
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
          error:
            "Unable to load announcements.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        announcements: data ?? [],
        count: data?.length ?? 0,
        generatedAt:
          new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin announcement access error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Admin access required.",
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

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const title = String(
      body.title ?? ""
    ).trim();

    const message = String(
      body.message ?? ""
    ).trim();

    const priority =
      typeof body.priority === "string" &&
      ALLOWED_PRIORITIES.has(
        body.priority
      )
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

    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          error:
            `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.length >
      MAX_MESSAGE_LENGTH
    ) {
      return NextResponse.json(
        {
          error:
            `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Admin authorization is checked above first.
     * The service-role client is then used for the
     * database write so public announcement RLS does
     * not accidentally block legitimate admin actions.
     */
    const supabase =
      createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .insert({
        title,
        message,
        type: "info",
        priority,
        is_active: true,
        created_by: admin.id,
      })
      .select(
        `
          id,
          title,
          message,
          type,
          priority,
          is_active,
          created_by,
          created_at,
          expires_at
        `
      )
      .single();

    if (error) {
      console.error(
        "Announcement creation error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to create announcement.",
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
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin announcement POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
