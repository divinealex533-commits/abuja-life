import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function tasksEnabled() {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("admin_game_settings")
    .select("tasks_enabled")
    .eq("id", 1)
    .single();

  if (error) throw error;

  return data?.tasks_enabled === true;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const enabled = await tasksEnabled();

    if (!enabled) {
      return NextResponse.json({
        tasks: [],
        tasksEnabled: false,
      });
    }

    const admin = createAdminSupabaseClient();
    const now = new Date().toISOString();

    const { data: tasks, error } = await admin
      .from("admin_tasks")
      .select(
        "id,title,description,reward_amount,reward_type,assigned_user_id,max_completions,deadline,is_active,created_at"
      )
      .eq("is_active", true)
      .or(`assigned_user_id.is.null,assigned_user_id.eq.${user.id}`)
      .or(`deadline.is.null,deadline.gt.${now}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const taskIds = (tasks ?? []).map((task) => task.id);

    let completions: {
      task_id: string;
      completed_at: string;
      reward_paid: boolean;
    }[] = [];

    if (taskIds.length > 0) {
      const { data, error: completionError } = await admin
        .from("admin_task_completions")
        .select("task_id,completed_at,reward_paid")
        .eq("user_id", user.id)
        .in("task_id", taskIds);

      if (completionError) throw completionError;

      completions = data ?? [];
    }

    const completionMap = new Map(
      completions.map((completion) => [
        completion.task_id,
        completion,
      ])
    );

    const result = (tasks ?? []).map((task) => {
      const completion = completionMap.get(task.id);

      return {
        ...task,
        completed: Boolean(completion),
        completedAt: completion?.completed_at ?? null,
        rewardPaid: completion?.reward_paid ?? false,
      };
    });

    return NextResponse.json({
      tasks: result,
      tasksEnabled: true,
    });
  } catch (error) {
    console.error("Player tasks GET error:", error);

    return NextResponse.json(
      { error: "Unable to load tasks." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const enabled = await tasksEnabled();

    if (!enabled) {
      return NextResponse.json(
        {
          error: "Admin tasks are currently disabled.",
          code: "TASKS_DISABLED",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    const taskId = String(body?.taskId ?? "").trim();

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required." },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    const { data: task, error: taskError } = await admin
      .from("admin_tasks")
      .select(
        "id,title,reward_amount,reward_type,assigned_user_id,max_completions,deadline,is_active"
      )
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: "Task not found." },
        { status: 404 }
      );
    }

    if (!task.is_active) {
      return NextResponse.json(
        { error: "This task is no longer active." },
        { status: 409 }
      );
    }

    if (
      task.assigned_user_id &&
      task.assigned_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "This task is not assigned to you." },
        { status: 403 }
      );
    }

    if (
      task.deadline &&
      new Date(task.deadline).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "This task has expired." },
        { status: 409 }
      );
    }

    const { data: existing } = await admin
      .from("admin_task_completions")
      .select("id")
      .eq("task_id", task.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already completed this task." },
        { status: 409 }
      );
    }

    if (task.max_completions !== null) {
      const { count, error: countError } = await admin
        .from("admin_task_completions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("task_id", task.id);

      if (countError) throw countError;

      if ((count ?? 0) >= task.max_completions) {
        return NextResponse.json(
          {
            error:
              "This task has reached its completion limit.",
          },
          { status: 409 }
        );
      }
    }

    const { data: state, error: stateError } = await admin
      .from("player_game_states")
      .select(
        "user_id,cash,energy,max_energy,reputation,job_experience"
      )
      .eq("user_id", user.id)
      .single();

    if (stateError || !state) {
      return NextResponse.json(
        {
          error:
            "Your player profile is not ready yet. Enter the game first.",
        },
        { status: 409 }
      );
    }

    const reward = Math.max(
      0,
      Number(task.reward_amount ?? 0)
    );

    const rewardType = String(
      task.reward_type ?? "cash"
    ).toLowerCase();

    let nextCash = Number(state.cash ?? 0);
    let nextReputation = Number(
      state.reputation ?? 0
    );
    let nextJobExperience = Number(
      state.job_experience ?? 0
    );

    if (rewardType === "cash") {
      nextCash += reward;
    }

    if (rewardType === "reputation") {
      nextReputation += Math.round(reward);
    }

    if (
      rewardType === "experience" ||
      rewardType === "xp"
    ) {
      nextJobExperience += Math.round(reward);
    }

    /*
     * Insert completion first.
     * The unique(task_id,user_id) constraint prevents
     * duplicate rewards.
     */
    const { data: completion, error: completionError } =
      await admin
        .from("admin_task_completions")
        .insert({
          task_id: task.id,
          user_id: user.id,
          completed_at: new Date().toISOString(),
          reward_paid: false,
        })
        .select("id")
        .single();

    if (completionError) {
      if (completionError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "You have already completed this task.",
          },
          { status: 409 }
        );
      }

      throw completionError;
    }

    const { error: updateError } = await admin
      .from("player_game_states")
      .update({
        cash: nextCash,
        reputation: nextReputation,
        job_experience: nextJobExperience,
      })
      .eq("user_id", user.id);

    if (updateError) {
      await admin
        .from("admin_task_completions")
        .delete()
        .eq("id", completion.id);

      throw updateError;
    }

    await admin
      .from("admin_task_completions")
      .update({
        reward_paid: true,
      })
      .eq("id", completion.id);

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
      },
      reward: {
        amount: reward,
        type: rewardType,
      },
      player: {
        cash: nextCash,
        reputation: nextReputation,
        jobExperience: nextJobExperience,
      },
    });
  } catch (error) {
    console.error(
      "Player task completion error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to complete this task right now.",
      },
      { status: 500 }
    );
  }
}
