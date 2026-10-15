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

const ANNOUNCEMENT_SELECT = `
  id,
  title,
  message,
  type,
  priority,
  is_active,
  created_by,
  created_at,
  expires_at
`;

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseOptionalExpiry(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function validateTitle(value: unknown) {
  const title = String(value ?? "").trim();

  if (!title) {
    return {
      error: "Title is required.",
    };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      error: `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`,
    };
  }

  return {
    value: title,
  };
}

function validateMessage(value: unknown) {
  const message = String(value ?? "").trim();

  if (!message) {
    return {
      error: "Message is required.",
    };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      error: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  return {
    value: message,
  };
}

function validatePriority(value: unknown) {
  if (
    typeof value !== "string" ||
    !ALLOWED_PRIORITIES.has(value)
  ) {
    return {
      error:
        "Priority must be normal, important, or urgent.",
    };
  }

  return {
    value,
  };
}

async function getAnnouncementId(request: Request) {
  const url = new URL(request.url);

  return url.searchParams.get("id")?.trim() ?? "";
}

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .select(ANNOUNCEMENT_SELECT)
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

    const titleResult =
      validateTitle(body.title);

    if (titleResult.error) {
      return NextResponse.json(
        {
          error: titleResult.error,
        },
        {
          status: 400,
        }
      );
    }

    const messageResult =
      validateMessage(body.message);

    if (messageResult.error) {
      return NextResponse.json(
        {
          error: messageResult.error,
        },
        {
          status: 400,
        }
      );
    }

    const priority =
      typeof body.priority === "string" &&
      ALLOWED_PRIORITIES.has(
        body.priority
      )
        ? body.priority
        : "normal";

    const expiresAt =
      parseOptionalExpiry(body.expires_at);

    if (
      expiresAt === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid expiration date.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("admin_announcements")
      .insert({
        title: titleResult.value,
        message: messageResult.value,
        type: "info",
        priority,
        is_active: true,
        created_by: admin.id,
        expires_at: expiresAt,
      })
      .select(ANNOUNCEMENT_SELECT)
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

export async function PATCH(
  request: Request
) {
  try {
    const admin = await requireAdmin();

    const id =
      await getAnnouncementId(request);

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        {
          error:
            "A valid announcement ID is required.",
        },
        {
          status: 400,
        }
      );
    }

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

    const supabase =
      createAdminSupabaseClient();

    /*
     * Quick admin controls.
     */

    if (body.action === "toggle") {
      const { data: current, error: lookupError } =
        await supabase
          .from("admin_announcements")
          .select("id, is_active")
          .eq("id", id)
          .maybeSingle();

      if (lookupError) {
        console.error(
          "Announcement toggle lookup error:",
          lookupError
        );

        return NextResponse.json(
          {
            error:
              "Unable to load announcement.",
          },
          {
            status: 500,
          }
        );
      }

      if (!current) {
        return NextResponse.json(
          {
            error:
              "Announcement not found.",
          },
          {
            status: 404,
          }
        );
      }

      const { data, error } =
        await supabase
          .from("admin_announcements")
          .update({
            is_active: !current.is_active,
          })
          .eq("id", id)
          .select(ANNOUNCEMENT_SELECT)
          .single();

      if (error) {
        console.error(
          "Announcement toggle error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to update announcement status.",
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
          action:
            data.is_active
              ? "activated"
              : "deactivated",
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
     * Immediately expire an announcement.
     */

    if (body.action === "expire") {
      const { data, error } =
        await supabase
          .from("admin_announcements")
          .update({
            is_active: false,
            expires_at:
              new Date().toISOString(),
          })
          .eq("id", id)
          .select(ANNOUNCEMENT_SELECT)
          .single();

      if (error) {
        console.error(
          "Announcement expire error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to expire announcement.",
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
          action: "expired",
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    /*
     * Normal announcement editing.
     * Only supplied fields are changed.
     */

    const updates: Record<
      string,
      unknown
    > = {};

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "title"
      )
    ) {
      const result =
        validateTitle(body.title);

      if (result.error) {
        return NextResponse.json(
          {
            error: result.error,
          },
          {
            status: 400,
          }
        );
      }

      updates.title = result.value;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "message"
      )
    ) {
      const result =
        validateMessage(body.message);

      if (result.error) {
        return NextResponse.json(
          {
            error: result.error,
          },
          {
            status: 400,
          }
        );
      }

      updates.message = result.value;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "priority"
      )
    ) {
      const result =
        validatePriority(body.priority);

      if (result.error) {
        return NextResponse.json(
          {
            error: result.error,
          },
          {
            status: 400,
          }
        );
      }

      updates.priority = result.value;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "is_active"
      )
    ) {
      if (
        typeof body.is_active !==
        "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "is_active must be true or false.",
          },
          {
            status: 400,
          }
        );
      }

      updates.is_active =
        body.is_active;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "expires_at"
      )
    ) {
      const expiresAt =
        parseOptionalExpiry(
          body.expires_at
        );

      if (
        expiresAt === undefined
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid expiration date.",
          },
          {
            status: 400,
          }
        );
      }

      updates.expires_at =
        expiresAt;
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No valid announcement changes were provided.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Keep the admin responsible for the
     * modification visible in the database.
     *
     * created_by remains the original creator.
     * We do not overwrite it during edits.
     */
    void admin;

    const { data, error } =
      await supabase
        .from("admin_announcements")
        .update(updates)
        .eq("id", id)
        .select(ANNOUNCEMENT_SELECT)
        .single();

    if (error) {
      console.error(
        "Announcement update error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to update announcement.",
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
        action: "updated",
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
      "Admin announcement PATCH error:",
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

export async function DELETE(
  request: Request
) {
  try {
    await requireAdmin();

    const id =
      await getAnnouncementId(request);

    if (!id || !isValidUuid(id)) {
      return NextResponse.json(
        {
          error:
            "A valid announcement ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createAdminSupabaseClient();

    const { data: existing, error: lookupError } =
      await supabase
        .from("admin_announcements")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Announcement delete lookup error:",
        lookupError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find announcement.",
        },
        {
          status: 500,
        }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Announcement not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { error } =
      await supabase
        .from("admin_announcements")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Announcement delete error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to delete announcement.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        deletedId: id,
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
      "Admin announcement DELETE error:",
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
