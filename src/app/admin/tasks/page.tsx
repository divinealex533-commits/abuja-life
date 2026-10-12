"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string;
  reward_amount: number | string;
  reward_type: string;
  assigned_user_id: string | null;
  max_completions: number | null;
  deadline: string | null;
  is_active: boolean;
  created_at: string;
};

const rewardTypes = [
  {
    value: "cash",
    label: "Cash",
    icon: "💰",
  },
  {
    value: "xp",
    label: "XP",
    icon: "⭐",
  },
  {
    value: "item",
    label: "Item",
    icon: "🎁",
  },
  {
    value: "vip",
    label: "VIP",
    icon: "👑",
  },
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [rewardAmount, setRewardAmount] =
    useState("0");

  const [rewardType, setRewardType] =
    useState("cash");

  const [assignedUserId, setAssignedUserId] =
    useState("");

  const [maxCompletions, setMaxCompletions] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] =
    useState(true);

  const [feedback, setFeedback] =
    useState("");

  async function loadTasks() {
    try {
      setLoadingTasks(true);

      const response = await fetch(
        "/api/admin/tasks",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to load tasks."
        );
      }

      setTasks(result.tasks ?? []);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to load tasks."
      );
    } finally {
      setLoadingTasks(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function createTask(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setFeedback(
        "Task title and description are required."
      );
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const response = await fetch(
        "/api/admin/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            reward_amount: Number(
              rewardAmount || 0
            ),
            reward_type: rewardType,
            assigned_user_id:
              assignedUserId.trim() || null,
            max_completions:
              maxCompletions || null,
            deadline:
              deadline || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to create task."
        );
      }

      setTitle("");
      setDescription("");
      setRewardAmount("0");
      setRewardType("cash");
      setAssignedUserId("");
      setMaxCompletions("");
      setDeadline("");

      setFeedback(
        "Player task created successfully."
      );

      await loadTasks();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to create task."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
      >
        ← Admin Dashboard
      </Link>

      {/* HEADER */}
      <section className="mt-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
          🎯 PLAYER TASKS
        </div>

        <h1 className="mt-5 text-4xl font-black">
          Task Control Center
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Create missions and activities for
          Abuja Life players, assign rewards and
          control how many players can complete
          each task.
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* CREATE TASK */}
        <form
          onSubmit={createTask}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-black">
              Create Player Task
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Set the task details, reward and
              completion rules.
            </p>
          </div>

          <div className="space-y-5">
            {/* TITLE */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Task Title
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Complete 3 city missions"
                maxLength={120}
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Explain exactly what the player needs to do..."
                rows={5}
                maxLength={2000}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />

              <p className="mt-1 text-right text-[10px] text-slate-600">
                {description.length}/2000
              </p>
            </div>

            {/* REWARD */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400">
                  Reward Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rewardAmount}
                  onChange={(event) =>
                    setRewardAmount(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400">
                  Reward Type
                </label>

                <select
                  value={rewardType}
                  onChange={(event) =>
                    setRewardType(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                >
                  {rewardTypes.map(
                    (reward) => (
                      <option
                        key={reward.value}
                        value={reward.value}
                      >
                        {reward.icon}{" "}
                        {reward.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* ASSIGN */}
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Assign to Player
              </label>

              <input
                value={assignedUserId}
                onChange={(event) =>
                  setAssignedUserId(
                    event.target.value
                  )
                }
                placeholder="Player UUID — leave empty for everyone"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />

              <p className="mt-1 text-[10px] text-slate-600">
                Leave empty to make the task
                available generally.
              </p>
            </div>

            {/* LIMIT + DEADLINE */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400">
                  Max Completions
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxCompletions}
                  onChange={(event) =>
                    setMaxCompletions(
                      event.target.value
                    )
                  }
                  placeholder="Unlimited"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-400">
                  Deadline
                </label>

                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) =>
                    setDeadline(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Task..."
                : "Create Player Task"}
            </button>

            {feedback && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-300">
                {feedback}
              </div>
            )}
          </div>
        </form>

        {/* TASK LIST */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Created Tasks
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Tasks currently managed by the
                administration.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-500">
              {tasks.length} total
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {loadingTasks ? (
              <div className="rounded-xl bg-black/20 p-8 text-center text-sm text-slate-500">
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
                <div className="text-4xl">
                  🎯
                </div>

                <p className="mt-3 text-sm font-bold text-slate-400">
                  No player tasks yet
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Create your first task using
                  the form.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-black">
                        {task.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {task.description}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                        task.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {task.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        Reward
                      </p>

                      <p className="mt-1 text-sm font-black">
                        {task.reward_type ===
                        "cash"
                          ? formatNaira(
                              Number(
                                task.reward_amount
                              )
                            )
                          : `${task.reward_amount} ${task.reward_type.toUpperCase()}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        Assignment
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-slate-400">
                        {task.assigned_user_id
                          ? task.assigned_user_id
                          : "Everyone"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        Completion Limit
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {task.max_completions ??
                          "Unlimited"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        Deadline
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {task.deadline
                          ? new Date(
                              task.deadline
                            ).toLocaleString()
                          : "No deadline"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-slate-600">
                    Created{" "}
                    {new Date(
                      task.created_at
                    ).toLocaleString()}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
