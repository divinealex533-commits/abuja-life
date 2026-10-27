"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BANK_SCENARIOS,
  BankAction,
  BankDifficulty,
  BankScenario,
  calculateBankResult,
  getActionOutcome,
  getBankShiftDuration,
  getRandomBankScenario,
} from "@/lib/game/bankManager";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

interface BankManagerPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState | null>
  >;
}

type Screen =
  | "lobby"
  | "briefing"
  | "shift"
  | "result";

const SHIFT_DIFFICULTY: BankDifficulty = "hard";

const ACTIONS: {
  id: BankAction;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "serve",
    label: "Serve",
    icon: "🤝",
    description: "Handle the customer normally.",
  },
  {
    id: "verify",
    label: "Verify",
    icon: "🪪",
    description: "Check identity and transaction details.",
  },
  {
    id: "investigate",
    label: "Investigate",
    icon: "🔎",
    description: "Investigate suspicious activity.",
  },
  {
    id: "loan",
    label: "Loan Decision",
    icon: "💳",
    description: "Review and decide on a loan.",
  },
  {
    id: "reject",
    label: "Reject",
    icon: "✋",
    description: "Decline the transaction.",
  },
  {
    id: "security",
    label: "Security",
    icon: "🚨",
    description: "Activate branch security procedures.",
  },
];

function formatMoney(value: number) {
  return `₦${Math.max(0, Math.round(value)).toLocaleString()}`;
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getScenarioAccent(type: BankScenario["type"]) {
  switch (type) {
    case "fraud":
      return "border-red-500/30 bg-red-500/10";
    case "security":
      return "border-orange-500/30 bg-orange-500/10";
    case "vip":
      return "border-yellow-400/30 bg-yellow-400/10";
    case "loan":
      return "border-blue-500/30 bg-blue-500/10";
    case "angry":
      return "border-pink-500/30 bg-pink-500/10";
    default:
      return "border-emerald-500/20 bg-emerald-500/10";
  }
}

function getScenarioIcon(type: BankScenario["type"]) {
  switch (type) {
    case "fraud":
      return "🕵️";
    case "security":
      return "🚨";
    case "vip":
      return "👑";
    case "loan":
      return "💳";
    case "angry":
      return "😤";
    case "withdrawal":
      return "💵";
    case "deposit":
      return "🏦";
    case "target":
      return "🎯";
    case "bonus":
      return "💎";
    default:
      return "👤";
  }
}

export default function BankManagerPanel({
  player,
  setPlayer,
}: BankManagerPanelProps) {
  const [screen, setScreen] = useState<Screen>("lobby");

  const [currentScenario, setCurrentScenario] =
    useState<BankScenario | null>(null);

  const [usedScenarioIds, setUsedScenarioIds] =
    useState<string[]>([]);

  const [difficulty] =
    useState<BankDifficulty>(SHIFT_DIFFICULTY);

  const [timeLeft, setTimeLeft] = useState(
    getBankShiftDuration(SHIFT_DIFFICULTY)
  );

  const [score, setScore] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);
  const [successfulDecisions, setSuccessfulDecisions] =
    useState(0);
  const [failedDecisions, setFailedDecisions] = useState(0);
  const [fraudStopped, setFraudStopped] = useState(0);
  const [loansApproved, setLoansApproved] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const [branchCash, setBranchCash] = useState(5000000);
  const [queue, setQueue] = useState(3);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
    cash: number;
  } | null>(null);

  const [processing, setProcessing] = useState(false);

  const [result, setResult] =
    useState<ReturnType<typeof calculateBankResult> | null>(
      null
    );

  const [playerName] = useState("Branch Manager");

  const shiftProgress = useMemo(() => {
    const total = getBankShiftDuration(difficulty);

    return Math.min(
      100,
      Math.max(0, ((total - timeLeft) / total) * 100)
    );
  }, [difficulty, timeLeft]);

  const startShift = () => {
    const firstScenario = getRandomBankScenario();

    setCurrentScenario(firstScenario);
    setUsedScenarioIds([firstScenario.id]);

    setTimeLeft(getBankShiftDuration(difficulty));

    setScore(0);
    setCustomersServed(0);
    setSuccessfulDecisions(0);
    setFailedDecisions(0);
    setFraudStopped(0);
    setLoansApproved(0);
    setTotalProcessed(0);

    setBranchCash(5000000);
    setQueue(3);

    setFeedback(null);
    setResult(null);

    setScreen("briefing");
  };

  const beginShift = () => {
    setScreen("shift");
  };

  const finishShift = () => {
    if (screen !== "shift") return;

    const finalResult = calculateBankResult({
      score,
      customersServed,
      successfulDecisions,
      failedDecisions,
      fraudStopped,
      loansApproved,
      totalProcessed,
      elapsedSeconds:
        getBankShiftDuration(difficulty) - timeLeft,
      difficulty,
    });

    setResult(finalResult);
    setScreen("result");
  };

  useEffect(() => {
    if (screen !== "shift") return;

    if (timeLeft <= 0) {
      finishShift();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, timeLeft]);

  const handleAction = (action: BankAction) => {
    if (!currentScenario || processing || timeLeft <= 0) {
      return;
    }

    setProcessing(true);

    const outcome = getActionOutcome(
      currentScenario,
      action
    );

    setCustomersServed((value) => value + 1);

    setScore((value) => value + outcome.score);

    setBranchCash((value) =>
      Math.max(0, value + outcome.cash)
    );

    setTotalProcessed(
      (value) => value + currentScenario.amount
    );

    if (outcome.correct) {
      setSuccessfulDecisions((value) => value + 1);

      if (currentScenario.type === "fraud") {
        setFraudStopped((value) => value + 1);
      }

      if (
        currentScenario.type === "loan" &&
        currentScenario.correctAction === "loan"
      ) {
        setLoansApproved((value) => value + 1);
      }
    } else {
      setFailedDecisions((value) => value + 1);
    }

    setFeedback({
      correct: outcome.correct,
      message: outcome.message,
      cash: outcome.cash,
    });

    window.setTimeout(() => {
      const next = getRandomBankScenario(
        [...usedScenarioIds, currentScenario.id]
      );

      setUsedScenarioIds((ids) => [
        ...ids,
        next.id,
      ]);

      setCurrentScenario(next);

      setQueue((value) =>
        Math.max(0, Math.min(8, value + (Math.random() > 0.65 ? 1 : 0)))
      );

      setFeedback(null);
      setProcessing(false);
    }, 1100);
  };

  const collectRewards = async () => {
    if (!result) return;

    const nextPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      reputation: player.reputation + result.reputation,
      energy: Math.max(0, player.energy - 20),
      currentJobId: "bank-manager",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(nextPlayer);

    await savePersistentPlayerState(nextPlayer);

    setScreen("lobby");
  };

  if (screen === "lobby") {
    return (
      <main className="min-h-screen bg-[#07080d] text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/70 via-[#0b1113] to-black shadow-2xl">
            <div className="relative p-6 sm:p-10">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  🏦 Abuja Life • Career
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
                  <div>
                    <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                      Bank Manager
                    </h1>

                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                      Run your own Abuja branch, handle customers,
                      approve loans, stop fraud and keep the bank
                      profitable.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <button
                        onClick={startShift}
                        disabled={player.energy < 20}
                        className="rounded-2xl bg-emerald-500 px-6 py-3.5 font-black text-black shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        🏦 Start Bank Shift
                      </button>

                      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          Energy Required
                        </div>
                        <div className="mt-1 font-black">
                          20 ⚡
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                      Your Manager
                    </div>

                    <div className="mt-5 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-3xl">
                        👔
                      </div>

                      <div>
                        <div className="font-black">
                          {playerName}
                        </div>
                        <div className="text-sm text-white/40">
                          Abuja Branch
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-[10px] uppercase text-white/40">
                          Cash
                        </div>
                        <div className="mt-1 font-black">
                          {formatMoney(player.cash)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-[10px] uppercase text-white/40">
                          Energy
                        </div>
                        <div className="mt-1 font-black">
                          {player.energy} ⚡
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["👥", "Customer Service", "Keep the queue moving"],
              ["🔎", "Fraud Detection", "Protect branch funds"],
              ["💳", "Loan Management", "Make smart decisions"],
              ["🚨", "Branch Security", "Respond to emergencies"],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="text-2xl">{icon}</div>
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
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div>
                <div className="font-bold text-yellow-200">
                  Manager Tip
                </div>
                <p className="mt-1 text-sm leading-6 text-white/50">
                  Fast decisions matter, but reckless decisions
                  can cost the branch millions. Watch for fraud,
                  verify large transactions and protect your
                  reputation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "briefing" && currentScenario) {
    return (
      <main className="min-h-screen bg-[#07080d] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0c1012] shadow-2xl">
            <div className="border-b border-white/10 bg-emerald-500/5 p-6 sm:p-8">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Morning Briefing
              </div>

              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                Welcome to your branch.
              </h1>

              <p className="mt-3 max-w-2xl text-white/50">
                Your shift starts now. Customers are waiting,
                transactions are coming in and the branch has
                targets to hit.
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
              <div className="rounded-2xl bg-white/5 p-5">
                <div className="text-xs uppercase text-white/40">
                  Shift
                </div>
                <div className="mt-2 text-2xl font-black">
                  {formatTime(
                    getBankShiftDuration(difficulty)
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-5">
                <div className="text-xs uppercase text-white/40">
                  Difficulty
                </div>
                <div className="mt-2 text-2xl font-black capitalize">
                  {difficulty}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-5">
                <div className="text-xs uppercase text-white/40">
                  Starting Queue
                </div>
                <div className="mt-2 text-2xl font-black">
                  3 Customers
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() => setScreen("lobby")}
                className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Back
              </button>

              <button
                onClick={beginShift}
                className="rounded-2xl bg-emerald-500 px-7 py-3 font-black text-black transition hover:bg-emerald-400"
              >
                Start Shift →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "shift" && currentScenario) {
    return (
      <main className="min-h-screen bg-[#050608] text-white">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
          <header className="mb-4 rounded-2xl border border-white/10 bg-[#0b0e10] p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Abuja Branch • Live Shift
                </div>

                <div className="mt-1 text-xl font-black">
                  Bank Manager
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/35">
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
                  <div className="text-[9px] uppercase text-white/35">
                    Score
                  </div>
                  <div className="font-black text-emerald-300">
                    {score}
                  </div>
                </div>

                <div className="rounded-xl bg-white/5 px-4 py-2">
                  <div className="text-[9px] uppercase text-white/35">
                    Queue
                  </div>
                  <div className="font-black">
                    {queue}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${shiftProgress}%`,
                }}
              />
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0d0f] shadow-2xl">
              <div className="border-b border-white/10 p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-white/35">
                      Customer Request
                    </div>

                    <h1 className="mt-2 text-2xl font-black sm:text-4xl">
                      {currentScenario.title}
                    </h1>
                  </div>

                  <div
                    className={`rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wider ${getScenarioAccent(
                      currentScenario.type
                    )}`}
                  >
                    {getScenarioIcon(
                      currentScenario.type
                    )}{" "}
                    {currentScenario.type}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 text-5xl">
                    {getScenarioIcon(
                      currentScenario.type
                    )}
                  </div>

                  <div>
                    <div className="text-xl font-black">
                      {currentScenario.customer}
                    </div>

                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                      {currentScenario.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-[9px] uppercase tracking-wider text-white/35">
                          Amount
                        </div>
                        <div className="mt-1 font-black">
                          {formatMoney(
                            currentScenario.amount
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-[9px] uppercase tracking-wider text-white/35">
                          Risk
                        </div>
                        <div className="mt-1 font-black capitalize">
                          {currentScenario.difficulty}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 p-4">
                        <div className="text-[9px] uppercase tracking-wider text-white/35">
                          Potential
                        </div>
                        <div className="mt-1 font-black text-emerald-300">
                          {formatMoney(
                            currentScenario.reward
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`mt-6 rounded-2xl border p-5 ${
                      feedback.correct
                        ? "border-emerald-400/20 bg-emerald-400/10"
                        : "border-red-400/20 bg-red-400/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {feedback.correct
                          ? "✅"
                          : "⚠️"}
                      </div>

                      <div>
                        <div className="font-black">
                          {feedback.correct
                            ? "Good Decision"
                            : "Wrong Decision"}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-white/60">
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
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest text-white/35">
                    Manager Decision
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() =>
                          handleAction(action.id)
                        }
                        disabled={processing}
                        className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-emerald-400/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
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
              <div className="rounded-3xl border border-white/10 bg-[#0a0d0f] p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-white/35">
                  Branch Dashboard
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/45">
                      Branch Funds
                    </span>
                    <span className="font-black">
                      {formatMoney(branchCash)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/45">
                      Customers
                    </span>
                    <span className="font-black">
                      {customersServed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/45">
                      Successful
                    </span>
                    <span className="font-black text-emerald-300">
                      {successfulDecisions}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/45">
                      Mistakes
                    </span>
                    <span className="font-black text-red-300">
                      {failedDecisions}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-red-500/10 bg-red-500/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <span>🚨</span>
                  <span className="text-xs font-black uppercase tracking-widest text-red-300">
                    Security
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  Fraudulent transactions can drain the
                  branch. Investigate suspicious activity
                  before approving large transfers.
                </p>
              </div>

              <button
                onClick={finishShift}
                disabled={processing}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                End Shift Early
              </button>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "result" && result) {
    return (
      <main className="min-h-screen bg-[#07080d] text-white">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-8">
          <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f10] shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-500/15 via-transparent to-blue-500/10 p-6 text-center sm:p-10">
              <div className="text-5xl">🏦</div>

              <div className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                Shift Complete
              </div>

              <h1 className="mt-3 text-4xl font-black sm:text-6xl">
                {result.rank}
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-white/50">
                {result.message}
              </p>

              <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-400/20 bg-emerald-400/10">
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

            <div className="grid grid-cols-2 gap-px border-y border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                ["Customers", result.customersServed],
                ["Correct", result.successfulDecisions],
                ["Fraud Stopped", result.fraudStopped],
                ["Rating", `${result.branchRating}/5`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="bg-[#0b0f10] p-5 text-center"
                >
                  <div className="text-2xl font-black">
                    {value}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
                <div className="text-xs uppercase tracking-wider text-white/35">
                  Shift Earnings
                </div>
                <div className="mt-2 text-3xl font-black text-emerald-300">
                  +{formatMoney(result.cash)}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.06] p-5">
                <div className="text-xs uppercase tracking-wider text-white/35">
                  Reputation
                </div>
                <div className="mt-2 text-3xl font-black text-blue-300">
                  +{result.reputation}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-6 sm:flex-row sm:justify-end sm:p-8">
              <button
                onClick={() => setScreen("lobby")}
                className="rounded-2xl border border-white/10 px-6 py-3 font-bold text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                Back to Bank
              </button>

              <button
                onClick={collectRewards}
                className="rounded-2xl bg-emerald-500 px-7 py-3 font-black text-black transition hover:bg-emerald-400"
              >
                Collect ₦
                {result.cash.toLocaleString()} →
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
