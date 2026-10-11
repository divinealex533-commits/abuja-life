"use client";

import React, { useEffect, useState } from "react";

interface FoodCookingGameProps {
  dishName: string;
  cookingTime: number;
  onComplete: (performance: number) => void;
}

type CookingPhase = "prep" | "cook" | "serve";

export default function FoodCookingGame({
  dishName,
  cookingTime,
  onComplete,
}: FoodCookingGameProps) {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<CookingPhase>("prep");
  const [progress, setProgress] = useState(0);
  const [heat, setHeat] = useState(50);
  const [quality, setQuality] = useState(50);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const targetTime = Math.max(8, Math.min(20, cookingTime));

  function startCooking() {
    setStarted(true);
    setPhase("prep");
    setProgress(0);
    setHeat(50);
    setQuality(50);
    setMistakes(0);
    setFinished(false);
  }

  function chop() {
    if (!started || finished || phase !== "prep") return;

    setProgress((current) => {
      const next = current + 20;

      if (next >= 100) {
        setPhase("cook");
        return 100;
      }

      return next;
    });

    setQuality((current) => Math.min(100, current + 5));
  }

  function increaseHeat() {
    if (!started || finished || phase !== "cook") return;

    setHeat((current) => Math.min(100, current + 8));
  }

  function reduceHeat() {
    if (!started || finished || phase !== "cook") return;

    setHeat((current) => Math.max(0, current - 8));
  }

  function stir() {
    if (!started || finished || phase !== "cook") return;

    const idealHeat = 65;
    const heatDifference = Math.abs(heat - idealHeat);

    if (heatDifference <= 15) {
      setQuality((current) => Math.min(100, current + 7));
    } else {
      setMistakes((current) => current + 1);
      setQuality((current) => Math.max(0, current - 4));
    }
  }

  function serve() {
    if (!started || finished || phase !== "serve") return;

    const performance = Math.max(
      0.5,
      Math.min(
        1,
        quality / 100 - Math.min(0.3, mistakes * 0.05)
      )
    );

    setFinished(true);
    onComplete(performance);
  }

  useEffect(() => {
    if (!started || finished || phase !== "cook") return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = current + 100 / (targetTime * 10);

        if (next >= 100) {
          setPhase("serve");
          return 100;
        }

        return next;
      });

      setHeat((current) => {
        const drift = Math.random() > 0.5 ? 3 : -3;
        return Math.max(0, Math.min(100, current + drift));
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [started, finished, phase, targetTime]);

  if (!started) {
    return (
      <section className="rounded-3xl border border-orange-400/20 bg-black/30 p-6 shadow-2xl">
        <div className="text-sm font-black uppercase tracking-[0.25em] text-orange-300">
          🍳 Abuja Kitchen
        </div>

        <h2 className="mt-3 text-3xl font-black text-white">
          Prepare {dishName}
        </h2>

        <p className="mt-2 text-white/60">
          Prepare the order carefully. Your cooking performance affects
          your final payment and reputation.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-white/40">
              Dish
            </div>

            <div className="mt-1 font-black text-white">
              {dishName}
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-white/40">
              Cooking Time
            </div>

            <div className="mt-1 font-black text-white">
              {cookingTime} min
            </div>
          </div>
        </div>

        <button
          onClick={startCooking}
          className="mt-6 w-full rounded-2xl bg-orange-400 px-5 py-4 font-black text-black transition hover:bg-orange-300 active:scale-[0.98]"
        >
          START COOKING 🍳
        </button>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-6 shadow-2xl">
        <div className="text-sm font-black uppercase tracking-[0.25em] text-orange-300">
          Order Complete
        </div>

        <h2 className="mt-3 text-4xl font-black text-white">
          🍽️ Served!
        </h2>

        <p className="mt-2 text-white/60">
          Your {dishName} has been served to the customer.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-xs text-white/40">
              Kitchen Quality
            </div>

            <div className="mt-1 text-2xl font-black text-orange-300">
              {Math.round(quality)}%
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-xs text-white/40">
              Mistakes
            </div>

            <div className="mt-1 text-2xl font-black text-white">
              {mistakes}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-2xl sm:p-6">
      <div className="mb-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
          🍳 Live Kitchen
        </div>

        <h2 className="mt-2 text-2xl font-black text-white">
          Cooking {dishName}
        </h2>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex justify-between text-xs font-bold text-white/50">
          <span>
            {phase === "prep"
              ? "Preparation"
              : phase === "cook"
              ? "Cooking"
              : "Serving"}
          </span>

          <span>{Math.round(progress)}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {phase === "prep" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-7xl">🔪🥕🍅</div>

          <h3 className="mt-4 text-2xl font-black text-white">
            Prepare your ingredients
          </h3>

          <p className="mt-2 text-sm text-white/50">
            Chop and prepare the ingredients before putting the food on
            the stove.
          </p>

          <button
            onClick={chop}
            className="mt-6 w-full rounded-2xl bg-orange-400 px-5 py-4 font-black text-black transition hover:bg-orange-300 active:scale-95"
          >
            CHOP INGREDIENTS 🔪
          </button>
        </div>
      )}

      {phase === "cook" && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-center text-7xl">🍳🔥</div>

          <h3 className="mt-4 text-center text-2xl font-black text-white">
            Control the cooking
          </h3>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-bold text-white/50">
              <span>Heat</span>

              <span>{Math.round(heat)}%</span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-red-400 transition-all"
                style={{
                  width: `${heat}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={reduceHeat}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 font-black text-white active:scale-95"
            >
              🔥− REDUCE
            </button>

            <button
              onClick={increaseHeat}
              className="rounded-2xl bg-red-400 px-4 py-4 font-black text-black active:scale-95"
            >
              🔥+ INCREASE
            </button>
          </div>

          <button
            onClick={stir}
            className="mt-3 w-full rounded-2xl bg-orange-400 px-5 py-4 font-black text-black active:scale-95"
          >
            🥄 STIR FOOD
          </button>

          <div className="mt-5 rounded-2xl bg-black/20 p-4 text-center">
            <div className="text-xs text-white/40">
              Kitchen Quality
            </div>

            <div className="mt-1 text-2xl font-black text-orange-300">
              {Math.round(quality)}%
            </div>
          </div>
        </div>
      )}

      {phase === "serve" && (
        <div className="rounded-3xl border border-orange-400/20 bg-orange-500/10 p-6 text-center">
          <div className="text-7xl">🍽️</div>

          <h3 className="mt-4 text-3xl font-black text-white">
            Ready to serve!
          </h3>

          <p className="mt-2 text-white/60">
            The food is ready. Serve it to your customer before the order
            gets cold.
          </p>

          <button
            onClick={serve}
            className="mt-6 w-full rounded-2xl bg-orange-400 px-5 py-4 font-black text-black transition hover:bg-orange-300 active:scale-95"
          >
            SERVE ORDER 🍽️
          </button>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/5 p-4 text-center">
          <div className="text-xs text-white/40">
            Quality
          </div>

          <div className="mt-1 font-black text-white">
            {Math.round(quality)}%
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 text-center">
          <div className="text-xs text-white/40">
            Mistakes
          </div>

          <div className="mt-1 font-black text-white">
            {mistakes}
          </div>
        </div>
      </div>
    </section>
  );
}