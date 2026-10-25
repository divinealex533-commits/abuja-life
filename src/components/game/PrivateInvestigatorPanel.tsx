"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  INVESTIGATION_CASES,
  InvestigationCase,
  InvestigationEvidence,
  InvestigationResult,
  InvestigationSuspect,
  calculateInvestigationResult,
  getDifficultyLabel,
} from "@/lib/game/privateInvestigator";

import {
  PlayerGameState,
  savePersistentPlayerState,
} from "@/lib/game/player";

interface PrivateInvestigatorPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

type Screen =
  | "cases"
  | "briefing"
  | "investigation"
  | "result";

export default function PrivateInvestigatorPanel({
  player,
  setPlayer,
}: PrivateInvestigatorPanelProps) {
  const [screen, setScreen] = useState<Screen>("cases");

  const [selectedCase, setSelectedCase] =
    useState<InvestigationCase | null>(null);

  const [selectedSuspectId, setSelectedSuspectId] =
    useState<string | null>(null);

  const [foundEvidence, setFoundEvidence] =
    useState<string[]>([]);

  const [askedQuestions, setAskedQuestions] =
    useState<string[]>([]);

  const [activeSuspect, setActiveSuspect] =
    useState<InvestigationSuspect | null>(null);

  const [result, setResult] =
    useState<InvestigationResult | null>(null);

  const [timeRemaining, setTimeRemaining] = useState(0);

  const [investigationMessage, setInvestigationMessage] =
    useState<string | null>(null);

  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (screen !== "investigation" || !selectedCase) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen, selectedCase]);

  useEffect(() => {
    if (
      screen === "investigation" &&
      selectedCase &&
      timeRemaining === 0
    ) {
      finishInvestigation();
    }
  }, [timeRemaining]);

  const evidenceFound = useMemo(
    () =>
      selectedCase?.evidence.filter((item) =>
        foundEvidence.includes(item.id)
      ) ?? [],
    [selectedCase, foundEvidence]
  );

  const availableQuestions = useMemo(
    () =>
      selectedCase?.questions.filter(
        (question) =>
          !askedQuestions.includes(question.id)
      ) ?? [],
    [selectedCase, askedQuestions]
  );

  function startCase(caseData: InvestigationCase) {
    setSelectedCase(caseData);
    setSelectedSuspectId(null);
    setFoundEvidence([]);
    setAskedQuestions([]);
    setActiveSuspect(null);
    setResult(null);
    setInvestigationMessage(null);
    setTimeRemaining(caseData.timeLimit);
    setScreen("briefing");
  }

  function beginInvestigation() {
    if (!selectedCase) return;

    if (player.energy < 20) {
      setInvestigationMessage(
        "You need at least 20 energy to start an investigation."
      );
      return;
    }

    setPlayer((current) => ({
      ...current,
      energy: Math.max(0, current.energy - 20),
    }));

    setScreen("investigation");
  }

  function collectEvidence(evidence: InvestigationEvidence) {
    if (foundEvidence.includes(evidence.id)) return;

    setFoundEvidence((current) => [
      ...current,
      evidence.id,
    ]);

    setInvestigationMessage(
      `Evidence discovered: ${evidence.name}`
    );

    setShake(true);

    window.setTimeout(() => {
      setShake(false);
    }, 350);
  }

  function interrogate(
    suspect: InvestigationSuspect
  ) {
    setActiveSuspect(suspect);
    setInvestigationMessage(null);
  }

  function askQuestion(questionId: string) {
    if (!selectedCase) return;

    const question = selectedCase.questions.find(
      (item) => item.id === questionId
    );

    if (!question) return;

    if (
      question.evidenceRequired &&
      !foundEvidence.includes(
        question.evidenceRequired
      )
    ) {
      setInvestigationMessage(
        "You need the right evidence before asking this question."
      );
      return;
    }

    setAskedQuestions((current) => [
      ...current,
      question.id,
    ]);

    if (
      question.revealsEvidence &&
      !foundEvidence.includes(
        question.revealsEvidence
      )
    ) {
      const evidence = selectedCase.evidence.find(
        (item) =>
          item.id === question.revealsEvidence
      );

      if (evidence) {
        setFoundEvidence((current) => [
          ...current,
          evidence.id,
        ]);

        setInvestigationMessage(
          `${activeSuspect?.name ?? "The suspect"} revealed something important: ${evidence.name}.`
        );

        return;
      }
    }

    setInvestigationMessage(
      "The suspect answered, but nothing immediately useful was revealed."
    );
  }

  function selectSuspect(suspectId: string) {
    setSelectedSuspectId(suspectId);

    const suspect = selectedCase?.suspects.find(
      (item) => item.id === suspectId
    );

    if (suspect) {
      setActiveSuspect(suspect);
    }

    setInvestigationMessage(
      "Suspect selected. Make sure your evidence supports the accusation."
    );
  }

  function finishInvestigation() {
    if (!selectedCase || result) return;

    const investigationResult =
      calculateInvestigationResult(
        selectedCase,
        selectedSuspectId ?? "",
        foundEvidence,
        askedQuestions,
        timeRemaining
      );

    setResult(investigationResult);
    setScreen("result");

    setPlayer((current) => {
      const updatedPlayer: PlayerGameState = {
        ...current,
        cash: Math.max(
          0,
          current.cash + investigationResult.reward
        ),
        reputation:
          current.reputation +
          investigationResult.reputation,
        jobExperience:
          current.jobExperience +
          investigationResult.experience,
      };

      savePersistentPlayerState(updatedPlayer);

      return updatedPlayer;
    });
  }

  function closeCase() {
    setSelectedCase(null);
    setSelectedSuspectId(null);
    setFoundEvidence([]);
    setAskedQuestions([]);
    setActiveSuspect(null);
    setResult(null);
    setInvestigationMessage(null);
    setScreen("cases");
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  if (screen === "cases") {
    return (
      <section className="mt-8 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#18120a] via-[#11130f] to-[#07110f] p-5 shadow-2xl shadow-black/30 md:p-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
              🕵️ Private Investigator
            </div>

            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              Investigation Bureau
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Take difficult cases, examine evidence,
              interrogate suspects and solve mysteries
              across Abuja.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3">
            <div className="text-xs text-white/40">
              INVESTIGATOR
            </div>
            <div className="mt-1 font-black text-amber-300">
              Reputation {player.reputation}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            // The actual cases are rendered below.
          ]}

          {INVESTIGATION_CASES.map(
              (caseData: InvestigationCase) => (
                <button
                  key={caseData.id}
                  type="button"
                  onClick={() => startCase(caseData)}
                  className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-amber-400/40 hover:bg-amber-400/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl transition group-hover:scale-110">
                      🕵️
                    </div>

                    <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                      {getDifficultyLabel(
                        caseData.difficulty
                      )}
                    </span>
                  </div>

                  <div className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
                    Case {caseData.caseNumber}
                  </div>

                  <h3 className="mt-1 text-2xl font-black">
                    {caseData.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    {caseData.subtitle}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/20 p-3">
                      <div className="text-[10px] text-white/30">
                        REWARD
                      </div>
                      <div className="mt-1 font-black text-emerald-300">
                        ₦{caseData.reward.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <div className="text-[10px] text-white/30">
                        TIME
                      </div>
                      <div className="mt-1 font-black">
                        {formatTime(
                          caseData.timeLimit
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3">
                      <div className="text-[10px] text-white/30">
                        CLUES
                      </div>
                      <div className="mt-1 font-black">
                        {caseData.evidence.length}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 text-sm font-black text-amber-300">
                    OPEN CASE →
                  </div>
                </button>
              )
            )}
        </div>
      </section>
    );
  }

  if (screen === "briefing" && selectedCase) {
    return (
      <section className="mt-8 rounded-3xl border border-amber-400/20 bg-[#10120f] p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={closeCase}
            className="text-sm font-bold text-white/40 hover:text-white"
          >
            ← Back to cases
          </button>

          <div className="mt-8 text-center">
            <div className="text-6xl">🕵️</div>

            <div className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
              Case {selectedCase.caseNumber}
            </div>

            <h2 className="mt-2 text-4xl font-black">
              {selectedCase.title}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-white/50">
              {selectedCase.description}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="font-black text-amber-300">
                📋 CASE BRIEFING
              </div>

              <div className="mt-4 space-y-3">
                {selectedCase.briefing.map(
                  (item, index) => (
                    <div
                      key={item}
                      className="flex gap-3 text-sm text-white/60"
                    >
                      <span className="font-black text-amber-300">
                        {index + 1}.
                      </span>
                      {item}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="font-black text-cyan-300">
                🎯 YOUR OBJECTIVE
              </div>

              <ul className="mt-4 space-y-3 text-sm text-white/60">
                <li>🔎 Investigate the scene.</li>
                <li>🧩 Collect useful evidence.</li>
                <li>💬 Interrogate suspects.</li>
                <li>🧠 Identify the culprit.</li>
                <li>🏆 Maximize your investigation score.</li>
              </ul>
            </div>
          </div>

          {investigationMessage && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {investigationMessage}
            </div>
          )}

          <button
            onClick={beginInvestigation}
            className="mt-7 w-full rounded-2xl bg-amber-400 px-6 py-4 text-sm font-black text-black transition hover:bg-amber-300"
          >
            START INVESTIGATION 🔎
          </button>
        </div>
      </section>
    );
  }

  if (screen === "investigation" && selectedCase) {
    return (
      <section
        className={`mt-8 rounded-3xl border border-amber-400/20 bg-[#0d110f] p-5 md:p-8 ${
          shake ? "animate-pulse" : ""
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
              Active Investigation
            </div>

            <h2 className="mt-1 text-2xl font-black">
              {selectedCase.title}
            </h2>
          </div>

          <div
            className={`rounded-2xl border px-5 py-3 text-center ${
              timeRemaining <= 30
                ? "border-red-400/40 bg-red-400/10 text-red-300"
                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest">
              Time Remaining
            </div>

            <div className="mt-1 text-2xl font-black">
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black">
                  🔎 Evidence Board
                </h3>

                <span className="text-xs text-white/40">
                  {evidenceFound.length}/
                  {selectedCase.evidence.length} found
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selectedCase.evidence.map(
                  (evidence) => {
                    const found =
                      foundEvidence.includes(
                        evidence.id
                      );

                    return (
                      <button
                        key={evidence.id}
                        type="button"
                        onClick={() =>
                          collectEvidence(evidence)
                        }
                        disabled={found}
                        className={`rounded-2xl border p-4 text-left transition ${
                          found
                            ? "border-emerald-400/30 bg-emerald-400/10"
                            : "border-white/10 bg-black/20 hover:border-amber-400/30 hover:bg-amber-400/5"
                        }`}
                      >
                        <div className="text-2xl">
                          {found ? "📌" : "🔍"}
                        </div>

                        <div className="mt-2 font-bold">
                          {found
                            ? evidence.name
                            : "Search location"}
                        </div>

                        <div className="mt-1 text-xs text-white/40">
                          {found
                            ? evidence.description
                            : evidence.location}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-black">
                👤 Suspects
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selectedCase.suspects.map(
                  (suspect) => (
                    <button
                      key={suspect.id}
                      type="button"
                      onClick={() =>
                        interrogate(suspect)
                      }
                      className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                        selectedSuspectId ===
                        suspect.id
                          ? "border-amber-400/50 bg-amber-400/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">
                          👤
                        </span>

                        <span className="text-xs text-red-300">
                          Suspicion {suspect.suspiciousLevel}%
                        </span>
                      </div>

                      <div className="mt-3 font-black">
                        {suspect.name}
                      </div>

                      <div className="text-xs text-white/40">
                        {suspect.occupation}
                      </div>

                      <div className="mt-3 text-xs text-white/50">
                        “{suspect.statement}”
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-black">
                💬 Interrogation Room
              </h3>

              {!activeSuspect ? (
                <div className="mt-5 rounded-2xl bg-black/20 p-5 text-center text-sm text-white/40">
                  Select a suspect to begin questioning.
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-2xl bg-black/20 p-4">
                    <div className="text-xs text-white/30">
                      QUESTIONING
                    </div>

                    <div className="mt-1 text-lg font-black">
                      {activeSuspect.name}
                    </div>

                    <div className="mt-1 text-xs text-white/40">
                      {activeSuspect.occupation}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {availableQuestions
                      .filter(
                        (question) =>
                          question.targetSuspectId ===
                          activeSuspect.id
                      )
                      .map((question) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() =>
                            askQuestion(
                              question.id
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-sm transition hover:border-amber-400/30 hover:bg-amber-400/5"
                        >
                          💬 {question.text}
                        </button>
                      ))}

                    {availableQuestions.filter(
                      (question) =>
                        question.targetSuspectId ===
                        activeSuspect.id
                    ).length === 0 && (
                      <div className="rounded-xl bg-black/20 p-4 text-sm text-white/40">
                        You've exhausted the useful questions for this suspect.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {investigationMessage && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                {investigationMessage}
              </div>
            )}

            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
              <div className="text-xs font-black uppercase tracking-widest text-red-300">
                ⚠️ Make Your Accusation
              </div>

              <p className="mt-2 text-xs leading-5 text-white/40">
                Select the person you believe committed the crime.
                Your evidence determines your final score.
              </p>

              <div className="mt-4 space-y-2">
                {selectedCase.suspects.map(
                  (suspect) => (
                    <button
                      key={suspect.id}
                      type="button"
                      onClick={() =>
                        selectSuspect(suspect.id)
                      }
                      className={`w-full rounded-xl border p-3 text-left text-sm font-bold transition ${
                        selectedSuspectId ===
                        suspect.id
                          ? "border-red-400/50 bg-red-400/10 text-red-200"
                          : "border-white/10 bg-black/20 hover:border-red-400/20"
                      }`}
                    >
                      {selectedSuspectId ===
                      suspect.id
                        ? "🔴 "
                        : "⚪ "}
                      {suspect.name}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={!selectedSuspectId}
                onClick={finishInvestigation}
                className="mt-4 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                SUBMIT ACCUSATION 🚨
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (screen === "result" && selectedCase && result) {
    return (
      <section className="mt-8 overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-[#18130a] via-[#11130f] to-[#07110f] p-6 md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-7xl">
            {result.correct
              ? result.rank === "S"
                ? "🏆"
                : "🎉"
              : "💥"}
          </div>

          <div className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-amber-300">
            Investigation Complete
          </div>

          <h2 className="mt-2 text-4xl font-black">
            {result.correct
              ? "Case Solved!"
              : "Investigation Failed"}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-white/50">
            {result.message}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/30">
                SCORE
              </div>
              <div className="mt-1 text-3xl font-black text-amber-300">
                {result.score}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/30">
                RANK
              </div>
              <div className="mt-1 text-3xl font-black">
                {result.rank}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/30">
                REWARD
              </div>
              <div className="mt-1 text-xl font-black text-emerald-300">
                ₦{result.reward.toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="text-xs text-white/30">
                XP
              </div>
              <div className="mt-1 text-xl font-black text-cyan-300">
                +{result.experience}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              🔎 {result.evidenceFound} evidence found
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              💬 {result.questionsAsked} questions asked
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              ⭐ {result.reputation >= 0 ? "+" : ""}
              {result.reputation} reputation
            </div>
          </div>

          <button
            onClick={closeCase}
            className="mt-8 rounded-2xl bg-amber-400 px-8 py-4 text-sm font-black text-black transition hover:bg-amber-300"
          >
            RETURN TO CASES
          </button>
        </div>
      </section>
    );
  }

  return null;
}
