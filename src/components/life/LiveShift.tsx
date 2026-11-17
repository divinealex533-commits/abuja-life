"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ACCENT_CLASSES, getCareer } from "@/lib/game/careers";
import { pickScenarios, rankIndexForXp, riskLabel, shiftPayAtRank } from "@/lib/game/careers/engine";
import type { Career, ShiftChoice, ShiftDecision, ShiftResult, ShiftScenario } from "@/lib/game/careers/types";
import { refreshLife, useLife } from "@/lib/life/client";
import { SHIFT_TASKS } from "@/lib/life/needs";
import { syncPlayerSnapshot } from "@/lib/vip/client";

const TASK_SECONDS = 3.2;
const DECISION_SECONDS = 15;

const TASK_WORDS = [
  "Serve customer",
  "Answer the phone",
  "Count the cash",
  "Restock",
  "Sign the paperwork",
  "Help a client",
  "Clear the queue",
  "Send the receipt",
];

type Step = { kind: "task"; label: string; x: number; y: number } | { kind: "scenario"; scenario: ShiftScenario };

interface LifeBonus {
  mood: number | null;
  moodLabel: string | null;
  moodAdjustment: number;
  hustleBonus: number;
  tasksDone: number;
}

type Phase =
  | { kind: "loading" }
  | { kind: "no-job" }
  | { kind: "ready" }
  | { kind: "playing"; steps: Step[]; index: number; stepStartedAt: number }
  | { kind: "submitting" }
  | { kind: "report"; result: ShiftResult; lifeBonus: LifeBonus | null; rankTitle: string; newCases: string[] }
  | { kind: "error"; message: string };

/** Safest choice the player is allowed to pick (used when time runs out). */
function safestChoice(scenario: ShiftScenario, rank: number): ShiftChoice {
  const allowed = scenario.choices.filter((c) => (c.minRank ?? 0) <= rank);
  return [...allowed].sort((a, b) => (a.risk?.chance ?? 0) - (b.risk?.chance ?? 0))[0] ?? scenario.choices[0];
}

function buildSteps(career: Career): Step[] {
  const scenarios = pickScenarios(career);
  const words = [...TASK_WORDS].sort(() => Math.random() - 0.5);
  const task = (i: number): Step => ({
    kind: "task",
    label: words[i % words.length],
    x: 12 + Math.random() * 60,
    y: 10 + Math.random() * 55,
  });
  // task, scenario, task, scenario, task, scenario, task
  const steps: Step[] = [];
  for (let i = 0; i < SHIFT_TASKS; i++) {
    steps.push(task(i));
    if (scenarios[i]) steps.push({ kind: "scenario", scenario: scenarios[i] });
  }
  return steps;
}

/** Full-screen live work shift: tap hustle tasks, make decisions against the clock. */
export default function LiveShift({ onClose }: { onClose: () => void }) {
  const life = useLife();
  const [career, setCareer] = useState<Career | null>(null);
  const [careerXp, setCareerXp] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [now, setNow] = useState(Date.now());
  const decisions = useRef<ShiftDecision[]>([]);
  const tasksDone = useRef(0);
  const [taskFlash, setTaskFlash] = useState<"hit" | "miss" | null>(null);

  useEffect(() => {
    fetch("/api/careers", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const found = getCareer(String(data?.currentJobId ?? ""));
        if (!found) {
          setPhase({ kind: "no-job" });
          return;
        }
        setCareer(found);
        setCareerXp(Number(data?.progress?.[found.id]?.xp ?? 0));
        setPhase({ kind: "ready" });
      })
      .catch(() => setPhase({ kind: "error", message: "Couldn't load your job. Check your connection." }));
  }, []);

  // Stop page scroll behind the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const rank = career ? rankIndexForXp(career, careerXp) : 0;

  const submit = useCallback(async () => {
    if (!career) return;
    setPhase({ kind: "submitting" });
    try {
      const res = await fetch("/api/careers/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId: career.id, decisions: decisions.current, tasksDone: tasksDone.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase({ kind: "error", message: data.error || "The shift didn't go through." });
        return;
      }
      if (data.player) syncPlayerSnapshot(data.player);
      setCareerXp(Number(data.careerXp ?? careerXp));
      void refreshLife();
      setPhase({
        kind: "report",
        result: data.result,
        lifeBonus: data.lifeBonus ?? null,
        rankTitle: data.rankTitle ?? "",
        newCases: data.newCases ?? [],
      });
    } catch {
      setPhase({ kind: "error", message: "Network problem. Your shift wasn't saved." });
    }
  }, [career, careerXp]);

  // Each step can only be finished once (tap and time-out can race).
  const handledStep = useRef(-1);
  const pendingSubmit = useRef(false);

  const advance = useCallback((fromIndex: number) => {
    if (handledStep.current === fromIndex) return;
    handledStep.current = fromIndex;
    setPhase((p) => {
      if (p.kind !== "playing" || p.index !== fromIndex) return p;
      const next = p.index + 1;
      if (next >= p.steps.length) {
        pendingSubmit.current = true;
        return { kind: "submitting" };
      }
      return { ...p, index: next, stepStartedAt: Date.now() + 900 };
    });
  }, []);

  useEffect(() => {
    if (phase.kind === "submitting" && pendingSubmit.current) {
      pendingSubmit.current = false;
      void submit();
    }
  }, [phase.kind, submit]);

  // Clock for timers.
  useEffect(() => {
    if (phase.kind !== "playing") return;
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, [phase.kind]);

  // Time-outs: missed task, or auto-decide when the decision timer ends.
  useEffect(() => {
    if (phase.kind !== "playing" || !career) return;
    const step = phase.steps[phase.index];
    const elapsed = (now - phase.stepStartedAt) / 1000;
    if (step.kind === "task" && elapsed > TASK_SECONDS) {
      if (handledStep.current !== phase.index) setTaskFlash("miss");
      advance(phase.index);
    }
    if (step.kind === "scenario" && elapsed > DECISION_SECONDS) {
      if (handledStep.current !== phase.index) {
        const choice = safestChoice(step.scenario, rank);
        decisions.current.push({ scenarioId: step.scenario.id, choiceId: choice.id });
      }
      advance(phase.index);
    }
  }, [now, phase, career, rank, advance]);

  useEffect(() => {
    if (!taskFlash) return;
    const t = window.setTimeout(() => setTaskFlash(null), 700);
    return () => window.clearTimeout(t);
  }, [taskFlash]);

  const accent = career ? ACCENT_CLASSES[career.accent] : null;
  const basePay = useMemo(() => (career ? shiftPayAtRank(career, rank) : 0), [career, rank]);

  function begin() {
    if (!career) return;
    if (life.energy < career.energyCost) {
      setPhase({
        kind: "error",
        message: `You need ${career.energyCost} energy for this shift. You have ${Math.round(life.energy)}. Sleep or take a power nap first.`,
      });
      return;
    }
    decisions.current = [];
    tasksDone.current = 0;
    handledStep.current = -1;
    setPhase({ kind: "playing", steps: buildSteps(career), index: 0, stepStartedAt: Date.now() + 1200 });
  }

  const step = phase.kind === "playing" ? phase.steps[phase.index] : null;
  const elapsed = phase.kind === "playing" ? (now - phase.stepStartedAt) / 1000 : 0;
  const waiting = elapsed < 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1020] text-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{career?.emoji ?? "💼"}</span>
            <div>
              <div className="text-sm font-black">{career?.name ?? "Work shift"}</div>
              {career && <div className="text-[11px] text-white/50">{career.ranks[rank].title}</div>}
            </div>
          </div>
          {phase.kind !== "playing" && phase.kind !== "submitting" && (
            <button type="button" onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
              ✕
            </button>
          )}
          {phase.kind === "playing" && (
            <div className="text-xs font-black text-white/60">
              Tasks {tasksDone.current}/{SHIFT_TASKS} · Step {phase.index + 1}/{phase.steps.length}
            </div>
          )}
        </div>

        <div className="relative min-h-[420px] flex-1 overflow-y-auto">
          {phase.kind === "loading" && <div className="p-8 text-center text-white/50">Clocking in...</div>}

          {phase.kind === "no-job" && (
            <div className="p-8 text-center">
              <div className="text-5xl">🧑🏾‍💼</div>
              <p className="mt-4 text-lg font-black">You don&apos;t have a job yet</p>
              <p className="mt-1 text-sm text-white/50">Pick a career first. POS agent is a good start.</p>
              <Link
                href="/careers"
                className="mt-5 inline-block rounded-xl bg-emerald-400 px-5 py-3 font-black text-black"
              >
                Find a job →
              </Link>
            </div>
          )}

          {phase.kind === "ready" && career && (
            <div className="p-6">
              <div className={`rounded-2xl border p-4 ${accent?.border ?? "border-white/10"} bg-white/[0.04]`}>
                <p className="text-sm text-white/70">{career.tagline}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-black/30 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/40">Base pay</div>
                    <div className="font-black">₦{basePay.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/40">Energy</div>
                    <div className="font-black">−{career.energyCost}</div>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2">
                    <div className="text-[10px] font-bold uppercase text-white/40">Mood</div>
                    <div className="font-black">
                      {life.moodInfo.emoji} {life.mood}%
                    </div>
                  </div>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-white/70">
                <li>⚡ <b>Tap the tasks</b> that pop up before they disappear. All {SHIFT_TASKS} = <b>+15% pay</b>.</li>
                <li>🤔 <b>Make 3 decisions</b> in {DECISION_SECONDS}s each. Shady choices pay more but can get you arrested.</li>
                <li>😎 Your mood changes your pay. Eat, bathe and have fun to stay sharp.</li>
              </ul>

              <button
                type="button"
                onClick={begin}
                className="mt-6 w-full rounded-2xl border-b-4 border-emerald-800 bg-gradient-to-b from-emerald-300 to-emerald-500 py-4 text-lg font-black uppercase tracking-wider text-black active:translate-y-0.5 active:border-b-2"
              >
                ▶ Clock in
              </button>
            </div>
          )}

          {phase.kind === "playing" && step && (
            <div className="relative h-[460px] bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.12),transparent_55%)]">
              {waiting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                  <div className="animate-pulse text-5xl">{career?.emoji}</div>
                  <div className="mt-3 text-sm font-bold">Working...</div>
                </div>
              )}

              {!waiting && step.kind === "task" && (
                <button
                  type="button"
                  onClick={() => {
                    if (phase.kind !== "playing" || handledStep.current === phase.index) return;
                    tasksDone.current += 1;
                    setTaskFlash("hit");
                    advance(phase.index);
                  }}
                  className="absolute animate-[al-pop_.25s_ease-out] rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-300 to-orange-500 px-4 py-3 text-left font-black text-black shadow-[0_0_30px_rgba(245,158,11,0.7)]"
                  style={{ left: `${step.x}%`, top: `${step.y}%` }}
                >
                  <div className="text-xs uppercase opacity-70">Tap fast!</div>
                  <div>{step.label}</div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/20">
                    <div
                      className="h-full bg-black/60"
                      style={{ width: `${Math.max(0, 100 - (elapsed / TASK_SECONDS) * 100)}%` }}
                    />
                  </div>
                </button>
              )}

              {!waiting && step.kind === "scenario" && (
                <div className="absolute inset-0 overflow-y-auto p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{step.scenario.emoji}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        DECISION_SECONDS - elapsed < 5 ? "animate-pulse bg-red-500" : "bg-white/10"
                      }`}
                    >
                      ⏱ {Math.max(0, Math.ceil(DECISION_SECONDS - elapsed))}s
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-black">{step.scenario.title}</h3>
                  <p className="mt-1 text-sm text-white/65">{step.scenario.situation}</p>
                  <div className="mt-4 space-y-2">
                    {step.scenario.choices.map((choice) => {
                      const locked = (choice.minRank ?? 0) > rank;
                      const risk = riskLabel(choice.risk?.chance);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          disabled={locked}
                          onClick={() => {
                            if (phase.kind !== "playing" || handledStep.current === phase.index) return;
                            decisions.current.push({ scenarioId: step.scenario.id, choiceId: choice.id });
                            advance(phase.index);
                          }}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-left transition hover:bg-white/[0.1] active:scale-[0.99] disabled:opacity-40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black">{choice.label}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                risk === "Safe"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : risk === "Some risk"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-red-500/20 text-red-300"
                              }`}
                            >
                              {locked ? `Rank ${(choice.minRank ?? 0) + 1}` : risk}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-white/50">{choice.detail}</div>
                          {choice.risk && !locked && (
                            <div className="mt-1 text-[11px] text-red-300/80">⚠ {choice.risk.warning}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-white/35">If time runs out, you&apos;ll play it safe.</p>
                </div>
              )}

              {taskFlash && (
                <div
                  className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm font-black ${
                    taskFlash === "hit" ? "bg-emerald-400 text-black" : "bg-red-500 text-white"
                  }`}
                >
                  {taskFlash === "hit" ? "Nice! +bonus" : "Missed!"}
                </div>
              )}
            </div>
          )}

          {phase.kind === "submitting" && (
            <div className="flex h-[420px] flex-col items-center justify-center text-white/60">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
              <div className="mt-4 font-bold">Closing up for the day...</div>
            </div>
          )}

          {phase.kind === "error" && (
            <div className="p-8 text-center">
              <div className="text-5xl">😓</div>
              <p className="mt-4 font-bold">{phase.message}</p>
              <button
                type="button"
                onClick={() => setPhase(career ? { kind: "ready" } : { kind: "no-job" })}
                className="mt-5 rounded-xl bg-white/10 px-5 py-3 font-black"
              >
                Back
              </button>
            </div>
          )}

          {phase.kind === "report" && (
            <div className="p-6">
              <div className="text-center">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Shift complete</div>
                <div className="mt-2 text-5xl font-black text-emerald-300">
                  +₦{phase.result.totalPay.toLocaleString()}
                </div>
                {phase.result.promoted && (
                  <div className="mt-2 inline-block rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-black">
                    🎉 Promoted to {phase.rankTitle}!
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-1.5 rounded-2xl bg-white/[0.04] p-4 text-sm">
                <Row label="Work done" value={phase.result.decisionPay} />
                {phase.result.event && <Row label={phase.result.event.text} value={phase.result.eventBonus} />}
                {phase.result.vipBonus > 0 && <Row label="VIP bonus" value={phase.result.vipBonus} />}
                {phase.lifeBonus && phase.lifeBonus.moodAdjustment !== 0 && (
                  <Row label={`Mood: ${phase.lifeBonus.moodLabel}`} value={phase.lifeBonus.moodAdjustment} />
                )}
                {phase.lifeBonus && (
                  <Row label={`Hustle tasks ${phase.lifeBonus.tasksDone}/${SHIFT_TASKS}`} value={phase.lifeBonus.hustleBonus} />
                )}
                <div className="flex justify-between border-t border-white/10 pt-2 text-xs text-white/50">
                  <span>Reputation {phase.result.reputation >= 0 ? "+" : ""}{phase.result.reputation}</span>
                  <span>XP +{phase.result.xp}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {phase.result.decisions.map((d) => (
                  <div
                    key={d.scenarioId}
                    className={`rounded-xl border p-3 text-sm ${
                      d.success ? "border-emerald-400/20 bg-emerald-500/5" : "border-red-400/30 bg-red-500/10"
                    }`}
                  >
                    <div className="font-black">
                      {d.success ? "✅" : "❌"} {d.scenarioTitle}: {d.choiceLabel}
                    </div>
                    <div className="mt-0.5 text-xs text-white/60">{d.text}</div>
                  </div>
                ))}
              </div>

              {phase.newCases.length > 0 && (
                <Link
                  href="/court"
                  className="mt-4 block rounded-xl bg-red-500 p-3 text-center text-sm font-black"
                >
                  🚨 You&apos;ve been charged! Go to court within 48 hours →
                </Link>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={onClose} className="rounded-xl bg-white/10 py-3 font-black">
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => setPhase({ kind: "ready" })}
                  className="rounded-xl bg-emerald-400 py-3 font-black text-black"
                >
                  Another shift
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes al-pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/60">{label}</span>
      <span className={`shrink-0 font-black ${value < 0 ? "text-red-300" : "text-white"}`}>
        {value < 0 ? "−" : "+"}₦{Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}
