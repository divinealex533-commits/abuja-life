"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChefAction,
  ChefOrder,
  ChefOutcome,
  ChefResult,
  ChefScenario,
  calculateChefResult,
  getAllChefOrders,
  getChefActionOutcome,
  getChefResponseTime,
  getChefScenarios,
} from "@/lib/game/restaurantChef";
import {
  PlayerGameState,
  savePlayerState,
} from "@/lib/game/player";

interface RestaurantChefPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

type Screen =
  | "kitchen"
  | "orders"
  | "briefing"
  | "cooking"
  | "result";

const ENERGY_COST = 18;

const ACTIONS: {
  id: ChefAction;
  label: string;
  emoji: string;
}[] = [
  { id: "prep", label: "Prepare Station", emoji: "🧑‍🍳" },
  { id: "chop", label: "Chop", emoji: "🔪" },
  { id: "season", label: "Season", emoji: "🧂" },
  { id: "fry", label: "Fry", emoji: "🍳" },
  { id: "grill", label: "Grill", emoji: "🔥" },
  { id: "boil", label: "Boil", emoji: "🍲" },
  { id: "bake", label: "Bake", emoji: "🥐" },
  { id: "plate", label: "Plate", emoji: "🍽️" },
  { id: "serve", label: "Serve", emoji: "🚀" },
  { id: "check-order", label: "Check Order", emoji: "📋" },
];

export default function RestaurantChefPanel({
  player,
  setPlayer,
}: RestaurantChefPanelProps) {
  const orders = getAllChefOrders();

  const [screen, setScreen] = useState<Screen>("kitchen");
  const [selectedOrder, setSelectedOrder] =
    useState<ChefOrder | null>(null);

  const [scenario, setScenario] =
    useState<ChefScenario | null>(null);

  const [scenarioPool, setScenarioPool] =
    useState<ChefScenario[]>([]);

  const [scenarioIndex, setScenarioIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const [responseTime, setResponseTime] = useState(0);

  const [score, setScore] = useState(0);
  const [correctSteps, setCorrectSteps] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const [customerSatisfaction, setCustomerSatisfaction] =
    useState(50);

  const [ordersCompleted, setOrdersCompleted] =
    useState(0);

  const [message, setMessage] = useState(
    "Welcome to the Abuja kitchen."
  );

  const [activityLog, setActivityLog] = useState<string[]>(
    []
  );

  const [result, setResult] =
    useState<ChefResult | null>(null);

  const [busy, setBusy] = useState(false);

  const currentStep = scenarioIndex + 1;

  const progressPercent = useMemo(() => {
    if (!selectedOrder) return 0;

    if (selectedOrder.steps <= 0) return 0;

    return Math.min(
      100,
      Math.round(
        (currentStep / selectedOrder.steps) * 100
      )
    );
  }, [currentStep, selectedOrder]);

  useEffect(() => {
    if (screen !== "cooking") return;

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
    if (screen !== "cooking") return;

    if (timeLeft <= 0 && scenario) {
      handleTimeout();
    }
  }, [timeLeft, screen, scenario]);

  useEffect(() => {
    if (screen !== "cooking") return;

    if (responseTime <= 0 && scenario) {
      handleTimeout();
    }
  }, [responseTime, screen, scenario]);

  useEffect(() => {
    if (screen !== "cooking") return;

    const timer = window.setInterval(() => {
      setResponseTime((current) =>
        current > 0 ? current - 1 : 0
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, scenarioIndex]);

  function addLog(entry: string) {
    setActivityLog((current) => [
      entry,
      ...current.slice(0, 7),
    ]);
  }

  function resetGame() {
    setScore(0);
    setCorrectSteps(0);
    setMistakes(0);
    setCustomerSatisfaction(50);
    setOrdersCompleted(0);
    setScenarioIndex(0);
    setScenario(null);
    setTimeLeft(0);
    setResponseTime(0);
    setMessage("Welcome to the Abuja kitchen.");
    setActivityLog([]);
    setResult(null);
    setBusy(false);
  }

  function selectOrder(order: ChefOrder) {
    setSelectedOrder(order);
    setScreen("briefing");
  }

  function startCooking() {
    if (!selectedOrder) return;

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to start a kitchen shift.`
      );
      setScreen("kitchen");
      return;
    }

    const scenarios = getChefScenarios(
      selectedOrder.id
    );

    if (scenarios.length === 0) {
      setMessage(
        "This order has no kitchen scenarios yet."
      );
      return;
    }

    setScenarioPool(scenarios);
    setScenarioIndex(0);
    setScore(0);
    setCorrectSteps(0);
    setMistakes(0);
    setCustomerSatisfaction(50);
    setOrdersCompleted(0);
    setActivityLog([]);

    const firstScenario = scenarios[0];

    setScenario(firstScenario);
    setTimeLeft(selectedOrder.timeLimit);
    setResponseTime(
      getChefResponseTime(firstScenario)
    );
    setMessage(firstScenario.instruction);
    setScreen("cooking");
  }

  function loadScenario(index: number) {
    if (!selectedOrder) return;

    if (index >= selectedOrder.steps) {
      finishCooking();
      return;
    }

    const nextScenario =
      scenarioPool[index % scenarioPool.length];

    setScenario(nextScenario);
    setScenarioIndex(index);

    const response = getChefResponseTime(nextScenario);

    setResponseTime(response);
    setMessage(nextScenario.instruction);
  }

  function handleAction(action: ChefAction) {
    if (
      !scenario ||
      !selectedOrder ||
      busy ||
      screen !== "cooking"
    ) {
      return;
    }

    setBusy(true);

    const outcome = getChefActionOutcome(
      scenario,
      action
    );

    const nextScore = Math.max(
      0,
      score + outcome.points
    );

    setScore(nextScore);

    if (outcome.success) {
      setCorrectSteps((current) => current + 1);

      setCustomerSatisfaction((current) =>
        Math.min(100, current + 7)
      );

      addLog(`✅ ${outcome.message}`);
      setMessage(outcome.message);
    } else {
      setMistakes((current) => current + 1);

      setCustomerSatisfaction((current) =>
        Math.max(0, current - 10)
      );

      addLog(`❌ ${outcome.message}`);
      setMessage(outcome.message);
    }

    window.setTimeout(() => {
      setBusy(false);

      if (
        scenarioIndex + 1 >=
        Math.max(selectedOrder.steps, scenarioPool.length)
      ) {
        finishCooking(nextScore);
        return;
      }

      loadScenario(scenarioIndex + 1);
    }, 650);
  }

  function handleTimeout() {
    if (
      screen !== "cooking" ||
      !scenario ||
      !selectedOrder ||
      busy
    ) {
      return;
    }

    setBusy(true);

    const penalty = scenario.failurePoints;

    const nextScore = Math.max(
      0,
      score + penalty
    );

    setScore(nextScore);
    setMistakes((current) => current + 1);

    setCustomerSatisfaction((current) =>
      Math.max(0, current - 12)
    );

    setMessage(
      "⏰ Time is up! The kitchen is getting backed up."
    );

    addLog(
      "⏰ You missed a kitchen action and lost points."
    );

    window.setTimeout(() => {
      setBusy(false);

      if (
        scenarioIndex + 1 >=
        Math.max(selectedOrder.steps, scenarioPool.length)
      ) {
        finishCooking(nextScore);
        return;
      }

      loadScenario(scenarioIndex + 1);
    }, 700);
  }

  function finishCooking(finalScore = score) {
    if (!selectedOrder) return;

    const finalMistakes = mistakes;
    const finalCorrectSteps = correctSteps;

    const chefResult = calculateChefResult({
      order: selectedOrder,
      score: finalScore,
      correctSteps: finalCorrectSteps,
      mistakes: finalMistakes,
      ordersCompleted: 1,
    });

    setResult(chefResult);
    setOrdersCompleted(1);
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
      currentJobId: "restaurant-chef",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);

    setMessage(
      `Kitchen shift complete! You earned ₦${result.cash.toLocaleString()}.`
    );

    setScreen("kitchen");
    setSelectedOrder(null);
    setResult(null);
    resetGame();
  }

  function getOutcomeLabel(
    outcome: ChefOutcome
  ) {
    switch (outcome) {
      case "perfect":
        return "PERFECT SERVICE";
      case "excellent":
        return "EXCELLENT SERVICE";
      case "good":
        return "GOOD SERVICE";
      case "mixed":
        return "MIXED SERVICE";
      case "poor":
        return "POOR SERVICE";
      default:
        return "KITCHEN DISASTER";
    }
  }

  function difficultyClass(
    difficulty: ChefOrder["difficulty"]
  ) {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/20";
      case "hard":
        return "bg-orange-500/15 text-orange-300 border-orange-500/20";
      case "extreme":
        return "bg-red-500/15 text-red-300 border-red-500/20";
    }
  }

  if (screen === "briefing" && selectedOrder) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-orange-950 via-slate-900 to-red-950 p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={() => setScreen("orders")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              ← Back to Orders
            </button>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${difficultyClass(
                selectedOrder.difficulty
              )}`}
            >
              {selectedOrder.difficulty}
            </span>
          </div>

          <div className="text-6xl">👨🏾‍🍳</div>

          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
            {selectedOrder.name}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 md:text-base">
            {selectedOrder.description}
          </p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-4 md:p-8">
          <InfoCard
            label="Restaurant"
            value={selectedOrder.restaurant}
            icon="🏪"
          />

          <InfoCard
            label="Customers"
            value={selectedOrder.targetCustomers.toString()}
            icon="👥"
          />

          <InfoCard
            label="Ingredients"
            value={selectedOrder.ingredients.toString()}
            icon="🥕"
          />

          <InfoCard
            label="Time"
            value={`${selectedOrder.timeLimit}s`}
            icon="⏱️"
          />
        </div>

        <div className="border-t border-white/10 p-5 md:p-8">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔥</div>

              <div>
                <h2 className="font-black text-white">
                  Kitchen Mission
                </h2>

                <p className="mt-1 text-sm leading-6 text-white/60">
                  Complete the cooking tasks correctly,
                  keep customers happy and finish before
                  the kitchen gets overwhelmed.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startCooking}
            disabled={player.energy < ENERGY_COST}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-orange-950/30 transition hover:scale-[1.01] hover:from-orange-400 hover:to-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {player.energy < ENERGY_COST
              ? `Need ${ENERGY_COST} Energy`
              : "🔥 Start Kitchen Shift"}
          </button>
        </div>
      </section>
    );
  }

  if (screen === "cooking" && selectedOrder && scenario) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-red-950 via-orange-950 to-slate-950 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                LIVE KITCHEN
              </p>

              <h1 className="mt-1 text-xl font-black md:text-3xl">
                {selectedOrder.name}
              </h1>
            </div>

            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-center">
              <div className="text-[10px] font-black uppercase tracking-wider text-red-300">
                Kitchen Time
              </div>

              <div className="text-2xl font-black text-white">
                {timeLeft}s
              </div>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_320px] md:p-6">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-950/70 via-slate-900 to-red-950/60 p-5 md:p-8">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-300">
                    Step {currentStep}
                  </span>

                  <span className="text-sm font-bold text-white/50">
                    {selectedOrder.steps} steps
                  </span>
                </div>

                <div className="py-10 text-center">
                  <div className="animate-bounce text-7xl md:text-8xl">
                    👨🏾‍🍳
                  </div>

                  <h2 className="mt-6 text-2xl font-black md:text-4xl">
                    {scenario.title}
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60 md:text-base">
                    {scenario.instruction}
                  </p>

                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                    <span className="text-red-400">
                      ⏱
                    </span>

                    <span className="font-black">
                      {responseTime}s
                    </span>

                    <span className="text-xs text-white/40">
                      response time
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex justify-between gap-4 text-xs font-bold">
                    <span className="text-white/50">
                      Kitchen Status
                    </span>

                    <span className="text-orange-300">
                      {message}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {ACTIONS.map((action) => (
                <button
                  key={action.id}
                  disabled={busy}
                  onClick={() =>
                    handleAction(action.id)
                  }
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-orange-500/10 disabled:pointer-events-none disabled:opacity-40"
                >
                  <div className="text-2xl transition group-hover:scale-110">
                    {action.emoji}
                  </div>

                  <div className="mt-2 text-xs font-black text-white/80">
                    {action.label}
                  </div>
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
              label="Customer Satisfaction"
              value={`${customerSatisfaction}%`}
              icon="😍"
            />

            <StatCard
              label="Correct Steps"
              value={correctSteps.toString()}
              icon="✅"
            />

            <StatCard
              label="Mistakes"
              value={mistakes.toString()}
              icon="❌"
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black">
                  Kitchen Log
                </h3>

                <span className="text-xs text-white/40">
                  LIVE
                </span>
              </div>

              <div className="space-y-2">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-white/35">
                    Your kitchen activity will appear here.
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

  if (screen === "result" && result && selectedOrder) {
    return (
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="bg-gradient-to-br from-orange-950 via-red-950 to-slate-950 p-8 text-center md:p-12">
          <div className="text-7xl">
            {result.outcome === "disaster"
              ? "💥"
              : result.outcome === "poor"
                ? "😓"
                : result.outcome === "mixed"
                  ? "🫤"
                  : "👨🏾‍🍳"}
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-orange-300">
            Kitchen Shift Complete
          </p>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            {getOutcomeLabel(result.outcome)}
          </h1>

          <p className="mt-3 text-white/50">
            {selectedOrder.name}
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-8">
          <ResultCard
            label="Earnings"
            value={`₦${result.cash.toLocaleString()}`}
            icon="💰"
          />

          <ResultCard
            label="Score"
            value={result.score.toLocaleString()}
            icon="🏆"
          />

          <ResultCard
            label="Satisfaction"
            value={`${result.customerSatisfaction}%`}
            icon="😍"
          />

          <ResultCard
            label="Chef Rank"
            value={result.rank}
            icon="👨🏾‍🍳"
          />
        </div>

        <div className="grid gap-3 px-5 pb-5 md:grid-cols-3 md:px-8 md:pb-8">
          <SmallResult
            label="Correct Steps"
            value={result.correctSteps}
          />

          <SmallResult
            label="Mistakes"
            value={result.mistakes}
          />

          <SmallResult
            label="Reputation"
            value={`+${result.reputation}`}
          />
        </div>

        <div className="border-t border-white/10 p-5 md:p-8">
          <button
            onClick={collectReward}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 text-lg font-black text-white shadow-lg shadow-orange-950/30 transition hover:scale-[1.01] hover:from-orange-400 hover:to-red-500"
          >
            💰 Collect ₦
            {result.cash.toLocaleString()} & Continue
          </button>
        </div>
      </section>
    );
  }

  if (screen === "orders") {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <button
              onClick={() => setScreen("kitchen")}
              className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white"
            >
              ← Kitchen
            </button>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
              Restaurant Contracts
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              Choose Your Order
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Bigger kitchens mean bigger rewards — and
              much bigger pressure.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase text-orange-300">
              Available Energy
            </p>

            <p className="mt-1 text-xl font-black">
              {player.energy}/{player.maxEnergy} ⚡
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => selectOrder(order)}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-orange-500/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-4xl">
                  {order.type === "breakfast"
                    ? "🥞"
                    : order.type === "street-food"
                      ? "🍢"
                      : order.type === "local-dish"
                        ? "🍛"
                        : order.type === "continental"
                          ? "🥩"
                          : order.type === "dessert"
                            ? "🍰"
                            : "🍽️"}
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${difficultyClass(
                    order.difficulty
                  )}`}
                >
                  {order.difficulty}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black">
                {order.name}
              </h2>

              <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/50">
                {order.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-black/20 p-3">
                  <span className="block text-white/35">
                    Reward
                  </span>

                  <span className="mt-1 block font-black text-emerald-300">
                    ₦{order.minReward.toLocaleString()}+
                  </span>
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  <span className="block text-white/35">
                    Customers
                  </span>

                  <span className="mt-1 block font-black">
                    {order.targetCustomers}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-xs font-black text-orange-400 transition group-hover:text-orange-300">
                Accept Kitchen Contract →
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl">
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-slate-950 to-red-950 p-6 md:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                ABUJA LIFE • CULINARY CAREER
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
                Restaurant Chef
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Build your reputation from a small kitchen
                to Abuja's most prestigious restaurants.
                Cook under pressure, satisfy customers and
                become a legendary chef.
              </p>
            </div>

            <div className="text-center">
              <div className="animate-bounce text-7xl md:text-8xl">
                👨🏾‍🍳
              </div>

              <p className="mt-2 text-xs font-black uppercase tracking-widest text-white/40">
                Chef Mode
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
            icon="🔪"
            title="Master the Kitchen"
            text="Prepare, chop, season, cook and plate dishes under pressure."
          />

          <FeatureCard
            icon="🔥"
            title="Handle Pressure"
            text="Every second matters when customers are waiting."
          />

          <FeatureCard
            icon="⭐"
            title="Build Your Name"
            text="Earn money, reputation and experience as your chef career grows."
          />
        </div>

        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🍽️</div>

            <div className="flex-1">
              <h2 className="font-black">
                Today's Kitchen Brief
              </h2>

              <p className="mt-1 text-sm leading-6 text-white/50">
                You have multiple restaurant contracts
                available. Start with a manageable kitchen
                or take on a high-stakes VIP contract for
                a much bigger payout.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen("orders")}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-5 text-lg font-black text-white shadow-xl shadow-orange-950/20 transition hover:scale-[1.01] hover:from-orange-400 hover:to-red-500"
        >
          🍳 View Restaurant Contracts
        </button>

        <p className="mt-3 text-center text-xs text-white/30">
          Each kitchen shift costs {ENERGY_COST} energy.
        </p>
      </div>
    </section>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white/90">
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

      <div className="mt-2 text-xl font-black text-white">
        {value}
      </div>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-orange-400/20">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-4 font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-white/45">
        {text}
      </p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-2xl">{icon}</div>

      <p className="mt-3 text-xs font-black uppercase tracking-wider text-white/35">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
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
