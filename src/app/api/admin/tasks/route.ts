import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/access";

async function checkTasksEnabled() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("admin_game_settings")
    .select("tasks_enabled")
    .eq("id", 1)
    .single();

  if (error) {
    console.error(
      "Tasks settings lookup error:",
      error
    );

    return {
      ok: false,
      enabled: false,
    };
  }

  return {
    ok: true,
    enabled: data?.tasks_enabled === true,
  };
}

export async function GET() {
  try {
    await requireAdmin();

    const taskSettings =
      await checkTasksEnabled();

    if (!taskSettings.ok) {
      return NextResponse.json(
        {
          error:
            "Task settings could not be verified. Please try again later.",
        },
        { status: 503 }
      );
    }

    const supabase =
      await createServerSupabaseClient();

    const { data: tasks, error } =
      await supabase
        .from("admin_tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Admin tasks GET error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: tasks ?? [],
      tasksEnabled: taskSettings.enabled,
    });
  } catch (error) {
    console.error(
      "Admin tasks access error:",
      error
    );

    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    /*
     * Check the global Admin Tasks switch
     * before creating a new task.
     */
    const taskSettings =
      await checkTasksEnabled();

    if (!taskSettings.ok) {
      return NextResponse.json(
        {
          error:
            "Task settings could not be verified. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (!taskSettings.enabled) {
      return NextResponse.json(
        {
          error:
            "Admin tasks are currently disabled.",
          code: "TASKS_DISABLED",
        },
        { status: 503 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          error:
            "Invalid task payload.",
        },
        { status: 400 }
      );
    }

    const title =
      String(body.title ?? "").trim();

    const description =
      String(body.description ?? "").trim();

    const rewardAmount =
      Number(body.reward_amount ?? 0);

    const rewardType =
      String(
        body.reward_type ?? "cash"
      ).trim() || "cash";

    const assignedUserId =
      body.assigned_user_id
        ? String(
            body.assigned_user_id
          ).trim()
        : null;

    const maxCompletions =
      body.max_completions === null ||
      body.max_completions === undefined ||
      body.max_completions === ""
        ? null
        : Number(
            body.max_completions
          );

    const deadline =
      body.deadline
        ? String(body.deadline)
        : null;

    if (!title || !description) {
      return NextResponse.json(
        {
          error:
            "Task title and description are required.",
        },
        { status: 400 }
      );
    }

    if (title.length > 120) {
      return NextResponse.json(
        {
          error:
            "Task title cannot exceed 120 characters.",
        },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        {
          error:
            "Task description cannot exceed 2000 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(rewardAmount) ||
      rewardAmount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Reward amount must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    if (
      maxCompletions !== null &&
      (!Number.isInteger(
        maxCompletions
      ) ||
        maxCompletions < 1)
    ) {
      return NextResponse.json(
        {
          error:
            "Maximum completions must be a whole number greater than zero.",
        },
        { status: 400 }
      );
    }

    const supabase =
      await createServerSupabaseClient();

    const { data, error } =
      await supabase
        .from("admin_tasks")
        .insert({
          title,
          description,
          reward_amount:
            rewardAmount,
          reward_type:
            rewardType,
          assigned_user_id:
            assignedUserId,
          max_completions:
            maxCompletions,
          deadline,
          is_active: true,
          created_by: admin.id,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Admin task creation error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        task: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Admin task POST error:",
      error
    );

    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }
}
