"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CabinCrewAction,
  CabinCrewFlight,
  CabinCrewOutcome,
  CabinCrewResult,
  CabinCrewScenario,
  calculateCabinCrewResult,
  getAllCabinCrewFlights,
  getCabinCrewActionOutcome,
  getCabinCrewResponseTime,
  getCabinCrewScenarios,
} from "@/lib/game/cabinCrew";
import {
  PlayerGameState,
  savePlayerState,
} from "@/lib/game/player";

interface CabinCrewPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

type Screen =
  | "crew"
  | "flights"
  | "briefing"
  | "cabin"
  | "result";

const ENERGY_COST = 20;

const ACTIONS: {
  id: CabinCrewAction;
  label: string;
  emoji: string;
}[] = [
  { id: "greet-passengers", label: "Welcome", emoji: "👋" },
  { id: "check-cabin", label: "Check Cabin", emoji: "🔎" },
  { id: "demonstrate-safety", label: "Safety Demo", emoji: "🛟" },
  { id: "serve-meals", label: "Serve Meals", emoji: "🍱" },
  { id: "serve-drinks", label: "Serve Drinks", emoji: "🥤" },
  { id: "assist-passenger", label: "Assist Passenger", emoji: "🤝" },
  { id: "handle-complaint", label: "Handle Complaint", emoji: "😤" },
  { id: "manage-turbulence", label: "Manage Turbulence", emoji: "🌪️" },
  { id: "secure-cabin", label: "Secure Cabin", emoji: "🔒" },
  { id: "help-medical", label: "Medical Help", emoji: "🩺" },
  { id: "assist-vip", label: "Assist VIP", emoji: "👑" },
  { id: "prepare-landing", label: "Prepare Landing", emoji: "🛬" },
  { id: "announce-update", label: "Announcement", emoji: "📢" },
  { id: "handle-emergency", label: "Emergency", emoji: "🚨" },
];

export default function CabinCrewPanel({
  player,
  setPlayer,
}: CabinCrewPanelProps) {
  const flights = getAllCabinCrewFlights();

  const [screen, setScreen] = useState<Screen>("crew");
  const [selectedFlight, setSelectedFlight] =
    useState<CabinCrewFlight | null>(null);

  const [scenario, setScenario] =
    useState<CabinCrewScenario | null>(null);

  const [scenarioPool, setScenarioPool] =
    useState<CabinCrewScenario[]>([]);

  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [responseTime, setResponseTime] = useState(0);

  const [score, setScore] = useState(0);
  const [correctActions, setCorrectActions] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [passengersHelped, setPassengersHelped] = useState(0);

  const [passengerSatisfaction, setPassengerSatisfaction] =
    useState(55);

  const [safetyRating, setSafetyRating] = useState(65);

  const [message, setMessage] = useState(
    "Welcome to the Abuja Life cabin crew."
  );

  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [result, setResult] = useState<CabinCrewResult | null>(null);
  const [busy, setBusy] = useState(false);

  const currentStep = scenarioIndex + 1;

  const progressPercent = useMemo(() => {
    if (!selectedFlight) return 0;

    const total = Math.max(
      selectedFlight.safetyChecks + 4,
      scenarioPool.length,
      1
    );

    return Math.min(100, Math.round((currentStep / total) * 100));
  }, [
    currentStep,
    selectedFlight,
    scenarioPool.length,
  ]);

  useEffect(() => {
    if (screen !== "cabin") return;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, scenarioIndex]);

  useEffect(() => {
    if (
      screen !== "cabin" ||
      !scenario ||
      busy ||
      timeLeft > 0
    ) {
      return;
    }

    handleTimeout();
  }, [timeLeft, screen, scenario, busy]);

  useEffect(() => {
    if (screen !== "cabin") return;

    const timer = window.setInterval(() => {
      setResponseTime((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, scenarioIndex]);

  useEffect(() => {
    if (
      screen !== "cabin" ||
      !scenario ||
      busy ||
      responseTime > 0
    ) {
      return;
    }

    handleTimeout();
  }, [
    responseTime,
    screen,
    scenario,
    busy,
  ]);

  function addLog(entry: string) {
    setActivityLog((current) => [
      entry,
      ...current.slice(0, 7),
    ]);
  }

  function resetGame() {
    setScore(0);
    setCorrectActions(0);
    setMistakes(0);
    setPassengersHelped(0);
    setPassengerSatisfaction(55);
    setSafetyRating(65);
    setScenarioIndex(0);
    setScenario(null);
    setScenarioPool([]);
    setTimeLeft(0);
    setResponseTime(0);
    setMessage(
      "Welcome to the Abuja Life cabin crew."
    );
    setActivityLog([]);
    setResult(null);
    setBusy(false);
  }

  function selectFlight(flight: CabinCrewFlight) {
    setSelectedFlight(flight);
    setScreen("briefing");
  }

  function startFlight() {
    if (!selectedFlight) return;

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to work this flight.`
      );
      setScreen("crew");
      return;
    }

    const scenarios = getCabinCrewScenarios(
      selectedFlight.id
    );

    if (scenarios.length === 0) {
      setMessage(
        "This flight has no cabin scenarios yet."
      );
      setScreen("flights");
      return;
    }

    setScenarioPool(scenarios);
    setScenarioIndex(0);
    setScore(0);
    setCorrectActions(0);
    setMistakes(0);
    setPassengersHelped(0);
    setPassengerSatisfaction(55);
    setSafetyRating(65);
    setActivityLog([]);

    const first = scenarios[0];

    setScenario(first);
    setTimeLeft(selectedFlight.timeLimit);
    setResponseTime(
      getCabinCrewResponseTime(first)
    );
    setMessage(first.instruction);
    setScreen("cabin");
  }

  function loadScenario(index: number) {
    if (!selectedFlight) return;

    if (index >= scenarioPool.length) {
      finishFlight();
      return;
    }

    const next = scenarioPool[index];

    setScenario(next);
    setScenarioIndex(index);
    setResponseTime(
      getCabinCrewResponseTime(next)
    );
    setMessage(next.instruction);
  }

  function handleAction(action: CabinCrewAction) {
    if (
      !scenario ||
      !selectedFlight ||
      busy ||
      screen !== "cabin"
    ) {
      return;
    }

    setBusy(true);

    const outcome = getCabinCrewActionOutcome(
      scenario,
      action
    );

    const nextScore = Math.max(
      0,
      score + outcome.points
    );

    setScore(nextScore);

    if (outcome.success) {
      setCorrectActions((current) => current + 1);

      if (
        scenario.type === "passenger" ||
        scenario.type === "medical" ||
        scenario.type === "vip"
      ) {
        setPassengersHelped(
          (current) => current + 1
        );
      }

      setPassengerSatisfaction((current) =>
        Math.min(100, current + 7)
      );

      if (
        scenario.type === "safety" ||
        scenario.type === "turbulence" ||
        scenario.type === "emergency" ||
        scenario.type === "landing"
      ) {
        setSafetyRating((current) =>
          Math.min(100, current + 6)
        );
      }

      addLog(`✅ ${outcome.message}`);
      setMessage(outcome.message);
    } else {
      setMistakes((current) => current + 1);

      setPassengerSatisfaction((current) =>
        Math.max(0, current - 9)
      );

      if (
        scenario.type === "safety" ||
        scenario.type === "turbulence" ||
        scenario.type === "emergency" ||
        scenario.type === "landing"
      ) {
        setSafetyRating((current) =>
          Math.max(0, current - 12)
        );
      }

      addLog(`❌ ${outcome.message}`);
      setMessage(outcome.message);
    }

    window.setTimeout(() => {
      setBusy(false);

      if (
        scenarioIndex + 1 >=
        scenarioPool.length
      ) {
        finishFlight(nextScore);
        return;
      }

      loadScenario(scenarioIndex + 1);
    }, 700);
  }

  function handleTimeout() {
    if (
      screen !== "cabin" ||
      !scenario ||
      !selectedFlight ||
      busy
    ) {
      return;
    }

    setBusy(true);

    const nextScore = Math.max(
      0,
      score + scenario.failurePoints
    );

    setScore(nextScore);
    setMistakes((current) => current + 1);

    setPassengerSatisfaction((current) =>
      Math.max(0, current - 12)
    );

    if (
      scenario.type === "safety" ||
      scenario.type === "turbulence" ||
      scenario.type === "emergency" ||
      scenario.type === "landing"
    ) {
      setSafetyRating((current) =>
        Math.max(0, current - 15)
      );
    }

    setMessage(
      "⏰ You reacted too slowly. The cabin needs immediate attention."
    );

    addLog(
      "⏰ Cabin response missed. Passenger and safety ratings dropped."
    );

    window.setTimeout(() => {
      setBusy(false);

      if (
        scenarioIndex + 1 >=
        scenarioPool.length
      ) {
        finishFlight(nextScore);
        return;
      }

      loadScenario(scenarioIndex + 1);
    }, 750);
  }

  function finishFlight(finalScore = score) {
    if (!selectedFlight) return;

    const cabinResult =
      calculateCabinCrewResult({
        flight: selectedFlight,
        score: finalScore,
        correctActions,
        mistakes,
        passengersHelped,
      });

    setResult(cabinResult);
    setScreen("result");
  }

  function collectReward() {
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
      currentJobId: "cabin-crew",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);

    setMessage(
      `Flight complete! You earned ₦${result.cash.toLocaleString()}.`
    );

    setSelectedFlight(null);
    resetGame();
    setScreen("crew");
  }

  function outcomeLabel(outcome: CabinCrewOutcome) {
    switch (outcome) {
      case "outstanding":
        return "OUTSTANDING FLIGHT";
      case "excellent":
        return "EXCELLENT SERVICE";
      case "good":
        return "GOOD FLIGHT";
      case "mixed":
        return "MIXED PERFORMANCE";
      case "poor":
        return "POOR PERFORMANCE";
      default:
        return "CRITICAL CABIN FAILURE";
    }
  }

  function difficultyClass(
    difficulty: CabinCrewFlight["difficulty"]
  ) {
    switch (difficulty) {
      case "easy":
        return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
      case "medium":
        return "border-amber-500/20 bg-amber-500/10 text-amber-300";
      case "hard":
        return "border-orange-500/20 bg-orange-500/10 text-orange-300";
      case "extreme":
        return "border-red-500/20 bg-red-500/10 text-red-300";
    }
  }

  if (
    screen === "briefing" &&
    selectedFlight
  ) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-blue-950 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setScreen("flights")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to Flights
            </button>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${difficultyClass(
                selectedFlight.difficulty
              )}`}
            >
              {selectedFlight.difficulty}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <div className="text-7xl">✈️</div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
                Crew Assignment
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                {selectedFlight.name}
              </h1>

              <p className="mt-2 text-white/50">
                {selectedFlight.route}
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
            {selectedFlight.description}
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-4 md:p-8">
          <InfoCard
            icon="👥"
            label="Passengers"
            value={selectedFlight.passengers.toString()}
          />

          <InfoCard
            icon="👑"
            label="VIPs"
            value={selectedFlight.vipPassengers.toString()}
          />

          <InfoCard
            icon="🛟"
            label="Safety Checks"
            value={selectedFlight.safetyChecks.toString()}
          />

          <InfoCard
            icon="⏱️"
            label="Flight Time"
            value={`${selectedFlight.timeLimit}s`}
          />
        </div>

        <div className="border-t border-white/10 p-5 md:p-8">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
            <div className="flex gap-4">
              <div className="text-3xl">🧑🏾‍✈️</div>

              <div>
                <h2 className="font-black">
                  Crew Briefing
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/50">
                  Keep passengers safe and satisfied.
                  You will need to react quickly to
                  service requests, safety problems,
                  turbulence and emergencies.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startFlight}
            disabled={player.energy < ENERGY_COST}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-950/30 transition hover:scale-[1.01] hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {player.energy < ENERGY_COST
              ? `Need ${ENERGY_COST} Energy`
              : "✈️ Report for Duty"}
          </button>
        </div>
      </section>
    );
  }

  if (
    screen === "cabin" &&
    selectedFlight &&
    scenario
  ) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-blue-950 via-slate-950 to-sky-950 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
                🔴 CABIN CREW LIVE
              </p>

              <h1 className="mt-1 text-xl font-black md:text-3xl">
                {selectedFlight.route}
              </h1>
            </div>

            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-300">
                Flight Time
              </p>

              <p className="text-2xl font-black">
                {timeLeft}s
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-600 transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_320px] md:p-6">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-950/70 via-slate-900 to-blue-950/60 p-5 md:p-8">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-black uppercase text-sky-300">
                    Cabin Step {currentStep}
                  </span>

                  <span className="text-xs font-bold text-white/40">
                    {scenario.type}
                  </span>
                </div>

                <div className="py-10 text-center">
                  <div
                    className={`text-7xl md:text-8xl ${
                      scenario.type === "turbulence"
                        ? "animate-pulse"
                        : "animate-bounce"
                    }`}
                  >
                    {scenario.type === "emergency"
                      ? "🚨"
                      : scenario.type === "medical"
                        ? "🩺"
                        : scenario.type === "turbulence"
                          ? "🌪️"
                          : scenario.type === "vip"
                            ? "👑"
                            : "🧑🏾‍✈️"}
                  </div>

                  <h2 className="mt-6 text-2xl font-black md:text-4xl">
                    {scenario.title}
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60 md:text-base">
                    {scenario.instruction}
                  </p>

                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <span className="text-red-400">⏱</span>

                    <span className="font-black">
                      {responseTime}s
                    </span>

                    <span className="text-xs text-white/40">
                      response
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                  <p className="text-xs font-bold text-white/40">
                    CABIN STATUS
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/70">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  disabled={busy}
                  onClick={() =>
                    handleAction(action.id)
                  }
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-sky-500/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <div className="text-2xl transition group-hover:scale-110">
                    {action.emoji}
                  </div>

                  <p className="mt-2 text-xs font-black text-white/80">
                    {action.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <StatCard
              label="Score"
              value={score.toString()}
              icon="🏆"
            />

            <StatCard
              label="Passengers"
              value={`${passengerSatisfaction}%`}
              icon="😊"
            />

            <StatCard
              label="Safety"
              value={`${safetyRating}%`}
              icon="🛡️"
            />

            <StatCard
              label="Passengers Helped"
              value={passengersHelped.toString()}
              icon="🤝"
            />

            <StatCard
              label="Mistakes"
              value={mistakes.toString()}
              icon="❌"
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black">
                  Crew Log
                </h3>

                <span className="text-[10px] font-black text-red-400">
                  LIVE
                </span>
              </div>

              <div className="space-y-2">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-white/30">
                    Crew activity will appear here.
                  </p>
                ) : (
                  activityLog.map((entry, index) => (
                    <div
                      key={`${entry}-${index}`}
                      className="rounded-xl bg-black/20 p-2 text-xs leading-5 text-white/60"
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  if (
    screen === "result" &&
    result &&
    selectedFlight
  ) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950 p-8 text-center md:p-12">
          <div className="text-7xl">
            {result.outcome === "critical"
              ? "🚨"
              : result.outcome === "poor"
                ? "😓"
                : result.outcome === "mixed"
                  ? "🫤"
                  : "🧑🏾‍✈️"}
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-sky-300">
            Flight Complete
          </p>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            {outcomeLabel(result.outcome)}
          </h1>

          <p className="mt-3 text-white/50">
            {selectedFlight.name}
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
          <ResultCard
            icon="💰"
            label="Earnings"
            value={`₦${result.cash.toLocaleString()}`}
          />

          <ResultCard
            icon="🏆"
            label="Score"
            value={result.score.toLocaleString()}
          />

          <ResultCard
            icon="😊"
            label="Passenger Rating"
            value={`${result.passengerSatisfaction}%`}
          />

          <ResultCard
            icon="🛡️"
            label="Safety Rating"
            value={`${result.safetyRating}%`}
          />
        </div>

        <div className="grid gap-3 px-5 pb-5 md:grid-cols-4 md:px-8 md:pb-8">
          <SmallResult
            label="Correct Actions"
            value={result.correctActions}
          />

          <SmallResult
            label="Mistakes"
            value={result.mistakes}
          />

          <SmallResult
            label="Passengers Helped"
            value={result.passengersHelped}
          />

          <SmallResult
            label="Crew Rank"
            value={result.rank}
          />
        </div>

        <div className="border-t border-white/10 p-5 md:p-8">
          <button
            onClick={collectReward}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-950/30 transition hover:scale-[1.01] hover:from-sky-400 hover:to-blue-500"
          >
            💰 Collect ₦
            {result.cash.toLocaleString()} & Continue
          </button>
        </div>
      </section>
    );
  }

  if (screen === "flights") {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl md:p-8">
        <button
          onClick={() => setScreen("crew")}
          className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          ← Crew Base
        </button>

        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400">
          Flight Assignments
        </p>

        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          Choose Your Flight
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Short domestic routes are safer. International
          and emergency flights pay much more.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flights.map((flight) => (
            <button
              key={flight.id}
              onClick={() => selectFlight(flight)}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-sky-400/30 hover:bg-sky-500/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-4xl">
                  {flight.difficulty === "extreme"
                    ? "🚨"
                    : flight.vipPassengers > 10
                      ? "👑"
                      : "✈️"}
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${difficultyClass(
                    flight.difficulty
                  )}`}
                >
                  {flight.difficulty}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black">
                {flight.name}
              </h2>

              <p className="mt-1 text-sm font-bold text-sky-300">
                {flight.route}
              </p>

              <p className="mt-3 min-h-[48px] text-sm leading-6 text-white/50">
                {flight.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-black/20 p-3">
                  <span className="block text-white/35">
                    Passengers
                  </span>

                  <span className="mt-1 block font-black">
                    {flight.passengers}
                  </span>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <span className="block text-white/35">
                    VIPs
                  </span>

                  <span className="mt-1 block font-black text-amber-300">
                    {flight.vipPassengers}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300">
                  ₦{flight.minReward.toLocaleString()}+
                </span>

                <span className="text-xs font-black text-sky-400 transition group-hover:text-sky-300">
                  Accept Flight →
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-slate-950 to-blue-950 p-6 md:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="absolute -bottom-20 left-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-400">
                ABUJA LIFE • AVIATION CAREER
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                Cabin Crew
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Take care of passengers, manage the cabin,
                handle emergencies and build your reputation
                as one of Abuja's best flight crew members.
              </p>
            </div>

            <div className="text-center">
              <div className="animate-bounce text-7xl md:text-8xl">
                🧑🏾‍✈️
              </div>

              <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/40">
                Crew Mode
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Cash"
              value={`₦${player.cash.toLocaleString()}`}
              icon="💰"
            />

            <StatCard
              label="Energy"
              value={`${player.energy}/${player.maxEnergy}`}
              icon="⚡"
            />

            <StatCard
              label="Reputation"
              value={player.reputation.toLocaleString()}
              icon="⭐"
            />
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon="🛟"
            title="Keep Passengers Safe"
            text="Perform cabin checks, safety demonstrations and emergency procedures."
          />

          <FeatureCard
            icon="😊"
            title="Serve Passengers"
            text="Handle meals, drinks, complaints, VIP requests and passenger needs."
          />

          <FeatureCard
            icon="🚨"
            title="Handle Emergencies"
            text="React quickly when turbulence, medical situations and serious emergencies happen."
          />
        </div>

        <div className="mt-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl">✈️</div>

            <div>
              <h2 className="font-black">
                Crew Brief
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/50">
                Every flight is different. Domestic
                flights are easier, while VIP and emergency
                flights can dramatically increase your
                earnings — and the pressure.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen("flights")}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-5 text-lg font-black text-white shadow-xl shadow-blue-950/30 transition hover:scale-[1.01] hover:from-sky-400 hover:to-blue-500"
        >
          ✈️ View Flight Assignments
        </button>

        <p className="mt-3 text-center text-xs text-white/30">
          Each flight assignment costs {ENERGY_COST} energy.
        </p>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-white/40">
          {label}
        </span>

        <span className="text-xl">{icon}</span>
      </div>

      <p className="mt-2 text-xl font-black">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-sky-400/20">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-4 font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-white/45">
        {text}
      </p>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-xs font-black uppercase tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-1 text-xl font-black">
        {value}
      </p>
    </div>
  );
}

function SmallResult({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <p className="text-xs font-bold text-white/40">
        {label}
      </p>

      <p className="mt-1 text-lg font-black">
        {value}
      </p>
    </div>
  );
}
