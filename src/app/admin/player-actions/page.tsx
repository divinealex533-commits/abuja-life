"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PlayerAction {
  id: string;
  action: string;
  reason: string | null;
  amount: number | null;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
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

interface ActionsResponse {
  actions: PlayerAction[];
  total?: number;
  resultCount?: number;
}

const actionOptions = [
  { value: "", label: "All Actions" },
  { value: "freeze", label: "Freeze" },
  { value: "unfreeze", label: "Unfreeze" },
  { value: "cash", label: "Cash" },
  { value: "energy", label: "Energy" },
  { value: "reputation", label: "Reputation" },
  { value: "experience", label: "Experience" },
  { value: "location", label: "Location" },
  { value: "reset", label: "Reset" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function actionLabel(action: string) {
  return (
    actionOptions.find((item) => item.value === action)?.label ?? action
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

    case "energy":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "reputation":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    case "experience":
      return "border-blue-500/20 bg-blue-500/10 text-blue-400";

    case "location":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-400";

    case "reset":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function safeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getValue(
  record: Record<string, unknown> | undefined,
  keys: string[]
) {
  if (!record) return null;

  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return null;
}

function formatValue(value: unknown, field?: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (
    field === "cash" &&
    (typeof value === "number" || typeof value === "string")
  ) {
    const amount = safeNumber(value);

    if (amount !== null) {
      return formatMoney(amount);
    }
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Object";
    }
  }

  return String(value);
}

function getChangeText(item: PlayerAction) {
  const before = item.beforeValue ?? {};
  const after = item.afterValue ?? {};

  const fieldMap: Record<string, string[]> = {
    cash: ["cash"],
    energy: ["energy", "max_energy"],
    reputation: ["reputation"],
    experience: ["experience", "xp"],
    location: ["current_location_id", "currentLocationId"],
    freeze: ["is_frozen", "isFrozen"],
    unfreeze: ["is_frozen", "isFrozen"],
  };

  const fields = fieldMap[item.action] ?? [];

  for (const field of fields) {
    const beforeValue = getValue(before, [field]);
    const afterValue = getValue(after, [field]);

    if (beforeValue !== null || afterValue !== null) {
      return {
        field,
        before: formatValue(beforeValue, field),
        after: formatValue(afterValue, field),
      };
    }
  }

  const metadataBefore = getValue(item.metadata, ["before"]);
  const metadataAfter = getValue(item.metadata, ["after"]);

  if (metadataBefore !== null || metadataAfter !== null) {
    return {
      field: "value",
      before: formatValue(metadataBefore),
      after: formatValue(metadataAfter),
    };
  }

  return null;
}

export default function AdminPlayerActionsPage() {
  const [actions, setActions] = useState<PlayerAction[]>([]);
  const [totalActions, setTotalActions] = useState(0);

  const [playerId, setPlayerId] = useState("");
  const [selectedAction, setSelectedAction] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadActions = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (playerId.trim()) {
          params.set("playerId", playerId.trim());
        }

        if (selectedAction) {
          params.set("action", selectedAction);
        }

        params.set("limit", "500");

        const response = await fetch(
          `/api/admin/player-actions?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const data: ActionsResponse & { error?: string } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load action history."
          );
        }

        const nextActions = Array.isArray(data.actions)
          ? data.actions
          : [];

        setActions(nextActions);

        setTotalActions(
          typeof data.total === "number"
            ? data.total
            : typeof data.resultCount === "number"
              ? data.resultCount
              : nextActions.length
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load action history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [playerId, selectedAction]
  );

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadActions(false);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [loadActions]);

  const stats = useMemo(() => {
    const cash = actions.filter(
      (item) => item.action === "cash"
    ).length;

    const accountControls = actions.filter(
      (item) =>
        item.action === "freeze" ||
        item.action === "unfreeze" ||
        item.action === "reset"
    ).length;

    const playersAffected = new Set(
      actions.map((item) => item.player.id)
    ).size;

    return {
      cash,
      accountControls,
      playersAffected,
    };
  }, [actions]);

  function clearFilters() {
    setPlayerId("");
    setSelectedAction("");
  }

  const hasFilters =
    playerId.trim() !== "" || selectedAction !== "";

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
              Complete administrative audit trail for player controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {refreshing && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Updating...
              </span>
            )}

            <button
              onClick={() => loadActions(false)}
              disabled={loading || refreshing}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Audit Filters
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Narrow the administrative history by player or action.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_220px_auto_auto]">
            <input
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              placeholder="Filter by player UUID"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-500/50"
            />

            <select
              value={selectedAction}
              onChange={(event) => setSelectedAction(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => loadActions()}
              className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black text-black transition hover:bg-orange-400"
            >
              Apply Filters
            </button>

            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-black text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </section>

        {/* STATS */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Actions Loaded
            </p>

            <p className="mt-2 text-3xl font-black">
              {actions.length}
            </p>

            <p className="mt-1 text-[10px] text-slate-700">
              Current filtered result
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Cash Actions
            </p>

            <p className="mt-2 text-3xl font-black text-orange-400">
              {stats.cash}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Account Controls
            </p>

            <p className="mt-2 text-3xl font-black text-red-400">
              {stats.accountControls}
            </p>

            <p className="mt-1 text-[10px] text-slate-700">
              Freeze, unfreeze and reset
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Players Affected
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {stats.playersAffected}
            </p>

            <p className="mt-1 text-[10px] text-slate-700">
              In current results
            </p>
          </div>
        </section>

        {/* AUDIT STATUS */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-500/10 bg-green-500/[0.04] px-5 py-4">
          <div>
            <p className="text-xs font-black text-green-400">
              Audit logging active
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Player control actions are recorded with administrator and
              timestamp information.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
            {totalActions} result{totalActions === 1 ? "" : "s"}
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            <span>{error}</span>

            <button
              onClick={() => loadActions()}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase text-red-300 hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-black">
                  Administrative Actions
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Every action is recorded with its administrator, target
                  player, reason and available state changes.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                Live
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="text-2xl">⏳</div>

              <p className="mt-3 text-sm font-bold text-slate-500">
                Loading action history...
              </p>
            </div>
          ) : actions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">🧾</div>

              <p className="mt-4 font-black">
                No admin actions found
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {hasFilters
                  ? "Try clearing your filters or choosing another action."
                  : "Player control activity will appear here automatically."}
              </p>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
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
                  {actions.map((item) => {
                    const change = getChangeText(item);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.015]"
                      >
                        <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-500">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <Link
                            href={`/admin/players/${item.player.id}`}
                            className="flex items-center gap-3 hover:text-orange-400"
                          >
                            <span className="text-xl">
                              {item.player.avatar || "🧑🏾"}
                            </span>

                            <div>
                              <div className="text-sm font-black">
                                {item.player.displayName ||
                                  item.player.username ||
                                  "Unknown Player"}
                              </div>

                              <div className="text-[10px] text-slate-600">
                                @{item.player.username}
                              </div>

                              <div className="mt-1 font-mono text-[9px] text-slate-800">
                                {item.player.id}
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
                            {actionLabel(item.action)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {item.amount !== null ? (
                            <div>
                              <span className="font-black text-orange-400">
                                {item.amount >= 0 ? "+" : ""}
                                {formatMoney(Number(item.amount))}
                              </span>

                              {change && (
                                <div className="mt-2 text-[10px] text-slate-600">
                                  {change.before} → {change.after}
                                </div>
                              )}
                            </div>
                          ) : change ? (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-slate-700">
                                {change.field}
                              </div>

                              <div className="mt-1 text-xs">
                                <span className="text-slate-600">
                                  {change.before}
                                </span>

                                <span className="mx-2 text-slate-800">
                                  →
                                </span>

                                <span className="font-bold text-slate-300">
                                  {change.after}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="max-w-[260px] px-6 py-5 text-xs text-slate-400">
                          <div className="line-clamp-3">
                            {item.reason || "No reason provided"}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="text-xs font-bold text-slate-400">
                            {item.admin?.email || "Unknown admin"}
                          </div>

                          {item.admin?.id && (
                            <div className="mt-1 font-mono text-[9px] text-slate-700">
                              {item.admin.id}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FOOTER */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-700">
          <span>
            Automatic refresh: every 30 seconds
          </span>

          <span>
            Showing up to 500 audit records per query
          </span>
        </div>
      </div>
    </main>
  );
}
