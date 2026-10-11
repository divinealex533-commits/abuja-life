"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getIncomingFriendRequests,
  getMyFriends,
  getOutgoingFriendRequests,
  removeFriend,
  type FriendPlayer,
  type FriendRequest,
  subscribeToFriendRequests,
} from "@/lib/multiplayer/friends";
import { getMyProfile } from "@/lib/multiplayer/profile";

interface PlayerSummary {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendPlayer[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [requestPlayers, setRequestPlayers] = useState<
    Record<string, PlayerSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loadFriends = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const [friendList, incomingRequests, outgoingRequests] =
        await Promise.all([
          getMyFriends(),
          getIncomingFriendRequests(),
          getOutgoingFriendRequests(),
        ]);

      setFriends(friendList);
      setIncoming(incomingRequests);
      setOutgoing(outgoingRequests);

      const requestPlayerIds = Array.from(
        new Set(
          [
            ...incomingRequests.map((request) => request.senderId),
            ...outgoingRequests.map((request) => request.recipientId),
          ].filter(Boolean)
        )
      );

      if (requestPlayerIds.length > 0) {
        const profile = await getMyProfile();

        if (profile) {
          const { createClient } = await import(
            "@/lib/supabase/client"
          );

          const supabase = createClient();

          const { data } = await supabase
            .from("player_profiles")
            .select("id, username, display_name, avatar")
            .in("id", requestPlayerIds);

          const mapped: Record<string, PlayerSummary> = {};

          (data ?? []).forEach((player) => {
            mapped[player.id] = {
              id: player.id,
              username: player.username,
              displayName: player.display_name,
              avatar: player.avatar ?? "🧑🏽",
            };
          });

          setRequestPlayers(mapped);
        }
      } else {
        setRequestPlayers({});
      }
    } catch (error) {
      console.error("Friends loading error:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your friends right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();

    const unsubscribe = subscribeToFriendRequests(() => {
      loadFriends();
    });

    return unsubscribe;
  }, [loadFriends]);

  async function handleAccept(request: FriendRequest) {
    setWorkingId(request.id);
    setMessage("");

    try {
      await acceptFriendRequest(request.id);
      setMessage("Friend request accepted.");
      await loadFriends();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not accept the request."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDecline(request: FriendRequest) {
    setWorkingId(request.id);
    setMessage("");

    try {
      await declineFriendRequest(request.id);
      setMessage("Friend request declined.");
      await loadFriends();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not decline the request."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleRemove(friend: FriendPlayer) {
    const confirmed = window.confirm(
      `Remove ${friend.displayName} from your friends?`
    );

    if (!confirmed) {
      return;
    }

    setWorkingId(friend.id);
    setMessage("");

    try {
      await removeFriend(friend.id);
      setMessage(`${friend.displayName} was removed from your friends.`);
      await loadFriends();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove this friend."
      );
    } finally {
      setWorkingId(null);
    }
  }

  const getRequestPlayer = (
    request: FriendRequest,
    incomingRequest: boolean
  ) => {
    return requestPlayers[
      incomingRequest ? request.senderId : request.recipientId
    ];
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Abuja Life
            </p>

            <h1 className="text-3xl font-black sm:text-4xl">
              Friends
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/60 sm:text-base">
              Build your social circle, meet players around Abuja,
              and stay connected wherever you go.
            </p>
          </div>

          <Link
            href="/game"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold transition hover:bg-white/[0.1]"
          >
            ← Back to City
          </Link>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Friends
            </p>
            <p className="mt-2 text-2xl font-black">
              {friends.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Requests
            </p>
            <p className="mt-2 text-2xl font-black text-cyan-400">
              {incoming.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Sent
            </p>
            <p className="mt-2 text-2xl font-black">
              {outgoing.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Social Level
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-400">
              {Math.min(99, friends.length + incoming.length)}
            </p>
          </div>
        </section>

        {/* Incoming requests */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                Friend Requests
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Players who want to connect with you.
              </p>
            </div>

            {incoming.length > 0 && (
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-300">
                {incoming.length} pending
              </span>
            )}
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
              Loading friend requests...
            </div>
          ) : incoming.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <div className="text-4xl">👋🏽</div>
              <p className="mt-3 font-bold">
                No pending requests
              </p>
              <p className="mt-1 text-sm text-white/45">
                Meet players around Abuja and build your circle.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {incoming.map((request) => {
                const player = getRequestPlayer(request, true);

                return (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-cyan-400/15 bg-gradient-to-r from-cyan-400/[0.08] to-white/[0.03] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                          {player?.avatar ?? "🧑🏽"}
                        </div>

                        <div>
                          <p className="font-black">
                            {player?.displayName ?? "Abuja Player"}
                          </p>
                          <p className="text-sm text-white/45">
                            @{player?.username ?? "player"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request)}
                          disabled={workingId === request.id}
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {workingId === request.id
                            ? "..."
                            : "Accept"}
                        </button>

                        <button
                          onClick={() => handleDecline(request)}
                          disabled={workingId === request.id}
                          className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-bold transition hover:bg-white/10 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Friends */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              My Friends
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Players in your Abuja Life social circle.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="text-5xl">🧑🏽‍🤝‍🧑🏽</div>

              <h3 className="mt-4 text-lg font-black">
                Your social circle is empty
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
                Head into Abuja, meet other players, and send
                friend requests from the nearby players panel.
              </p>

              <Link
                href="/game"
                className="mt-5 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-300"
              >
                Enter Abuja
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                        {friend.avatar}

                        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#070b14] bg-emerald-400" />
                      </div>

                      <div>
                        <p className="font-black">
                          {friend.displayName}
                        </p>

                        <p className="text-xs text-white/40">
                          @{friend.username}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Friend
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[10px] uppercase text-white/35">
                        Level
                      </p>
                      <p className="mt-1 font-black">
                        {friend.level}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[10px] uppercase text-white/35">
                        Rep
                      </p>
                      <p className="mt-1 font-black">
                        {friend.reputation}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[10px] uppercase text-white/35">
                        Area
                      </p>
                      <p className="mt-1 truncate text-xs font-bold">
                        {friend.currentLocationId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/profile/${friend.id}`}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-bold transition hover:bg-white/10"
                    >
                      View Profile
                    </Link>

                    <Link
                      href={`/chat/${friend.id}`}
                      className="flex-1 rounded-xl bg-cyan-400 px-3 py-2 text-center text-xs font-black text-black transition hover:bg-cyan-300"
                    >
                      Message
                    </Link>
                  </div>

                  <button
                    onClick={() => handleRemove(friend)}
                    disabled={workingId === friend.id}
                    className="mt-3 w-full text-xs font-semibold text-white/30 transition hover:text-red-300 disabled:opacity-50"
                  >
                    {workingId === friend.id
                      ? "Removing..."
                      : "Remove Friend"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sent requests */}
        {outgoing.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black">
                Sent Requests
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Requests waiting for another player to respond.
              </p>
            </div>

            <div className="grid gap-3">
              {outgoing.map((request) => {
                const player = getRequestPlayer(request, false);

                return (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl">
                        {player?.avatar ?? "🧑🏽"}
                      </div>

                      <div>
                        <p className="font-bold">
                          {player?.displayName ?? "Abuja Player"}
                        </p>

                        <p className="text-xs text-white/40">
                          @{player?.username ?? "player"} • Pending
                        </p>
                      </div>
                    </div>

                    <div className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                      Waiting for response
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}