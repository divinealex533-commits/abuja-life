"use client";

import { useMemo, useState } from "react";

import {
  calculateDeveloperResult,
  type DevelopmentStack,
  type DeveloperContract,
} from "@/lib/game/softwareDeveloper";

interface SoftwareDeveloperPanelProps {
  contract: DeveloperContract;
  onComplete: (
    result: ReturnType<typeof calculateDeveloperResult>
  ) => void;
}

const STACKS: {
  id: DevelopmentStack;
  label: string;
  icon: string;
}[] = [
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: "typescript", label: "TypeScript", icon: "🔷" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "react", label: "React", icon: "⚛️" },
  { id: "node", label: "Node.js", icon: "🟢" },
];

export default function SoftwareDeveloperPanel({
  contract,
  onComplete,
}: SoftwareDeveloperPanelProps) {
  const [step, setStep] = useState<
    "brief" | "stack" | "debug" | "build" | "deploy" | "result"
  >("brief");

  const [stack, setStack] =
    useState<DevelopmentStack>("javascript");

  const [debugging, setDebugging] = useState(0.8);
  const [quality, setQuality] = useState(0.8);
  const [speed, setSpeed] = useState(0.8);

  const result = useMemo(
    () =>
      calculateDeveloperResult(
        contract,
        stack,
        debugging,
        quality,
        speed
      ),
    [contract, stack, debugging, quality, speed]
  );

  function completeContract() {
    setStep("result");
    onComplete(result);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
              Developer Workspace
            </div>

            <h2 className="mt-2 text-2xl font-black">
              {contract.project}
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Client: {contract.client}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Contract
            </div>

            <div className="mt-1 text-lg font-black">
              ₦{contract.budget.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === "brief" && (
          <div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="text-5xl">💻</div>

              <h3 className="mt-4 text-xl font-black">
                Client Requirements
              </h3>

              <p className="mt-3 leading-7 text-white/55">
                {contract.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-black/20 p-4">
                  <div className="text-[9px] font-black uppercase text-white/30">
                    Difficulty
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {contract.difficulty}
                  </div>
                </div>

                <div className="rounded-xl bg-black/20 p-4">
                  <div className="text-[9px] font-black uppercase text-white/30">
                    Deadline
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {contract.deadlineMinutes} min
                  </div>
                </div>

                <div className="rounded-xl bg-black/20 p-4">
                  <div className="text-[9px] font-black uppercase text-white/30">
                    Project
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {contract.task}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep("stack")}
              className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black transition hover:bg-cyan-300"
            >
              ACCEPT CONTRACT →
            </button>
          </div>
        )}

        {step === "stack" && (
          <div>
            <h3 className="text-xl font-black">
              Choose your technology
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Selecting the client's preferred stack gives you a contract bonus.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STACKS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStack(item.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    stack === item.id
                      ? "border-cyan-400/60 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="text-3xl">{item.icon}</div>

                  <div className="mt-3 text-sm font-black">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("debug")}
              className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black"
            >
              OPEN CODEBASE →
            </button>
          </div>
        )}

        {step === "debug" && (
          <div>
            <div className="text-4xl">🐛</div>

            <h3 className="mt-4 text-xl font-black">
              Debug the project
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Find the bugs before building the final solution.
            </p>

            <div className="mt-7">
              <div className="mb-3 flex justify-between">
                <span className="text-sm font-bold">
                  Debugging Accuracy
                </span>

                <span className="font-black text-cyan-300">
                  {Math.round(debugging * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={debugging}
                onChange={(event) =>
                  setDebugging(Number(event.target.value))
                }
                className="w-full accent-cyan-400"
              />
            </div>

            <button
              onClick={() => setStep("build")}
              className="mt-7 w-full rounded-2xl bg-blue-400 px-5 py-4 text-sm font-black text-black"
            >
              FIX BUGS & BUILD →
            </button>
          </div>
        )}

        {step === "build" && (
          <div>
            <div className="text-4xl">⌨️</div>

            <h3 className="mt-4 text-xl font-black">
              Write the solution
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Balance clean code with getting the project finished.
            </p>

            <div className="mt-7">
              <div className="mb-3 flex justify-between">
                <span className="text-sm font-bold">
                  Code Quality
                </span>

                <span className="font-black text-blue-300">
                  {Math.round(quality * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={quality}
                onChange={(event) =>
                  setQuality(Number(event.target.value))
                }
                className="w-full accent-blue-400"
              />
            </div>

            <button
              onClick={() => setStep("deploy")}
              className="mt-7 w-full rounded-2xl bg-purple-400 px-5 py-4 text-sm font-black text-black"
            >
              RUN TESTS →
            </button>
          </div>
        )}

        {step === "deploy" && (
          <div>
            <div className="text-4xl">🚀</div>

            <h3 className="mt-4 text-xl font-black">
              Final Deployment
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Deliver the project quickly without sacrificing quality.
            </p>

            <div className="mt-7">
              <div className="mb-3 flex justify-between">
                <span className="text-sm font-bold">
                  Delivery Speed
                </span>

                <span className="font-black text-purple-300">
                  {Math.round(speed * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={speed}
                onChange={(event) =>
                  setSpeed(Number(event.target.value))
                }
                className="w-full accent-purple-400"
              />
            </div>

            <button
              onClick={completeContract}
              className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-300"
            >
              DEPLOY PROJECT 🚀
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="text-center">
            <div className="text-6xl">
              {result.clientSatisfaction >= 90
                ? "🔥"
                : result.clientSatisfaction >= 75
                  ? "💻"
                  : "🛠️"}
            </div>

            <h3 className="mt-4 text-2xl font-black">
              {result.message}
            </h3>

            <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                  Code Quality
                </div>

                <div className="mt-2 text-2xl font-black text-cyan-300">
                  {result.codeQuality}%
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                  Satisfaction
                </div>

                <div className="mt-2 text-2xl font-black text-blue-300">
                  {result.clientSatisfaction}%
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                  Payment
                </div>

                <div className="mt-2 text-2xl font-black text-emerald-300">
                  ₦{result.totalPayment.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-white/10 bg-black/20 p-5 text-left text-sm">
              <div className="flex justify-between py-2">
                <span className="text-white/40">
                  Stack bonus
                </span>

                <span className="font-bold">
                  +₦{result.stackBonus.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-white/40">
                  Quality bonus
                </span>

                <span className="font-bold">
                  +₦{result.qualityBonus.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-white/40">
                  Speed bonus
                </span>

                <span className="font-bold">
                  +₦{result.speedBonus.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-white/40">
                  Client tip
                </span>

                <span className="font-bold text-emerald-300">
                  +₦{result.tip.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                <span className="font-black">
                  Reputation
                </span>

                <span className="font-black text-orange-300">
                  +{result.reputationGain}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
