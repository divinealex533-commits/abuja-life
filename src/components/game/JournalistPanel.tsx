"use client";

import React, { useMemo, useState } from "react";
import {
  JOURNALIST_ASSIGNMENTS,
  calculateJournalistResult,
  type JournalistAssignment,
} from "@/lib/game/journalist";

interface JournalistPanelProps {
  onComplete: (result: {
    payment: number;
    reputation: number;
    experience: number;
    energyUsed: number;
  }) => void;
  onBack?: () => void;
}

type Step = "assignments" | "research" | "accuracy" | "writing" | "speed" | "result";

export default function JournalistPanel({
  onComplete,
  onBack,
}: JournalistPanelProps) {
  const [step, setStep] = useState<Step>("assignments");
  const [assignment, setAssignment] = useState<JournalistAssignment | null>(null);

  const [research, setResearch] = useState(70);
  const [accuracy, setAccuracy] = useState(75);
  const [writing, setWriting] = useState(75);
  const [speed, setSpeed] = useState(70);

  const result = useMemo(() => {
    if (!assignment) return null;

    return calculateJournalistResult(
      assignment,
      research,
      accuracy,
      writing,
      speed
    );
  }, [assignment, research, accuracy, writing, speed]);

  function startAssignment(selected: JournalistAssignment) {
    setAssignment(selected);
    setResearch(70);
    setAccuracy(75);
    setWriting(75);
    setSpeed(70);
    setStep("research");
  }

  function nextStep() {
    if (step === "research") setStep("accuracy");
    else if (step === "accuracy") setStep("writing");
    else if (step === "writing") setStep("speed");
    else if (step === "speed") setStep("result");
  }

  function finishAssignment() {
    if (!result) return;

    onComplete({
      payment: result.payment,
      reputation: result.reputation,
      experience: result.experience,
      energyUsed: result.energyUsed,
    });
  }

  if (step === "assignments") {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-sm font-semibold text-amber-400">
            📰 NEWSROOM
          </div>
          <h2 className="mt-1 text-2xl font-black text-white">
            Choose a Story
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Pick an assignment and turn it into a publishable Abuja story.
          </p>
        </div>

        <div className="grid gap-4">
          {JOURNALIST_ASSIGNMENTS.map((item) => (
            <button
              key={item.id}
              onClick={() => startAssignment(item)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-amber-400/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs text-white/50">
                    {item.location} • {item.beat} • {item.type}
                  </p>
                </div>

                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold capitalize text-amber-300">
                  {item.difficulty}
                </span>
              </div>

              <p className="mt-3 text-sm text-white/65">{item.description}</p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">
                  Base ₦{item.basePay.toLocaleString()}
                </span>
                <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">
                  Deadline {item.deadline}s
                </span>
              </div>
            </button>
          ))}
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/5"
          >
            ← Back to Jobs
          </button>
        )}
      </div>
    );
  }

  if (!assignment) return null;

  if (step === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6">
          <div className="text-sm font-semibold text-amber-300">
            STORY COMPLETE
          </div>

          <h2 className="mt-2 text-3xl font-black text-white">
            {result.headline}
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            {result.verdict}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Story Score" value={`${result.storyScore}%`} />
          <Stat label="Payment" value={`₦${result.payment.toLocaleString()}`} />
          <Stat label="Reputation" value={`+${result.reputation}`} />
          <Stat label="XP" value={`+${result.experience}`} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="font-bold text-white">Report Breakdown</h3>

          <div className="mt-4 space-y-3">
            <Progress label="Research" value={result.research} />
            <Progress label="Accuracy" value={result.accuracy} />
            <Progress label="Writing" value={result.writing} />
            <Progress label="Speed" value={result.speed} />
          </div>

          {result.bonus > 0 && (
            <div className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-300">
              Performance bonuses: +₦{result.bonus.toLocaleString()}
            </div>
          )}
        </div>

        <button
          onClick={finishAssignment}
          className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-black transition hover:bg-amber-300"
        >
          Collect Payment & Return to Jobs
        </button>
      </div>
    );
  }

  const stepInfo = {
    research: {
      title: "Investigate the Story",
      description:
        "Research the story carefully. Better research gives you stronger facts and more reliable reporting.",
      value: research,
      setValue: setResearch,
      label: "Research Quality",
    },
    accuracy: {
      title: "Verify Your Sources",
      description:
        "Check the facts before publishing. Accuracy is one of the most important parts of journalism.",
      value: accuracy,
      setValue: setAccuracy,
      label: "Source Accuracy",
    },
    writing: {
      title: "Write the Article",
      description:
        "Turn your information into a clear, engaging and professional story.",
      value: writing,
      setValue: setWriting,
      label: "Writing Quality",
    },
    speed: {
      title: "Beat the Deadline",
      description:
        "Publish quickly without sacrificing the quality of your reporting.",
      value: speed,
      setValue: setSpeed,
      label: "Publishing Speed",
    },
  }[step as keyof typeof stepInfo];

  if (!stepInfo) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {assignment.beat} • {assignment.type}
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">
              {stepInfo.title}
            </h2>
          </div>

          <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
            {assignment.location}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-white/65">
          {stepInfo.description}
        </p>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">
              {stepInfo.label}
            </span>
            <span className="text-lg font-black text-amber-300">
              {stepInfo.value}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={stepInfo.value}
            onChange={(event) => stepInfo.setValue(Number(event.target.value))}
            className="w-full accent-amber-400"
          />

          <div className="mt-2 flex justify-between text-[11px] text-white/30">
            <span>Poor</span>
            <span>Average</span>
            <span>Excellent</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Research" value={research} />
        <MiniStat label="Accuracy" value={accuracy} />
        <MiniStat label="Writing" value={writing} />
        <MiniStat label="Speed" value={speed} />
      </div>

      <button
        onClick={nextStep}
        className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-black transition hover:bg-amber-300"
      >
        {step === "speed" ? "Publish Story 📰" : "Continue →"}
      </button>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] text-white/40">{label}</div>
      <div className="mt-1 font-black text-white">{value}%</div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Progress({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-bold text-white">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
