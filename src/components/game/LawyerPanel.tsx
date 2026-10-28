"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LawyerAction,
  LawyerCase,
  LawyerScenario,
  calculateLawyerResult,
  getAllLawyerCases,
  getLawyerActionOutcome,
  getLawyerFailureMessage,
  getLawyerResponseTime,
  getLawyerSuccessMessage,
  getRandomLawyerScenario,
} from "@/lib/game/lawyer";
import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

interface LawyerPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<
    React.SetStateAction<PlayerGameState>
  >;
}

type Screen =
  | "office"
  | "cases"
  | "briefing"
  | "courtroom"
  | "result";

const ENERGY_COST = 22;

const ACTION_LABELS: Record<LawyerAction, string> = {
  "review-evidence": "Review Evidence",
  "question-witness": "Question Witness",
  "cross-examine": "Cross-Examine",
  object: "Raise Objection",
  "present-evidence": "Present Evidence",
  "make-opening": "Opening Argument",
  "make-closing": "Closing Argument",
  negotiate: "Negotiate Settlement",
  challenge: "Challenge Testimony",
  "protect-client": "Protect Client",
};

const ACTION_ICONS: Record<LawyerAction, string> = {
  "review-evidence": "🔎",
  "question-witness": "👤",
  "cross-examine": "⚔️",
  object: "🚨",
  "present-evidence": "📂",
  "make-opening": "📝",
  "make-closing": "⚖️",
  negotiate: "🤝",
  challenge: "🛡️",
  "protect-client": "🧑‍⚖️",
};

const ACTIONS: LawyerAction[] = [
  "review-evidence",
  "question-witness",
  "cross-examine",
  "object",
  "present-evidence",
  "make-opening",
  "make-closing",
  "negotiate",
  "challenge",
  "protect-client",
];

function difficultyClasses(
  difficulty: LawyerCase["difficulty"]
) {
  switch (difficulty) {
    case "easy":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "medium":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "hard":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";
    case "extreme":
      return "border-red-400/20 bg-red-400/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

function caseTypeIcon(type: LawyerCase["type"]) {
  switch (type) {
    case "criminal":
      return "🚔";
    case "civil":
      return "🏛️";
    case "business":
      return "💼";
    case "property":
      return "🏠";
    case "family":
      return "👨‍👩‍👧";
    case "corruption":
      return "💰";
    default:
      return "⚖️";
  }
}

export default function LawyerPanel({
  player,
  setPlayer,
}: LawyerPanelProps) {
  const [screen, setScreen] = useState<Screen>("office");
  const [selectedCase, setSelectedCase] =
    useState<LawyerCase | null>(null);

  const [scenario, setScenario] =
    useState<LawyerScenario | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);
  const [responseTime, setResponseTime] = useState(6500);

  const [score, setScore] = useState(0);
  const [caseStrength, setCaseStrength] = useState(50);
  const [clientConfidence, setClientConfidence] =
    useState(60);

  const [successfulActions, setSuccessfulActions] =
    useState(0);
  const [failedActions, setFailedActions] = useState(0);
  const [evidenceUsed, setEvidenceUsed] = useState(0);
  const [witnessesHandled, setWitnessesHandled] =
    useState(0);
  const [objectionsWon, setObjectionsWon] = useState(0);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  const [result, setResult] =
    useState<ReturnType<typeof calculateLawyerResult> | null>(
      null
    );

  const [history, setHistory] = useState<
    {
      action: LawyerAction;
      success: boolean;
      message: string;
    }[]
  >([]);

  const cases = useMemo(
    () => getAllLawyerCases(),
    []
  );

  const resetCase = () => {
    setScenario(null);
    setTimeLeft(0);
    setScore(0);
    setCaseStrength(50);
    setClientConfidence(60);
    setSuccessfulActions(0);
    setFailedActions(0);
    setEvidenceUsed(0);
    setWitnessesHandled(0);
    setObjectionsWon(0);
    setMessage("");
    setHistory([]);
    setResult(null);
    setBusy(false);
  };

  const selectCase = (legalCase: LawyerCase) => {
    resetCase();
    setSelectedCase(legalCase);
    setScreen("briefing");
  };

  const startCase = () => {
    if (!selectedCase) return;

    if (player.energy < ENERGY_COST) {
      setMessage(
        `You need ${ENERGY_COST} energy to take a case.`
      );
      setMessageType("error");
      return;
    }

    setMessage("");
    setScreen("courtroom");

    const nextScenario =
      getRandomLawyerScenario(selectedCase);

    setScenario(nextScenario);
    setTimeLeft(selectedCase.timeLimit);
    setResponseTime(
      getLawyerResponseTime(selectedCase.difficulty)
    );
  };

  const finishCase = async () => {
    if (!selectedCase || result) return;

    const finalResult = calculateLawyerResult({
      legalCase: selectedCase,
      score,
      clientConfidence,
      caseStrength,
      successfulActions,
      failedActions,
      evidenceUsed,
      witnessesHandled,
      objectionsWon,
      timeRemaining: Math.max(0, timeLeft),
    });

    setResult(finalResult);
    setScreen("result");
    setBusy(false);
  };

  useEffect(() => {
    if (
      screen !== "courtroom" ||
      !selectedCase ||
      result ||
      busy
    ) {
      return;
    }

    if (timeLeft <= 0) {
      void finishCase();
      return;
    }

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
  }, [
    screen,
    selectedCase,
    result,
    busy,
    timeLeft,
  ]);

  const triggerScenario = () => {
    if (!selectedCase) return;

    const nextScenario =
      getRandomLawyerScenario(selectedCase);

    setScenario(nextScenario);
    setResponseTime(
      getLawyerResponseTime(selectedCase.difficulty)
    );
    setBusy(false);
  };

  const performAction = async (
    action: LawyerAction
  ) => {
    if (
      !selectedCase ||
      !scenario ||
      busy ||
      result
    ) {
      return;
    }

    setBusy(true);

    const outcome = getLawyerActionOutcome(
      scenario,
      action
    );

    const correct = outcome.correct;

    const newStrength = Math.max(
      0,
      Math.min(
        100,
        caseStrength + outcome.legalImpact
      )
    );

    const newConfidence = Math.max(
      0,
      Math.min(
        100,
        clientConfidence + outcome.clientImpact
      )
    );

    setCaseStrength(newStrength);
    setClientConfidence(newConfidence);

    if (correct) {
      setSuccessfulActions((value) => value + 1);
      setScore((value) => value + outcome.reward);

      if (
        action === "review-evidence" ||
        action === "present-evidence"
      ) {
        setEvidenceUsed((value) => value + 1);
      }

      if (
        action === "question-witness" ||
        action === "cross-examine"
      ) {
        setWitnessesHandled((value) => value + 1);
      }

      if (action === "object") {
        setObjectionsWon((value) => value + 1);
      }

      setMessage(
        getLawyerSuccessMessage(action)
      );
      setMessageType("success");
    } else {
      setFailedActions((value) => value + 1);

      setMessage(
        getLawyerFailureMessage(action)
      );
      setMessageType("error");
    }

    setHistory((items) => [
      ...items,
      {
        action,
        success: correct,
        message: correct
          ? getLawyerSuccessMessage(action)
          : getLawyerFailureMessage(action),
      },
    ]);

    await new Promise((resolve) =>
      window.setTimeout(resolve, 500)
    );

    triggerScenario();
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
      currentJobId: "lawyer",
      jobExperience:
        player.jobExperience + result.score,
    };

    setPlayer(updatedPlayer);
    await savePersistentPlayerState(
      updatedPlayer
    );

    setScreen("office");
    setSelectedCase(null);
    resetCase();
  };

  const abandonCase = () => {
    if (!selectedCase) return;

    setResult(null);
    setSelectedCase(null);
    resetCase();
    setScreen("office");
  };

  const resultEmoji = result
    ? {
        victory: "🏆",
        "partial-victory": "⚖️",
        settlement: "🤝",
        loss: "💔",
      }[result.caseOutcome]
    : "⚖️";

  const resultTitle = result
    ? {
        victory: "CASE WON",
        "partial-victory": "STRONG RESULT",
        settlement: "SETTLEMENT REACHED",
        loss: "CASE LOST",
      }[result.caseOutcome]
    : "";

  return (
    <main className="min-h-screen bg-[#07080c] text-white">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/80 via-[#11131b] to-[#090a0e] p-5 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl ring-1 ring-indigo-400/20">
                  ⚖️
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300">
                    Abuja Life Legal Division
                  </p>

                  <h1 className="text-2xl font-black sm:text-3xl">
                    LAWYER
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-sm text-white/50">
                Build your legal career through evidence,
                courtroom strategy, witness questioning and
                high-stakes negotiations.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Cash
                </p>
                <p className="mt-1 text-sm font-black text-emerald-300">
                  ₦{player.cash.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Energy
                </p>
                <p className="mt-1 text-sm font-black text-amber-300">
                  {player.energy}/{player.maxEnergy}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-wider text-white/35">
                  Rep
                </p>
                <p className="mt-1 text-sm font-black text-indigo-300">
                  {player.reputation}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* OFFICE */}
        {screen === "office" && (
          <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
                    Chambers
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Your Legal Practice
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
                    Your reputation grows with every smart
                    decision. Take cases, build your record
                    and become Abuja's most respected advocate.
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-indigo-400/10 px-4 py-3 text-center ring-1 ring-indigo-400/10 sm:block">
                  <p className="text-2xl">⚖️</p>
                  <p className="mt-1 text-[10px] font-black uppercase text-indigo-300">
                    Counsel
                  </p>
                </div>
              </div>

              <button
                onClick={() => setScreen("cases")}
                className="group w-full rounded-2xl bg-indigo-500 px-5 py-4 text-left font-black transition hover:bg-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg">
                      Browse Court Cases
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Choose your next client and enter the
                      courtroom.
                    </p>
                  </div>

                  <span className="text-2xl transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                Career Profile
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/35">
                    Legal Experience
                  </p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {player.currentJobId === "lawyer"
                      ? player.jobExperience.toLocaleString()
                      : "0"} XP
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/35">
                    Reputation
                  </p>
                  <p className="mt-1 text-2xl font-black text-indigo-300">
                    {player.reputation}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs text-white/35">
                    Case Energy Cost
                  </p>
                  <p className="mt-1 text-2xl font-black text-amber-300">
                    {ENERGY_COST}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CASE BOARD */}
        {screen === "cases" && (
          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
                  Case Board
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Available Cases
                </h2>
              </div>

              <button
                onClick={() => setScreen("office")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ← Chambers
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cases.map((legalCase) => (
                <button
                  key={legalCase.id}
                  onClick={() => selectCase(legalCase)}
                  className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-indigo-500/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                      {caseTypeIcon(
                        legalCase.type
                      )}
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${difficultyClasses(
                        legalCase.difficulty
                      )}`}
                    >
                      {legalCase.difficulty}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    {legalCase.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/45">
                    {legalCase.description}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/30">
                        Client
                      </p>
                      <p className="mt-1 truncate text-xs font-bold">
                        {legalCase.client}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <p className="text-[10px] uppercase text-white/30">
                        Court
                      </p>
                      <p className="mt-1 truncate text-xs font-bold">
                        {legalCase.court}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs font-bold text-white/40">
                      Up to
                    </span>

                    <span className="text-sm font-black text-emerald-300">
                      ₦{legalCase.maxReward.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-4 text-xs font-black text-indigo-300 opacity-70 transition group-hover:opacity-100">
                    Review case →
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* BRIEFING */}
        {screen === "briefing" &&
          selectedCase && (
            <section className="mx-auto max-w-4xl">
              <button
                onClick={() => setScreen("cases")}
                className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
              >
                ← Case Board
              </button>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/50 to-white/[0.03]">
                <div className="border-b border-white/10 p-6 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-3xl">
                          {caseTypeIcon(
                            selectedCase.type
                          )}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${difficultyClasses(
                            selectedCase.difficulty
                          )}`}
                        >
                          {selectedCase.difficulty} case
                        </span>
                      </div>

                      <h2 className="text-3xl font-black">
                        {selectedCase.title}
                      </h2>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                        {selectedCase.description}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4 text-center">
                      <p className="text-[10px] font-black uppercase text-white/35">
                        Potential Fee
                      </p>
                      <p className="mt-1 text-xl font-black text-emerald-300">
                        ₦
                        {selectedCase.maxReward.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Client
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {selectedCase.client}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Opponent
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {selectedCase.opponent}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Witnesses
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {selectedCase.witnesses}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Evidence
                    </p>
                    <p className="mt-1 text-sm font-black">
                      {selectedCase.evidenceCount}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 p-6 sm:p-8">
                  <div className="mb-5 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
                    <div className="flex gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-sm font-black text-amber-300">
                          Courtroom Warning
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/45">
                          Every decision affects the strength
                          of your case and your client's
                          confidence in you.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startCase}
                    disabled={
                      player.energy < ENERGY_COST
                    }
                    className="w-full rounded-2xl bg-indigo-500 px-5 py-4 font-black transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {player.energy < ENERGY_COST
                      ? `Need ${ENERGY_COST} Energy`
                      : `Enter Courtroom • ${ENERGY_COST} Energy`}
                  </button>
                </div>
              </div>
            </section>
          )}

        {/* COURTROOM */}
        {screen === "courtroom" &&
          selectedCase &&
          scenario && (
            <section>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
                    In Session
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {selectedCase.title}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                    <span className="text-[10px] uppercase text-white/30">
                      Court
                    </span>
                    <p className="text-xs font-black">
                      {selectedCase.court}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl border px-4 py-2 ${
                      timeLeft <= 20
                        ? "border-red-400/30 bg-red-400/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span className="text-[10px] uppercase text-white/30">
                      Time
                    </span>
                    <p
                      className={`text-xs font-black ${
                        timeLeft <= 20
                          ? "text-red-300"
                          : "text-white"
                      }`}
                    >
                      {timeLeft}s
                    </p>
                  </div>
                </div>
              </div>

              {/* COURTROOM METERS */}
              <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-white/35">
                      Case Strength
                    </span>
                    <span className="text-xs font-black text-indigo-300">
                      {caseStrength}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all"
                      style={{
                        width: `${caseStrength}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-white/35">
                      Client Confidence
                    </span>
                    <span className="text-xs font-black text-emerald-300">
                      {clientConfidence}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{
                        width: `${clientConfidence}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-[10px] font-black uppercase text-white/35">
                    Score
                  </span>
                  <p className="mt-2 text-xl font-black">
                    {score}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-[10px] font-black uppercase text-white/35">
                    Record
                  </span>
                  <p className="mt-2 text-xl font-black">
                    <span className="text-emerald-300">
                      {successfulActions}
                    </span>
                    <span className="mx-1 text-white/20">
                      /
                    </span>
                    <span className="text-red-300">
                      {failedActions}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                {/* SCENARIO */}
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#171923] to-[#0c0d12] p-6 shadow-2xl sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
                        Courtroom Event
                      </p>

                      <h3 className="mt-3 text-2xl font-black">
                        {scenario.title}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-center">
                      <p className="text-2xl">⚖️</p>
                      <p className="mt-1 text-[9px] font-black uppercase text-white/30">
                        Judge
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-indigo-400/10 bg-indigo-400/5 p-5">
                    <p className="text-sm leading-7 text-white/70">
                      {scenario.description}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-wider text-white/40">
                        Choose your legal response
                      </p>

                      <span className="text-[10px] font-bold text-white/25">
                        Respond quickly
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {ACTIONS.map((action) => (
                        <button
                          key={action}
                          disabled={busy}
                          onClick={() =>
                            void performAction(action)
                          }
                          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-indigo-400/30 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg transition group-hover:bg-indigo-400/10">
                              {ACTION_ICONS[action]}
                            </span>

                            <div>
                              <p className="text-sm font-black">
                                {ACTION_LABELS[action]}
                              </p>

                              <p className="mt-1 text-[10px] text-white/30">
                                Legal action
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {message && (
                    <div
                      className={`mt-5 rounded-2xl border p-4 ${
                        messageType === "success"
                          ? "border-emerald-400/20 bg-emerald-400/10"
                          : messageType === "error"
                            ? "border-red-400/20 bg-red-400/10"
                            : "border-indigo-400/20 bg-indigo-400/10"
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">
                          {messageType === "success"
                            ? "✅"
                            : messageType === "error"
                              ? "⚠️"
                              : "ℹ️"}
                        </span>

                        <p className="text-sm font-bold text-white/70">
                          {message}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex justify-between gap-3">
                    <button
                      onClick={abandonCase}
                      className="rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-2 text-xs font-black text-red-300/70 hover:bg-red-400/10 hover:text-red-300"
                    >
                      Leave Court
                    </button>

                    <div className="text-right text-[10px] text-white/25">
                      Evidence: {evidenceUsed} • Witnesses:{" "}
                      {witnessesHandled} • Objections:{" "}
                      {objectionsWon}
                    </div>
                  </div>
                </div>

                {/* CASE LOG */}
                <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
                    Case Log
                  </p>

                  <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {history.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center">
                        <p className="text-2xl">
                          📋
                        </p>

                        <p className="mt-2 text-xs font-bold text-white/35">
                          Your courtroom decisions will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      history
                        .slice()
                        .reverse()
                        .map((item, index) => (
                          <div
                            key={`${item.action}-${index}`}
                            className="rounded-2xl border border-white/10 bg-black/20 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black">
                                {ACTION_ICONS[item.action]}{" "}
                                {ACTION_LABELS[
                                  item.action
                                ]}
                              </span>

                              <span
                                className={
                                  item.success
                                    ? "text-[10px] font-black text-emerald-300"
                                    : "text-[10px] font-black text-red-300"
                                }
                              >
                                {item.success
                                  ? "SUCCESS"
                                  : "FAILED"}
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] leading-5 text-white/35">
                              {item.message}
                            </p>
                          </div>
                        ))
                    )}
                  </div>
                </aside>
              </div>
            </section>
          )}

        {/* RESULT */}
        {screen === "result" &&
          result &&
          selectedCase && (
            <section className="mx-auto max-w-4xl">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/60 via-[#12141d] to-[#090a0e] shadow-2xl">
                <div className="border-b border-white/10 p-8 text-center sm:p-12">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-400/10 text-4xl ring-1 ring-indigo-400/20">
                    {resultEmoji}
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-indigo-300">
                    Court Decision
                  </p>

                  <h2 className="mt-2 text-4xl font-black">
                    {resultTitle}
                  </h2>

                  <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/45">
                    {result.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
                  <div className="bg-[#101118] p-5 text-center">
                    <p className="text-[10px] uppercase text-white/30">
                      Score
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {result.score}
                    </p>
                  </div>

                  <div className="bg-[#101118] p-5 text-center">
                    <p className="text-[10px] uppercase text-white/30">
                      Legal Fee
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">
                      ₦{result.cash.toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-[#101118] p-5 text-center">
                    <p className="text-[10px] uppercase text-white/30">
                      Reputation
                    </p>
                    <p className="mt-2 text-2xl font-black text-indigo-300">
                      +{result.reputation}
                    </p>
                  </div>

                  <div className="bg-[#101118] p-5 text-center">
                    <p className="text-[10px] uppercase text-white/30">
                      Rank
                    </p>
                    <p className="mt-2 text-sm font-black">
                      {result.rank}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Case Strength
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {result.caseStrength}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Client Confidence
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {result.clientConfidence}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Successful
                    </p>
                    <p className="mt-1 text-xl font-black text-emerald-300">
                      {result.successfulActions}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] uppercase text-white/30">
                      Failed
                    </p>
                    <p className="mt-1 text-xl font-black text-red-300">
                      {result.failedActions}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 p-6 sm:p-8">
                  <button
                    onClick={() => void collectReward()}
                    className="w-full rounded-2xl bg-indigo-500 px-5 py-4 font-black transition hover:bg-indigo-400"
                  >
                    Collect ₦
                    {result.cash.toLocaleString()} & Return
                    to Chambers
                  </button>
                </div>
              </div>
            </section>
          )}
      </div>
    </main>
  );
}
