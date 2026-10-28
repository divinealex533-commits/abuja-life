"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateWigRevamperResult,
  getAllWigOrders,
  getWigActionLabel,
  getWigActionOutcome,
  type WigAction,
  type WigOrder,
  type WigRevamperResult,
} from "@/lib/game/wigRevamper";
import {
  loadPersistentPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

const ENERGY_COST = 22;

type Screen = "base" | "orders" | "briefing" | "game" | "result";

const actionIcons: Record<WigAction, string> = {
  inspect: "🔍",
  wash: "🧴",
  condition: "💧",
  detangle: "🪮",
  "deep-treatment": "✨",
  "repair-lace": "🧵",
  "fix-shedding": "🧶",
  "color-correction": "🎨",
  "bleach-lace": "🧪",
  plucking: "✂️",
  "style-wig": "💇🏾‍♀️",
  "curl-wig": "🌀",
  "straighten-wig": "📏",
  "trim-wig": "✂️",
  "install-wig": "👑",
  "quality-check": "✅",
  package: "📦",
};

const problemLabels: Record<WigOrder["problem"], string> = {
  tangled: "Tangled",
  dry: "Dry / Dehydrated",
  shedding: "Shedding",
  "damaged-lace": "Damaged Lace",
  "bad-color": "Bad Colour",
  frizzy: "Frizzy",
  "old-style": "Old Style",
  dirty: "Dirty",
};

const wigTypeLabels: Record<WigOrder["wigType"], string> = {
  "human-hair": "Human Hair",
  frontal: "Frontal",
  closure: "Closure",
  bob: "Bob",
  "bone-straight": "Bone Straight",
  curly: "Curly",
  "water-wave": "Water Wave",
  colored: "Coloured Wig",
  luxury: "Luxury Wig",
};

const difficultyStyles: Record<WigOrder["difficulty"], string> = {
  easy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  medium: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  hard: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  extreme: "border-red-400/30 bg-red-400/10 text-red-300",
};

export default function WigRevamperPanel() {
  const orders = useMemo(() => getAllWigOrders(), []);

  const [screen, setScreen] = useState<Screen>("base");
  const [player, setPlayer] = useState<PlayerGameState | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WigOrder | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctActions, setCorrectActions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activityLog, setActivityLog] = useState<string[]>([]);
  const [result, setResult] = useState<WigRevamperResult | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const finishedRef = useRef(false);

  useEffect(() => {
    setPlayer(loadPersistentPlayerState());
  }, []);

  const currentRequiredAction =
    selectedOrder?.requiredSteps[currentStep] ?? null;

  const progress =
    selectedOrder && selectedOrder.requiredSteps.length > 0
      ? Math.min(
          100,
          Math.round(
            (currentStep / selectedOrder.requiredSteps.length) * 100
          )
        )
      : 0;

  useEffect(() => {
    if (screen !== "game" || !selectedOrder || finishedRef.current) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);

          if (!finishedRef.current) {
            window.setTimeout(() => {
              finishOrder();
            }, 0);
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, selectedOrder]);

  function startOrder(order: WigOrder) {
    if (!player) {
      return;
    }

    if (player.energy < ENERGY_COST) {
      setActivityLog([
        `You need ${ENERGY_COST} energy to take a wig order.`,
      ]);
      return;
    }

    setSelectedOrder(order);
    setCurrentStep(0);
    setScore(0);
    setMistakes(0);
    setCorrectActions(0);
    setTimeLeft(order.deadlineSeconds);
    setActivityLog([
      `New order received from ${order.customerName}.`,
      `Problem detected: ${problemLabels[order.problem]}.`,
      `Start with ${getWigActionLabel(order.requiredSteps[0])}.`,
    ]);
    setResult(null);
    setIsFinishing(false);
    finishedRef.current = false;
    setScreen("briefing");
  }

  function beginWork() {
    if (!selectedOrder) {
      return;
    }

    finishedRef.current = false;
    setScreen("game");
    setActivityLog((previous) => [
      ...previous,
      "Studio session started. Work carefully!",
    ]);
  }

  function chooseAction(action: WigAction) {
    if (
      !selectedOrder ||
      screen !== "game" ||
      finishedRef.current ||
      isFinishing
    ) {
      return;
    }

    const expected = selectedOrder.requiredSteps[currentStep];

    const outcome = getWigActionOutcome(
      selectedOrder,
      action,
      currentStep
    );

    if (action === expected) {
      setScore((previous) => previous + outcome.score);
      setCorrectActions((previous) => previous + 1);

      setActivityLog((previous) => [
        ...previous,
        `✅ ${getWigActionLabel(action)} — ${outcome.message}`,
      ]);

      const nextStep = currentStep + 1;

      if (nextStep >= selectedOrder.requiredSteps.length) {
        setCurrentStep(nextStep);

        window.setTimeout(() => {
          finishOrder();
        }, 350);

        return;
      }

      setCurrentStep(nextStep);

      setActivityLog((previous) => [
        ...previous,
        `Next: ${getWigActionLabel(
          selectedOrder.requiredSteps[nextStep]
        )}.`,
      ]);

      return;
    }

    setMistakes((previous) => previous + 1);
    setScore((previous) => Math.max(0, previous + outcome.score));

    setActivityLog((previous) => [
      ...previous,
      `⚠️ ${getWigActionLabel(action)} — ${outcome.message}`,
    ]);
  }

  function finishOrder() {
    if (
      finishedRef.current ||
      !selectedOrder ||
      isFinishing
    ) {
      return;
    }

    finishedRef.current = true;
    setIsFinishing(true);

    const finalResult = calculateWigRevamperResult({
      order: selectedOrder,
      score,
      correctActions,
      mistakes,
      ordersCompleted: 1,
    });

    setResult(finalResult);

    if (player) {
      const updatedPlayer: PlayerGameState = {
        ...player,
        cash: player.cash + finalResult.cash,
        energy: Math.max(0, player.energy - ENERGY_COST),
        reputation: Math.max(
          0,
          player.reputation + finalResult.reputation
        ),
        currentJobId: "wig-revamper",
        jobExperience:
          player.jobExperience + finalResult.xp,
      };

      setPlayer(updatedPlayer);
      savePlayerState(updatedPlayer);
    }

    setScreen("result");
    setIsFinishing(false);
  }

  function resetStudio() {
    setSelectedOrder(null);
    setResult(null);
    setCurrentStep(0);
    setScore(0);
    setMistakes(0);
    setCorrectActions(0);
    setTimeLeft(0);
    setActivityLog([]);
    setIsFinishing(false);
    finishedRef.current = false;
    setScreen("base");
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  if (!player) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
          <p className="text-sm text-zinc-400">
            Opening your wig studio...
          </p>
        </div>
      </div>
    );
  }

  if (screen === "base") {
    return (
      <div className="overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-zinc-950 via-purple-950/30 to-black shadow-2xl shadow-fuchsia-950/20">
        <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-fuchsia-300">
                Beauty Business
              </span>

              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                WIG STUDIO
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Wig Revamper
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Restore damaged wigs, repair lace, fix shedding,
              customize colours and deliver premium Abuja beauty
              orders.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              <StatCard
                label="Job XP"
                value={player.jobExperience.toLocaleString()}
                icon="🏆"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
          <button
            type="button"
            onClick={() => setScreen("orders")}
            className="group rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-6 text-left transition hover:-translate-y-1 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/15"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-2xl">
              💇🏾‍♀️
            </div>

            <h2 className="text-xl font-black text-white">
              View Wig Orders
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Choose a customer order and start revamping.
            </p>

            <div className="mt-5 text-sm font-bold text-fuchsia-300">
              Open orders →
            </div>
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
              👑
            </div>

            <h2 className="text-xl font-black text-white">
              Premium Studio
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Take higher-value Maitama, Asokoro and VIP orders
              to grow your reputation and earnings.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniStat label="Best Orders" value="₦60K+" />
              <MiniStat label="Energy / Order" value="22" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "orders") {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={resetStudio}
              className="mb-4 text-sm font-semibold text-zinc-500 transition hover:text-white"
            >
              ← Back to studio
            </button>

            <h1 className="text-3xl font-black text-white">
              Wig Orders
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Choose the order you want to work on.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Energy
            </p>
            <p className="mt-1 font-black text-white">
              {player.energy}/{player.maxEnergy}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-fuchsia-400/30 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
                    {order.location}
                  </p>

                  <h2 className="mt-2 text-xl font-black text-white">
                    {order.title}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-400">
                    Customer: {order.customerName}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${difficultyStyles[order.difficulty]}`}
                >
                  {order.difficulty}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <InfoChip
                  label="Wig"
                  value={wigTypeLabels[order.wigType]}
                />
                <InfoChip
                  label="Problem"
                  value={problemLabels[order.problem]}
                />
                <InfoChip
                  label="Reward"
                  value={`₦${order.rewardMax.toLocaleString()}`}
                />
                <InfoChip
                  label="Time"
                  value={formatTime(order.deadlineSeconds)}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-500">
                {order.description}
              </p>

              <button
                type="button"
                onClick={() => startOrder(order)}
                disabled={player.energy < ENERGY_COST}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-3 text-sm font-black text-white transition hover:from-fuchsia-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {player.energy < ENERGY_COST
                  ? `Need ${ENERGY_COST} Energy`
                  : "Take This Order →"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedOrder) {
    return (
      <div className="rounded-3xl border border-fuchsia-400/20 bg-zinc-950 p-5 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setScreen("orders")}
          className="mb-6 text-sm font-semibold text-zinc-500 transition hover:text-white"
        >
          ← Back to orders
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
              Client Briefing
            </span>

            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {selectedOrder.title}
            </h1>

            <p className="mt-2 text-zinc-400">
              {selectedOrder.customerName} • {selectedOrder.location}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Customer Request
              </p>

              <p className="mt-3 text-sm leading-7 text-zinc-300">
                {selectedOrder.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoChip
                  label="Wig Type"
                  value={wigTypeLabels[selectedOrder.wigType]}
                />
                <InfoChip
                  label="Problem"
                  value={problemLabels[selectedOrder.problem]}
                />
                <InfoChip
                  label="Reward"
                  value={`₦${selectedOrder.rewardMin.toLocaleString()} - ₦${selectedOrder.rewardMax.toLocaleString()}`}
                />
                <InfoChip
                  label="Deadline"
                  value={formatTime(selectedOrder.deadlineSeconds)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
              Required Workflow
            </p>

            <div className="mt-4 space-y-2">
              {selectedOrder.requiredSteps.map((step, index) => (
                <div
                  key={`${step}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-xs font-black text-fuchsia-300">
                    {index + 1}
                  </span>

                  <span className="text-sm text-zinc-200">
                    {actionIcons[step]} {getWigActionLabel(step)}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={beginWork}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-4 font-black text-white transition hover:from-fuchsia-500 hover:to-purple-500"
            >
              Start Revamp ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "game" && selectedOrder) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-4">
          <GameStat
            label="Time"
            value={formatTime(timeLeft)}
            danger={timeLeft <= 20}
          />
          <GameStat
            label="Progress"
            value={`${progress}%`}
          />
          <GameStat
            label="Score"
            value={score.toLocaleString()}
          />
          <GameStat
            label="Mistakes"
            value={mistakes.toString()}
            danger={mistakes > 2}
          />
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 p-5">
            <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
              Current Client
            </span>

            <h2 className="mt-2 text-2xl font-black text-white">
              {selectedOrder.customerName}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {selectedOrder.location}
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Wig</p>
                <p className="mt-1 font-bold text-white">
                  {wigTypeLabels[selectedOrder.wigType]}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Problem</p>
                <p className="mt-1 font-bold text-white">
                  {problemLabels[selectedOrder.problem]}
                </p>
              </div>

              <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                <p className="text-xs text-cyan-300">
                  Next Required Step
                </p>

                <p className="mt-1 font-black text-white">
                  {currentRequiredAction
                    ? `${actionIcons[currentRequiredAction]} ${getWigActionLabel(currentRequiredAction)}`
                    : "Finishing..."}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Studio Log
              </p>

              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {activityLog.slice(-8).map((message, index) => (
                  <p
                    key={`${message}-${index}`}
                    className="text-xs leading-5 text-zinc-400"
                  >
                    {message}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  Beauty Tools
                </h2>
                <p className="text-sm text-zinc-500">
                  Choose the correct next treatment.
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-500">
                Step {Math.min(
                  currentStep + 1,
                  selectedOrder.requiredSteps.length
                )} / {selectedOrder.requiredSteps.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from(
                new Set(selectedOrder.requiredSteps)
              ).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => chooseAction(action)}
                  disabled={isFinishing || finishedRef.current}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-xl transition group-hover:bg-fuchsia-500/15">
                    {actionIcons[action]}
                  </div>

                  <p className="mt-3 text-sm font-bold text-white">
                    {getWigActionLabel(action)}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-4">
              <p className="text-xs leading-5 text-yellow-200/70">
                💡 Follow the customer's required treatment order.
                Wrong treatments create mistakes and can reduce your
                final payout.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "result" && selectedOrder && result) {
    return (
      <div className="overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-zinc-950 shadow-2xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 p-6 text-center sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 text-4xl">
            {result.outcome === "legendary"
              ? "👑"
              : result.outcome === "excellent"
                ? "✨"
                : result.outcome === "good"
                  ? "💎"
                  : result.outcome === "mixed"
                    ? "🛠️"
                    : result.outcome === "poor"
                      ? "😮‍💨"
                      : "💥"}
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-fuchsia-300">
            Order Complete
          </p>

          <h1 className="mt-2 text-4xl font-black uppercase text-white">
            {result.outcome}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            {result.message}
          </p>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-4 sm:p-8">
          <RewardCard
            label="Earned"
            value={`₦${result.cash.toLocaleString()}`}
            icon="💰"
          />
          <RewardCard
            label="Reputation"
            value={`+${result.reputation}`}
            icon="⭐"
          />
          <RewardCard
            label="XP"
            value={`+${result.xp}`}
            icon="🏆"
          />
          <RewardCard
            label="Score"
            value={result.score.toLocaleString()}
            icon="🎯"
          />
        </div>

        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 sm:px-8 sm:pb-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Studio Performance
            </p>

            <div className="mt-4 space-y-3">
              <ResultRow
                label="Correct Actions"
                value={correctActions.toString()}
              />
              <ResultRow
                label="Mistakes"
                value={mistakes.toString()}
              />
              <ResultRow
                label="Orders Completed"
                value={result.ordersCompleted.toString()}
              />
              <ResultRow
                label="New Rank"
                value={result.rank}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/5 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
              Career Progress
            </p>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Your wig studio reputation has been updated. Keep
              completing premium orders to unlock the higher levels
              of the beauty business.
            </p>

            <button
              type="button"
              onClick={() => setScreen("orders")}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-3 font-black text-white transition hover:from-fuchsia-500 hover:to-purple-500"
            >
              Take Another Order
            </button>

            <button
              type="button"
              onClick={resetStudio}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Back to Wig Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="mt-2 text-sm font-black text-white">
        {value}
      </p>
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
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function GameStat({
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
          ? "border-red-400/30 bg-red-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-black ${
          danger ? "text-red-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RewardCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-right text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}
