"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  isFrozen: boolean;
  recentlyActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlayersResponse {
  players?: Player[];
  total?: number;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatTime(value: Date | null) {
  if (!value) return "Not refreshed yet";

  return new Intl.DateTimeFormat("en-NG", {
    timeStyle: "short",
  }).format(value);
}

function locationLabel(location: string) {
  return location
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadPlayers = useCallback(
    async (manualRefresh = false) => {
      try {
        setError("");

        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const query = search.trim()
          ? `?search=${encodeURIComponent(search.trim())}`
          : "";

        const response = await fetch(
          `/api/admin/players${query}`,
          {
            cache: "no-store",
          }
        );

        const data: PlayersResponse =
          await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            (data as { error?: string })?.error ||
              "Unable to load players."
          );
        }

        const nextPlayers = data.players ?? [];

        setPlayers(nextPlayers);
        setTotalPlayers(
          typeof data.total === "number"
            ? data.total
            : nextPlayers.length
        );

        setLastUpdated(new Date());

        /*
         * Keep the quick-view modal synchronized with
         * the newest player data after a refresh.
         */
        setSelectedPlayer((current) => {
          if (!current) return null;

          return (
            nextPlayers.find(
              (player) => player.id === current.id
            ) ?? current
          );
        });
      } catch (err) {
        console.error("Admin players error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load players."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  /*
   * Initial player load.
   */
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  /*
   * Keep the player administration screen live.
   */
  useEffect(() => {
    const interval = window.setInterval(() => {
      loadPlayers(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadPlayers]);

  const stats = useMemo(() => {
    return {
      /*
       * Use the API's real total instead of players.length.
       * This prevents search results from changing the
       * displayed total player count.
       */
      total: totalPlayers,

      active: players.filter(
        (player) =>
          player.recentlyActive &&
          !player.isFrozen
      ).length,

      frozen: players.filter(
        (player) => player.isFrozen
      ).length,

      cash: players.reduce(
        (total, player) =>
          total + Number(player.cash ?? 0),
        0
      ),
    };
  }, [players, totalPlayers]);

  return (
    <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-black">
              Players
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor and manage every Abuja Life
              player.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-green-400">
                ● Live Player Data
              </span>

              <span className="text-[10px] font-bold text-slate-600">
                Last updated: {formatTime(lastUpdated)}
              </span>
            </div>
          </div>

          <button
            onClick={() => loadPlayers(true)}
            disabled={loading || refreshing}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Players"}
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400">
                  Player Data Error
                </p>

                <p className="mt-1 text-sm font-bold text-red-300">
                  {error}
                </p>
              </div>

              <button
                onClick={() => loadPlayers(true)}
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/20"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STATS */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Total Players
            </p>

            <p className="mt-2 text-3xl font-black">
              {loading ? "..." : stats.total.toLocaleString()}
            </p>

            {search.trim() && (
              <p className="mt-1 text-[10px] text-slate-600">
                {players.length.toLocaleString()} shown by
                current search
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-green-500/10 bg-green-500/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Recently Active
            </p>

            <p className="mt-2 text-3xl font-black text-green-400">
              {loading ? "..." : stats.active.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Active within 15 minutes
            </p>
          </div>

          <div className="rounded-3xl border border-red-500/10 bg-red-500/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Frozen
            </p>

            <p className="mt-2 text-3xl font-black text-red-400">
              {loading ? "..." : stats.frozen.toLocaleString()}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Frozen players in current results
            </p>
          </div>

          <div className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Player Cash
            </p>

            <p className="mt-2 text-2xl font-black text-orange-400">
              {loading ? "..." : formatMoney(stats.cash)}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Combined balance of displayed players
            </p>
          </div>

        </section>

        {/* SEARCH */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              loadPlayers(true);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search username or display name..."
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
            />

            <button
              type="submit"
              disabled={loading || refreshing}
              className="rounded-xl bg-orange-500 px-7 py-3 text-xs font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search
            </button>

            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                Clear
              </button>
            )}
          </form>
        </section>

        {/* PLAYER TABLE */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

          <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-black">
                Player Management
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Select a player to view their complete
                game state and administrative controls.
              </p>
            </div>

            <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Auto-refresh: 30 seconds
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="text-3xl">👥</div>

              <p className="mt-4 text-sm font-black">
                Loading players...
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Loading live player data from Abuja Life.
              </p>
            </div>
          ) : players.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">
                👥
              </div>

              <p className="mt-4 font-black">
                No players found
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Try another search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10 text-left">

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Player
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Level / XP
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Cash
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Energy
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Reputation
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Location
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Updated
                    </th>

                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Manage
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {players.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >

                      {/* PLAYER */}

                      <td className="px-6 py-5">
                        <button
                          onClick={() =>
                            setSelectedPlayer(player)
                          }
                          className="flex items-center gap-3 text-left"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-2xl">
                            {player.avatar || "🧑🏾"}
                          </span>

                          <span>
                            <span className="block text-sm font-black hover:text-orange-400">
                              {player.displayName ||
                                "Unnamed Player"}
                            </span>

                            <span className="block text-[10px] text-slate-600">
                              @{player.username ||
                                "unknown"}
                            </span>
                          </span>
                        </button>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">

                          {player.isFrozen ? (
                            <span className="inline-flex w-fit rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[9px] font-black uppercase text-red-400">
                              🔒 Frozen
                            </span>
                          ) : (
                            <span className="inline-flex w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[9px] font-black uppercase text-green-400">
                              ● Active
                            </span>
                          )}

                          {player.recentlyActive && (
                            <span className="text-[9px] font-bold text-slate-600">
                              Recently active
                            </span>
                          )}

                        </div>
                      </td>

                      {/* LEVEL */}

                      <td className="px-6 py-5">
                        <div className="font-black">
                          Lv. {player.level}
                        </div>

                        <div className="text-[10px] text-slate-600">
                          {Number(
                            player.experience ?? 0
                          ).toLocaleString()}{" "}
                          XP
                        </div>
                      </td>

                      {/* CASH */}

                      <td className="px-6 py-5">
                        <span className="font-black text-green-400">
                          {formatMoney(player.cash)}
                        </span>
                      </td>

                      {/* ENERGY */}

                      <td className="px-6 py-5">
                        <div className="min-w-[90px]">

                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold">
                              {player.energy}
                            </span>

                            <span className="text-slate-600">
                              / {player.maxEnergy}
                            </span>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    (Number(
                                      player.energy ?? 0
                                    ) /
                                      Math.max(
                                        1,
                                        Number(
                                          player.maxEnergy ??
                                            1
                                        )
                                      )) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>

                        </div>
                      </td>

                      {/* REPUTATION */}

                      <td className="px-6 py-5">
                        <span className="font-black text-purple-400">
                          {Number(
                            player.reputation ?? 0
                          ).toLocaleString()}
                        </span>
                      </td>

                      {/* LOCATION */}

                      <td className="px-6 py-5">
                        <div className="text-xs font-bold text-slate-300">
                          {locationLabel(
                            player.currentLocationId ||
                              "unknown"
                          )}
                        </div>

                        {player.currentJobId && (
                          <div className="mt-1 text-[9px] text-slate-600">
                            Job: {player.currentJobId}
                          </div>
                        )}
                      </td>

                      {/* UPDATED */}

                      <td className="px-6 py-5">
                        <div className="text-xs text-slate-400">
                          {formatDate(
                            player.updatedAt
                          )}
                        </div>

                        <div className="mt-1 text-[9px] text-slate-600">
                          {player.recentlyActive
                            ? "Recently active"
                            : "Not recently active"}
                        </div>
                      </td>

                      {/* MANAGE */}

                      <td className="px-6 py-5">
                        <Link
                          href={`/admin/players/${player.id}`}
                          className="inline-flex rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-orange-400 transition hover:bg-orange-500/20"
                        >
                          Manage →
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* PLAYER QUICK VIEW */}

        {selectedPlayer && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
            onClick={() =>
              setSelectedPlayer(null)
            }
          >
            <div
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#09110f] p-7 shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-4xl">
                    {selectedPlayer.avatar || "🧑🏾"}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      {selectedPlayer.displayName ||
                        "Unnamed Player"}
                    </h2>

                    <p className="text-xs text-slate-600">
                      @{selectedPlayer.username ||
                        "unknown"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedPlayer(null)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:text-white"
                >
                  ✕
                </button>

              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Status
                  </p>

                  <p
                    className={`mt-2 font-black ${
                      selectedPlayer.isFrozen
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {selectedPlayer.isFrozen
                      ? "🔒 Frozen"
                      : "● Active"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Activity
                  </p>

                  <p className="mt-2 font-black">
                    {selectedPlayer.recentlyActive
                      ? "Recently Active"
                      : "Not Recently Active"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Wallet
                  </p>

                  <p className="mt-2 font-black text-green-400">
                    {formatMoney(
                      selectedPlayer.cash
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Energy
                  </p>

                  <p className="mt-2 font-black">
                    {selectedPlayer.energy} /{" "}
                    {selectedPlayer.maxEnergy}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Level / XP
                  </p>

                  <p className="mt-2 font-black">
                    Level {selectedPlayer.level}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    {Number(
                      selectedPlayer.experience ?? 0
                    ).toLocaleString()}{" "}
                    XP
                  </p>

                  <p className="mt-2 text-[10px] text-slate-600">
                    Job XP:{" "}
                    {Number(
                      selectedPlayer.jobExperience ?? 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Reputation
                  </p>

                  <p className="mt-2 font-black text-purple-400">
                    {Number(
                      selectedPlayer.reputation ?? 0
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Location
                  </p>

                  <p className="mt-2 font-black">
                    {locationLabel(
                      selectedPlayer.currentLocationId ||
                        "unknown"
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Current Job
                  </p>

                  <p className="mt-2 font-black">
                    {selectedPlayer.currentJobId ||
                      "No active job"}
                  </p>
                </div>

              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Account Created
                  </p>

                  <p className="mt-2 text-xs font-bold text-slate-300">
                    {formatDate(
                      selectedPlayer.createdAt
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Last Game Update
                  </p>

                  <p className="mt-2 text-xs font-bold text-slate-300">
                    {formatDate(
                      selectedPlayer.updatedAt
                    )}
                  </p>
                </div>

              </div>

              <div className="mt-6 flex flex-wrap gap-3">

                <Link
                  href={`/admin/players/${selectedPlayer.id}`}
                  className="flex-1 rounded-xl bg-orange-500 px-5 py-3 text-center text-xs font-black text-black transition hover:bg-orange-400"
                >
                  Open Full Management
                </Link>

                <Link
                  href={`/admin/player-actions?playerId=${selectedPlayer.id}`}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  View Action History
                </Link>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
