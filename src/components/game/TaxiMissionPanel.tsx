"use client";

import React, { useEffect, useMemo, useState } from "react";
import TaxiDrivingGame from "@/components/game/TaxiDrivingGame";
import {
  TaxiMission,
  TaxiRouteStyle,
  TAXI_ROUTES,
  calculateTaxiTrip,
  getTaxiTrafficLabel,
} from "@/lib/game/taxi";

interface TaxiMissionPanelProps {
  mission: TaxiMission;
  onComplete: (result: ReturnType<typeof calculateTaxiTrip>) => void;
  onCancel?: () => void;
}

interface TaxiDriverProgress {
  level: number;
  xp: number;
  completedTrips: number;
  totalEarnings: number;
  bestPerformance: number;
}

const TAXI_PROGRESS_KEY = "abujaLifeTaxiDriverProgress";

const DEFAULT_PROGRESS: TaxiDriverProgress = {
  level: 1,
  xp: 0,
  completedTrips: 0,
  totalEarnings: 0,
  bestPerformance: 0,
};

function loadTaxiProgress(): TaxiDriverProgress {
  if (typeof window === "undefined") {
    return DEFAULT_PROGRESS;
  }

  try {
    const saved = localStorage.getItem(TAXI_PROGRESS_KEY);

    if (!saved) {
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(saved);

    return {
      level:
        typeof parsed.level === "number"
          ? Math.max(1, parsed.level)
          : DEFAULT_PROGRESS.level,
      xp:
        typeof parsed.xp === "number"
          ? Math.max(0, parsed.xp)
          : DEFAULT_PROGRESS.xp,
      completedTrips:
        typeof parsed.completedTrips === "number"
          ? Math.max(0, parsed.completedTrips)
          : DEFAULT_PROGRESS.completedTrips,
      totalEarnings:
        typeof parsed.totalEarnings === "number"
          ? Math.max(0, parsed.totalEarnings)
          : DEFAULT_PROGRESS.totalEarnings,
      bestPerformance:
        typeof parsed.bestPerformance === "number"
          ? Math.max(0, Math.min(1, parsed.bestPerformance))
          : DEFAULT_PROGRESS.bestPerformance,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveTaxiProgress(progress: TaxiDriverProgress) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    TAXI_PROGRESS_KEY,
    JSON.stringify(progress)
  );
}

function getXpRequired(level: number) {
  return 100 + (level - 1) * 50;
}

function calculateXpReward(
  performance: number,
  satisfaction: number
) {
  const performanceXp = Math.round(performance * 60);
  const satisfactionXp = Math.round(satisfaction * 40);

  return Math.max(10, performanceXp + satisfactionXp);
}

export default function TaxiMissionPanel({
  mission,
  onComplete,
  onCancel,
}: TaxiMissionPanelProps) {
  const [step, setStep] = useState(1);

  const [selectedRoute, setSelectedRoute] =
    useState<TaxiRouteStyle>(TAXI_ROUTES[0].style);

  const [tripResult, setTripResult] =
    useState<ReturnType<typeof calculateTaxiTrip> | null>(null);

  const [performance, setPerformance] = useState(1);

  const [progress, setProgress] =
    useState<TaxiDriverProgress>(DEFAULT_PROGRESS);

  const [xpEarned, setXpEarned] = useState(0);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    setProgress(loadTaxiProgress());
  }, []);

  const progressInfo = useMemo(() => {
    const required = getXpRequired(progress.level);

    return {
      required,
      percent: Math.min(
        100,
        Math.round((progress.xp / required) * 100)
      ),
    };
  }, [progress.level, progress.xp]);

  function handleDrivingComplete(drivingPerformance: number) {
    setPerformance(drivingPerformance);

    const result = calculateTaxiTrip(
      mission,
      selectedRoute,
      drivingPerformance
    );

    setTripResult(result);
    setStep(4);
  }

  function finishTrip() {
    if (!tripResult) return;

    const earnings =
      tripResult.fare + tripResult.tip;

    const earnedXp = calculateXpReward(
      performance,
      tripResult.satisfaction
    );

    const previousProgress = loadTaxiProgress();

    const oldLevel = previousProgress.level;

    let newXp =
      previousProgress.xp + earnedXp;

    let newLevel =
      previousProgress.level;

    let xpRequired =
      getXpRequired(newLevel);

    while (newXp >= xpRequired) {
      newXp -= xpRequired;
      newLevel += 1;
      xpRequired = getXpRequired(newLevel);
    }

    const updatedProgress: TaxiDriverProgress = {
      level: newLevel,
      xp: newXp,
      completedTrips:
        previousProgress.completedTrips + 1,
      totalEarnings:
        previousProgress.totalEarnings + earnings,
      bestPerformance: Math.max(
        previousProgress.bestPerformance,
        performance
      ),
    };

    saveTaxiProgress(updatedProgress);

    setProgress(updatedProgress);
    setXpEarned(earnedXp);
    setLevelUp(newLevel > oldLevel);

    onComplete(tripResult);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-2xl sm:p-6">

      {/* HEADER */}
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
          🚕 Taxi Driver
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-black text-white">
              {mission.pickup} → {mission.destination}
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Pick up your passenger, choose your route and drive through Abuja.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Driver Level
            </div>

            <div className="mt-1 text-2xl font-black text-white">
              Lv. {progress.level}
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER PROGRESS */}
      <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
              Taxi Career
            </div>

            <div className="mt-1 text-sm font-bold text-white">
              {progress.xp} / {progressInfo.required} XP
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-white/40">
              Trips
            </div>

            <div className="font-black text-white">
              {progress.completedTrips}
            </div>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${progressInfo.percent}%`,
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/35">
              Career Earnings
            </div>

            <div className="mt-1 font-black text-emerald-300">
              ₦{progress.totalEarnings.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/35">
              Best Driving
            </div>

            <div className="mt-1 font-black text-white">
              {Math.round(progress.bestPerformance * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS STEPS */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((number) => (
          <div
            key={number}
            className={`h-2 rounded-full ${
              step >= number
                ? "bg-emerald-400"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-5xl">🙋🏽</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Find your passenger
          </h3>

          <p className="mt-2 text-white/60">
            Your passenger is waiting at{" "}
            <span className="font-bold text-white">
              {mission.pickup}
            </span>
            .
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Pickup
              </div>

              <div className="mt-1 font-bold text-white">
                {mission.pickup}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Destination
              </div>

              <div className="mt-1 font-bold text-white">
                {mission.destination}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            PICK UP PASSENGER 🚕
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-5xl">🗺️</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Choose your route
          </h3>

          <p className="mt-2 text-white/60">
            Pick the route you want to use through Abuja.
          </p>

          <div className="mt-5 space-y-3">
            {TAXI_ROUTES.map((route) => {
              const selected =
                selectedRoute === route.style;

              return (
                <button
                  type="button"
                  key={route.name}
                  onClick={() =>
                    setSelectedRoute(route.style)
                  }
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-white">
                        {route.name}
                      </div>

                      <div className="mt-1 text-sm text-white/50">
                        {route.description}
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20"
                      }`}
                    >
                      {selected ? "✓" : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            START DRIVING 🚕
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10"
          >
            BACK
          </button>
        </div>
      )}

      {/* STEP 3 — ACTUAL DRIVING GAME */}
      {step === 3 && (
        <div>
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
              Step 3
            </div>

            <h3 className="mt-2 text-2xl font-black text-white">
              Drive through Abuja
            </h3>

            <p className="mt-2 text-sm text-white/60">
              Traffic:{" "}
              <span className="font-bold text-white">
                {getTaxiTrafficLabel(mission.traffic)}
              </span>
            </p>
          </div>

          <TaxiDrivingGame
            traffic={mission.traffic}
            distanceKm={mission.distanceKm}
            onComplete={handleDrivingComplete}
          />

          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white hover:bg-white/10"
          >
            BACK TO ROUTES
          </button>
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && tripResult && (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="text-5xl">🏁</div>

          <h3 className="mt-4 text-3xl font-black text-white">
            Arrive at {mission.destination}
          </h3>

          <p className="mt-2 text-white/60">
            You've reached the destination. Your passenger has paid for
            the trip.
          </p>

          {/* LEVEL UP */}
          {levelUp && (
            <div className="mt-5 rounded-2xl border border-yellow-300/30 bg-yellow-300/10 p-5 text-center">
              <div className="text-4xl">🎉</div>

              <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-300">
                Driver Level Up
              </div>

              <div className="mt-1 text-3xl font-black text-white">
                Level {progress.level}
              </div>

              <p className="mt-1 text-sm text-white/60">
                Your taxi career is progressing.
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Fare
              </div>

              <div className="mt-1 text-xl font-black text-white">
                ₦{tripResult.fare.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Tip
              </div>

              <div className="mt-1 text-xl font-black text-emerald-300">
                ₦{tripResult.tip.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Reputation
              </div>

              <div className="mt-1 text-xl font-black text-white">
                +{tripResult.reputation}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/40">
                Energy
              </div>

              <div className="mt-1 text-xl font-black text-white">
                -{tripResult.energyCost} ⚡
              </div>
            </div>
          </div>

          {/* XP REWARD */}
          {xpEarned > 0 && (
            <div className="mt-4 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
                Career XP
              </div>

              <div className="mt-1 text-2xl font-black text-white">
                +{xpEarned} XP
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-purple-400 transition-all"
                  style={{
                    width: `${progressInfo.percent}%`,
                  }}
                />
              </div>

              <div className="mt-2 text-xs text-white/40">
                Level {progress.level} •{" "}
                {progress.xp} / {progressInfo.required} XP
              </div>
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-black/20 p-4">
            <div className="text-xs text-white/40">
              Passenger satisfaction
            </div>

            <div className="mt-1 text-2xl font-black text-emerald-300">
              {Math.round(tripResult.satisfaction * 100)}%
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      tripResult.satisfaction * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            {tripResult.message}
          </div>

          <div className="mt-4 rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-white/40">
              Driving Performance
            </div>

            <div className="mt-1 text-2xl font-black text-emerald-300">
              {Math.round(performance * 100)}%
            </div>
          </div>

          <button
            type="button"
            onClick={finishTrip}
            className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            COLLECT PAYMENT 💰
          </button>
        </div>
      )}

      {/* CANCEL */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/70 hover:bg-white/10 hover:text-white"
        >
          CANCEL MISSION
        </button>
      )}
    </section>
  );
}