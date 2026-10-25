"use client";

import { useMemo, useState } from "react";

import {
  calculateBarberResult,
  type BarberCustomer,
} from "@/lib/game/barber";

type BarberPanelProps = {
  customer: BarberCustomer;
  onComplete: (result: {
    payment: number;
    tip: number;
    reputation: number;
    satisfaction: number;
    energyCost: number;
    message: string;
  }) => void;
  onCancel: () => void;
};

type Step = "consultation" | "cut" | "finish";

export default function BarberPanel({
  customer,
  onComplete,
  onCancel,
}: BarberPanelProps) {
  const [step, setStep] = useState<Step>("consultation");

  const [styleMatch, setStyleMatch] = useState(50);
  const [precision, setPrecision] = useState(50);

  const [result, setResult] = useState<ReturnType<
    typeof calculateBarberResult
  > | null>(null);

  const difficultyData = useMemo(() => {
    if (customer.difficulty === "hard") {
      return {
        label: "Advanced",
        targetPrecision: 88,
        energy: 18,
      };
    }

    if (customer.difficulty === "medium") {
      return {
        label: "Professional",
        targetPrecision: 75,
        energy: 14,
      };
    }

    return {
      label: "Standard",
      targetPrecision: 62,
      energy: 10,
    };
  }, [customer.difficulty]);

  function handleStartCut() {
    setStep("cut");
  }

  function handleFinishCut() {
    const finalResult = calculateBarberResult(
      customer,
      precision,
      styleMatch
    );

    setResult(finalResult);
    setStep("finish");
  }

  function renderConsultation() {
    return (
      <section className="rounded-[2rem] border border-pink-400/20 bg-gradient-to-br from-pink-500/10 via-white/[0.03] to-purple-500/10 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300">
              Step 1 / 3
            </div>

            <h2 className="mt-2 text-3xl font-black">
              Consult Your Customer
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Listen carefully to the customer's request before
              starting the haircut.
            </p>
          </div>

          <div className="text-5xl">{customer.emoji}</div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Customer
            </div>

            <div className="mt-2 text-xl font-black">
              {customer.customer}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Requested Style
            </div>

            <div className="mt-2 text-xl font-black text-pink-300">
              {customer.styleName}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Base Price
            </div>

            <div className="mt-1 font-black text-emerald-300">
              ₦{customer.basePrice.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Difficulty
            </div>

            <div className="mt-1 font-black">
              {difficultyData.label}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Energy
            </div>

            <div className="mt-1 font-black text-orange-300">
              -{difficultyData.energy}
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-3xl border border-pink-400/10 bg-pink-400/5 p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-300">
            Customer Request
          </div>

          <p className="mt-3 text-sm leading-6 text-white/60">
            "{customer.styleName}" — Make sure the style is clean,
            balanced and professionally finished.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black transition hover:bg-white/10"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleStartCut}
            className="flex-1 rounded-2xl bg-pink-400 px-5 py-4 text-xs font-black text-black transition hover:bg-pink-300"
          >
            START HAIRCUT →
          </button>
        </div>
      </section>
    );
  }

  function renderCut() {
    return (
      <section className="rounded-[2rem] border border-purple-400/20 bg-gradient-to-br from-purple-500/10 via-white/[0.03] to-pink-500/10 p-6 shadow-2xl sm:p-8">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300">
          Step 2 / 3
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Work the Cut
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          Balance style accuracy and cutting precision. Better
          technique means happier customers and bigger tips.
        </p>

        <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                Requested Style
              </div>

              <div className="mt-2 text-xl font-black">
                {customer.styleName}
              </div>
            </div>

            <div className="text-5xl">💈</div>
          </div>
        </div>

        <div className="mt-7 space-y-7">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">
                Style Match
              </span>

              <span className="text-xs font-black text-pink-300">
                {styleMatch}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={styleMatch}
              onChange={(event) =>
                setStyleMatch(Number(event.target.value))
              }
              className="mt-4 w-full accent-pink-400"
            />

            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-white/25">
              <span>Different</span>
              <span>Close</span>
              <span>Exact</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">
                Cutting Precision
              </span>

              <span className="text-xs font-black text-purple-300">
                {precision}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={precision}
              onChange={(event) =>
                setPrecision(Number(event.target.value))
              }
              className="mt-4 w-full accent-purple-400"
            />

            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-white/25">
              <span>Rough</span>
              <span>Clean</span>
              <span>Masterful</span>
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-[9px] font-black uppercase tracking-wider text-white/25">
            Professional target
          </div>

          <div className="mt-1 text-sm font-bold text-white/60">
            Aim for at least {difficultyData.targetPrecision}% precision
            for a strong result.
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setStep("consultation")}
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs font-black transition hover:bg-white/10"
          >
            ← BACK
          </button>

          <button
            type="button"
            onClick={handleFinishCut}
            className="flex-1 rounded-2xl bg-purple-400 px-5 py-4 text-xs font-black text-black transition hover:bg-purple-300"
          >
            FINISH CUT ✂️
          </button>
        </div>
      </section>
    );
  }

  function renderFinish() {
    if (!result) return null;

    const total = result.payment + result.tip;

    return (
      <section className="rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-pink-500/10 p-6 shadow-2xl sm:p-8">
        <div className="text-center">
          <div className="text-6xl">
            {result.satisfaction >= 90
              ? "🔥"
              : result.satisfaction >= 75
                ? "💈"
                : "✂️"}
          </div>

          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
            Service Complete
          </div>

          <h2 className="mt-2 text-4xl font-black">
            {result.satisfaction >= 90
              ? "Fresh Cut!"
              : result.satisfaction >= 75
                ? "Good Work!"
                : "Cut Completed"}
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/45">
            {result.message}
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Service
            </div>

            <div className="mt-2 text-2xl font-black text-emerald-300">
              ₦{result.payment.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Tip
            </div>

            <div className="mt-2 text-2xl font-black text-yellow-300">
              ₦{result.tip.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Satisfaction
            </div>

            <div className="mt-2 text-2xl font-black">
              {result.satisfaction}%
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-white/30">
              Energy
            </div>

            <div className="mt-2 text-2xl font-black text-orange-300">
              -{result.energyCost}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            Total Earned
          </div>

          <div className="mt-2 text-4xl font-black">
            ₦{total.toLocaleString()}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onComplete(result)}
          className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-xs font-black text-black transition hover:bg-emerald-300"
        >
          COLLECT PAYMENT & RETURN TO SHOP →
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {step === "consultation" && renderConsultation()}
      {step === "cut" && renderCut()}
      {step === "finish" && renderFinish()}
    </div>
  );
}
