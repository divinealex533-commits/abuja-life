"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EmergencyCall,
  PARAMEDIC_EMERGENCIES,
  PARAMEDIC_TREATMENTS,
  TreatmentType,
  calculateParamedicResult,
  getParamedicDifficultyLabel,
} from "@/lib/game/paramedic";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

type Screen = "dispatch" | "briefing" | "emergency" | "result";

interface ParamedicPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

function difficultyClass(difficulty: EmergencyCall["difficulty"]) {
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

export default function ParamedicPanel({
  player,
  setPlayer,
}: ParamedicPanelProps) {
  const [screen, setScreen] = useState<Screen>("dispatch");
  const [selectedEmergency, setSelectedEmergency] =
    useState<EmergencyCall | null>(null);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedTreatment, setSelectedTreatment] =
    useState<TreatmentType | null>(null);

  const [result, setResult] = useState<ReturnType<
    typeof calculateParamedicResult
  > | null>(null);

  const [totalCalls, setTotalCalls] = useState(0);
  const [successfulCalls, setSuccessfulCalls] = useState(0);
  const [flash, setFlash] = useState(false);

  const availableEmergencies = useMemo(() => {
    return [...PARAMEDIC_EMERGENCIES].sort(() => Math.random() - 0.5);
  }, [screen]);

  useEffect(() => {
    if (screen !== "emergency" || !selectedEmergency) {
      return;
    }

    if (timeRemaining <= 0) {
      finishEmergency();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [screen, timeRemaining, selectedEmergency]);

  function startEmergency(emergency: EmergencyCall) {
    setSelectedEmergency(emergency);
    setSelectedTreatment(null);
    setResult(null);
    setTimeRemaining(emergency.timeLimit);
    setScreen("briefing");
  }

  function beginResponse() {
    if (!selectedEmergency) return;

    setSelectedTreatment(null);
    setTimeRemaining(selectedEmergency.timeLimit);
    setFlash(true);

    window.setTimeout(() => {
      setFlash(false);
      setScreen("emergency");
    }, 350);
  }

  function chooseTreatment(treatment: TreatmentType) {
    if (!selectedEmergency || selectedTreatment) return;

    setSelectedTreatment(treatment);

    window.setTimeout(() => {
      finishEmergency(treatment);
    }, 550);
  }

  function finishEmergency(
    treatmentOverride?: TreatmentType
  ) {
    if (!selectedEmergency || result) return;

    const treatment =
      treatmentOverride ?? selectedTreatment;

    if (!treatment) {
      const fallback = selectedEmergency.requiredTreatment;

      const emergencyResult = calculateParamedicResult(
        selectedEmergency,
        fallback,
        selectedEmergency.timeLimit
      );

      applyResult(emergencyResult);
      return;
    }

    const elapsed =
      selectedEmergency.timeLimit - timeRemaining;

    const emergencyResult = calculateParamedicResult(
      selectedEmergency,
      treatment,
      elapsed
    );

    applyResult(emergencyResult);
  }

  function applyResult(
    emergencyResult: ReturnType<typeof calculateParamedicResult>
  ) {
    setResult(emergencyResult);
    setTotalCalls((current) => current + 1);

    if (emergencyResult.success) {
      setSuccessfulCalls((current) => current + 1);
    }

    const nextPlayer = {
      ...player,
      cash: Math.max(
        0,
        player.cash + emergencyResult.reward
      ),
      reputation: Math.max(
        0,
        player.reputation + emergencyResult.reputation
      ),
      jobExperience: Math.max(
        0,
        player.jobExperience + emergencyResult.score
      ),
      energy: Math.max(
        0,
        player.energy - 22
      ),
    };

    setPlayer(nextPlayer);
    savePersistentPlayerState(nextPlayer);

    setScreen("result");
  }

  function returnToDispatch() {
    setSelectedEmergency(null);
    setSelectedTreatment(null);
    setResult(null);
    setTimeRemaining(0);
    setScreen("dispatch");
  }

  if (screen === "dispatch") {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950 via-slate-950 to-black p-6 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-3xl ring-1 ring-red-400/20">
                🚑
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-300">
                  Abuja Emergency Services
                </p>

                <h1 className="text-2xl font-black text-white sm:text-3xl">
                  Paramedic Dispatch
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Emergency calls are coming in across Abuja.
              Pick a case, reach the patient quickly and make
              the right treatment decision before time runs out.
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
                  Saved
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
                Incoming Emergencies
              </h2>

              <p className="text-sm text-slate-400">
                Choose your next call.
              </p>
            </div>

            <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
              LIVE DISPATCH
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {availableEmergencies.map((emergency) => (
              <button
                key={emergency.id}
                type="button"
                onClick={() => startEmergency(emergency)}
                disabled={player.energy < 22}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-red-400/30 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-red-500/5 blur-3xl transition group-hover:bg-red-500/15" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 text-3xl">
                        {emergency.difficulty === "critical"
                          ? "🚨"
                          : "🩺"}
                      </div>

                      <h3 className="text-lg font-black text-white">
                        {emergency.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        📍 {emergency.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${difficultyClass(
                        emergency.difficulty
                      )}`}
                    >
                      {getParamedicDifficultyLabel(
                        emergency.difficulty
                      )}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    {emergency.description}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Distance
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {emergency.distance}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Time
                      </p>
                      <p className="mt-1 text-sm font-bold text-white">
                        {emergency.timeLimit}s
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] uppercase text-slate-500">
                        Reward
                      </p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">
                        ₦{emergency.baseReward.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300">
                      🚑 Respond
                    </span>

                    <span className="text-slate-500 transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {player.energy < 22 && (
            <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-200">
              ⚡ You need at least 22 energy to respond to an
              emergency.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedEmergency) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-slate-950 p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5" />

        <div className="relative mx-auto max-w-2xl">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-red-500/10 text-5xl ring-1 ring-red-400/20">
              🚨
            </div>

            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
              Emergency Dispatch
            </p>

            <h1 className="mt-2 text-3xl font-black text-white">
              {selectedEmergency.title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              📍 {selectedEmergency.location} •{" "}
              {selectedEmergency.distance}
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm leading-7 text-slate-200">
              {selectedEmergency.description}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Response Window
                </p>
                <p className="mt-1 text-xl font-black text-white">
                  {selectedEmergency.timeLimit}s
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Base Reward
                </p>
                <p className="mt-1 text-xl font-black text-emerald-300">
                  ₦{selectedEmergency.baseReward.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-slate-500">
                  Reputation
                </p>
                <p className="mt-1 text-xl font-black text-yellow-300">
                  +{selectedEmergency.reputation}
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
              onClick={beginResponse}
              className="flex-[2] rounded-2xl bg-red-500 px-5 py-4 font-black text-white shadow-lg shadow-red-500/20 transition hover:scale-[1.02] hover:bg-red-400"
            >
              🚑 RESPOND NOW
            </button>
          </div>
        </div>

        {flash && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
            <div className="animate-ping text-7xl">🚑</div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "emergency" && selectedEmergency) {
    const progress =
      (timeRemaining / selectedEmergency.timeLimit) * 100;

    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-950 via-slate-950 to-black p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                Emergency In Progress
              </p>

              <h1 className="mt-1 text-2xl font-black text-white">
                {selectedEmergency.title}
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                📍 {selectedEmergency.location}
              </p>
            </div>

            <div
              className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 ${
                timeRemaining <= 8
                  ? "animate-pulse border-red-400 bg-red-500/15"
                  : "border-white/10 bg-white/5"
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
                  : "bg-emerald-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-red-500/10 text-5xl">
              🩺
            </div>

            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Patient Condition
            </p>

            <h2 className="mt-2 text-2xl font-black capitalize text-white">
              {selectedEmergency.condition.replace("-", " ")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              {selectedEmergency.description}
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black text-white">
                Choose Treatment
              </h3>

              <span className="text-xs font-bold text-red-300">
                Make the right call
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PARAMEDIC_TREATMENTS.map((treatment) => {
                const selected =
                  selectedTreatment === treatment.id;

                return (
                  <button
                    key={treatment.id}
                    type="button"
                    onClick={() =>
                      chooseTreatment(treatment.id)
                    }
                    disabled={Boolean(selectedTreatment)}
                    className={`group rounded-2xl border p-4 text-left transition duration-200 ${
                      selected
                        ? "scale-[1.02] border-red-400 bg-red-500/15"
                        : "border-white/10 bg-white/5 hover:-translate-y-1 hover:border-red-400/30 hover:bg-white/10"
                    } disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                        {treatment.icon}
                      </div>

                      <div>
                        <p className="font-black text-white">
                          {treatment.name}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {treatment.description}
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

  if (screen === "result" && selectedEmergency && result) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div
          className={`absolute inset-0 ${
            result.success
              ? "bg-emerald-500/5"
              : "bg-red-500/5"
          }`}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full text-6xl ${
              result.success
                ? "animate-bounce bg-emerald-500/10"
                : "bg-red-500/10"
            }`}
          >
            {result.success ? "❤️" : "🚨"}
          </div>

          <p
            className={`mt-6 text-xs font-black uppercase tracking-[0.3em] ${
              result.success
                ? "text-emerald-300"
                : "text-red-300"
            }`}
          >
            {result.success
              ? "Patient Stabilized"
              : "Emergency Failed"}
          </p>

          <h1 className="mt-2 text-3xl font-black text-white">
            {result.success
              ? "Excellent Response!"
              : "Response Needs Improvement"}
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
                Treatment
              </span>

              <span
                className={
                  result.treatmentCorrect
                    ? "font-black text-emerald-300"
                    : "font-black text-red-300"
                }
              >
                {result.treatmentCorrect
                  ? "✓ Correct"
                  : "✕ Incorrect"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Energy used
              </span>

              <span className="font-bold text-white">
                -22 ⚡
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={returnToDispatch}
            className="mt-7 w-full rounded-2xl bg-red-500 px-5 py-4 font-black text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 hover:scale-[1.01]"
          >
            🚑 TAKE ANOTHER CALL
          </button>
        </div>
      </div>
    );
  }

  return null;
}
