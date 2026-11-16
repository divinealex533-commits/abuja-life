"use client";

import { useEffect, useRef, useState } from "react";

import {
  calculateFashionResult,
  type FashionCustomer,
  type FashionDesignResult,
  type FashionFabric,
  type FashionStyle,
} from "@/lib/game/fashionDesigner";

const STYLES: Array<{ id: FashionStyle; label: string; emoji: string }> = [
  { id: "traditional", label: "Traditional", emoji: "🪡" },
  { id: "streetwear", label: "Streetwear", emoji: "🧢" },
  { id: "formal", label: "Formal", emoji: "🤵" },
  { id: "casual", label: "Casual", emoji: "👕" },
  { id: "luxury", label: "Luxury", emoji: "💎" },
];

const FABRICS: Array<{ id: FashionFabric; label: string; emoji: string }> = [
  { id: "ankara", label: "Ankara", emoji: "🟧" },
  { id: "lace", label: "Lace", emoji: "🤍" },
  { id: "cotton", label: "Cotton", emoji: "☁️" },
  { id: "silk", label: "Silk", emoji: "✨" },
  { id: "denim", label: "Denim", emoji: "👖" },
];

type Step = "style" | "cutting" | "finishing" | "done";

/** A moving marker; stop it as close to the centre as possible. */
function useSweep(active: boolean, speed: number) {
  const [position, setPosition] = useState(0);
  const direction = useRef(1);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setPosition((p) => {
        let next = p + direction.current * speed;
        if (next >= 100) {
          next = 100;
          direction.current = -1;
        } else if (next <= 0) {
          next = 0;
          direction.current = 1;
        }
        return next;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [active, speed]);

  return position;
}

function scoreFromPosition(position: number) {
  // 1.0 at the centre (50), 0 at the edges.
  return Math.max(0, 1 - Math.abs(position - 50) / 50);
}

export default function FashionDesignerPanel({
  customer,
  onComplete,
}: {
  customer: FashionCustomer;
  onComplete: (result: FashionDesignResult) => void | Promise<void>;
}) {
  const [step, setStep] = useState<Step>("style");
  const [style, setStyle] = useState<FashionStyle | null>(null);
  const [fabric, setFabric] = useState<FashionFabric | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const [result, setResult] = useState<FashionDesignResult | null>(null);

  const speed = customer.difficulty === "hard" ? 4 : customer.difficulty === "medium" ? 3 : 2;
  const cutPosition = useSweep(step === "cutting", speed);
  const finishPosition = useSweep(step === "finishing", speed + 1);

  // New customer → start over.
  useEffect(() => {
    setStep("style");
    setStyle(null);
    setFabric(null);
    setAccuracy(0);
    setResult(null);
  }, [customer.id]);

  function stopCutting() {
    setAccuracy(scoreFromPosition(cutPosition));
    setStep("finishing");
  }

  function stopFinishing() {
    if (!style || !fabric) return;
    const finish = scoreFromPosition(finishPosition);
    const outcome = calculateFashionResult(customer, style, fabric, accuracy, finish);
    setResult(outcome);
    setStep("done");
    void onComplete(outcome);
  }

  const marker = (position: number) => (
    <div className="relative mt-5 h-10 overflow-hidden rounded-full bg-white/10">
      <div className="absolute inset-y-0 left-[40%] w-[20%] bg-emerald-400/25" />
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-emerald-300" />
      <div
        className="absolute top-1 h-8 w-3 -translate-x-1/2 rounded-full bg-pink-300 shadow-lg"
        style={{ left: `${position}%` }}
      />
    </div>
  );

  return (
    <section className="rounded-3xl border border-pink-400/20 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300">
            Customer · {customer.difficulty}
          </div>
          <h2 className="mt-2 text-2xl font-black">{customer.name}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">“{customer.request}”</p>
        </div>
        <div className="rounded-2xl bg-black/30 px-4 py-3 text-right">
          <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Budget</div>
          <div className="text-xl font-black text-emerald-300">₦{customer.budget.toLocaleString()}</div>
        </div>
      </div>

      {step === "style" && (
        <div className="mt-8 space-y-6">
          <div>
            <div className="text-sm font-black">1. Choose a style</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`rounded-2xl border p-3 text-sm font-bold transition ${
                    style === s.id ? "border-pink-300 bg-pink-400/20" : "border-white/10 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="text-2xl">{s.emoji}</div>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-black">2. Choose a fabric</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {FABRICS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFabric(f.id)}
                  className={`rounded-2xl border p-3 text-sm font-bold transition ${
                    fabric === f.id ? "border-pink-300 bg-pink-400/20" : "border-white/10 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="text-2xl">{f.emoji}</div>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!style || !fabric}
            onClick={() => setStep("cutting")}
            className="w-full rounded-2xl bg-pink-400 py-4 text-sm font-black text-black transition hover:bg-pink-300 disabled:opacity-40"
          >
            START CUTTING THE FABRIC →
          </button>
        </div>
      )}

      {step === "cutting" && (
        <div className="mt-8 text-center">
          <div className="text-4xl">✂️</div>
          <div className="mt-2 text-lg font-black">Cut the pattern</div>
          <p className="text-sm text-white/50">Stop the marker in the green zone for a precise cut.</p>
          {marker(cutPosition)}
          <button
            type="button"
            onClick={stopCutting}
            className="mt-6 rounded-2xl bg-pink-400 px-10 py-4 text-sm font-black text-black hover:bg-pink-300"
          >
            CUT!
          </button>
        </div>
      )}

      {step === "finishing" && (
        <div className="mt-8 text-center">
          <div className="text-4xl">🧵</div>
          <div className="mt-2 text-lg font-black">Finish the stitching</div>
          <p className="text-sm text-white/50">
            Cut accuracy: {Math.round(accuracy * 100)}%. Now stop the needle in the green zone.
          </p>
          {marker(finishPosition)}
          <button
            type="button"
            onClick={stopFinishing}
            className="mt-6 rounded-2xl bg-pink-400 px-10 py-4 text-sm font-black text-black hover:bg-pink-300"
          >
            STITCH!
          </button>
        </div>
      )}

      {step === "done" && result && (
        <div className="mt-8 rounded-2xl border border-pink-400/20 bg-black/30 p-5">
          <div className="text-lg font-black">{result.message}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-white/40">Satisfaction</div>
              <div className="font-black">{result.satisfaction}%</div>
            </div>
            <div>
              <div className="text-white/40">Tip</div>
              <div className="font-black">₦{result.tip.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-white/40">Reputation</div>
              <div className="font-black">+{result.reputationGain}</div>
            </div>
            <div>
              <div className="text-white/40">Total earned</div>
              <div className="font-black text-emerald-300">₦{result.totalPayment.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
