"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PoliceCall,
  POLICE_CALLS,
  POLICE_DECISIONS,
  PoliceDecision,
  calculatePoliceResult,
  getPoliceDifficultyLabel,
} from "@/lib/game/policeOfficer";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

type Screen = "dispatch" | "briefing" | "incident" | "result";

interface PoliceOfficerPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

function difficultyClass(
  difficulty: PoliceCall["difficulty"]
) {
  switch (difficulty) {
    case "easy":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "hard":
      return "border-orange-400/30 bg-orange-400/10 text-orange-300";
    case "critical":
      return "border-red-400/40 bg-red-500/15 text-red-300";
  }
}

export default function PoliceOfficerPanel({
  player,
  setPlayer,
}: PoliceOfficerPanelProps) {
  const [screen, setScreen] = useState<Screen>("dispatch");
  const [selectedCall, setSelectedCall] =
    useState<PoliceCall | null>(null);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedDecision, setSelectedDecision] =
    useState<PoliceDecision | null>(null);

  const [result, setResult] = useState<ReturnType<
    typeof calculatePoliceResult
  > | null>(null);

  const [totalCalls, setTotalCalls] = useState(0);
  const [successfulCalls, setSuccessfulCalls] = useState(0);
  const [flash, setFlash] = useState(false);

  const availableCalls = useMemo(() => {
    return [...POLICE_CALLS].sort(() => Math.random() - 0.5);
  }, [screen]);

  useEffect(() => {
    if (screen !== "incident" || !selectedCall) {
      return;
    }

    if (timeRemaining <= 0) {
      finishIncident();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeRemaining((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [screen, timeRemaining, selectedCall]);

  function startCall(policeCall: PoliceCall) {
    setSelectedCall(policeCall);
    setSelectedDecision(null);
    setResult(null);
    setTimeRemaining(policeCall.timeLimit);
    setScreen("briefing");
  }

  function beginIncident() {
    if (!selectedCall) return;

    setSelectedDecision(null);
    setTimeRemaining(selectedCall.timeLimit);
    setFlash(true);

    window.setTimeout(() => {
      setFlash(false);
      setScreen("incident");
    }, 450);
  }

  function chooseDecision(decision: PoliceDecision) {
    if (!selectedCall || selectedDecision) {
      return;
    }

    setSelectedDecision(decision);

    window.setTimeout(() => {
      finishIncident(decision);
    }, 650);
  }

  function finishIncident(
    decisionOverride?: PoliceDecision
  ) {
    if (!selectedCall || result) {
      return;
    }

    const decision =
      decisionOverride ?? selectedDecision;

    if (!decision) {
      const failedResult = calculatePoliceResult(
        selectedCall,
        "warn",
        selectedCall.timeLimit
      );

      applyResult(failedResult);
      return;
    }

    const elapsed =
      selectedCall.timeLimit - timeRemaining;

    const policeResult = calculatePoliceResult(
      selectedCall,
      decision,
      elapsed
    );

    applyResult(policeResult);
  }

  function applyResult(
    policeResult: ReturnType<typeof calculatePoliceResult>
  ) {
    setResult(policeResult);
    setTotalCalls((current) => current + 1);

    if (policeResult.success) {
      setSuccessfulCalls((current) => current + 1);
    }

    const nextPlayer = {
      ...player,
      cash: Math.max(
        0,
        player.cash + policeResult.reward
      ),
      reputation: Math.max(
        0,
        player.reputation + policeResult.reputation
      ),
      jobExperience: Math.max(
        0,
        player.jobExperience + policeResult.score
      ),
      energy: Math.max(0, player.energy - 20),
    };

    setPlayer(nextPlayer);
    savePersistentPlayerState(nextPlayer);

    setScreen("result");
  }

  function returnToDispatch() {
    setSelectedCall(null);
    setSelectedDecision(null);
    setResult(null);
    setTimeRemaining(0);
    setScreen("dispatch");
  }

  if (screen === "dispatch") {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950 via-slate-950 to-black p-6 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-3xl ring-1 ring-blue-400/20">
                👮🏾‍♂️
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
                  Abuja Police Department
                </p>

                <h1 className="text-2xl font-black text-white sm:text-3xl">
                  Police Dispatch
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Calls are coming in across Abuja. Respond to
              incidents, investigate situations and make the
              right decision before the situation gets worse.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Calls
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {totalCalls}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Successful
                </p>
                <p className="mt-1 text-xl font-black text-emerald-300">
                  {successfulCalls}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">
                  Energy
                </p>
                <p className="mt-1 text-xl font-black text-yellow-300">
                  {player.energy}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">
                Incoming Calls
              </h2>

              <p className="text-sm text-slate-400">
                Choose your next police assignment.
              </p>
            </div>

            <span className="animate-pulse rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
              ● LIVE
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {availableCalls.map((policeCall) => (
              <button
                key={policeCall.id}
                type="button"
                onClick={() => startCall(policeCall)}
                disabled={player.energy < 20}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition group-hover:bg-blue-500/15" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 text-3xl">
                        {policeCall.type === "pursuit"
                          ? "🚓"
                          : policeCall.type === "crime-scene"
                            ? "🔎"
                            : policeCall.type === "missing-person"
                              ? "🧍"
                              : "🚨"}
                      </div>

                      <h3 className="text-lg font-black text-white">
                        {policeCall.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        📍 {policeCall.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${difficultyClass(
                        policeCall.difficulty
                      )}`}
                    >
                      {getPoliceDifficultyLabel(
                        policeCall.difficulty
                      )}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {policeCall.description}
                  </p>

                  {policeCall.suspect && (
                    <div className="mt-3 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs text-red-200">
                      👤 Suspect: {policeCall.suspect}
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Time
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {policeCall.timeLimit}s
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Reward
                      </p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">
                        ₦{policeCall.baseReward.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Rep
                      </p>
                      <p className="mt-1 text-sm font-bold text-yellow-300">
                        +{policeCall.reputation}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">
                      🚓 Respond to call
                    </span>

                    <span className="text-slate-500 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {player.energy < 20 && (
            <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-200">
              ⚡ You need at least 20 energy to respond to a
              police call.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedCall) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-950 p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-red-500/5" />

        <div className="relative mx-auto max-w-2xl">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-blue-500/10 text-5xl ring-1 ring-blue-400/20">
              🚨
            </div>

            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
              Dispatch Assignment
            </p>

            <h1 className="mt-2 text-3xl font-black text-white">
              {selectedCall.title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              📍 {selectedCall.location}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm leading-7 text-slate-200">
              {selectedCall.description}
            </p>

            {selectedCall.suspect && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-red-300">
                  Person of Interest
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {selectedCall.suspect}
                </p>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Response Window
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {selectedCall.timeLimit}s
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Base Reward
                </p>

                <p className="mt-1 text-xl font-black text-emerald-300">
                  ₦{selectedCall.baseReward.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Reputation
                </p>

                <p className="mt-1 text-xl font-black text-yellow-300">
                  +{selectedCall.reputation}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={returnToDispatch}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold text-slate-300 transition hover:bg-white/10"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={beginIncident}
              className="flex-[2] rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.02] hover:bg-blue-500"
            >
              🚓 RESPOND NOW
            </button>
          </div>
        </div>

        {flash && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
            <div className="animate-ping text-7xl">
              🚓
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "incident" && selectedCall) {
    const progress =
      (timeRemaining / selectedCall.timeLimit) * 100;

    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950 via-slate-950 to-black p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                Incident Active
              </p>

              <h1 className="mt-1 text-2xl font-black text-white">
                {selectedCall.title}
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                📍 {selectedCall.location}
              </p>
            </div>

            <div
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 ${
                timeRemaining <= 8
                  ? "animate-pulse border-red-400 bg-red-500/15"
                  : "border-blue-400/30 bg-blue-500/10"
              }`}
            >
              <span className="text-2xl font-black text-white">
                {timeRemaining}
              </span>

              <span className="text-[9px] uppercase text-slate-400">
                seconds
              </span>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all duration-1000 ${
                timeRemaining <= 8
                  ? "bg-red-500"
                  : "bg-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-blue-500/10 text-5xl">
              👮🏾‍♂️
            </div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Situation Report
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              What will you do?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Assess the situation and choose the most
              appropriate police response.
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-white">
                Select Action
              </h3>

              <span className="text-xs font-bold text-blue-300">
                Think fast
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {POLICE_DECISIONS.map((decision) => {
                const selected =
                  selectedDecision === decision.id;

                return (
                  <button
                    key={decision.id}
                    type="button"
                    onClick={() =>
                      chooseDecision(decision.id)
                    }
                    disabled={Boolean(selectedDecision)}
                    className={`group rounded-2xl border p-4 text-left transition duration-200 ${
                      selected
                        ? "scale-[1.02] border-blue-400 bg-blue-500/15"
                        : "border-white/10 bg-white/5 hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/10"
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                        {decision.icon}
                      </div>

                      <div>
                        <p className="font-black text-white">
                          {decision.name}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {decision.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "result" && selectedCall && result) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div
          className={`absolute inset-0 ${
            result.success
              ? "bg-blue-500/5"
              : "bg-red-500/5"
          }`}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-6xl ${
              result.success
                ? "animate-bounce bg-blue-500/10"
                : "bg-red-500/10"
            }`}
          >
            {result.success ? "👮🏾‍♂️" : "🚨"}
          </div>

          <p
            className={`mt-6 text-xs font-black uppercase tracking-[0.3em] ${
              result.success
                ? "text-blue-300"
                : "text-red-300"
            }`}
          >
            {result.success
              ? "Situation Under Control"
              : "Incident Mishandled"}
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            {result.success
              ? "Good Police Work!"
              : "Better Judgment Needed"}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
            {result.message}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase text-slate-500">
                Score
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {result.score}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase text-slate-500">
                Earnings
              </p>

              <p className="mt-1 text-lg font-black text-emerald-300">
                ₦{result.reward.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase text-slate-500">
                Reputation
              </p>

              <p className="mt-1 text-2xl font-black text-yellow-300">
                +{result.reputation}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase text-slate-500">
                Response
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                {result.responseTime}s
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Decision
              </span>

              <span
                className={
                  result.correctDecision
                    ? "font-black text-emerald-300"
                    : "font-black text-red-300"
                }
              >
                {result.correctDecision
                  ? "✓ Correct"
                  : "✕ Incorrect"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Energy used
              </span>

              <span className="font-bold text-white">
                -20 ⚡
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={returnToDispatch}
            className="mt-7 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:scale-[1.01] hover:bg-blue-500"
          >
            🚓 TAKE ANOTHER CALL
          </button>
        </div>
      </div>
    );
  }

  return null;
}
