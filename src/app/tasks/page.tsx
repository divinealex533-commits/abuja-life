"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string;
  reward_amount: number;
  reward_type: string;
  assigned_user_id: string | null;
  max_completions: number | null;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
  completed: boolean;
  completedAt: string | null;
  rewardPaid: boolean;
}

function formatReward(amount: number, type: string) {
  const value = Number(amount || 0);

  if (type === "reputation") {
    return `+${Math.round(value)} Reputation`;
  }

  if (type === "experience" || type === "xp") {
    return `+${Math.round(value)} XP`;
  }

  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "No deadline";

  const date = new Date(deadline);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/tasks", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load tasks."
        );
      }

      setTasks(data.tasks ?? []);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load tasks.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function completeTask(taskId: string) {
    try {
      setCompletingId(taskId);
      setMessage(null);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to complete task."
        );
      }

      const reward = data?.reward;

      let rewardText = "Task completed successfully.";

      if (reward) {
        rewardText = `Task completed! You received ${formatReward(
          Number(reward.amount || 0),
          String(reward.type || "cash")
        )}.`;
      }

      setMessage({
        type: "success",
        text: rewardText,
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: true,
                completedAt:
                  new Date().toISOString(),
                rewardPaid: true,
              }
            : task
        )
      );
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to complete task.",
      });
    } finally {
      setCompletingId(null);
    }
  }

  const availableTasks = tasks.filter(
    (task) => !task.completed
  );

  const completedTasks = tasks.filter(
    (task) => task.completed
  );

  return (
    <main className="min-h-screen bg-[#050b0a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/game"
              className="mb-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-orange-500/30 hover:text-white"
            >
              ← Back to Game
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl">
                🎯
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
                  Abuja Life
                </p>

                <h1 className="text-3xl font-black tracking-tight">
                  Player Tasks
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Complete tasks created by Abuja Life administrators
              and earn rewards.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh Tasks"}
          </button>
        </div>

        {/* FEEDBACK */}
        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              message.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? "✓ " : "⚠ "}
            {message.text}
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Available
            </p>
            <p className="mt-2 text-2xl font-black text-white">
              {availableTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Completed
            </p>
            <p className="mt-2 text-2xl font-black text-green-400">
              {completedTasks.length}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Total Tasks
            </p>
            <p className="mt-2 text-2xl font-black text-orange-400">
              {tasks.length}
            </p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-orange-500" />
            <p className="text-sm font-semibold text-slate-500">
              Loading available tasks...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && tasks.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <div className="text-5xl">📋</div>

            <h2 className="mt-5 text-xl font-black">
              No Tasks Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are currently no active Admin Tasks for
              you. Check back later for new opportunities.
            </p>
          </div>
        )}

        {/* AVAILABLE TASKS */}
        {!loading && availableTasks.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  Available Tasks
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Complete these tasks to earn rewards.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {availableTasks.map((task) => (
                <article
                  key={task.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-xl">
                        🎯
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-black text-white">
                          {task.title}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-orange-400">
                            {task.assigned_user_id
                              ? "Assigned Task"
                              : "Open Task"}
                          </span>

                          {task.max_completions !== null && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold text-slate-500">
                              Limited
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        Reward
                      </p>
                      <p className="mt-1 text-sm font-black text-green-400">
                        {formatReward(
                          Number(task.reward_amount),
                          task.reward_type
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {task.description}
                  </p>

                  <div className="mt-5 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        Deadline
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDeadline(task.deadline)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                        Completion Limit
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {task.max_completions === null
                          ? "Unlimited"
                          : `${task.max_completions} players`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => completeTask(task.id)}
                    disabled={
                      completingId === task.id
                    }
                    className="mt-5 w-full rounded-2xl bg-orange-500 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {completingId === task.id
                      ? "Completing..."
                      : "✓ Complete Task"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* COMPLETED */}
        {!loading && completedTasks.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-black">
                Completed Tasks
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Your completed Admin Tasks and rewards.
              </p>
            </div>

            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-green-500/10 bg-green-500/[0.03] p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                        ✓
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-200">
                          {task.title}
                        </h3>

                        <p className="mt-1 text-[11px] text-slate-600">
                          Completed{" "}
                          {task.completedAt
                            ? new Date(
                                task.completedAt
                              ).toLocaleString("en-NG")
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-green-400">
                        {formatReward(
                          Number(task.reward_amount),
                          task.reward_type
                        )}
                      </span>

                      <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-green-400">
                        Reward Paid
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
