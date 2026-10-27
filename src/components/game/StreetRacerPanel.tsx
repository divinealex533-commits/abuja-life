"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  STREET_RACES,
  RACE_ACTIONS,
  calculateRaceResult,
  getActionOutcome,
  getRaceTimeLimit,
  type RaceAction,
  type StreetRace,
} from "@/lib/game/streetRacer";
import type { PlayerGameState } from "@/lib/game/player";
import { savePersistentPlayerState } from "@/lib/game/playerStorage";

interface StreetRacerPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState | null>>;
}

type Screen = "garage" | "briefing" | "race" | "result";

export default function StreetRacerPanel({
  player,
  setPlayer,
}: StreetRacerPanelProps) {
  const [screen, setScreen] = useState<Screen>("garage");
  const [selectedRace, setSelectedRace] = useState<StreetRace | null>(null);

  const [speed, setSpeed] = useState(60);
  const [position, setPosition] = useState(6);
  const [crashes, setCrashes] = useState(0);
  const [perfectMoves, setPerfectMoves] = useState(0);
  const [raceTime, setRaceTime] = useState(0);
  const [raceTimeLimit, setRaceTimeLimit] = useState(60);

  const [nitro, setNitro] = useState(100);
  const [distanceProgress, setDistanceProgress] = useState(0);

  const [message, setMessage] = useState("Choose your race.");
  const [actionLocked, setActionLocked] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateRaceResult> | null>(
    null
  );

  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);

  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);

  const racers = useMemo(
    () => [
      { name: "Ghost", emoji: "🏎️", position: 1 },
      { name: "Abuja Boy", emoji: "🚘", position: 2 },
      { name: "Mimi", emoji: "🚗", position: 3 },
      { name: "K-Dash", emoji: "🏎️", position: 4 },
      { name: "You", emoji: "🚙", position },
      { name: "Tunde", emoji: "🚕", position: 6 },
      { name: "Ice", emoji: "🚘", position: 7 },
      { name: "Rex", emoji: "🏁", position: 8 },
    ],
    [position]
  );

  useEffect(() => {
    if (screen !== "race" || !raceStarted || !selectedRace) {
      return;
    }

    const interval = window.setInterval(() => {
      setRaceTime((previous) => {
        const next = previous + 1;

        if (next >= raceTimeLimit) {
          finishRace();
        }

        return next;
      });

      setDistanceProgress((previous) =>
        Math.min(100, previous + Math.max(1.2, speed / 75))
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, raceStarted, selectedRace, raceTimeLimit, speed]);

  useEffect(() => {
    if (screen !== "race" || !raceStarted) {
      return;
    }

    if (distanceProgress >= 100) {
      finishRace();
    }
  }, [distanceProgress, screen, raceStarted]);

  function resetRaceState(race: StreetRace) {
    setSelectedRace(race);
    setSpeed(60);
    setPosition(6);
    setCrashes(0);
    setPerfectMoves(0);
    setRaceTime(0);
    setRaceTimeLimit(getRaceTimeLimit(race));
    setNitro(100);
    setDistanceProgress(0);
    setMessage("Get ready...");
    setResult(null);
    setCountdown(null);
    setRaceStarted(false);
    setActionLocked(false);
  }

  function selectRace(race: StreetRace) {
    resetRaceState(race);
    setScreen("briefing");
  }

  function startRace() {
    if (!selectedRace) return;

    if ((player.energy ?? 0) < 18) {
      setMessage("You need at least 18 energy to race.");
      return;
    }

    setCountdown(3);

    let current = 3;

    const countdownInterval = window.setInterval(() => {
      current -= 1;

      if (current <= 0) {
        window.clearInterval(countdownInterval);
        setCountdown(null);
        setRaceStarted(true);
        setScreen("race");
        setMessage("GO! GO! GO! 🏁");
      } else {
        setCountdown(current);
      }
    }, 850);
  }

  function triggerImpact() {
    setShake(true);
    setFlash(true);

    window.setTimeout(() => setShake(false), 450);
    window.setTimeout(() => setFlash(false), 250);
  }

  function performAction(action: RaceAction) {
    if (!selectedRace || !raceStarted || actionLocked) return;

    if (action === "boost" && nitro < 25) {
      setMessage("⚠️ Not enough nitro!");
      return;
    }

    setActionLocked(true);

    if (action === "boost") {
      setNitro((previous) => Math.max(0, previous - 25));
    } else {
      setNitro((previous) =>
        Math.min(100, previous + (action === "brake" ? 8 : 4))
      );
    }

    const outcome = getActionOutcome(
      selectedRace,
      action,
      speed,
      position,
      crashes
    );

    setSpeed(outcome.speed);
    setPosition(outcome.position);
    setCrashes(outcome.crashes);

    if (outcome.perfect) {
      setPerfectMoves((previous) => previous + 1);
      setMessage("🔥 PERFECT MOVE!");
    } else if (outcome.crash) {
      triggerImpact();
      setMessage("💥 CRASH! You lost control!");
    } else {
      const actionMessages: Record<RaceAction, string> = {
        accelerate: "⚡ Speed rising!",
        brake: "🛞 Controlled braking!",
        drift: "🔥 Clean drift!",
        boost: "🚀 NITRO!",
        overtake: "🏎️ OVERTAKE!",
      };

      setMessage(actionMessages[action]);
    }

    window.setTimeout(() => {
      setActionLocked(false);
    }, 500);
  }

  function finishRace() {
    if (!selectedRace || !raceStarted) return;

    setRaceStarted(false);

    const finalResult = calculateRaceResult({
      race: selectedRace,
      position,
      totalRacers: 8,
      crashes,
      time: raceTime,
      perfectMoves,
    });

    setResult(finalResult);

    const updatedPlayer: PlayerGameState = {
      ...player,
      energy: Math.max(0, (player.energy ?? 0) - 18),
      cash: (player.cash ?? 0) + finalResult.prize,
      reputation: (player.reputation ?? 0) + finalResult.reputation,
      jobExperience: {
        ...(player.jobExperience ?? {}),
        "street-racer":
          ((player.jobExperience ?? {})["street-racer"] ?? 0) +
          finalResult.score,
      },
    };

    setPlayer(updatedPlayer);
    savePersistentPlayerState(updatedPlayer);

    setScreen("result");
  }

  function leaveRace() {
    setScreen("garage");
    setSelectedRace(null);
    setResult(null);
  }

  const positionLabel =
    position === 1
      ? "1ST"
      : position === 2
        ? "2ND"
        : position === 3
          ? "3RD"
          : `${position}TH`;

  return (
    <div className="min-h-screen bg-[#08090d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/40 via-[#11131a] to-black p-5 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-400">
                Abuja Underground Racing
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                STREET RACER 🏎️
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Push your limits, master the corners and become the fastest
                racer in Abuja.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatBox label="CASH" value={`₦${(player.cash ?? 0).toLocaleString()}`} />
              <StatBox label="ENERGY" value={`${player.energy ?? 0}`} />
              <StatBox label="REP" value={`${player.reputation ?? 0}`} />
            </div>
          </div>
        </div>

        {screen === "garage" && (
          <div>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Underground Garage
                </p>
                <h2 className="text-2xl font-black">Choose Your Race</h2>
              </div>

              <div className="hidden rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 sm:block">
                ENTRY COST: 18 ENERGY
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {STREET_RACES.map((race) => (
                <button
                  key={race.id}
                  type="button"
                  onClick={() => selectRace(race)}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] text-left transition duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:bg-white/[0.06]"
                >
                  <div className="relative flex h-40 items-end overflow-hidden bg-gradient-to-br from-red-950 via-zinc-900 to-black p-5">
                    <div className="absolute right-5 top-4 text-6xl opacity-20 transition duration-300 group-hover:scale-110 group-hover:opacity-40">
                      🏎️
                    </div>

                    <div>
                      <div className="mb-2 inline-flex rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-300">
                        {race.difficulty}
                      </div>

                      <h3 className="text-2xl font-black">{race.name}</h3>
                      <p className="text-xs text-gray-400">
                        📍 {race.location}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="min-h-[48px] text-sm leading-6 text-gray-400">
                      {race.description}
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <MiniStat label="DISTANCE" value={`${race.distance}km`} />
                      <MiniStat label="TRAFFIC" value={`${race.traffic}%`} />
                      <MiniStat label="CORNERS" value={`${race.corners}`} />
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-bold text-yellow-400">
                        💰 Prize x{race.prizeMultiplier}
                      </span>

                      <span className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase transition group-hover:bg-red-500">
                        Race →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === "briefing" && selectedRace && (
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-black to-zinc-950 px-6 py-12 text-center">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute left-10 top-10 h-24 w-24 rounded-full bg-red-600 blur-3xl" />
                  <div className="absolute bottom-0 right-10 h-32 w-32 rounded-full bg-orange-500 blur-3xl" />
                </div>

                <div className="relative">
                  <div className="text-7xl">🏎️</div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-red-400">
                    Race Briefing
                  </p>
                  <h2 className="mt-2 text-4xl font-black">
                    {selectedRace.name}
                  </h2>
                  <p className="mt-2 text-gray-400">
                    📍 {selectedRace.location}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <p className="leading-7 text-gray-300">
                  {selectedRace.description}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <BriefStat label="DISTANCE" value={`${selectedRace.distance} KM`} />
                  <BriefStat label="TRAFFIC" value={`${selectedRace.traffic}%`} />
                  <BriefStat label="CORNERS" value={`${selectedRace.corners}`} />
                  <BriefStat
                    label="TIME LIMIT"
                    value={`${getRaceTimeLimit(selectedRace)}s`}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-sm font-bold text-yellow-300">
                    ⚠️ Racing is risky.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Accelerate for speed, brake before danger, drift through
                    corners, use nitro carefully and overtake when you see an
                    opening.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setScreen("garage")}
                    className="rounded-2xl border border-white/10 px-5 py-4 font-bold text-gray-300 transition hover:bg-white/5"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={startRace}
                    className="flex-1 rounded-2xl bg-red-600 px-5 py-4 font-black uppercase tracking-wider transition hover:bg-red-500 active:scale-[0.98]"
                  >
                    Start Race 🏁
                  </button>
                </div>

                {message !== "Get ready..." && (
                  <p className="mt-4 text-center text-sm font-bold text-red-300">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {countdown !== null && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-red-400">
                    Get Ready
                  </p>

                  <div className="mt-3 text-[9rem] font-black leading-none text-white animate-pulse">
                    {countdown}
                  </div>

                  <p className="mt-4 text-xl font-black">🏁</p>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === "race" && selectedRace && (
          <div className={shake ? "animate-pulse" : ""}>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RaceHud label="POSITION" value={positionLabel} />
              <RaceHud label="SPEED" value={`${speed} KM/H`} />
              <RaceHud
                label="TIME"
                value={`${raceTime}/${raceTimeLimit}s`}
              />
              <RaceHud label="CRASHES" value={`${crashes}`} danger={crashes > 0} />
            </div>

            <div
              className={`relative min-h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl ${
                flash ? "ring-4 ring-red-500/70" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/60 via-zinc-900 to-black" />

              <div className="absolute left-1/2 top-0 h-full w-[68%] -translate-x-1/2 overflow-hidden bg-zinc-800">
                <div className="absolute inset-y-0 left-0 w-2 bg-white/10" />
                <div className="absolute inset-y-0 right-0 w-2 bg-white/10" />

                <div className="absolute left-1/2 top-0 h-[200%] w-2 -translate-x-1/2 border-l-2 border-dashed border-white/40 animate-[roadMove_0.45s_linear_infinite]" />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:70px_70px]" />
              </div>

              <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Race
                </p>
                <p className="font-black">{selectedRace.name}</p>
              </div>

              <div className="absolute right-5 top-5 w-44 rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                  <span>NITRO</span>
                  <span className="text-blue-400">{nitro}%</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${nitro}%` }}
                  />
                </div>
              </div>

              <div className="absolute left-1/2 top-[38%] w-[68%] -translate-x-1/2">
                {racers.map((racer, index) => {
                  const lane =
                    index % 4 === 0
                      ? "left-[12%]"
                      : index % 4 === 1
                        ? "left-[32%]"
                        : index % 4 === 2
                          ? "left-[58%]"
                          : "left-[76%]";

                  const isPlayer = racer.name === "You";

                  return (
                    <div
                      key={`${racer.name}-${index}`}
                      className={`absolute ${lane} transition-all duration-700`}
                      style={{
                        top: `${Math.max(
                          0,
                          Math.min(300, (racer.position - 1) * 40)
                        )}px`,
                      }}
                    >
                      <div
                        className={`text-4xl drop-shadow-2xl transition-transform duration-300 ${
                          isPlayer ? "scale-125" : ""
                        }`}
                      >
                        {racer.emoji}
                      </div>

                      {isPlayer && (
                        <div className="mt-1 text-center text-[9px] font-black text-red-400">
                          YOU
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="absolute bottom-6 left-1/2 w-[90%] -translate-x-1/2">
                <div className="rounded-3xl border border-white/10 bg-black/75 p-4 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-black">{message}</span>
                    <span className="text-xs font-bold text-gray-500">
                      {Math.round(distanceProgress)}%
                    </span>
                  </div>

                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${distanceProgress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {RACE_ACTIONS.map((action) => {
                      const isBoost = action.id === "boost";

                      return (
                        <button
                          key={action.id}
                          type="button"
                          disabled={actionLocked}
                          onClick={() => performAction(action.id)}
                          className={`rounded-2xl border px-3 py-4 text-left transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                            isBoost
                              ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="text-[11px] font-black">
                            {action.label}
                          </div>

                          <div className="mt-1 hidden text-[9px] leading-4 text-gray-500 sm:block">
                            {action.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={finishRace}
                className="rounded-xl border border-white/10 px-5 py-3 text-xs font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
              >
                Finish Race
              </button>
            </div>
          </div>
        )}

        {screen === "result" && selectedRace && result && (
          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl">
              <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-black to-zinc-950 px-6 py-12 text-center">
                <div className="text-7xl">
                  {result.position === 1
                    ? "🏆"
                    : result.position === 2
                      ? "🥈"
                      : result.position === 3
                        ? "🥉"
                        : "🏎️"}
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-red-400">
                  Race Complete
                </p>

                <h2 className="mt-2 text-5xl font-black">
                  {result.position === 1
                    ? "CHAMPION"
                    : `${result.position}${result.position === 2 ? "ND" : result.position === 3 ? "RD" : "TH"} PLACE`}
                </h2>

                <p className="mt-3 text-gray-400">{result.message}</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <ResultStat
                    label="PRIZE"
                    value={`₦${result.prize.toLocaleString()}`}
                  />
                  <ResultStat
                    label="REP"
                    value={`+${result.reputation}`}
                  />
                  <ResultStat
                    label="SCORE"
                    value={result.score.toLocaleString()}
                  />
                  <ResultStat
                    label="CRASHES"
                    value={`${result.crashes}`}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <ResultLine label="Race" value={selectedRace.name} />
                  <ResultLine label="Time" value={`${result.time}s`} />
                  <ResultLine
                    label="Perfect Moves"
                    value={`${result.perfectMoves}`}
                  />
                  <ResultLine
                    label="Distance"
                    value={`${selectedRace.distance} km`}
                  />
                </div>

                <button
                  type="button"
                  onClick={leaveRace}
                  className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 font-black uppercase tracking-wider transition hover:bg-red-500 active:scale-[0.98]"
                >
                  Return To Garage 🏎️
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes roadMove {
          from {
            transform: translateX(-50%) translateY(-50%);
          }

          to {
            transform: translateX(-50%) translateY(0%);
          }
        }
      `}</style>
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/30 px-2 py-3">
      <p className="text-[8px] font-black tracking-widest text-gray-600">
        {label}
      </p>
      <p className="mt-1 text-xs font-black">{value}</p>
    </div>
  );
}

function BriefStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
      <p className="text-[9px] font-black tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function RaceHud({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-red-500/30 bg-red-500/10"
          : "border-white/10 bg-white/[0.035]"
      }`}
    >
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-black ${
          danger ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function ResultLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
