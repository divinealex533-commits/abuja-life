"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  PilotAction,
  PilotMission,
  PilotResult,
  PilotScenario,
  calculatePilotResult,
  getAllPilotMissions,
  getPilotActionOutcome,
  getPilotResponseTime,
  getRandomPilotScenario,
  getPilotSuccessMessage,
  getPilotFailureMessage,
} from "@/lib/game/pilot";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

type Screen =
  | "airport"
  | "missions"
  | "briefing"
  | "cockpit"
  | "result";

interface PilotPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState>
  >;
}

const ENERGY_COST = 24;

const ACTIONS: {
  id: PilotAction;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    id: "inspect",
    label: "Inspect",
    emoji: "🔍",
    description: "Check the aircraft systems.",
  },
  {
    id: "fuel",
    label: "Fuel",
    emoji: "⛽",
    description: "Manage fuel and reserves.",
  },
  {
    id: "taxi",
    label: "Taxi",
    emoji: "🚕",
    description: "Move safely toward the runway.",
  },
  {
    id: "takeoff",
    label: "Take Off",
    emoji: "🛫",
    description: "Execute a controlled departure.",
  },
  {
    id: "climb",
    label: "Climb",
    emoji: "⬆️",
    description: "Adjust altitude safely.",
  },
  {
    id: "navigate",
    label: "Navigate",
    emoji: "🧭",
    description: "Update your flight route.",
  },
  {
    id: "communicate",
    label: "ATC",
    emoji: "📡",
    description: "Communicate with air traffic control.",
  },
  {
    id: "avoid",
    label: "Avoid",
    emoji: "🌩️",
    description: "Avoid dangerous weather.",
  },
  {
    id: "stabilize",
    label: "Stabilize",
    emoji: "🎛️",
    description: "Regain aircraft stability.",
  },
  {
    id: "descend",
    label: "Descend",
    emoji: "⬇️",
    description: "Begin controlled descent.",
  },
  {
    id: "land",
    label: "Land",
    emoji: "🛬",
    description: "Complete the landing.",
  },
  {
    id: "go-around",
    label: "Go Around",
    emoji: "🔄",
    description: "Abort an unsafe landing.",
  },
];

function clamp(
  value: number,
  min = 0,
  max = 100
) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value: number) {
  return `₦${Math.max(0, value).toLocaleString()}`;
}

function difficultyClass(
  difficulty: PilotMission["difficulty"]
) {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
    case "medium":
      return "bg-amber-500/15 text-amber-300 border-amber-400/20";
    case "hard":
      return "bg-orange-500/15 text-orange-300 border-orange-400/20";
    case "extreme":
      return "bg-red-500/15 text-red-300 border-red-400/20";
  }
}

export default function PilotPanel({
  player,
  setPlayer,
}: PilotPanelProps) {
  const missions = useMemo(
    () => getAllPilotMissions(),
    []
  );

  const [screen, setScreen] =
    useState<Screen>("airport");

  const [selectedMission, setSelectedMission] =
    useState<PilotMission | null>(null);

  const [scenario, setScenario] =
    useState<PilotScenario | null>(null);

  const [result, setResult] =
    useState<PilotResult | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  const [safety, setSafety] = useState(100);
  const [navigation, setNavigation] =
    useState(100);
  const [fuel, setFuel] = useState(100);

  const [passengersSafe, setPassengersSafe] =
    useState(0);

  const [passengersAtRisk, setPassengersAtRisk] =
    useState(0);

  const [successfulActions, setSuccessfulActions] =
    useState(0);

  const [failedActions, setFailedActions] =
    useState(0);

  const [score, setScore] = useState(0);
  const [cashEarned, setCashEarned] =
    useState(0);

  const [flightStarted, setFlightStarted] =
    useState(false);

  const [message, setMessage] = useState(
    "Welcome to Abuja Aviation Command."
  );

  const [lastAction, setLastAction] =
    useState<PilotAction | null>(null);

  const [busy, setBusy] = useState(false);

  const resetFlight = () => {
    setScenario(null);
    setResult(null);
    setTimeLeft(0);
    setSafety(100);
    setNavigation(100);
    setFuel(selectedMission?.fuel ?? 100);
    setPassengersSafe(
      selectedMission?.passengers ?? 0
    );
    setPassengersAtRisk(0);
    setSuccessfulActions(0);
    setFailedActions(0);
    setScore(0);
    setCashEarned(0);
    setFlightStarted(false);
    setLastAction(null);
    setMessage(
      "Complete the pre-flight briefing."
    );
  };

  const openMission = (mission: PilotMission) => {
    setSelectedMission(mission);
    setScreen("briefing");
    setScenario(null);
    setResult(null);
    setTimeLeft(0);
    setSafety(100);
    setNavigation(100);
    setFuel(mission.fuel);
    setPassengersSafe(mission.passengers);
    setPassengersAtRisk(0);
    setSuccessfulActions(0);
    setFailedActions(0);
    setScore(0);
    setCashEarned(0);
    setFlightStarted(false);
    setLastAction(null);
    setMessage(
      "Review your flight plan before departure."
    );
  };

  const startFlight = () => {
    if (!selectedMission) return;

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to operate this flight.`
      );
      return;
    }

    setTimeLeft(selectedMission.flightTime);
    setSafety(100);
    setNavigation(100);
    setFuel(selectedMission.fuel);
    setPassengersSafe(
      selectedMission.passengers
    );
    setPassengersAtRisk(0);
    setSuccessfulActions(0);
    setFailedActions(0);
    setScore(0);
    setCashEarned(0);
    setFlightStarted(true);
    setLastAction(null);

    setScenario(
      getRandomPilotScenario(selectedMission)
    );

    setMessage(
      "Flight initiated. Follow cockpit instructions."
    );

    setScreen("cockpit");
  };

  const finishFlight = () => {
    if (!selectedMission || busy) return;

    setBusy(true);

    const responseTime =
      getPilotResponseTime(selectedMission);

    const finalResult = calculatePilotResult({
      mission: selectedMission,
      safety,
      navigation,
      fuelRemaining: fuel,
      passengersSafe,
      passengersAtRisk,
      successfulActions,
      failedActions,
      responseTime,
      missionsCompleted: 0,
    });

    setResult(finalResult);
    setScreen("result");
    setFlightStarted(false);
    setBusy(false);
  };

  useEffect(() => {
    if (
      screen !== "cockpit" ||
      !flightStarted
    ) {
      return;
    }

    if (timeLeft <= 0) {
      finishFlight();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    screen,
    flightStarted,
    timeLeft,
    safety,
    navigation,
    fuel,
    passengersSafe,
    passengersAtRisk,
    successfulActions,
    failedActions,
  ]);

  const handleAction = (
    action: PilotAction
  ) => {
    if (
      !selectedMission ||
      !scenario ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setLastAction(action);

    const outcome =
      getPilotActionOutcome(
        scenario,
        action
      );

    const nextSafety = clamp(
      safety + outcome.safetyChange
    );

    const nextNavigation = clamp(
      navigation +
        outcome.navigationChange
    );

    const nextFuel = clamp(
      fuel + outcome.fuelChange
    );

    const passengerChange =
      outcome.passengerChange;

    const nextPassengersAtRisk =
      outcome.success
        ? Math.max(
            0,
            passengersAtRisk -
              Math.max(
                1,
                Math.floor(
                  passengerChange / 3
                )
              )
          )
        : Math.min(
            selectedMission.passengers,
            passengersAtRisk +
              Math.max(
                1,
                Math.floor(
                  Math.abs(
                    passengerChange
                  ) / 2
                )
              )
          );

    const nextPassengersSafe =
      Math.max(
        0,
        selectedMission.passengers -
          nextPassengersAtRisk
      );

    const nextScore = Math.max(
      0,
      score + outcome.scoreChange
    );

    const nextCash = Math.max(
      0,
      cashEarned + outcome.cashChange
    );

    setSafety(nextSafety);
    setNavigation(nextNavigation);
    setFuel(nextFuel);
    setPassengersAtRisk(
      nextPassengersAtRisk
    );
    setPassengersSafe(
      nextPassengersSafe
    );
    setScore(nextScore);
    setCashEarned(nextCash);

    if (outcome.success) {
      setSuccessfulActions(
        (value) => value + 1
      );

      setMessage(
        getPilotSuccessMessage(scenario)
      );
    } else {
      setFailedActions(
        (value) => value + 1
      );

      setMessage(
        getPilotFailureMessage(scenario)
      );
    }

    const emergency =
      nextSafety <= 0 ||
      nextNavigation <= 0 ||
      nextFuel <= 0 ||
      nextPassengersAtRisk >=
        selectedMission.passengers;

    if (emergency) {
      setSafety(nextSafety);
      setNavigation(nextNavigation);
      setFuel(nextFuel);

      window.setTimeout(() => {
        setBusy(false);
        finishFlight();
      }, 500);

      return;
    }

    const nextScenario =
      getRandomPilotScenario(
        selectedMission
      );

    window.setTimeout(() => {
      setScenario(nextScenario);
      setBusy(false);
    }, 650);
  };

  const collectReward = async () => {
    if (!result) return;

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      energy: Math.max(
        0,
        player.energy - ENERGY_COST
      ),
      reputation:
        player.reputation + result.reputation,
      currentJobId: "pilot",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(updatedPlayer);
    await savePersistentPlayerState(
      updatedPlayer
    );

    setScreen("airport");
    setSelectedMission(null);
    setResult(null);
    setMessage(
      "Flight reward deposited successfully."
    );
  };

  const abandonFlight = () => {
    if (!flightStarted) return;

    setFlightStarted(false);
    setScenario(null);
    setScreen("airport");
    setSelectedMission(null);
    setMessage(
      "Flight aborted. No reward was issued."
    );
  };

  const renderMeter = (
    label: string,
    value: number,
    icon: string,
    dangerAt = 25
  ) => {
    const danger = value <= dangerAt;

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-white/45">
            {icon} {label}
          </span>

          <span
            className={`text-sm font-black ${
              danger
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {Math.round(value)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              danger
                ? "bg-red-500"
                : "bg-white"
            }`}
            style={{
              width: `${clamp(value)}%`,
            }}
          />
        </div>
      </div>
    );
  };

  const renderAirport = () => (
    <main className="min-h-screen bg-[#050608] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-sky-500/15 via-white/[0.03] to-transparent p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-sky-300">
                ✈️ Abuja Aviation
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Pilot Command
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                Fly passengers across Abuja,
                Nigeria and the world. Manage
                the aircraft, make critical
                decisions and land safely.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                Pilot Wallet
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatMoney(player.cash)}
              </p>
              <p className="mt-1 text-xs text-white/35">
                ⚡ {player.energy} energy
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-3xl">🧑🏾‍✈️</div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/35">
              Pilot Experience
            </p>
            <p className="mt-1 text-2xl font-black">
              {player.jobExperience.toLocaleString()}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-3xl">⭐</div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/35">
              Reputation
            </p>
            <p className="mt-1 text-2xl font-black">
              {player.reputation}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="text-3xl">🛫</div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/35">
              Flight Status
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-400">
              Ready
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-black">
                Airport Operations
              </p>
              <p className="mt-1 text-sm text-white/40">
                Select a route and take command
                of your aircraft.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setScreen("missions")
              }
              className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]"
            >
              View Flights →
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">
            📡{" "}
            <span className="font-bold text-white/80">
              ATC:
            </span>{" "}
            {message}
          </div>
        </div>
      </div>
    </main>
  );

  const renderMissions = () => (
    <main className="min-h-screen bg-[#050608] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            setScreen("airport")
          }
          className="mb-6 text-sm font-bold text-white/45 hover:text-white"
        >
          ← Back to Airport
        </button>

        <div className="mb-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
            Flight Board
          </p>
          <h2 className="mt-2 text-4xl font-black">
            Choose Your Flight
          </h2>
          <p className="mt-2 text-sm text-white/45">
            Higher-risk flights offer bigger
            rewards.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              onClick={() =>
                openMission(mission)
              }
              className="group rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-5xl">
                  {mission.emoji}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${difficultyClass(
                    mission.difficulty
                  )}`}
                >
                  {mission.difficulty}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">
                {mission.title}
              </h3>

              <p className="mt-1 text-sm font-bold text-sky-300">
                {mission.route}
              </p>

              <p className="mt-3 text-sm leading-6 text-white/45">
                {mission.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase text-white/30">
                    Passengers
                  </p>
                  <p className="mt-1 font-black">
                    {mission.passengers}
                  </p>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase text-white/30">
                    Flight Time
                  </p>
                  <p className="mt-1 font-black">
                    {mission.flightTime}s
                  </p>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase text-white/30">
                    Starting Pay
                  </p>
                  <p className="mt-1 font-black text-emerald-400">
                    {formatMoney(
                      mission.startingReward
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase text-white/30">
                    Max Pay
                  </p>
                  <p className="mt-1 font-black text-yellow-300">
                    {formatMoney(
                      mission.maxReward
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs font-bold text-white/35">
                <span>
                  🌤️ {mission.weather}
                </span>
                <span className="text-white/60 group-hover:text-white">
                  Select →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );

  const renderBriefing = () => {
    if (!selectedMission) return null;

    return (
      <main className="min-h-screen bg-[#050608] px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() =>
              setScreen("missions")
            }
            className="mb-6 text-sm font-bold text-white/45 hover:text-white"
          >
            ← Flight Board
          </button>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
            <div className="bg-gradient-to-r from-sky-500/15 to-transparent p-7 sm:p-9">
              <div className="text-6xl">
                {selectedMission.emoji}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-300">
                  FLIGHT BRIEFING
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${difficultyClass(
                    selectedMission.difficulty
                  )}`}
                >
                  {selectedMission.difficulty}
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-black">
                {selectedMission.title}
              </h1>

              <p className="mt-2 text-lg font-bold text-sky-300">
                {selectedMission.route}
              </p>
            </div>

            <div className="grid gap-4 p-7 sm:grid-cols-2 sm:p-9">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/30">
                  Departure
                </p>
                <p className="mt-2 font-bold">
                  🛫 {selectedMission.departure}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/30">
                  Destination
                </p>
                <p className="mt-2 font-bold">
                  🛬 {selectedMission.destination}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/30">
                  Passengers
                </p>
                <p className="mt-2 text-2xl font-black">
                  {selectedMission.passengers}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-white/30">
                  Weather
                </p>
                <p className="mt-2 text-2xl font-black">
                  🌤️
                </p>
                <p className="text-sm text-white/45">
                  {selectedMission.weather}
                </p>
              </div>
            </div>

            <div className="px-7 pb-7 sm:px-9 sm:pb-9">
              <div className="rounded-2xl border border-sky-400/10 bg-sky-400/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-widest text-sky-300">
                  Captain's Brief
                </p>

                <p className="mt-3 text-sm leading-7 text-white/55">
                  {selectedMission.description}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    setScreen("missions")
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black"
                >
                  Change Flight
                </button>

                <button
                  type="button"
                  disabled={
                    player.energy < ENERGY_COST
                  }
                  onClick={startFlight}
                  className="flex-1 rounded-2xl bg-white px-6 py-4 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {player.energy < ENERGY_COST
                    ? `Need ${ENERGY_COST} Energy`
                    : `Begin Flight • ${ENERGY_COST} Energy`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const renderCockpit = () => {
    if (
      !selectedMission ||
      !scenario
    ) {
      return null;
    }

    const critical =
      safety <= 25 ||
      navigation <= 25 ||
      fuel <= 20 ||
      timeLeft <= 20;

    return (
      <main className="min-h-screen bg-[#030405] px-3 py-4 text-white sm:px-5 sm:py-6">
        <div className="mx-auto max-w-7xl">
          <div
            className={`mb-4 rounded-2xl border p-4 ${
              critical
                ? "border-red-500/40 bg-red-500/10"
                : "border-white/10 bg-white/[0.035]"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Cockpit Command
                </p>

                <h1 className="mt-1 text-xl font-black">
                  {selectedMission.route}
                </h1>
              </div>

              <div
                className={`rounded-xl px-4 py-2 text-center ${
                  timeLeft <= 20
                    ? "bg-red-500/20 text-red-300"
                    : "bg-white/5"
                }`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                  Flight Clock
                </p>
                <p className="text-2xl font-black">
                  {timeLeft}s
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.45fr_1fr]">
            <div className="space-y-4">
              {renderMeter(
                "Aircraft Safety",
                safety,
                "🛡️"
              )}

              {renderMeter(
                "Navigation",
                navigation,
                "🧭"
              )}

              {renderMeter(
                "Fuel",
                fuel,
                "⛽",
                20
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/35">
                    👥 Passengers
                  </span>

                  <span className="font-black">
                    {passengersSafe}/
                    {selectedMission.passengers}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{
                        width: `${
                          (passengersSafe /
                            selectedMission.passengers) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {passengersAtRisk > 0 && (
                  <p className="mt-3 text-xs font-bold text-red-400">
                    ⚠️ {passengersAtRisk} passenger
                    {passengersAtRisk === 1
                      ? ""
                      : "s"} at risk
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white/35">
                    Score
                  </span>
                  <span className="font-black">
                    {score.toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-white/35">
                    Actions
                  </span>
                  <span className="font-black">
                    {successfulActions} ✓ /{" "}
                    {failedActions} ✕
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-5 shadow-2xl sm:p-7">
              <div className="mb-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 text-4xl">
                  ✈️
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-sky-300">
                  Incoming Cockpit Event
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {scenario.title}
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/50">
                  {scenario.description}
                </p>
              </div>

              {lastAction && (
                <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs font-bold text-white/45">
                  Last command:{" "}
                  <span className="text-white">
                    {lastAction}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleAction(action.id)
                    }
                    className="group rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-400/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="text-xl">
                      {action.emoji}
                    </div>

                    <p className="mt-2 text-xs font-black">
                      {action.label}
                    </p>

                    <p className="mt-1 hidden text-[10px] leading-4 text-white/30 sm:block">
                      {action.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    📡
                  </span>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
                      ATC
                    </p>

                    <p className="mt-1 text-sm leading-6 text-white/60">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={abandonFlight}
                className="mt-5 w-full rounded-xl border border-red-500/10 bg-red-500/[0.04] py-3 text-xs font-black text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
              >
                Abort Flight
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Flight Information
                </p>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      Departure
                    </span>
                    <span className="max-w-[150px] text-right text-xs font-bold">
                      {selectedMission.departure}
                    </span>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      Destination
                    </span>
                    <span className="max-w-[150px] text-right text-xs font-bold">
                      {selectedMission.destination}
                    </span>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      Weather
                    </span>
                    <span className="text-xs font-bold">
                      🌤️{" "}
                      {selectedMission.weather}
                    </span>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      Aircraft
                    </span>
                    <span className="text-xs font-bold">
                      ✈️ A320
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-3xl border p-5 ${
                  critical
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-white/10 bg-white/[0.035]"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Cockpit Status
                </p>

                <p
                  className={`mt-3 text-lg font-black ${
                    critical
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {critical
                    ? "⚠️ CRITICAL"
                    : "● ALL SYSTEMS ACTIVE"}
                </p>

                <p className="mt-2 text-xs leading-5 text-white/35">
                  {critical
                    ? "Immediate action required. Protect the aircraft and passengers."
                    : "Aircraft systems are currently responding normally."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  };

  const renderResult = () => {
    if (!result || !selectedMission) {
      return null;
    }

    return (
      <main className="min-h-screen bg-[#050608] px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
            <div className="bg-gradient-to-br from-sky-500/15 to-transparent p-8 text-center sm:p-10">
              <div className="text-7xl">
                {result.safety >= 75
                  ? "🛬"
                  : "⚠️"}
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-sky-300">
                Flight Report
              </p>

              <h1 className="mt-3 text-4xl font-black">
                {result.rank}
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">
                {result.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4 sm:p-8">
              <div className="rounded-2xl bg-black/20 p-4 text-center">
                <p className="text-[10px] font-black uppercase text-white/30">
                  Score
                </p>
                <p className="mt-2 text-2xl font-black">
                  {result.score.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 text-center">
                <p className="text-[10px] font-black uppercase text-white/30">
                  Reward
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  {formatMoney(result.cash)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 text-center">
                <p className="text-[10px] font-black uppercase text-white/30">
                  Reputation
                </p>
                <p className="mt-2 text-2xl font-black text-yellow-300">
                  +{result.reputation}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4 text-center">
                <p className="text-[10px] font-black uppercase text-white/30">
                  Passengers
                </p>
                <p className="mt-2 text-2xl font-black">
                  {result.passengersSafe}
                </p>
              </div>
            </div>

            <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2 sm:px-8 sm:pb-8">
              {renderMeter(
                "Final Safety",
                result.safety,
                "🛡️"
              )}

              {renderMeter(
                "Navigation",
                result.navigation,
                "🧭"
              )}

              {renderMeter(
                "Fuel Remaining",
                result.fuelRemaining,
                "⛽",
                20
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white/35">
                    Successful Actions
                  </span>
                  <span className="font-black text-emerald-400">
                    {result.successfulActions}
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-white/35">
                    Failed Actions
                  </span>
                  <span className="font-black text-red-400">
                    {result.failedActions}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-6 sm:p-8">
              <button
                type="button"
                onClick={collectReward}
                className="w-full rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:scale-[1.01]"
              >
                Collect {formatMoney(result.cash)} Reward →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  };

  if (screen === "missions") {
    return renderMissions();
  }

  if (screen === "briefing") {
    return renderBriefing();
  }

  if (screen === "cockpit") {
    return renderCockpit();
  }

  if (screen === "result") {
    return renderResult();
  }

  return renderAirport();
}
