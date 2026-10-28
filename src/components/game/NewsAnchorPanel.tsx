"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  NewsAnchorAction,
  NewsAnchorResult,
  NewsScenario,
  NewsStory,
  calculateNewsAnchorResult,
  getAllNewsStories,
  getNewsActionOutcome,
  getNewsResponseTime,
  getNewsScenarios,
} from "@/lib/game/newsAnchor";
import {
  PlayerGameState,
  savePlayerState,
} from "@/lib/game/player";

interface NewsAnchorPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

type Screen =
  | "studio"
  | "stories"
  | "briefing"
  | "broadcast"
  | "result";

const ENERGY_COST = 18;

const actionLabels: Record<NewsAnchorAction, string> = {
  "verify-source": "Verify Sources",
  "read-headline": "Read Headline",
  "ask-question": "Ask Question",
  "challenge-guest": "Challenge Guest",
  clarify: "Clarify",
  "break-news": "Break News",
  "correct-error": "Correct Error",
  "give-analysis": "Give Analysis",
  "take-interview": "Take Interview",
  "close-broadcast": "Close Broadcast",
};

const actionIcons: Record<NewsAnchorAction, string> = {
  "verify-source": "🔎",
  "read-headline": "📰",
  "ask-question": "❓",
  "challenge-guest": "🎙️",
  clarify: "💡",
  "break-news": "🚨",
  "correct-error": "⚠️",
  "give-analysis": "📊",
  "take-interview": "👤",
  "close-broadcast": "🎬",
};

function difficultyClass(
  difficulty: NewsStory["difficulty"]
): string {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    case "medium":
      return "bg-yellow-500/15 text-yellow-300 border-yellow-400/20";
    case "hard":
      return "bg-orange-500/15 text-orange-300 border-orange-400/20";
    case "extreme":
      return "bg-red-500/15 text-red-300 border-red-400/20";
    default:
      return "bg-white/10 text-white/70 border-white/10";
  }
}

function outcomeClass(
  outcome: NewsAnchorResult["outcome"]
): string {
  switch (outcome) {
    case "excellent":
      return "text-emerald-300";
    case "good":
      return "text-cyan-300";
    case "mixed":
      return "text-yellow-300";
    case "poor":
      return "text-orange-300";
    case "disaster":
      return "text-red-300";
    default:
      return "text-white";
  }
}

export default function NewsAnchorPanel({
  player,
  setPlayer,
}: NewsAnchorPanelProps) {
  const [screen, setScreen] = useState<Screen>("studio");
  const [selectedStory, setSelectedStory] =
    useState<NewsStory | null>(null);

  const [scenario, setScenario] =
    useState<NewsScenario | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [responseTime, setResponseTime] = useState(10);

  const [score, setScore] = useState(0);
  const [audienceRating, setAudienceRating] = useState(50);
  const [credibility, setCredibility] = useState(70);

  const [successfulDecisions, setSuccessfulDecisions] =
    useState(0);

  const [failedDecisions, setFailedDecisions] =
    useState(0);

  const [message, setMessage] = useState(
    "Welcome to the Abuja newsroom."
  );

  const [broadcastLog, setBroadcastLog] = useState<string[]>(
    []
  );

  const [result, setResult] =
    useState<NewsAnchorResult | null>(null);

  const [busy, setBusy] = useState(false);

  const stories = useMemo(
    () => getAllNewsStories(),
    []
  );

  const scenarios = useMemo(
    () =>
      selectedStory
        ? getNewsScenarios(selectedStory.id)
        : [],
    [selectedStory]
  );

  const progressPercent = selectedStory
    ? Math.min(
        100,
        Math.round(
          ((selectedStory.durationSeconds - timeLeft) /
            selectedStory.durationSeconds) *
            100
        )
      )
    : 0;

  useEffect(() => {
    if (screen !== "broadcast") {
      return;
    }

    if (timeLeft <= 0) {
      finishBroadcast();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, timeLeft]);

  useEffect(() => {
    if (screen !== "broadcast" || !scenario) {
      return;
    }

    setResponseTime(
      getNewsResponseTime(
        selectedStory?.difficulty ?? "medium"
      )
    );

    const responseTimer = window.setInterval(() => {
      setResponseTime((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(responseTimer);
  }, [scenario, screen, selectedStory]);

  useEffect(() => {
    if (
      screen === "broadcast" &&
      scenario &&
      responseTime === 0
    ) {
      handleAction("close-broadcast");
    }
  }, [responseTime, scenario, screen]);

  function resetBroadcastState() {
    setScenario(null);
    setTimeLeft(0);
    setResponseTime(10);
    setScore(0);
    setAudienceRating(50);
    setCredibility(70);
    setSuccessfulDecisions(0);
    setFailedDecisions(0);
    setBroadcastLog([]);
    setMessage("Broadcast ready.");
    setResult(null);
  }

  function startStory(story: NewsStory) {
    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to anchor this broadcast.`
      );
      return;
    }

    resetBroadcastState();
    setSelectedStory(story);
    setScreen("briefing");
  }

  function beginBroadcast() {
    if (!selectedStory) {
      return;
    }

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to go live.`
      );
      return;
    }

    const firstScenario =
      scenarios.length > 0 ? scenarios[0] : null;

    if (!firstScenario) {
      setMessage(
        "This story does not have any broadcast scenarios yet."
      );
      return;
    }

    setScenario(firstScenario);
    setTimeLeft(selectedStory.durationSeconds);
    setResponseTime(
      getNewsResponseTime(selectedStory.difficulty)
    );
    setScreen("broadcast");
    setMessage("You are LIVE. Make your first newsroom decision.");
    setBroadcastLog([
      `🔴 LIVE: ${selectedStory.title}`,
      "The studio camera is rolling.",
    ]);
  }

  function nextScenario() {
    if (!selectedStory) {
      return;
    }

    const currentIndex = scenario
      ? scenarios.findIndex(
          (item) => item.id === scenario.id
        )
      : -1;

    const nextIndex = currentIndex + 1;

    if (nextIndex >= scenarios.length) {
      finishBroadcast();
      return;
    }

    const next = scenarios[nextIndex];

    setScenario(next);
    setResponseTime(
      getNewsResponseTime(selectedStory.difficulty)
    );
  }

  function handleAction(action: NewsAnchorAction) {
    if (!scenario || !selectedStory || busy) {
      return;
    }

    if (action === "close-broadcast") {
      finishBroadcast();
      return;
    }

    setBusy(true);

    const outcome = getNewsActionOutcome(
      scenario,
      action
    );

    const responseBonus =
      responseTime >=
      getNewsResponseTime(selectedStory.difficulty) * 0.7
        ? 20
        : responseTime <= 2
          ? -15
          : 5;

    const scoreChange =
      outcome.success
        ? 100 + responseBonus
        : -70;

    setScore((current) =>
      Math.max(0, current + scoreChange)
    );

    setAudienceRating((current) =>
      Math.max(
        0,
        Math.min(
          100,
          current + outcome.audienceImpact
        )
      )
    );

    setCredibility((current) =>
      Math.max(
        0,
        Math.min(
          100,
          current + outcome.credibilityImpact
        )
      )
    );

    if (outcome.success) {
      setSuccessfulDecisions(
        (current) => current + 1
      );
    } else {
      setFailedDecisions(
        (current) => current + 1
      );
    }

    setMessage(outcome.message);

    setBroadcastLog((current) => [
      ...current,
      `${outcome.success ? "✅" : "❌"} ${
        actionLabels[action]
      }: ${outcome.message}`,
    ]);

    window.setTimeout(() => {
      setBusy(false);
      nextScenario();
    }, 900);
  }

  function finishBroadcast() {
    if (screen !== "broadcast" || !selectedStory) {
      return;
    }

    const finalResult = calculateNewsAnchorResult({
      story: selectedStory,
      score,
      audienceRating,
      credibility,
      successfulDecisions,
      failedDecisions,
    });

    setResult(finalResult);
    setScreen("result");
  }

  function collectReward() {
    if (!result || !selectedStory) {
      return;
    }

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      energy: Math.max(
        0,
        player.energy - ENERGY_COST
      ),
      reputation:
        player.reputation + result.reputation,
      currentJobId: "news-anchor",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);

    setMessage(
      `Broadcast complete. You earned ₦${result.cash.toLocaleString()}.`
    );

    setScreen("studio");
    setSelectedStory(null);
    setScenario(null);
    setResult(null);
    setBroadcastLog([]);
  }

  function leaveBroadcast() {
    setScreen("studio");
    setSelectedStory(null);
    setScenario(null);
    setResult(null);
    setBroadcastLog([]);
  }

  function openStories() {
    setScreen("stories");
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes}:${remaining
      .toString()
      .padStart(2, "0")}`;
  }

  if (screen === "studio") {
    return (
      <div className="min-h-[700px] rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl md:p-7">
        <div className="mb-6 overflow-hidden rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-950/60 via-slate-900 to-black">
          <div className="relative p-6 md:p-8">
            <div className="absolute right-5 top-5 animate-pulse rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">
              ● NEWSROOM LIVE
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-red-300">
              Abuja Life • News Network
            </p>

            <h1 className="text-3xl font-black md:text-5xl">
              Prime Time Newsroom
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 md:text-base">
              Become the voice of Abuja. Break stories,
              interview guests, verify information and build
              a reputation as one of the city's most trusted
              anchors.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase text-white/45">
                  Cash
                </div>
                <div className="mt-1 text-2xl font-black">
                  ₦{player.cash.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase text-white/45">
                  Energy
                </div>
                <div className="mt-1 text-2xl font-black">
                  {player.energy}/{player.maxEnergy}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs uppercase text-white/45">
                  Reputation
                </div>
                <div className="mt-1 text-2xl font-black">
                  {player.reputation}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={openStories}
            className="group rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500/15 to-red-950/30 p-6 text-left transition hover:-translate-y-1 hover:border-red-300/40"
          >
            <div className="mb-4 text-4xl transition group-hover:scale-110">
              🎙️
            </div>

            <h2 className="text-xl font-black">
              Go On Air
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Choose a news story and run a live broadcast.
              Every decision affects your audience and
              credibility.
            </p>

            <div className="mt-5 inline-flex rounded-xl bg-red-500 px-4 py-2 text-sm font-bold">
              Choose Story →
            </div>
          </button>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 text-4xl">📺</div>

            <h2 className="text-xl font-black">
              Anchor Career
            </h2>

            <div className="mt-5 space-y-3 text-sm text-white/65">
              <div className="flex items-center justify-between">
                <span>Role</span>
                <span className="font-bold text-white">
                  News Anchor
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Energy / Broadcast</span>
                <span className="font-bold text-white">
                  {ENERGY_COST}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Stories Available</span>
                <span className="font-bold text-white">
                  {stories.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Career Experience</span>
                <span className="font-bold text-white">
                  {player.currentJobId === "news-anchor"
                    ? player.jobExperience.toLocaleString()
                    : "0"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
          {message}
        </div>
      </div>
    );
  }

  if (screen === "stories") {
    return (
      <div className="min-h-[700px] rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl md:p-7">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => setScreen("studio")}
              className="mb-4 text-sm font-semibold text-white/50 hover:text-white"
            >
              ← Back to Studio
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-300">
              Assignment Desk
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Choose Your Story
            </h1>

            <p className="mt-2 text-sm text-white/55">
              Bigger stories pay more, but mistakes can
              destroy your credibility.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
            Energy:{" "}
            <span className="font-black">
              {player.energy}/{player.maxEnergy}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => startStory(story)}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-red-400/30 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-3xl">
                  {story.type === "politics"
                    ? "🏛️"
                    : story.type === "business"
                      ? "💼"
                      : story.type === "crime"
                        ? "🚨"
                        : story.type === "weather"
                          ? "⛈️"
                          : story.type === "sports"
                            ? "🏆"
                            : story.type === "entertainment"
                              ? "🎬"
                              : "📰"}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${difficultyClass(
                    story.difficulty
                  )}`}
                >
                  {story.difficulty}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-black">
                {story.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/55">
                {story.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-black/25 p-3">
                  <div className="text-white/40">
                    Potential Pay
                  </div>
                  <div className="mt-1 font-black text-emerald-300">
                    ₦{story.maxPay.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl bg-black/25 p-3">
                  <div className="text-white/40">
                    Audience Target
                  </div>
                  <div className="mt-1 font-black">
                    {story.audienceTarget.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-xl bg-black/25 p-3">
                  <div className="text-white/40">
                    Sources
                  </div>
                  <div className="mt-1 font-black">
                    {story.sourcesRequired}
                  </div>
                </div>

                <div className="rounded-xl bg-black/25 p-3">
                  <div className="text-white/40">
                    Broadcast
                  </div>
                  <div className="mt-1 font-black">
                    {formatTime(story.durationSeconds)}
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm font-bold text-red-300">
                Enter newsroom →
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedStory) {
    return (
      <div className="min-h-[700px] rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl md:p-7">
        <button
          type="button"
          onClick={() => setScreen("stories")}
          className="mb-5 text-sm font-semibold text-white/50 hover:text-white"
        >
          ← Back to Stories
        </button>

        <div className="overflow-hidden rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-950/40 via-slate-900 to-black">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
                ASSIGNMENT
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${difficultyClass(
                  selectedStory.difficulty
                )}`}
              >
                {selectedStory.difficulty}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black md:text-4xl">
              {selectedStory.title}
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60 md:text-base">
              {selectedStory.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Base Pay
                </div>
                <div className="mt-1 font-black">
                  ₦{selectedStory.basePay.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Max Pay
                </div>
                <div className="mt-1 font-black text-emerald-300">
                  ₦{selectedStory.maxPay.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Sources
                </div>
                <div className="mt-1 font-black">
                  {selectedStory.sourcesRequired}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Energy
                </div>
                <div className="mt-1 font-black">
                  {ENERGY_COST}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/5 p-4 text-sm leading-6 text-yellow-100/75">
              ⚠️ Your credibility matters. Broadcasting
              unverified information can hurt your career,
              while careful reporting can dramatically
              increase your audience.
            </div>

            <button
              type="button"
              onClick={beginBroadcast}
              disabled={player.energy < ENERGY_COST}
              className="mt-6 w-full rounded-2xl bg-red-500 px-5 py-4 font-black transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {player.energy < ENERGY_COST
                ? `Need ${ENERGY_COST} Energy`
                : "🔴 GO LIVE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "broadcast" && selectedStory && scenario) {
    const credibilityWidth = Math.max(
      0,
      Math.min(100, credibility)
    );

    const audienceWidth = Math.max(
      0,
      Math.min(100, audienceRating)
    );

    return (
      <div className="min-h-[700px] rounded-3xl border border-white/10 bg-black p-4 text-white shadow-2xl md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-950/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="animate-pulse rounded-full bg-red-500 px-3 py-1 text-xs font-black">
              ● LIVE
            </span>

            <span className="text-sm font-bold">
              {selectedStory.title}
            </span>
          </div>

          <div
            className={`text-2xl font-black ${
              responseTime <= 2
                ? "animate-pulse text-red-300"
                : "text-white"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-red-950/30 to-black p-5 md:p-7">
              <div className="absolute right-5 top-5 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-red-300">
                ABUJA LIFE NEWS
              </div>

              <div className="flex min-h-[360px] flex-col justify-between">
                <div>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500 text-2xl">
                      🎙️
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                        LIVE ANCHOR
                      </div>
                      <div className="font-black">
                        New Citizen
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                      NEWSROOM DECISION
                    </div>

                    <h1 className="text-xl font-black leading-8 md:text-2xl">
                      {scenario.prompt}
                    </h1>

                    <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                      <span>
                        Response window
                      </span>
                      <span
                        className={
                          responseTime <= 2
                            ? "font-black text-red-300"
                            : "font-bold text-white"
                        }
                      >
                        {responseTime}s
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (responseTime /
                                getNewsResponseTime(
                                  selectedStory.difficulty
                                )) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs text-white/40">
                    <span>Broadcast Progress</span>
                    <span>{progressPercent}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  "verify-source",
                  "read-headline",
                  "ask-question",
                  "challenge-guest",
                  "clarify",
                  "break-news",
                  "correct-error",
                  "give-analysis",
                  "take-interview",
                ] as NewsAnchorAction[]
              ).map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled={busy}
                  onClick={() => handleAction(action)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="text-2xl">
                    {actionIcons[action]}
                  </div>

                  <div className="mt-2 text-sm font-black">
                    {actionLabels[action]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-5 text-sm font-black uppercase tracking-[0.15em] text-white/50">
                Broadcast Metrics
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-white/50">
                      Audience
                    </span>
                    <span className="font-black">
                      {audienceRating}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all"
                      style={{
                        width: `${audienceWidth}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-white/50">
                      Credibility
                    </span>
                    <span className="font-black">
                      {credibility}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{
                        width: `${credibilityWidth}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-black/30 p-3">
                    <div className="text-xs text-white/40">
                      Score
                    </div>
                    <div className="mt-1 text-xl font-black">
                      {score}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <div className="text-xs text-white/40">
                      Successes
                    </div>
                    <div className="mt-1 text-xl font-black text-emerald-300">
                      {successfulDecisions}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <div className="text-xs text-white/40">
                      Mistakes
                    </div>
                    <div className="mt-1 text-xl font-black text-red-300">
                      {failedDecisions}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/30 p-3">
                    <div className="text-xs text-white/40">
                      Energy
                    </div>
                    <div className="mt-1 text-xl font-black">
                      {player.energy}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 text-sm font-black">
                📝 Broadcast Log
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {broadcastLog.length === 0 ? (
                  <p className="text-xs text-white/40">
                    Waiting for your first newsroom decision...
                  </p>
                ) : (
                  broadcastLog.map((entry, index) => (
                    <div
                      key={`${entry}-${index}`}
                      className="rounded-xl bg-black/25 p-3 text-xs leading-5 text-white/60"
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={finishBroadcast}
              className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
            >
              End Broadcast
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "result" && result && selectedStory) {
    return (
      <div className="min-h-[700px] rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-2xl md:p-7">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/40 via-slate-900 to-black p-6 text-center md:p-10">
            <div className="text-6xl">
              {result.outcome === "excellent"
                ? "🏆"
                : result.outcome === "good"
                  ? "📺"
                  : result.outcome === "mixed"
                    ? "📰"
                    : result.outcome === "poor"
                      ? "⚠️"
                      : "🚨"}
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-red-300">
              Broadcast Complete
            </p>

            <h1
              className={`mt-2 text-3xl font-black md:text-5xl ${outcomeClass(
                result.outcome
              )}`}
            >
              {result.rank}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              {result.outcome.toUpperCase()} BROADCAST
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Broadcast Score
                </div>
                <div className="mt-1 text-3xl font-black">
                  {result.score}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Earnings
                </div>
                <div className="mt-1 text-3xl font-black text-emerald-300">
                  +₦{result.cash.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Audience Rating
                </div>
                <div className="mt-1 text-2xl font-black">
                  {result.audienceRating}%
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-xs text-white/40">
                  Credibility
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-300">
                  {result.credibility}%
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-4">
                <div className="text-xs text-white/40">
                  Correct Decisions
                </div>
                <div className="mt-1 text-xl font-black text-emerald-300">
                  {result.successfulDecisions}
                </div>
              </div>

              <div className="rounded-2xl bg-red-500/10 p-4">
                <div className="text-xs text-white/40">
                  Mistakes
                </div>
                <div className="mt-1 text-xl font-black text-red-300">
                  {result.failedDecisions}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/65">
              {getBroadcastSummary(result)}
            </div>

            <button
              type="button"
              onClick={collectReward}
              className="mt-6 w-full rounded-2xl bg-red-500 px-5 py-4 font-black transition hover:bg-red-400"
            >
              Collect ₦{result.cash.toLocaleString()} & Continue
            </button>

            <button
              type="button"
              onClick={leaveBroadcast}
              className="mt-3 w-full rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Leave Without Collecting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function getBroadcastSummary(
  result: NewsAnchorResult
): string {
  switch (result.outcome) {
    case "excellent":
      return "You handled the newsroom like a veteran. Your reporting was accurate, your audience stayed engaged and your credibility soared.";
    case "good":
      return "A strong shift in the newsroom. You balanced speed with accuracy and delivered a broadcast viewers could trust.";
    case "mixed":
      return "The broadcast had good moments, but some decisions affected your audience and credibility.";
    case "poor":
      return "The newsroom expected better. Your mistakes made the broadcast less reliable and reduced audience confidence.";
    case "disaster":
      return "The broadcast went badly. Too many poor decisions damaged both audience trust and your professional reputation.";
    default:
      return "Broadcast complete.";
  }
}
