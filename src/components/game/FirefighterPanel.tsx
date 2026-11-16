"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FIREFIGHTER_MISSIONS,
  FirefighterAction,
  FirefighterMission,
  FirefighterScenario,
  calculateFirefighterResult,
  getFirefighterActionOutcome,
  getFirefighterResponseTime,
  getRandomFirefighterMission,
  getRandomFirefighterScenario,
} from "@/lib/game/firefighter";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

interface FirefighterPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState | null>
  >;
}

type Screen =
  | "station"
  | "missions"
  | "briefing"
  | "emergency"
  | "result";

const ACTIONS: {
  id: FirefighterAction;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "assess",
    label: "Assess Scene",
    icon: "🔎",
    description:
      "Study the emergency before committing your crew.",
  },
  {
    id: "equip",
    label: "Gear Up",
    icon: "🧯",
    description:
      "Prepare protective equipment before entering danger.",
  },
  {
    id: "rescue",
    label: "Rescue",
    icon: "🧑‍🚒",
    description:
      "Search for civilians and move them toward safety.",
  },
  {
    id: "extinguish",
    label: "Extinguish",
    icon: "🚒",
    description:
      "Attack the fire and bring the flames under control.",
  },
  {
    id: "ventilate",
    label: "Ventilate",
    icon: "💨",
    description:
      "Clear dangerous smoke and improve visibility.",
  },
  {
    id: "protect",
    label: "Protect",
    icon: "🛡️",
    description:
      "Protect your crew and nearby civilians from hazards.",
  },
  {
    id: "evacuate",
    label: "Evacuate",
    icon: "🏃",
    description:
      "Move people away from an unstable danger zone.",
  },
  {
    id: "command",
    label: "Command",
    icon: "📢",
    description:
      "Coordinate your crew and control the emergency.",
  },
];

function formatMoney(value: number) {
  return `₦${Math.max(0, Math.round(value)).toLocaleString()}`;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${minutes}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function difficultyClass(
  difficulty: FirefighterMission["difficulty"]
) {
  switch (difficulty) {
    case "easy":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "medium":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    case "hard":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "extreme":
      return "border-red-400/20 bg-red-400/10 text-red-300";
  }
}

function scenarioIcon(
  type: FirefighterScenario["type"]
) {
  switch (type) {
    case "house-fire":
      return "🏠";

    case "shop-fire":
      return "🏪";

    case "vehicle-fire":
      return "🚗";

    case "gas-leak":
      return "💥";

    case "high-rise":
      return "🏢";

    case "rescue":
      return "🧑‍🚒";

    case "smoke":
      return "💨";

    case "explosion":
      return "🚨";

    case "wildfire":
      return "🌲";

    case "alarm":
      return "🔔";

    default:
      return "🔥";
  }
}

export default function FirefighterPanel({
  player,
  setPlayer,
}: FirefighterPanelProps) {
  const [screen, setScreen] =
    useState<Screen>("station");

  const [selectedMission, setSelectedMission] =
    useState<FirefighterMission | null>(null);

  const [currentScenario, setCurrentScenario] =
    useState<FirefighterScenario | null>(null);

  const [usedScenarioIds, setUsedScenarioIds] =
    useState<string[]>([]);

  const [timeLeft, setTimeLeft] = useState(120);

  const [score, setScore] = useState(0);

  const [safety, setSafety] = useState(55);

  const [fireRemaining, setFireRemaining] =
    useState(50);

  const [civiliansSaved, setCiviliansSaved] =
    useState(0);

  const [successfulActions, setSuccessfulActions] =
    useState(0);

  const [failedActions, setFailedActions] =
    useState(0);

  const [missionsCompleted, setMissionsCompleted] =
    useState(0);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
    cash: number;
  } | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [result, setResult] =
    useState<ReturnType<
      typeof calculateFirefighterResult
    > | null>(null);

  const [criticalAlert, setCriticalAlert] =
    useState(false);

  const [rewardCollected, setRewardCollected] =
    useState(false);

  const responseProgress = useMemo(() => {
    if (!selectedMission) return 0;

    const total =
      getFirefighterResponseTime(
        selectedMission
      );

    if (total <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        ((total - timeLeft) / total) * 100
      )
    );
  }, [selectedMission, timeLeft]);

  const safetyColor =
    safety >= 70
      ? "bg-emerald-400"
      : safety >= 40
        ? "bg-yellow-400"
        : "bg-red-400";

  const fireColor =
    fireRemaining <= 25
      ? "bg-emerald-400"
      : fireRemaining <= 55
        ? "bg-yellow-400"
        : "bg-red-400";

  const startMission = (
    mission: FirefighterMission
  ) => {
    setSelectedMission(mission);

    setScore(0);
    setSafety(55);
    setFireRemaining(
      mission.fireIntensity
    );
    setCiviliansSaved(0);

    setSuccessfulActions(0);
    setFailedActions(0);

    setUsedScenarioIds([]);
    setFeedback(null);
    setResult(null);
    setRewardCollected(false);
    setCriticalAlert(false);

    setScreen("briefing");
  };

  const beginEmergency = () => {
    if (!selectedMission) return;

    const firstScenario =
      getRandomFirefighterScenario();

    setCurrentScenario(firstScenario);
    setUsedScenarioIds([firstScenario.id]);

    setTimeLeft(
      getFirefighterResponseTime(
        selectedMission
      )
    );

    setScreen("emergency");
  };

  const finishMission = () => {
    if (
      !selectedMission ||
      screen !== "emergency"
    ) {
      return;
    }

    const elapsed =
      getFirefighterResponseTime(
        selectedMission
      ) - timeLeft;

    const finalResult =
      calculateFirefighterResult({
        mission: selectedMission,
        score,
        safety,
        fireRemaining,
        civiliansSaved,
        successfulActions,
        failedActions,
        missionsCompleted:
          missionsCompleted + 1,
        elapsedSeconds: elapsed,
      });

    setResult(finalResult);
    setScreen("result");
  };

  useEffect(() => {
    if (screen !== "emergency") return;

    if (timeLeft <= 0) {
      finishMission();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((value) =>
        Math.max(0, value - 1)
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [screen, timeLeft]);

  useEffect(() => {
    if (screen !== "emergency") {
      setCriticalAlert(false);
      return;
    }

    if (
      safety <= 25 ||
      fireRemaining >= 85 ||
      timeLeft <= 20
    ) {
      setCriticalAlert(true);
    } else {
      setCriticalAlert(false);
    }
  }, [
    screen,
    safety,
    fireRemaining,
    timeLeft,
  ]);

  const handleAction = (
    action: FirefighterAction
  ) => {
    if (
      !currentScenario ||
      !selectedMission ||
      processing ||
      timeLeft <= 0
    ) {
      return;
    }

    setProcessing(true);

    const outcome =
      getFirefighterActionOutcome(
        currentScenario,
        action
      );

    setScore((value) =>
      Math.max(
        0,
        value + outcome.score
      )
    );

    setSafety((value) =>
      Math.max(
        0,
        Math.min(
          100,
          value + outcome.safetyImpact
        )
      )
    );

    setFireRemaining((value) =>
      Math.max(
        0,
        Math.min(
          100,
          value + outcome.fireImpact
        )
      )
    );

    setCiviliansSaved((value) =>
      Math.max(
        0,
        Math.min(
          selectedMission.civiliansAtRisk,
          value + outcome.rescueImpact
        )
      )
    );

    if (outcome.correct) {
      setSuccessfulActions(
        (value) => value + 1
      );
    } else {
      setFailedActions(
        (value) => value + 1
      );
    }

    setFeedback({
      correct: outcome.correct,
      message: outcome.message,
      cash: outcome.cash,
    });

    window.setTimeout(() => {
      const next =
        getRandomFirefighterScenario([
          ...usedScenarioIds,
          currentScenario.id,
        ]);

      setUsedScenarioIds((ids) => [
        ...ids,
        next.id,
      ]);

      setCurrentScenario(next);

      setFeedback(null);
      setProcessing(false);
    }, 1200);
  };

  const collectReward = async () => {
    if (!result || rewardCollected) return;

    const nextPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      energy: Math.max(
        0,
        player.energy - 20
      ),
      reputation:
        player.reputation +
        result.reputation,
      currentJobId: "firefighter",
      jobExperience:
        player.jobExperience +
        result.score,
    };

    setPlayer(nextPlayer);

    await savePersistentPlayerState(
      nextPlayer
    );

    setRewardCollected(true);
    setMissionsCompleted(
      (value) => value + 1
    );
  };

  if (screen === "station") {
    return (
      <main className="min-h-screen bg-[#070809] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-950/60 via-[#111214] to-black shadow-2xl">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-red-500/15 blur-3xl" />

            <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.4fr_0.6fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-red-300">
                  🚒 Abuja Life • Emergency Services
                </div>

                <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
                  Firefighter
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
                  Answer emergency calls, protect civilians,
                  control dangerous fires and lead your crew
                  through high-pressure rescue missions.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      setScreen("missions")
                    }
                    disabled={player.energy < 20}
                    className="rounded-2xl bg-red-500 px-6 py-3.5 font-black text-white shadow-lg shadow-red-500/20 transition hover:scale-[1.02] hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    🚨 Answer Emergency Call
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/35">
                      Energy
                    </div>

                    <div className="mt-1 font-black">
                      {player.energy} /{" "}
                      {player.maxEnergy} ⚡
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-xs font-black uppercase tracking-widest text-white/35">
                  Fire Department Profile
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-3xl">
                    🧑‍🚒
                  </div>

                  <div>
                    <div className="font-black">
                      Abuja Fire & Rescue
                    </div>

                    <div className="text-sm text-white/40">
                      Emergency Response Unit
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-[10px] uppercase text-white/35">
                      Cash
                    </div>

                    <div className="mt-1 font-black">
                      {formatMoney(player.cash)}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <div className="text-[10px] uppercase text-white/35">
                      Experience
                    </div>

                    <div className="mt-1 font-black">
                      {player.jobExperience}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              [
                "🚨",
                "Respond",
                "Get to the emergency before the situation escalates.",
              ],
              [
                "🧑‍🚒",
                "Rescue",
                "Protect civilians and coordinate your crew.",
              ],
              [
                "🔥",
                "Control",
                "Fight the fire and secure the scene.",
              ],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-2xl">
                  {icon}
                </div>

                <div className="mt-4 font-black">
                  {title}
                </div>

                <div className="mt-1 text-sm text-white/40">
                  {text}
                </div>
              </div>
            ))}
          </section>

          <div className="mt-6 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.04] p-5">
            <div className="flex gap-3">
              <div className="text-xl">
                ⚠️
              </div>

              <div>
                <div className="font-black text-yellow-200">
                  Firefighter Tip
                </div>

                <p className="mt-1 text-sm leading-6 text-white/50">
                  Don't blindly attack every fire. Sometimes
                  the best move is to assess, protect civilians
                  or evacuate the area first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "missions") {
    return (
      <main className="min-h-screen bg-[#070809] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Emergency Dispatch
              </div>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                Choose Emergency
              </h1>

              <p className="mt-2 text-white/45">
                More dangerous emergencies offer bigger
                rewards but demand faster decisions.
              </p>
            </div>

            <button
              onClick={() =>
                setScreen("station")
              }
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white"
            >
              ← Back to Station
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {FIREFIGHTER_MISSIONS.map(
              (mission) => (
                <button
                  key={mission.id}
                  onClick={() =>
                    startMission(mission)
                  }
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition hover:-translate-y-1 hover:border-red-400/30 hover:bg-red-400/[0.04]"
                >
                  <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-red-950/50 via-black to-orange-950/30 text-7xl">
                    <span className="transition duration-300 group-hover:scale-110">
                      {mission.emoji}
                    </span>

                    <div
                      className={`absolute right-4 top-4 rounded-xl border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${difficultyClass(
                        mission.difficulty
                      )}`}
                    >
                      {mission.difficulty}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-red-300">
                      {mission.location}
                    </div>

                    <h2 className="mt-2 text-2xl font-black">
                      {mission.title}
                    </h2>

                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-white/45">
                      {mission.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-[9px] uppercase text-white/30">
                          Starting Reward
                        </div>

                        <div className="mt-1 text-sm font-black">
                          {formatMoney(
                            mission.startingReward
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3">
                        <div className="text-[9px] uppercase text-white/30">
                          Max Reward
                        </div>

                        <div className="mt-1 text-sm font-black text-emerald-300">
                          {formatMoney(
                            mission.maxReward
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-white/35">
                      <span>
                        👥 {mission.civiliansAtRisk} at risk
                      </span>

                      <span className="font-black text-red-300">
                        Respond →
                      </span>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  if (
    screen === "briefing" &&
    selectedMission
  ) {
    return (
      <main className="min-h-screen bg-[#070809] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0f11] shadow-2xl">
            <div className="bg-gradient-to-br from-red-500/15 to-transparent p-6 sm:p-10">
              <div className="text-7xl">
                {selectedMission.emoji}
              </div>

              <div className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-red-300">
                Emergency Briefing
              </div>

              <h1 className="mt-2 text-4xl font-black sm:text-6xl">
                {selectedMission.title}
              </h1>

              <div className="mt-2 text-lg font-bold text-white/40">
                📍 {selectedMission.location}
              </div>

              <p className="mt-5 max-w-2xl leading-7 text-white/55">
                {selectedMission.description}
              </p>
            </div>

            <div className="grid gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                [
                  "Starting Reward",
                  formatMoney(
                    selectedMission.startingReward
                  ),
                ],
                [
                  "Max Reward",
                  formatMoney(
                    selectedMission.maxReward
                  ),
                ],
                [
                  "Civilians",
                  selectedMission.civiliansAtRisk,
                ],
                [
                  "Time",
                  formatTime(
                    selectedMission.timeLimit
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#0d0f11] p-5"
                >
                  <div className="text-[9px] uppercase tracking-widest text-white/30">
                    {label}
                  </div>

                  <div className="mt-2 font-black">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b border-white/10 p-6 sm:p-8">
              <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.04] p-5">
                <div className="font-black text-yellow-200">
                  🚨 Dispatch Warning
                </div>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Every decision affects the safety of your
                  crew, the fire and the civilians at risk.
                  Stay calm and act quickly.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() =>
                  setScreen("missions")
                }
                className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-white/60 hover:bg-white/5 hover:text-white"
              >
                Choose Another
              </button>

              <button
                onClick={beginEmergency}
                className="rounded-2xl bg-red-500 px-7 py-3 font-black hover:bg-red-400"
              >
                🚨 Enter Emergency
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    screen === "emergency" &&
    selectedMission &&
    currentScenario
  ) {
    return (
      <main className="min-h-screen bg-[#050708] text-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
          {criticalAlert && (
            <div className="mb-4 animate-pulse rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  🚨
                </span>

                <div>
                  <div className="text-sm font-black text-red-300">
                    CRITICAL EMERGENCY
                  </div>

                  <div className="text-xs text-white/40">
                    Make a decision immediately.
                  </div>
                </div>
              </div>
            </div>
          )}

          <header className="mb-4 rounded-2xl border border-white/10 bg-[#0c0e10] p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                  🚒 Emergency Response •{" "}
                  {selectedMission.location}
                </div>

                <div className="mt-1 text-xl font-black">
                  {selectedMission.title}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Time
                  </div>

                  <div
                    className={`font-black ${
                      timeLeft <= 20
                        ? "text-red-400"
                        : "text-white"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Score
                  </div>

                  <div className="font-black text-yellow-300">
                    {score}
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/30">
                    Rescued
                  </div>

                  <div className="font-black text-emerald-300">
                    {civiliansSaved}/
                    {
                      selectedMission.civiliansAtRisk
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                <span>
                  Emergency Response
                </span>

                <span>
                  {responseProgress}%
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${responseProgress}%`,
                  }}
                />
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b0d0f] shadow-2xl">
              <div className="border-b border-white/10 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white/30">
                      Emergency Situation
                    </div>

                    <h1 className="mt-2 text-2xl font-black sm:text-4xl">
                      {currentScenario.title}
                    </h1>
                  </div>

                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-red-300">
                    {scenarioIcon(
                      currentScenario.type
                    )}{" "}
                    {currentScenario.type}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/40 via-black to-orange-950/20 p-6 sm:p-8">
                  <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-red-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-5xl shadow-inner">
                      {scenarioIcon(
                        currentScenario.type
                      )}
                    </div>

                    <h2 className="mt-6 text-2xl font-black">
                      {currentScenario.title}
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                      {currentScenario.description}
                    </p>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`mt-5 rounded-2xl border p-5 ${
                      feedback.correct
                        ? "border-emerald-400/20 bg-emerald-400/10"
                        : "border-red-400/20 bg-red-400/10"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">
                        {feedback.correct
                          ? "🧑‍🚒"
                          : "⚠️"}
                      </div>

                      <div>
                        <div className="font-black">
                          {feedback.correct
                            ? "Good Call"
                            : "Danger Increased"}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-white/55">
                          {feedback.message}
                        </p>

                        <div
                          className={`mt-2 text-sm font-black ${
                            feedback.cash >= 0
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {feedback.cash >= 0
                            ? "+"
                            : ""}
                          {formatMoney(
                            feedback.cash
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-7">
                  <div className="mb-3 text-xs font-black uppercase tracking-widest text-white/30">
                    What do you do?
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() =>
                          handleAction(action.id)
                        }
                        disabled={processing}
                        className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-red-400/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="text-2xl transition group-hover:scale-110">
                          {action.icon}
                        </div>

                        <div className="mt-3 font-black">
                          {action.label}
                        </div>

                        <div className="mt-1 text-xs leading-5 text-white/35">
                          {action.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[#0b0d0f] p-5">
                <div className="text-xs font-black uppercase tracking-widest text-white/30">
                  Emergency Dashboard
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-white/40">
                        Crew Safety
                      </span>

                      <span className="font-black">
                        {safety}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${safetyColor}`}
                        style={{
                          width: `${safety}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-white/40">
                        Fire Remaining
                      </span>

                      <span className="font-black">
                        {fireRemaining}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${fireColor}`}
                        style={{
                          width: `${fireRemaining}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[9px] uppercase text-white/30">
                        Saved
                      </div>

                      <div className="mt-1 text-xl font-black text-emerald-300">
                        {civiliansSaved}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                      <div className="text-[9px] uppercase text-white/30">
                        Mistakes
                      </div>

                      <div className="mt-1 text-xl font-black text-red-300">
                        {failedActions}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-orange-400/10 bg-orange-400/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <span>🔥</span>

                  <span className="text-xs font-black uppercase tracking-widest text-orange-300">
                    Dispatch Advice
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  Firefighting isn't just about extinguishing
                  flames. Protect your crew, rescue civilians and
                  control the scene.
                </p>
              </div>

              <button
                onClick={finishMission}
                disabled={processing}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                End Response
              </button>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (
    screen === "result" &&
    result &&
    selectedMission
  ) {
    return (
      <main className="min-h-screen bg-[#070809] text-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0f11] shadow-2xl">
            <div className="relative overflow-hidden bg-gradient-to-br from-red-500/20 via-transparent to-orange-500/10 p-6 text-center sm:p-10">
              <div className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-red-500/15 blur-3xl" />

              <div className="relative">
                <div className="text-6xl">
                  {result.rank ===
                  "Abuja Fire Hero"
                    ? "🏆"
                    : result.rank ===
                        "Senior Firefighter"
                      ? "🧑‍🚒"
                      : "🚒"}
                </div>

                <div className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-red-300">
                  Emergency Complete
                </div>

                <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                  {result.rank}
                </h1>

                <p className="mx-auto mt-3 max-w-2xl text-white/50">
                  {result.message}
                </p>

                <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-400/20 bg-red-400/10">
                  <div>
                    <div className="text-3xl font-black">
                      {result.score}
                    </div>

                    <div className="text-[9px] uppercase tracking-widest text-white/40">
                      Score
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                [
                  "Civilians Saved",
                  `${result.civiliansSaved}/${result.civiliansAtRisk}`,
                ],
                [
                  "Crew Safety",
                  `${result.safety}%`,
                ],
                [
                  "Fire Remaining",
                  `${result.fireRemaining}%`,
                ],
                [
                  "Response Time",
                  formatTime(
                    result.responseTime
                  ),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#0d0f11] p-5 text-center"
                >
                  <div className="text-xl font-black sm:text-2xl">
                    {value}
                  </div>

                  <div className="mt-1 text-[9px] uppercase tracking-wider text-white/30">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Earnings
                </div>

                <div className="mt-2 text-3xl font-black text-emerald-300">
                  +{formatMoney(result.cash)}
                </div>
              </div>

              <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Reputation
                </div>

                <div className="mt-2 text-3xl font-black text-red-300">
                  +{result.reputation}
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-5">
                <div className="text-[10px] uppercase tracking-widest text-white/30">
                  Actions
                </div>

                <div className="mt-2 text-3xl font-black text-yellow-300">
                  {result.successfulActions}/
                  {result.successfulActions +
                    result.failedActions}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 sm:px-8">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs font-black uppercase tracking-widest text-white/30">
                  Mission Report
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/5 p-4">
                    <div className="text-xs text-white/35">
                      Successful Decisions
                    </div>

                    <div className="mt-1 font-black text-emerald-300">
                      {result.successfulActions}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/5 p-4">
                    <div className="text-xs text-white/35">
                      Failed Decisions
                    </div>

                    <div className="mt-1 font-black text-red-300">
                      {result.failedActions}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() => {
                  setScreen("missions");
                  setResult(null);
                  setSelectedMission(null);
                }}
                className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Answer Another Call
              </button>

              <button
                onClick={collectReward}
                disabled={rewardCollected}
                className="rounded-2xl bg-red-500 px-7 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {rewardCollected
                  ? "✓ Reward Collected"
                  : `Collect ${formatMoney(
                      result.cash
                    )} →`}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
