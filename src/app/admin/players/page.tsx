"use client";

import { useEffect, useMemo, useState } from "react";

interface Player {
  id: string;
  username: string;
  displayName: string;
  avatar: string;

  level: number;
  experience: number;
  reputation: number;

  cash: number;

  energy: number;
  maxEnergy: number;

  currentJobId: string | null;
  jobExperience: number;
  currentLocationId: string;

  createdAt: string;
  updatedAt: string;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<Player | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  async function loadPlayers(
    showRefresh = false
  ) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await fetch(
        `/api/admin/players?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to load players."
        );
      }

      setPlayers(result.players ?? []);

      if (selected) {
        const updated = (result.players ?? []).find(
          (player: Player) =>
            player.id === selected.id
        );

        setSelected(updated ?? null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load players."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlineCount = useMemo(() => {
    const fiveMinutesAgo =
      Date.now() - 5 * 60 * 1000;

    return players.filter(
      (player) =>
        new Date(player.updatedAt).getTime() >=
        fiveMinutesAgo
    ).length;
  }, [players]);

  const totalCash = useMemo(
    () =>
      players.reduce(
        (total, player) => total + player.cash,
        0
      ),
    [players]
  );

  return (
    <div className="min-h-screen bg-[#050b0a] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-400">
              Admin Management
            </p>

            <h1 className="text-3xl font-black tracking-tight">
              Players
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage Abuja Life players, inspect their
              progression, economy, location and game
              state.
            </p>
          </div>

          <button
            onClick={() => loadPlayers(true)}
            disabled={refreshing}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh Players"}
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Registered Players
            </p>
            <p className="mt-2 text-3xl font-black">
              {players.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Recently Active
            </p>
            <p className="mt-2 text-3xl font-black text-green-400">
              {onlineCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Economy
            </p>
            <p className="mt-2 text-2xl font-black text-orange-400">
              {formatMoney(totalCash)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Player System
            </p>
            <p className="mt-2 text-sm font-black text-green-400">
              PERSISTENT
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                loadPlayers(true);
              }
            }}
            placeholder="Search username or player name..."
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
          />

          <button
            onClick={() => loadPlayers(true)}
            className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-orange-400"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr className="text-left">
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Player
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Level
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Cash
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Energy
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Reputation
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Location
                  </th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-600"
                    >
                      Loading players...
                    </td>
                  </tr>
                ) : players.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-600"
                    >
                      No players found.
                    </td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">
                            {player.avatar}
                          </div>

                          <div>
                            <p className="font-bold text-white">
                              {player.displayName}
                            </p>

                            <p className="text-xs text-slate-600">
                              @{player.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-black text-orange-400">
                          LVL {player.level}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-green-400">
                        {formatMoney(player.cash)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {player.energy}/{player.maxEnergy}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {player.reputation}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold capitalize text-slate-300">
                        {player.currentLocationId}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            setSelected(player)
                          }
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#07100e] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                    {selected.avatar}
                  </div>

                  <div>
                    <h2 className="text-xl font-black">
                      {selected.displayName}
                    </h2>
                    <p className="text-sm text-slate-600">
                      @{selected.username}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Player ID
                  </p>
                  <p className="mt-2 break-all text-xs font-mono text-slate-300">
                    {selected.id}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Level / XP
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {selected.level}
                    <span className="ml-2 text-sm text-slate-500">
                      {selected.experience} XP
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Wallet
                  </p>
                  <p className="mt-2 text-lg font-black text-green-400">
                    {formatMoney(selected.cash)}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Energy
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {selected.energy}
                    <span className="text-sm text-slate-600">
                      {" "}
                      / {selected.maxEnergy}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Reputation
                  </p>
                  <p className="mt-2 text-lg font-black text-orange-400">
                    {selected.reputation}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Location
                  </p>
                  <p className="mt-2 text-lg font-black capitalize">
                    {selected.currentLocationId}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Current Job
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-300">
                    {selected.currentJobId ?? "No active job"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Job XP
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {selected.jobExperience}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/10 px-6 py-5">
                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-600">
                  <span>
                    Joined {formatDate(selected.createdAt)}
                  </span>
                  <span>•</span>
                  <span>
                    Updated {formatDate(selected.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
