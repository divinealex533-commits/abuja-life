"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  calculateMakeupArtistResult,
  getAllMakeupSessions,
  getMakeupActionLabel,
  getMakeupActionOutcome,
  getMakeupResponseTime,
  type MakeupArtistAction,
  type MakeupArtistResult,
  type MakeupSession,
} from "@/lib/game/makeupArtist";
import {
  loadPersistentPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

const ENERGY_COST = 20;

const ALL_ACTIONS: MakeupArtistAction[] = [
  "cleanse",
  "prime",
  "foundation",
  "concealer",
  "contour",
  "blush",
  "brows",
  "eyeshadow",
  "eyeliner",
  "lashes",
  "highlighter",
  "lip",
  "setting-spray",
  "final-check",
];

const difficultyStyles: Record<
  MakeupSession["difficulty"],
  string
> = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-400/20",
  hard: "bg-orange-500/15 text-orange-300 border-orange-400/20",
  extreme: "bg-red-500/15 text-red-300 border-red-400/20",
};

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export default function MakeupArtistPanel() {
  const sessions = useMemo(() => getAllMakeupSessions(), []);

  const [player, setPlayer] = useState<PlayerGameState | null>(null);
  const [screen, setScreen] = useState<
    "base" | "bookings" | "briefing" | "game" | "result"
  >("base");

  const [selectedSession, setSelectedSession] =
    useState<MakeupSession | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctActions, setCorrectActions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<MakeupArtistResult | null>(null);

  const [message, setMessage] = useState(
    "Choose a beauty booking to begin."
  );

  const [busy, setBusy] = useState(false);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  useEffect(() => {
    setPlayer(loadPersistentPlayerState());
  }, []);

  const client = selectedSession?.clients[0] ?? null;

  const requiredSteps = client?.requiredSteps ?? [];

  const progress = requiredSteps.length
    ? Math.min(
        100,
        Math.round((currentStep / requiredSteps.length) * 100)
      )
    : 0;

  function chooseSession(session: MakeupSession) {
    setSelectedSession(session);
    setScreen("briefing");
    setMessage(
      `${session.title} is ready. Read the client's requirements before starting.`
    );
    setActivityLog([]);
    setResult(null);
  }

  function startSession() {
    if (!player || !selectedSession || !client) return;

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to take this appointment.`
      );
      return;
    }

    setCurrentStep(0);
    setScore(0);
    setMistakes(0);
    setCorrectActions(0);
    setTimeLeft(selectedSession.durationSeconds);
    setActivityLog([
      `Appointment started with ${client.name}.`,
      `Requested style: ${client.style.replace("-", " ")}.`,
    ]);
    setMessage("The appointment has started. Follow the client's requested sequence.");
    setScreen("game");
  }

  function finishAppointment(completed: boolean, remainingTime: number) {
    if (!selectedSession || !client || !player) return;

    const finalResult = calculateMakeupArtistResult({
      client,
      score,
      correctActions,
      mistakes,
      completed,
      timeRemaining: remainingTime,
    });

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + finalResult.cash,
      energy: Math.max(0, player.energy - ENERGY_COST),
      reputation: Math.max(
        0,
        player.reputation + finalResult.reputation
      ),
      currentJobId: "makeup-artist",
      jobExperience:
        player.jobExperience + finalResult.xp,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);

    setResult(finalResult);
    setScreen("result");
    setMessage(finalResult.message);
  }

  function handleAction(action: MakeupArtistAction) {
    if (
      busy ||
      !client ||
      !selectedSession ||
      screen !== "game"
    ) {
      return;
    }

    setBusy(true);

    const expectedAction = requiredSteps[currentStep];

    const actionResult = getMakeupActionOutcome(
      client,
      action,
      currentStep
    );

    setMessage(actionResult.message);

    setActivityLog((previous) => [
      actionResult.success ? "✓" : "✕",
      ...previous,
    ].slice(0, 8));

    if (actionResult.success && action === expectedAction) {
      const nextCorrect = correctActions + 1;
      const nextScore = Math.max(0, score + actionResult.score);
      const nextStep = currentStep + 1;

      setCorrectActions(nextCorrect);
      setScore(nextScore);

      if (nextStep >= requiredSteps.length) {
        setCurrentStep(nextStep);

        setTimeout(() => {
          finishAppointment(true, timeLeft);
          setBusy(false);
        }, 350);

        return;
      }

      setCurrentStep(nextStep);
    } else {
      setMistakes((previous) => previous + 1);
      setScore((previous) =>
        Math.max(0, previous + actionResult.score)
      );
    }

    setTimeout(() => setBusy(false), 180);
  }

  useEffect(() => {
    if (screen !== "game") return;
    if (!selectedSession || !client) return;

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval);

          setTimeout(() => {
            finishAppointment(false, 0);
          }, 0);

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, selectedSession, client]);

  function returnToBase() {
    setScreen("base");
    setSelectedSession(null);
    setResult(null);
    setActivityLog([]);
    setMessage("Choose a beauty booking to begin.");
  }

  if (!player) {
    return (
      <div className="min-h-[500px] flex items-center justify-center rounded-3xl border border-white/10 bg-black/30">
        <div className="text-center">
          <div className="text-4xl animate-pulse">💄</div>
          <p className="mt-3 text-white/60">
            Loading your beauty studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[600px] rounded-3xl border border-pink-400/20 bg-gradient-to-br from-[#1a0715] via-[#100812] to-black p-4 text-white shadow-2xl sm:p-6">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/15 text-2xl">
              💄
            </div>

            <div>
              <h1 className="text-xl font-bold sm:text-2xl">
                Abuja Beauty Studio
              </h1>

              <p className="text-sm text-white/50">
                Makeup Artist Career
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
            <div className="text-[10px] uppercase text-white/40">
              Cash
            </div>
            <div className="font-bold text-emerald-300">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
            <div className="text-[10px] uppercase text-white/40">
              Energy
            </div>
            <div className="font-bold text-yellow-300">
              {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
            <div className="text-[10px] uppercase text-white/40">
              Reputation
            </div>
            <div className="font-bold text-pink-300">
              {player.reputation}
            </div>
          </div>
        </div>
      </div>

      {/* BASE */}
      {screen === "base" && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-pink-400/20 bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-transparent p-6">
            <div className="max-w-2xl">
              <div className="mb-3 text-4xl">💋✨</div>

              <h2 className="text-2xl font-black sm:text-3xl">
                Build your beauty empire.
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/60 sm:text-base">
                Take real makeup appointments around Abuja,
                satisfy demanding clients, build your reputation
                and earn more as your career grows.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl">👰🏾</div>
              <h3 className="mt-2 font-bold">Bridal</h3>
              <p className="mt-1 text-xs text-white/50">
                High-paying wedding appointments.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl">📸</div>
              <h3 className="mt-2 font-bold">Photoshoots</h3>
              <p className="mt-1 text-xs text-white/50">
                Create camera-ready looks.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-2xl">👑</div>
              <h3 className="mt-2 font-bold">VIP Clients</h3>
              <p className="mt-1 text-xs text-white/50">
                Unlock premium bookings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScreen("bookings")}
            className="w-full rounded-2xl bg-pink-500 px-5 py-4 font-black text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-400 active:scale-[0.98]"
          >
            💄 View Beauty Bookings
          </button>
        </div>
      )}

      {/* BOOKINGS */}
      {screen === "bookings" && (
        <div className="space-y-5">
          <div>
            <button
              type="button"
              onClick={returnToBase}
              className="mb-3 text-sm text-white/50 hover:text-white"
            >
              ← Back to studio
            </button>

            <h2 className="text-2xl font-black">
              Available Appointments
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Pick a client and prove your skills.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sessions.map((session) => {
              const bookingClient = session.clients[0];

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => chooseSession(session)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-pink-400/40 hover:bg-pink-500/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        {session.title}
                      </h3>

                      <p className="mt-1 text-xs text-white/50">
                        📍 {session.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${difficultyStyles[session.difficulty]}`}
                    >
                      {session.difficulty}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/60">
                    {session.description}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/20 p-2">
                      <div className="text-[10px] text-white/40">
                        Client
                      </div>
                      <div className="mt-1 text-xs font-bold">
                        {bookingClient.name}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2">
                      <div className="text-[10px] text-white/40">
                        Reward
                      </div>
                      <div className="mt-1 text-xs font-bold text-emerald-300">
                        ₦{bookingClient.rewardMin.toLocaleString()}+
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2">
                      <div className="text-[10px] text-white/40">
                        Time
                      </div>
                      <div className="mt-1 text-xs font-bold">
                        {formatTime(session.durationSeconds)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BRIEFING */}
      {screen === "briefing" && selectedSession && client && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setScreen("bookings")}
            className="text-sm text-white/50 hover:text-white"
          >
            ← Back to bookings
          </button>

          <div className="rounded-3xl border border-pink-400/20 bg-pink-500/[0.06] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-4xl">💄</div>

                <h2 className="mt-3 text-2xl font-black">
                  {client.name}'s Appointment
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                  {selectedSession.description}
                </p>
              </div>

              <span
                className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${difficultyStyles[selectedSession.difficulty]}`}
              >
                {selectedSession.difficulty}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  Requested Style
                </div>
                <div className="mt-1 font-bold capitalize">
                  {client.style.replace("-", " ")}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  Desired Finish
                </div>
                <div className="mt-1 font-bold">
                  {client.preferredFinish}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  Appointment Time
                </div>
                <div className="mt-1 font-bold">
                  {formatTime(selectedSession.durationSeconds)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="font-bold">
              Makeup Plan
            </h3>

            <div className="mt-3 flex flex-wrap gap-2">
              {client.requiredSteps.map((step, index) => (
                <span
                  key={`${step}-${index}`}
                  className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70"
                >
                  {index + 1}. {getMakeupActionLabel(step)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setScreen("bookings")}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 font-bold text-white/70 hover:bg-white/[0.08]"
            >
              Choose Another
            </button>

            <button
              type="button"
              onClick={startSession}
              disabled={player.energy < ENERGY_COST}
              className="flex-1 rounded-2xl bg-pink-500 px-5 py-4 font-black shadow-lg shadow-pink-500/20 transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {player.energy < ENERGY_COST
                ? `Need ${ENERGY_COST} Energy`
                : "💄 Start Appointment"}
            </button>
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === "game" && selectedSession && client && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-pink-300">
                Live Appointment
              </div>

              <h2 className="mt-1 text-xl font-black">
                {client.name} — {client.style.replace("-", " ")}
              </h2>
            </div>

            <div
              className={`rounded-2xl border px-4 py-3 text-center ${
                timeLeft <= 15
                  ? "border-red-400/30 bg-red-500/10 text-red-300"
                  : "border-white/10 bg-white/[0.04]"
              }`}
            >
              <div className="text-[10px] uppercase text-white/40">
                Time Left
              </div>

              <div className="text-xl font-black">
                ⏱️ {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          <div>
            <div className="mb-2 flex justify-between text-xs text-white/50">
              <span>Makeup Progress</span>
              <span>
                {currentStep}/{requiredSteps.length}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* CURRENT STEP */}
          <div className="rounded-3xl border border-pink-400/20 bg-gradient-to-br from-pink-500/10 to-purple-500/5 p-6 text-center">
            {currentStep < requiredSteps.length ? (
              <>
                <div className="text-5xl">💄</div>

                <p className="mt-4 text-xs uppercase tracking-widest text-white/40">
                  Current Step
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  {getMakeupActionLabel(
                    requiredSteps[currentStep]
                  )}
                </h3>

                <p className="mt-2 text-sm text-white/50">
                  Choose the correct makeup action below.
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl">✨</div>
                <h3 className="mt-3 text-2xl font-black">
                  Finalizing Look
                </h3>
              </>
            )}
          </div>

          {/* ACTIONS */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">
                Beauty Tools
              </h3>

              <div className="text-xs text-white/40">
                Score: {score} · Mistakes: {mistakes}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {ALL_ACTIONS.map((action) => {
                const isExpected =
                  requiredSteps[currentStep] === action;

                return (
                  <button
                    key={action}
                    type="button"
                    disabled={busy}
                    onClick={() => handleAction(action)}
                    className={`rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
                      isExpected
                        ? "border-pink-400/30 bg-pink-500/10 hover:bg-pink-500/20"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="text-lg">
                      {action === "cleanse"
                        ? "🫧"
                        : action === "prime"
                        ? "✨"
                        : action === "foundation"
                        ? "🎨"
                        : action === "concealer"
                        ? "🖌️"
                        : action === "contour"
                        ? "🌓"
                        : action === "blush"
                        ? "🌸"
                        : action === "brows"
                        ? "👁️"
                        : action === "eyeshadow"
                        ? "🎨"
                        : action === "eyeliner"
                        ? "✏️"
                        : action === "lashes"
                        ? "👁️"
                        : action === "highlighter"
                        ? "✨"
                        : action === "lip"
                        ? "💋"
                        : action === "setting-spray"
                        ? "💦"
                        : "🔍"}
                    </div>

                    <div className="mt-2 text-xs font-bold">
                      {getMakeupActionLabel(action)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATUS */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs text-white/40">
                Client Patience
              </div>

              <div className="mt-2 text-lg font-black text-yellow-300">
                {Math.max(
                  0,
                  client.patience - mistakes * 10
                )}
                %
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs text-white/40">
                Correct Steps
              </div>

              <div className="mt-2 text-lg font-black text-emerald-300">
                {correctActions}/{requiredSteps.length}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs text-white/40">
                Appointment
              </div>

              <div className="mt-2 text-lg font-black text-pink-300">
                {selectedSession.location}
              </div>
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">
              Studio Activity
            </div>

            <div className="space-y-1 text-xs text-white/60">
              {activityLog.length === 0 ? (
                <div>Waiting for your first action...</div>
              ) : (
                activityLog.map((entry, index) => (
                  <div key={`${entry}-${index}`}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-pink-400/10 bg-pink-500/[0.04] p-4 text-sm text-white/60">
            💡 Tip: Follow the requested sequence. Randomly
            applying products will reduce your score.
          </div>

          <div className="text-center text-sm text-white/50">
            {message}
          </div>
        </div>
      )}

      {/* RESULT */}
      {screen === "result" && result && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-pink-400/20 bg-gradient-to-br from-pink-500/15 to-purple-500/10 p-8 text-center">
            <div className="text-6xl">
              {result.outcome === "legendary"
                ? "👑"
                : result.outcome === "excellent"
                ? "✨"
                : result.outcome === "good"
                ? "💄"
                : result.outcome === "mixed"
                ? "👍"
                : result.outcome === "poor"
                ? "😬"
                : "🚨"}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.25em] text-pink-300">
              Appointment Complete
            </p>

            <h2 className="mt-2 text-3xl font-black capitalize">
              {result.outcome}
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/60">
              {result.message}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xs text-white/40">
                Earnings
              </div>
              <div className="mt-1 text-xl font-black text-emerald-300">
                +₦{result.cash.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xs text-white/40">
                Reputation
              </div>
              <div className="mt-1 text-xl font-black text-pink-300">
                {result.reputation >= 0 ? "+" : ""}
                {result.reputation}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xs text-white/40">
                XP
              </div>
              <div className="mt-1 text-xl font-black text-purple-300">
                +{result.xp}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-xs text-white/40">
                Score
              </div>
              <div className="mt-1 text-xl font-black">
                {result.score}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs uppercase tracking-widest text-white/40">
              Career Rank
            </div>

            <div className="mt-2 text-xl font-black">
              💄 {result.rank}
            </div>

            <div className="mt-3 text-sm text-white/50">
              Clients completed:{" "}
              <span className="font-bold text-white">
                {result.clientsCompleted}
              </span>
              {" · "}
              Mistakes:{" "}
              <span className="font-bold text-white">
                {result.mistakes}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={returnToBase}
            className="w-full rounded-2xl bg-pink-500 px-5 py-4 font-black shadow-lg shadow-pink-500/20 transition hover:bg-pink-400"
          >
            💄 Return to Beauty Studio
          </button>
        </div>
      )}
    </div>
  );
}
