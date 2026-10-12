"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PlayerAction {
  id: string;
  action: string;
  reason: string | null;
  amount: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;

  player: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };

  admin: {
    id: string | null;
    email: string;
  };
}

const actionOptions = [
  {
    value: "",
    label: "All Actions",
  },
  {
    value: "freeze",
    label: "Freeze",
  },
  {
    value: "unfreeze",
    label: "Unfreeze",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "energy",
    label: "Energy",
  },
  {
    value: "reputation",
    label: "Reputation",
  },
  {
    value: "experience",
    label: "Experience",
  },
  {
    value: "location",
    label: "Location",
  },
  {
    value: "reset",
    label: "Reset",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actionLabel(action: string) {
  return (
    actionOptions.find(
      (item) => item.value === action
    )?.label ?? action
  );
}

function actionClass(action: string) {
  switch (action) {
    case "freeze":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "unfreeze":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "cash":
      return "border-orange-500/20 bg-orange-500/10 text-orange-400";

    case "reset":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

export default function AdminPlayerActionsPage() {
  const [actions, setActions] =
    useState<PlayerAction[]>([]);

  const [playerId, setPlayerId] =
    useState("");

  const [selectedAction, setSelectedAction] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadActions() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (playerId.trim()) {
        params.set(
          "playerId",
          playerId.trim()
        );
      }

      if (selectedAction) {
        params.set(
          "action",
          selectedAction
        );
      }

      params.set("limit", "500");

      const response = await fetch(
        `/api/admin/player-actions?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load action history."
        );
      }

      setActions(data.actions ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load action history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActions();
  }, [selectedAction]);

  return (
    <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/players"
              className="text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              ← Back to Players
            </Link>

            <h1 className="mt-3 text-3xl font-black">
              Player Action History
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Complete administrative audit trail
              for player controls.
            </p>
          </div>

          <button
            onClick={loadActions}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
            <input
              value={playerId}
              onChange={(event) =>
                setPlayerId(
                  event.target.value
                )
              }
              placeholder="Filter by player UUID"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
            />

            <select
              value={selectedAction}
              onChange={(event) =>
                setSelectedAction(
                  event.target.value
                )
              }
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            >
              {actionOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <button
              onClick={loadActions}
              className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black text-black transition hover:bg-orange-400"
            >
              Apply Filters
            </button>
          </div>
        </section>

        {/* STATS */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Total Actions
            </p>

            <p className="mt-2 text-3xl font-black">
              {actions.length}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Cash Actions
            </p>

            <p className="mt-2 text-3xl font-black text-orange-400">
              {
                actions.filter(
                  (item) =>
                    item.action === "cash"
                ).length
              }
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Account Controls
            </p>

            <p className="mt-2 text-3xl font-black text-red-400">
              {
                actions.filter(
                  (item) =>
                    item.action === "freeze" ||
                    item.action === "unfreeze" ||
                    item.action === "reset"
                ).length
              }
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Players Affected
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {
                new Set(
                  actions.map(
                    (item) =>
                      item.player.id
                  )
                ).size
              }
            </p>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="font-black">
              Administrative Actions
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Every action is recorded with its
              administrator, target player and
              reason.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading action history...
            </div>
          ) : actions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">🧾</div>

              <p className="mt-4 font-black">
                No admin actions yet
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Player control activity will
                appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Date
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Player
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Action
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Change
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Reason
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Admin
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {actions.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-6 py-5 text-xs text-slate-500">
                          {formatDate(
                            item.createdAt
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/players/${item.player.id}`}
                            className="flex items-center gap-3 hover:text-orange-400"
                          >
                            <span className="text-xl">
                              {
                                item.player
                                  .avatar
                              }
                            </span>

                            <div>
                              <div className="text-sm font-black">
                                {
                                  item.player
                                    .displayName
                                }
                              </div>

                              <div className="text-[10px] text-slate-600">
                                @
                                {
                                  item.player
                                    .username
                                }
                              </div>
                            </div>
                          </Link>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${actionClass(
                              item.action
                            )}`}
                          >
                            {actionLabel(
                              item.action
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-xs">
                          {item.amount !==
                          null ? (
                            <span className="font-black text-orange-400">
                              {item.amount >=
                              0
                                ? "+"
                                : ""}
                              {formatMoney(
                                Number(
                                  item.amount
                                )
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600">
                              —
                            </span>
                          )}
                        </td>

                        <td className="max-w-[260px] px-6 py-5 text-xs text-slate-400">
                          {item.reason ||
                            "No reason provided"}
                        </td>

                        <td className="px-6 py-5 text-xs text-slate-500">
                          {item.admin.email}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
