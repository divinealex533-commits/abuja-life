"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNearbyPlayers,
  type NearbyPlayer,
} from "@/lib/multiplayer/presence";
import {
  getMyProfile,
  type MultiplayerProfile,
} from "@/lib/multiplayer/profile";
import {
  acceptFriendRequest,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  sendFriendRequest,
  type FriendRequest,
} from "@/lib/multiplayer/friends";
import PrivateChatPanel from "@/components/game/PrivateChatPanel";

interface NearbyPlayersPanelProps {
  locationId: string;
}

type FriendStatus =
  | "loading"
  | "friend"
  | "sent"
  | "received"
  | "none";

interface FriendStatusInfo {
  status: FriendStatus;
  requestId?: string;
}

export default function NearbyPlayersPanel({
  locationId,
}: NearbyPlayersPanelProps) {
  const [players, setPlayers] = useState<NearbyPlayer[]>([]);
  const [profile, setProfile] =
    useState<MultiplayerProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedPlayer, setSelectedPlayer] =
    useState<NearbyPlayer | null>(null);

  const [friendStatuses, setFriendStatuses] = useState<
    Record<string, FriendStatusInfo>
  >({});

  const [friendWorking, setFriendWorking] =
    useState(false);

  const loadFriendStatuses = useCallback(
    async (nearbyPlayers: NearbyPlayer[]) => {
      if (nearbyPlayers.length === 0) {
        setFriendStatuses({});
        return;
      }

      try {
        const [incoming, outgoing] = await Promise.all([
          getIncomingFriendRequests(),
          getOutgoingFriendRequests(),
        ]);

        const statuses: Record<string, FriendStatusInfo> = {};

        for (const player of nearbyPlayers) {
          statuses[player.id] = {
            status: "none",
          };
        }

        /*
         * Build a set of existing friendships from the
         * friend request data that is relevant to these
         * players.
         *
         * The actual friendship relationship is checked
         * when needed, rather than firing one request per
         * nearby player.
         */
        const incomingByPlayer = new Map<string, FriendRequest>();
        const outgoingByPlayer = new Map<string, FriendRequest>();

        for (const request of incoming) {
          incomingByPlayer.set(request.senderId, request);
        }

        for (const request of outgoing) {
          outgoingByPlayer.set(request.recipientId, request);
        }

        /*
         * First mark pending requests.
         */
        for (const player of nearbyPlayers) {
          const incomingRequest =
            incomingByPlayer.get(player.id);

          if (incomingRequest) {
            statuses[player.id] = {
              status: "received",
              requestId: incomingRequest.id,
            };
            continue;
          }

          const outgoingRequest =
            outgoingByPlayer.get(player.id);

          if (outgoingRequest) {
            statuses[player.id] = {
              status: "sent",
              requestId: outgoingRequest.id,
            };
          }
        }

        /*
         * Existing friendships still need to be identified.
         * We use areFriends only for players who don't already
         * have a pending request.
         */
        const playersToCheck = nearbyPlayers.filter(
          (player) =>
            statuses[player.id]?.status === "none"
        );

        const friendshipResults = await Promise.all(
          playersToCheck.map(async (player) => {
            try {
              const { areFriends } = await import(
                "@/lib/multiplayer/friends"
              );

              return {
                playerId: player.id,
                isFriend: await areFriends(player.id),
              };
            } catch {
              return {
                playerId: player.id,
                isFriend: false,
              };
            }
          })
        );

        for (const result of friendshipResults) {
          if (result.isFriend) {
            statuses[result.playerId] = {
              status: "friend",
            };
          }
        }

        setFriendStatuses(statuses);
      } catch (error) {
        console.error(
          "Friend status error:",
          error
        );
      }
    },
    []
  );

  const loadPlayers = useCallback(async () => {
    try {
      setMessage("");

      const myProfile = await getMyProfile();

      setProfile(myProfile);

      if (!myProfile) {
        setPlayers([]);
        setMessage(
          "Your multiplayer profile is not set up yet."
        );
        return;
      }

      const nearby = await getNearbyPlayers(
        locationId,
        myProfile.id
      );

      setPlayers(nearby);

      await loadFriendStatuses(nearby);
    } catch (error) {
      console.error(
        "Nearby players error:",
        error
      );

      setMessage(
        "Unable to load nearby players."
      );
    } finally {
      setLoading(false);
    }
  }, [locationId, loadFriendStatuses]);

  useEffect(() => {
    setLoading(true);

    void loadPlayers();

    const interval = window.setInterval(
      () => {
        void loadPlayers();
      },
      10000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [loadPlayers]);

  async function handleAddFriend(
    player: NearbyPlayer
  ) {
    if (friendWorking) {
      return;
    }

    setFriendWorking(true);
    setMessage("");

    try {
      await sendFriendRequest(player.id);

      setFriendStatuses((current) => ({
        ...current,
        [player.id]: {
          status: "sent",
        },
      }));

      setMessage(
        `Friend request sent to ${player.displayName}.`
      );
    } catch (error) {
      console.error(
        "Add friend error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send friend request."
      );
    } finally {
      setFriendWorking(false);
    }
  }

  async function handleAcceptFriend(
    player: NearbyPlayer
  ) {
    const requestId =
      friendStatuses[player.id]?.requestId;

    if (!requestId || friendWorking) {
      return;
    }

    setFriendWorking(true);
    setMessage("");

    try {
      await acceptFriendRequest(requestId);

      setFriendStatuses((current) => ({
        ...current,
        [player.id]: {
          status: "friend",
        },
      }));

      setMessage(
        `You are now friends with ${player.displayName}.`
      );
    } catch (error) {
      console.error(
        "Accept friend error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to accept friend request."
      );
    } finally {
      setFriendWorking(false);
    }
  }

  function getFriendButton(
    player: NearbyPlayer
  ) {
    const status =
      friendStatuses[player.id]?.status ??
      "loading";

    if (status === "loading") {
      return "Checking...";
    }

    if (status === "friend") {
      return "✓ Friends";
    }

    if (status === "sent") {
      return "✓ Request Sent";
    }

    if (status === "received") {
      return "✓ Accept Friend";
    }

    return "🤝 Add Friend";
  }

  function isFriendButtonDisabled(
    player: NearbyPlayer
  ) {
    const status =
      friendStatuses[player.id]?.status;

    return (
      friendWorking ||
      status === "loading" ||
      status === "friend" ||
      status === "sent"
    );
  }

  function handleFriendAction(
    player: NearbyPlayer
  ) {
    const status =
      friendStatuses[player.id]?.status;

    if (status === "received") {
      void handleAcceptFriend(player);
      return;
    }

    if (status === "none") {
      void handleAddFriend(player);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            🟢 Multiplayer
          </div>

          <h2 className="mt-2 text-2xl font-black text-white">
            Players Nearby
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Players currently around this location.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-300">
          {players.length} nearby
        </div>
      </div>

      {message && (
        <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-center text-sm text-cyan-200">
          {message}
        </div>
      )}

      {loading && (
        <div className="mt-5 rounded-2xl bg-white/5 p-5 text-center text-sm text-white/50">
          Finding players nearby...
        </div>
      )}

      {!loading &&
        !message &&
        players.length === 0 && (
          <div className="mt-5 rounded-2xl bg-white/5 p-6 text-center">
            <div className="text-4xl">
              👀
            </div>

            <div className="mt-3 font-black text-white">
              Nobody else is here yet
            </div>

            <p className="mt-1 text-sm text-white/50">
              Other players who enter this
              location will appear here.
            </p>
          </div>
        )}

      {!loading && players.length > 0 && (
        <div className="mt-5 space-y-3">
          {players.map((player) => {
            const friendStatus =
              friendStatuses[player.id]?.status ??
              "loading";

            return (
              <div
                key={player.id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlayer(player)
                  }
                  className="flex w-full items-center gap-4 text-left active:scale-[0.98]"
                >
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl transition duration-300 group-hover:scale-110">
                    {player.avatar}

                    <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-black bg-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-black text-white">
                        {player.displayName}
                      </span>

                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    </div>

                    <div className="mt-1 truncate text-xs text-white/40">
                      @{player.username}
                    </div>

                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                      Online •{" "}
                      {player.currentLocationId}
                    </div>
                  </div>

                  <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-300 transition group-hover:bg-cyan-400 group-hover:text-black">
                    VIEW
                  </div>
                </button>

                <div className="mt-3 border-t border-white/5 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleFriendAction(player)
                    }
                    disabled={isFriendButtonDisabled(
                      player
                    )}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs font-black transition ${
                      friendStatus ===
                      "friend"
                        ? "cursor-default bg-emerald-400/10 text-emerald-300"
                        : friendStatus ===
                            "sent"
                          ? "cursor-default bg-cyan-400/10 text-cyan-300"
                          : friendStatus ===
                              "received"
                            ? "bg-amber-400 text-black hover:bg-amber-300"
                            : "bg-white/10 text-white hover:bg-cyan-400 hover:text-black"
                    } disabled:opacity-70`}
                  >
                    {getFriendButton(player)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {profile && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/40">
          You are appearing as{" "}
          <span className="font-bold text-white">
            {profile.displayName}
          </span>
        </div>
      )}

      {/* PLAYER INTERACTION MODAL */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-cyan-400/20 bg-[#07121a] p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                  {selectedPlayer.avatar}

                  <span className="absolute bottom-1 right-1 h-3 w-3 animate-pulse rounded-full border-2 border-[#07121a] bg-emerald-400" />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-white">
                    {selectedPlayer.displayName}
                  </h3>

                  <p className="truncate text-sm text-white/40">
                    @{selectedPlayer.username}
                  </p>

                  <div className="mt-1 text-xs font-bold text-emerald-300">
                    🟢 Online in{" "}
                    {selectedPlayer.currentLocationId}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPlayer(null)
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/60 transition hover:bg-red-400/20 hover:text-red-300"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <div className="text-xl">
                  💬
                </div>
                <div className="mt-1 text-[10px] font-black uppercase text-white/40">
                  Chat
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <div className="text-xl">
                  🤝
                </div>
                <div className="mt-1 text-[10px] font-black uppercase text-white/40">
                  Social
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-3 text-center">
                <div className="text-xl">
                  🎤
                </div>
                <div className="mt-1 text-[10px] font-black uppercase text-white/40">
                  Voice
                </div>
              </div>
            </div>

            <div className="mt-5">
              <PrivateChatPanel
                otherPlayerId={
                  selectedPlayer.id
                }
                otherPlayerName={
                  selectedPlayer.displayName
                }
                otherPlayerUsername={
                  selectedPlayer.username
                }
                otherPlayerAvatar={
                  selectedPlayer.avatar
                }
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() =>
                  handleFriendAction(
                    selectedPlayer
                  )
                }
                disabled={isFriendButtonDisabled(
                  selectedPlayer
                )}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-black transition ${
                  friendStatuses[
                    selectedPlayer.id
                  ]?.status === "friend"
                    ? "cursor-default bg-emerald-400/10 text-emerald-300"
                    : friendStatuses[
                          selectedPlayer.id
                        ]?.status === "sent"
                      ? "cursor-default bg-cyan-400/10 text-cyan-300"
                      : friendStatuses[
                            selectedPlayer.id
                          ]?.status === "received"
                        ? "bg-amber-400 text-black hover:bg-amber-300"
                        : "bg-cyan-400 text-black hover:bg-cyan-300"
                } disabled:opacity-70`}
              >
                {getFriendButton(
                  selectedPlayer
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}