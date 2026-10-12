"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import PrivateChatPanel from "@/components/game/PrivateChatPanel";

interface Player {
  id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  current_location_id: string | null;
  level: number | null;
  reputation: number | null;
}

export default function AdminChatPage() {
  const [players, setPlayers] = useState<Player[]>(
    []
  );

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPlayers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/chat/players",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load players."
        );
      }

      setPlayers(result.players ?? []);
    } catch (err) {
      console.error(
        "Admin chat player loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load players."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return players;
    }

    return players.filter((player) => {
      const username =
        player.username?.toLowerCase() ?? "";

      const displayName =
        player.display_name?.toLowerCase() ?? "";

      const id =
        player.id?.toLowerCase() ?? "";

      return (
        username.includes(query) ||
        displayName.includes(query) ||
        id.includes(query)
      );
    });
  }, [players, search]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* BACK */}
      <Link
        href="/admin"
        className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
      >
        ← Admin Dashboard
      </Link>

      {/* HEADER */}
      <section className="mt-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
              💬 ADMIN CHAT
            </div>

            <h1 className="mt-5 text-4xl font-black">
              Player Support Chat
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Chat directly with Abuja Life players
              using the existing private messaging
              system.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPlayers}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-40"
          >
            {loading
              ? "Loading..."
              : "↻ Refresh Players"}
          </button>
        </div>
      </section>

      {/* CHAT WORKSPACE */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* PLAYER LIST */}
        <aside className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-black">
                  Players
                </h2>

                <p className="mt-1 text-[10px] text-slate-600">
                  Select a player to open their
                  private conversation.
                </p>
              </div>

              <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[10px] font-black text-orange-400">
                {players.length}
              </span>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search player..."
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400" />

                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-orange-400"
                    style={{
                      animationDelay:
                        "120ms",
                    }}
                  />

                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-orange-400"
                    style={{
                      animationDelay:
                        "240ms",
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Loading players...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                <div className="text-2xl">
                  ⚠️
                </div>

                <p className="mt-2 text-xs leading-5 text-red-300">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadPlayers}
                  className="mt-4 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/20"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPlayers.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <div className="text-3xl">
                  👥
                </div>

                <p className="mt-3 text-sm font-bold text-slate-400">
                  {players.length === 0
                    ? "No players found"
                    : "No matching players"}
                </p>

                <p className="mt-1 text-[10px] leading-5 text-slate-600">
                  {players.length === 0
                    ? "Player profiles will appear here."
                    : "Try another username or display name."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map(
                  (player) => {
                    const isSelected =
                      selectedPlayer?.id ===
                      player.id;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() =>
                          setSelectedPlayer(
                            player
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-orange-500/40 bg-orange-500/10"
                            : "border-white/5 bg-white/[0.02] hover:border-orange-500/20 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                            {player.avatar ??
                              "🧑🏽"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-white">
                              {player.display_name ||
                                "Player"}
                            </div>

                            <div className="mt-0.5 truncate text-[10px] text-slate-500">
                              @
                              {player.username ||
                                "player"}
                            </div>
                          </div>

                          <div
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              isSelected
                                ? "bg-orange-400"
                                : "bg-slate-700"
                            }`}
                          />
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-600">
                          <span>
                            Level{" "}
                            {player.level ??
                              1}
                          </span>

                          <span>•</span>

                          <span>
                            Rep{" "}
                            {player.reputation ??
                              0}
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CHAT */}
        <main className="min-w-0">
          {!selectedPlayer ? (
            <div className="flex min-h-[620px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 text-4xl">
                💬
              </div>

              <h2 className="mt-6 text-2xl font-black">
                Select a Player
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Choose a player from the list to
                open their existing private
                conversation.
              </p>

              <div className="mt-6 rounded-2xl border border-orange-500/10 bg-orange-500/5 px-5 py-4 text-left">
                <p className="text-xs font-bold text-orange-300">
                  Admin messaging
                </p>

                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  Messages sent here use the same
                  private messaging system players
                  already use.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                    🛡️
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-orange-300">
                      ADMIN SUPPORT MODE
                    </p>

                    <p className="truncate text-[10px] text-slate-600">
                      Private conversation with{" "}
                      {selectedPlayer.display_name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlayer(null)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>

              <PrivateChatPanel
                key={selectedPlayer.id}
                otherPlayerId={
                  selectedPlayer.id
                }
                otherPlayerName={
                  selectedPlayer.display_name ||
                  "Player"
                }
                otherPlayerUsername={
                  selectedPlayer.username ||
                  "player"
                }
                otherPlayerAvatar={
                  selectedPlayer.avatar ??
                  "🧑🏽"
                }
                onClose={() =>
                  setSelectedPlayer(null)
                }
              />
            </div>
          )}
        </main>
      </section>

      {/* INFO */}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-lg">
            🔒
          </div>

          <div>
            <h3 className="text-sm font-black">
              Existing Private Messaging
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Admin Chat does not create a second
              messaging system. It uses Abuja Life's
              existing private messages and real-time
              chat infrastructure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
