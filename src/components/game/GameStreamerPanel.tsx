"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  calculateStartingViewers,
  calculateStreamResult,
  FEATURED_STREAMERS,
  getRandomStreamEvent,
  getStreamGame,
  getStreamDuration,
  performStreamAction,
  STREAM_GAMES,
  type StreamAction,
  type StreamEvent,
  type StreamGame,
} from "@/lib/game/gameStreamer";
import {
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

interface GameStreamerPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState | null>
  >;
}

type Screen =
  | "studio"
  | "select"
  | "briefing"
  | "live"
  | "result";

const ENERGY_COST = 18;

const formatNGN = (amount: number) =>
  `₦${Math.max(0, Math.round(amount)).toLocaleString()}`;

const formatNumber = (amount: number) =>
  Math.max(0, Math.round(amount)).toLocaleString();

const clamp = (
  value: number,
  min: number,
  max: number
) => Math.min(Math.max(value, min), max);

export default function GameStreamerPanel({
  player,
  setPlayer,
}: GameStreamerPanelProps) {
  const [screen, setScreen] = useState<Screen>("studio");
  const [selectedGame, setSelectedGame] =
    useState<StreamGame | null>(null);

  const [connectedTikTok, setConnectedTikTok] =
    useState(false);

  const [tiktokName, setTiktokName] =
    useState("");

  const [streamSeconds, setStreamSeconds] =
    useState(0);

  const [streamViewers, setStreamViewers] =
    useState(0);

  const [peakViewers, setPeakViewers] =
    useState(0);

  const [likes, setLikes] = useState(0);
  const [followers, setFollowers] =
    useState(0);
  const [subscribers, setSubscribers] =
    useState(0);
  const [donations, setDonations] =
    useState(0);
  const [sponsorIncome, setSponsorIncome] =
    useState(0);

  const [hype, setHype] = useState(35);

  const [chatMessages, setChatMessages] =
    useState<string[]>([
      "Welcome to the stream! 🔥",
      "Let's goooo!",
      "Abuja Life gang is here!",
    ]);

  const [event, setEvent] =
    useState<StreamEvent | null>(null);

  const [actionMessage, setActionMessage] =
    useState(
      "Choose an action to keep your audience entertained."
    );

  const [result, setResult] =
    useState<ReturnType<typeof calculateStreamResult> | null>(
      null
    );

  const [saving, setSaving] = useState(false);

  const [streamerName, setStreamerName] =
    useState("DivinePlays");

  const [showTikTokModal, setShowTikTokModal] =
    useState(false);

  const [showFeatured, setShowFeatured] =
    useState(true);

  const [lastDonation, setLastDonation] =
    useState<number | null>(null);

  const [notification, setNotification] =
    useState<string | null>(null);

  const streamerLevel = Math.max(
    1,
    Math.floor(player.jobExperience / 10) + 1
  );

  const streamerTitle = useMemo(() => {
    if (streamerLevel >= 20) {
      return "Streaming Legend";
    }

    if (streamerLevel >= 12) {
      return "Celebrity Streamer";
    }

    if (streamerLevel >= 7) {
      return "Rising Creator";
    }

    if (streamerLevel >= 3) {
      return "Growing Creator";
    }

    return "New Streamer";
  }, [streamerLevel]);

  const addChat = (message: string) => {
    setChatMessages((current) => {
      const next = [...current, message];

      if (next.length > 8) {
        return next.slice(next.length - 8);
      }

      return next;
    });
  };

  const showNotification = (message: string) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const resetStreamStats = () => {
    setStreamSeconds(0);
    setStreamViewers(0);
    setPeakViewers(0);
    setLikes(0);
    setFollowers(0);
    setSubscribers(0);
    setDonations(0);
    setSponsorIncome(0);
    setHype(35);
    setEvent(null);
    setResult(null);
    setLastDonation(null);

    setChatMessages([
      "Welcome to the stream! 🔥",
      "Let's goooo!",
      "Abuja Life gang is here!",
    ]);

    setActionMessage(
      "Choose an action to keep your audience entertained."
    );
  };

  const selectGame = (game: StreamGame) => {
    setSelectedGame(game);
    setScreen("briefing");
  };

  const beginStream = () => {
    if (!selectedGame) return;

    if (player.energy < ENERGY_COST) {
      showNotification(
        `You need ${ENERGY_COST} energy to start streaming.`
      );
      return;
    }

    resetStreamStats();

    const startingViewers =
      calculateStartingViewers(
        selectedGame,
        streamerLevel,
        connectedTikTok
      );

    setStreamViewers(startingViewers);
    setPeakViewers(startingViewers);

    setScreen("live");

    addChat("🔴 YOU ARE NOW LIVE!");

    if (connectedTikTok) {
      addChat(
        `📱 TikTok audience connected: @${tiktokName}`
      );
    }

    showNotification(
      `🔴 ${selectedGame.name} stream started!`
    );
  };

  const performAction = (action: StreamAction) => {
    if (!selectedGame || screen !== "live") {
      return;
    }

    const outcome = performStreamAction(
      action,
      selectedGame,
      streamViewers,
      hype
    );

    const nextViewers = clamp(
      streamViewers + outcome.viewerChange,
      0,
      999999
    );

    const nextHype = clamp(
      hype + outcome.hypeChange,
      0,
      100
    );

    setStreamViewers(nextViewers);
    setPeakViewers((current) =>
      Math.max(current, nextViewers)
    );

    setLikes((current) =>
      current + outcome.likes
    );

    setFollowers((current) =>
      current + outcome.followers
    );

    setDonations((current) =>
      current + outcome.cash
    );

    setHype(nextHype);

    setActionMessage(outcome.message);

    addChat(
      `${outcome.message} +${formatNumber(
        outcome.viewerChange
      )} viewers`
    );

    if (outcome.cash > 0) {
      setLastDonation(outcome.cash);

      window.setTimeout(() => {
        setLastDonation(null);
      }, 2500);
    }

    if (outcome.followers > 0) {
      addChat(
        `⭐ ${formatNumber(
          outcome.followers
        )} new followers!`
      );
    }

    if (outcome.viewerChange >= 800) {
      showNotification(
        `🔥 Your audience jumped by ${formatNumber(
          outcome.viewerChange
        )} viewers!`
      );
    }
  };

  const triggerRandomEvent = () => {
    if (!selectedGame || screen !== "live") {
      return;
    }

    const randomEvent = getRandomStreamEvent();

    const nextViewers = clamp(
      streamViewers + randomEvent.viewerChange,
      0,
      999999
    );

    const nextHype = clamp(
      hype + randomEvent.hypeChange,
      0,
      100
    );

    setEvent(randomEvent);

    setStreamViewers(nextViewers);

    setPeakViewers((current) =>
      Math.max(current, nextViewers)
    );

    setHype(nextHype);

    if (randomEvent.cashChange > 0) {
      setDonations(
        (current) =>
          current + randomEvent.cashChange
      );

      setLastDonation(
        randomEvent.cashChange
      );

      window.setTimeout(() => {
        setLastDonation(null);
      }, 3000);
    }

    if (randomEvent.type === "subscriber") {
      const gained =
        3 + Math.floor(Math.random() * 8);

      setSubscribers(
        (current) => current + gained
      );

      addChat(
        `⭐ ${gained} new subscribers just joined!`
      );
    }

    if (randomEvent.type === "viral") {
      const viralFollowers =
        20 + Math.floor(Math.random() * 60);

      setFollowers(
        (current) =>
          current + viralFollowers
      );

      setLikes(
        (current) =>
          current +
          Math.floor(
            Math.max(streamViewers, 1) * 0.5
          )
      );

      addChat(
        `🚀 VIRAL CLIP! ${formatNumber(
          viralFollowers
        )} new followers!`
      );
    }

    if (randomEvent.type === "raid") {
      addChat(
        "🚨 ANOTHER STREAMER JUST RAIDED YOU!"
      );
    }

    if (randomEvent.type === "troll") {
      addChat(
        "😈 Troll detected in chat..."
      );
    }

    if (randomEvent.type === "lag") {
      addChat(
        "⚠️ Your connection is struggling..."
      );
    }

    if (randomEvent.type === "sponsor") {
      setSponsorIncome(
        (current) =>
          current + randomEvent.cashChange
      );

      addChat(
        "📢 A sponsor wants to work with you!"
      );
    }

    setActionMessage(randomEvent.message);

    showNotification(
      `${randomEvent.title} — ${randomEvent.message}`
    );

    window.setTimeout(() => {
      setEvent(null);
    }, 4500);
  };

  const finishStream = async () => {
    if (!selectedGame || screen !== "live") {
      return;
    }

    const finalResult =
      calculateStreamResult({
        game: selectedGame,
        startingViewers:
          calculateStartingViewers(
            selectedGame,
            streamerLevel,
            connectedTikTok
          ),
        currentViewers: streamViewers,
        peakViewers,
        likes,
        followers,
        subscribers,
        donations,
        sponsorIncome,
        hype,
        durationSeconds: streamSeconds,
      });

    const energyAfter = Math.max(
      0,
      player.energy - ENERGY_COST
    );

    const nextPlayer: PlayerGameState = {
      ...player,
      cash:
        player.cash +
        finalResult.cashEarned,
      energy: energyAfter,
      reputation:
        player.reputation +
        finalResult.reputationGained,
      currentJobId: "game-streamer",
      jobExperience:
        player.jobExperience +
        Math.max(
          1,
          Math.round(
            finalResult.score / 100
          )
        ),
    };

    setSaving(true);

    const saved =
      await savePersistentPlayerState(
        nextPlayer
      );

    setPlayer(nextPlayer);

    setResult(finalResult);
    setScreen("result");
    setSaving(false);

    if (!saved) {
      showNotification(
        "Stream completed. Local game state updated."
      );
    }
  };

  useEffect(() => {
    if (screen !== "live") {
      return;
    }

    const timer = window.setInterval(() => {
      setStreamSeconds((current) => {
        const next = current + 1;

        if (
          selectedGame &&
          next >= getStreamDuration(selectedGame)
        ) {
          window.setTimeout(() => {
            finishStream();
          }, 0);
        }

        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [screen, selectedGame]);

  useEffect(() => {
    if (screen !== "live") {
      return;
    }

    const eventTimer = window.setInterval(() => {
      if (Math.random() < 0.72) {
        triggerRandomEvent();
      }
    }, 10000);

    return () => {
      window.clearInterval(eventTimer);
    };
  }, [
    screen,
    selectedGame,
    streamViewers,
    hype,
  ]);

  useEffect(() => {
    if (screen !== "live") {
      return;
    }

    const viewerTimer = window.setInterval(() => {
      setStreamViewers((current) => {
        const movement =
          Math.floor(
            Math.random() * 140
          ) - 45;

        const next = clamp(
          current + movement,
          0,
          999999
        );

        setPeakViewers((peak) =>
          Math.max(peak, next)
        );

        return next;
      });
    }, 3000);

    return () => {
      window.clearInterval(viewerTimer);
    };
  }, [screen]);

  const connectTikTok = () => {
    if (tiktokName.trim()) {
      setConnectedTikTok(true);
      setShowTikTokModal(false);

      showNotification(
        `TikTok @${tiktokName.trim()} connected!`
      );

      return;
    }

    setTiktokName(streamerName);
    setConnectedTikTok(true);
    setShowTikTokModal(false);

    showNotification(
      `TikTok @${streamerName} connected!`
    );
  };

  const disconnectTikTok = () => {
    setConnectedTikTok(false);
    setTiktokName("");

    showNotification(
      "TikTok account disconnected."
    );
  };

  const returnToStudio = () => {
    setScreen("studio");
    setSelectedGame(null);
    resetStreamStats();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining = seconds % 60;

    return `${minutes
      .toString()
      .padStart(2, "0")}:${remaining
      .toString()
      .padStart(2, "0")}`;
  };

  if (screen === "studio") {
    return (
      <div className="min-h-screen bg-[#08080d] text-white">
        {notification && (
          <div className="fixed right-5 top-5 z-[100] rounded-2xl border border-white/10 bg-[#15151d] px-5 py-4 shadow-2xl">
            <p className="text-sm font-semibold">
              {notification}
            </p>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950/60 via-[#12121b] to-red-950/30 p-6 shadow-2xl md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-400">
                    Creator Career
                  </span>

                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300">
                    Level {streamerLevel}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                  🎮 Streamer Studio
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">
                  Build your audience, go live, create viral
                  moments and become one of Abuja's biggest
                  gaming creators.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Creator status
                </p>
                <p className="mt-1 text-lg font-black">
                  {streamerTitle}
                </p>
                <p className="text-sm text-purple-300">
                  {formatNumber(player.jobExperience)} XP
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#111119] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                      Your channel
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      {streamerName}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">
                    🎥 CREATOR
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Cash
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {formatNGN(player.cash)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Energy
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {player.energy}/{player.maxEnergy}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-white/40">
                      Reputation
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {formatNumber(player.reputation)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#111119] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">
                      📱 Social Connections
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                      Connect your creator identity to grow
                      your stream.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-pink-500 to-black text-xl">
                      ♪
                    </div>

                    <div>
                      <p className="font-bold">
                        TikTok
                      </p>

                      {connectedTikTok ? (
                        <p className="text-sm text-green-400">
                          Connected as @{tiktokName}
                        </p>
                      ) : (
                        <p className="text-sm text-white/40">
                          Not connected
                        </p>
                      )}
                    </div>
                  </div>

                  {connectedTikTok ? (
                    <button
                      onClick={disconnectTikTok}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/5"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setShowTikTokModal(true)
                      }
                      className="rounded-xl bg-white px-4 py-2 text-sm font-black text-black transition hover:scale-[1.02]"
                    >
                      Connect TikTok
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-white/30">
                  TikTok connection currently works as an in-game
                  creator connection. Official TikTok OAuth can
                  be wired into this button later.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#111119] p-6">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Start a broadcast
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Choose your game
                  </h2>
                </div>

                <button
                  onClick={() =>
                    setScreen("select")
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-red-500 px-6 py-4 text-center font-black transition hover:scale-[1.01]"
                >
                  🎥 Choose Game & Go Live
                </button>
              </div>
            </div>

            {showFeatured && (
              <aside className="rounded-3xl border border-white/10 bg-[#111119] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-400">
                      Trending
                    </p>

                    <h2 className="text-xl font-black">
                      Featured Streamers
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      setShowFeatured(false)
                    }
                    className="text-xs text-white/30"
                  >
                    Hide
                  </button>
                </div>

                <div className="space-y-3">
                  {FEATURED_STREAMERS.map(
                    (streamer) => (
                      <div
                        key={streamer.id}
                        className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-red-500/30 text-lg">
                            {streamer.flag}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="truncate text-sm font-bold">
                                {streamer.name}
                              </p>

                              {streamer.verified && (
                                <span className="text-blue-400">
                                  ✓
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-white/40">
                              {streamer.platform} ·{" "}
                              {streamer.followers}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-[10px] font-black uppercase ${
                                streamer.status ===
                                "live"
                                  ? "text-red-400"
                                  : streamer.status ===
                                    "trending"
                                  ? "text-yellow-400"
                                  : "text-white/30"
                              }`}
                            >
                              {streamer.status}
                            </span>

                            <p className="text-xs text-white/50">
                              {streamer.viewers}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>

        {showTikTokModal && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#15151d] p-6 shadow-2xl">
              <h2 className="text-2xl font-black">
                Connect TikTok
              </h2>

              <p className="mt-2 text-sm text-white/50">
                Connect your creator username to give your
                streams a social audience boost.
              </p>

              <input
                value={tiktokName}
                onChange={(event) =>
                  setTiktokName(
                    event.target.value.replace(
                      /^@/,
                      ""
                    )
                  )
                }
                placeholder="yourusername"
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-500"
              />

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() =>
                    setShowTikTokModal(false)
                  }
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-bold text-white/60"
                >
                  Cancel
                </button>

                <button
                  onClick={connectTikTok}
                  className="flex-1 rounded-xl bg-white px-4 py-3 font-black text-black"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "select") {
    return (
      <div className="min-h-screen bg-[#08080d] px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => setScreen("studio")}
            className="mb-6 text-sm font-bold text-white/50 hover:text-white"
          >
            ← Back to Studio
          </button>

          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Broadcast setup
            </p>

            <h1 className="mt-1 text-3xl font-black md:text-5xl">
              Choose your game 🎮
            </h1>

            <p className="mt-2 text-white/50">
              Different games attract different audiences,
              donations and risks.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STREAM_GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => selectGame(game)}
                className="group rounded-3xl border border-white/10 bg-[#111119] p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-[#151522]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-4xl">
                    {game.emoji}
                  </span>

                  <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-black uppercase text-white/50">
                    {game.difficulty}
                  </span>
                </div>

                <h2 className="text-lg font-black">
                  {game.name}
                </h2>

                <p className="mt-1 text-xs font-bold text-purple-400">
                  {game.category}
                </p>

                <p className="mt-3 min-h-[60px] text-sm leading-5 text-white/45">
                  {game.description}
                </p>

                <div className="mt-5 border-t border-white/5 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">
                      Starting viewers
                    </span>

                    <span className="font-bold">
                      {formatNumber(
                        game.baseViewers
                      )}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedGame) {
    return (
      <div className="min-h-screen bg-[#08080d] px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() =>
              setScreen("select")
            }
            className="mb-6 text-sm font-bold text-white/50 hover:text-white"
          >
            ← Choose another game
          </button>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111119] shadow-2xl">
            <div className="bg-gradient-to-br from-purple-700/30 to-red-600/20 p-8">
              <div className="text-6xl">
                {selectedGame.emoji}
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-purple-300">
                Stream briefing
              </p>

              <h1 className="mt-2 text-4xl font-black">
                {selectedGame.name}
              </h1>

              <p className="mt-3 text-white/55">
                {selectedGame.description}
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Difficulty
                </p>
                <p className="mt-1 font-black uppercase">
                  {selectedGame.difficulty}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Energy
                </p>
                <p className="mt-1 font-black">
                  -{ENERGY_COST}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  TikTok boost
                </p>
                <p className="mt-1 font-black">
                  {connectedTikTok
                    ? "+850 viewers"
                    : "Not connected"}
                </p>
              </div>
            </div>

            <div className="border-t border-white/5 p-6">
              {player.energy < ENERGY_COST && (
                <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  ⚠️ You need {ENERGY_COST} energy to
                  stream. Current energy:{" "}
                  {player.energy}.
                </div>
              )}

              <button
                disabled={
                  player.energy < ENERGY_COST
                }
                onClick={beginStream}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-red-500 px-6 py-4 font-black shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                🔴 START STREAM
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "live" && selectedGame) {
    const duration = getStreamDuration(
      selectedGame
    );

    const progress = clamp(
      (streamSeconds / duration) * 100,
      0,
      100
    );

    return (
      <div className="min-h-screen bg-[#060609] text-white">
        {notification && (
          <div className="fixed right-5 top-5 z-[100] max-w-sm rounded-2xl border border-white/10 bg-[#15151d] px-5 py-4 shadow-2xl">
            <p className="text-sm font-semibold">
              {notification}
            </p>
          </div>
        )}

        {lastDonation !== null && (
          <div className="pointer-events-none fixed inset-x-0 top-20 z-[90] flex justify-center">
            <div className="animate-bounce rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-6 py-4 text-center shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-300">
                Donation
              </p>
              <p className="text-2xl font-black text-yellow-200">
                +{formatNGN(lastDonation)}
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-white/10 bg-[#0c0c12] px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-red-500">
                {selectedGame.emoji}
              </div>

              <div>
                <p className="font-black">
                  {streamerName}
                </p>
                <p className="text-xs text-white/40">
                  {selectedGame.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                LIVE
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-xs text-white/40">
                  Duration
                </p>
                <p className="font-bold">
                  {formatTime(streamSeconds)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-5 p-4 lg:grid-cols-[1fr_330px]">
          <main>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-950 via-[#101018] to-red-950/50">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-purple-500 blur-[100px]" />
                <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-red-500 blur-[120px]" />
              </div>

              <div className="relative flex min-h-[360px] items-center justify-center p-8 md:min-h-[480px]">
                <div className="text-center">
                  <div className="mb-6 text-8xl md:text-[120px]">
                    {selectedGame.emoji}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 px-6 py-4 backdrop-blur">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                      You are streaming
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {selectedGame.name}
                    </p>

                    <p className="mt-2 text-sm text-purple-300">
                      {actionMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative border-t border-white/10 bg-black/30 p-4">
                <div className="mb-2 flex justify-between text-xs text-white/40">
                  <span>Stream progress</span>
                  <span>
                    {formatTime(streamSeconds)} /{" "}
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-red-500 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-[#111119] p-4">
                <p className="text-xs text-white/40">
                  👥 Viewers
                </p>
                <p className="mt-1 text-xl font-black">
                  {formatNumber(streamViewers)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111119] p-4">
                <p className="text-xs text-white/40">
                  🔥 Peak
                </p>
                <p className="mt-1 text-xl font-black">
                  {formatNumber(peakViewers)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111119] p-4">
                <p className="text-xs text-white/40">
                  ❤️ Likes
                </p>
                <p className="mt-1 text-xl font-black">
                  {formatNumber(likes)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111119] p-4">
                <p className="text-xs text-white/40">
                  💰 Donations
                </p>
                <p className="mt-1 text-xl font-black">
                  {formatNGN(donations)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-[#111119] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                    Stream control
                  </p>

                  <h2 className="text-lg font-black">
                    Keep the audience engaged
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/40">
                    Hype
                  </p>

                  <p className="font-black text-orange-400">
                    {hype}%
                  </p>
                </div>
              </div>

              <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                  style={{
                    width: `${hype}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <button
                  onClick={() =>
                    performAction("play")
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                >
                  <span className="text-xl">
                    🎮
                  </span>
                  <p className="mt-2 font-black">
                    Play
                  </p>
                  <p className="text-xs text-white/40">
                    Gameplay
                  </p>
                </button>

                <button
                  onClick={() =>
                    performAction("interact")
                  }
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                >
                  <span className="text-xl">
                    💬
                  </span>
                  <p className="mt-2 font-black">
                    Chat
                  </p>
                  <p className="text-xs text-white/40">
                    Talk to viewers
                  </p>
                </button>

                <button
                  onClick={() =>
                    performAction("hype")
                  }
                  className="rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-4 text-left transition hover:bg-orange-500/10"
                >
                  <span className="text-xl">
                    🔥
                  </span>
                  <p className="mt-2 font-black">
                    Hype
                  </p>
                  <p className="text-xs text-white/40">
                    Fire up chat
                  </p>
                </button>

                <button
                  onClick={() =>
                    performAction("challenge")
                  }
                  className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-4 text-left transition hover:bg-purple-500/10"
                >
                  <span className="text-xl">
                    🏆
                  </span>
                  <p className="mt-2 font-black">
                    Challenge
                  </p>
                  <p className="text-xs text-white/40">
                    Risk for reward
                  </p>
                </button>

                <button
                  onClick={() =>
                    performAction("shoutout")
                  }
                  className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-4 text-left transition hover:bg-blue-500/10"
                >
                  <span className="text-xl">
                    📢
                  </span>
                  <p className="mt-2 font-black">
                    Shoutout
                  </p>
                  <p className="text-xs text-white/40">
                    Grow community
                  </p>
                </button>

                <button
                  onClick={() =>
                    performAction("clutch")
                  }
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-left transition hover:bg-red-500/10"
                >
                  <span className="text-xl">
                    🎯
                  </span>
                  <p className="mt-2 font-black">
                    Clutch
                  </p>
                  <p className="text-xs text-white/40">
                    Big risk
                  </p>
                </button>
              </div>

              <button
                onClick={finishStream}
                disabled={saving}
                className="mt-5 w-full rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-white/90 disabled:opacity-50"
              >
                {saving
                  ? "Saving stream..."
                  : "⏹ End Stream & Collect Earnings"}
              </button>
            </div>
          </main>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#111119] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-black">
                  💬 Live Chat
                </h2>

                <span className="text-xs text-red-400">
                  LIVE
                </span>
              </div>

              <div className="space-y-3">
                {chatMessages.map(
                  (message, index) => (
                    <div
                      key={`${message}-${index}`}
                      className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-white/70"
                    >
                      {message}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#111119] p-5">
              <h2 className="mb-4 font-black">
                📊 Stream Stats
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">
                    Followers
                  </span>
                  <span className="font-bold">
                    +{formatNumber(followers)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/40">
                    Subscribers
                  </span>
                  <span className="font-bold">
                    {formatNumber(subscribers)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/40">
                    Donations
                  </span>
                  <span className="font-bold">
                    {formatNGN(donations)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/40">
                    Sponsors
                  </span>
                  <span className="font-bold">
                    {formatNGN(sponsorIncome)}
                  </span>
                </div>
              </div>
            </div>

            {event && (
              <div className="animate-pulse rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-red-400">
                  Live Event
                </p>

                <h2 className="mt-2 text-lg font-black">
                  {event.title}
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  {event.message}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  if (screen === "result" && result && selectedGame) {
    return (
      <div className="min-h-screen bg-[#08080d] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111119] shadow-2xl">
            <div className="bg-gradient-to-br from-purple-700/30 via-transparent to-red-600/20 p-8 text-center md:p-12">
              <div className="text-6xl">
                🏆
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-purple-300">
                Stream Complete
              </p>

              <h1 className="mt-2 text-4xl font-black md:text-6xl">
                Great Stream!
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-white/50">
                Your {selectedGame.name} broadcast has ended.
                Your audience reacted to your performance.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white/5 p-5 text-center">
                <p className="text-xs text-white/40">
                  Peak Viewers
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatNumber(
                    result.peakViewers
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5 text-center">
                <p className="text-xs text-white/40">
                  Followers
                </p>

                <p className="mt-2 text-2xl font-black">
                  +{formatNumber(
                    result.followersGained
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5 text-center">
                <p className="text-xs text-white/40">
                  Likes
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatNumber(result.likes)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5 text-center">
                <p className="text-xs text-white/40">
                  Subscribers
                </p>

                <p className="mt-2 text-2xl font-black">
                  {formatNumber(
                    result.subscribers
                  )}
                </p>
              </div>
            </div>

            <div className="mx-6 rounded-3xl border border-green-500/20 bg-green-500/5 p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-green-400">
                Total Stream Earnings
              </p>

              <p className="mt-2 text-4xl font-black text-green-300">
                +{formatNGN(result.cashEarned)}
              </p>

              <p className="mt-2 text-sm text-white/40">
                Reputation +{result.reputationGained} ·
                Score {formatNumber(result.score)}
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <button
                onClick={() => {
                  resetStreamStats();
                  setScreen("select");
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-black transition hover:bg-white/10"
              >
                🎮 Stream Again
              </button>

              <button
                onClick={returnToStudio}
                className="rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-white/90"
              >
                🏠 Back to Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
