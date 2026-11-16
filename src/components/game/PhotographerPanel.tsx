"use client";

import { useMemo, useState } from "react";

import {
  calculatePhotographyResult,
  type PhotographyClient,
  type PhotographyLighting,
  type PhotographyStyle,
} from "@/lib/game/photographer";

interface PhotographerPanelProps {
  client: PhotographyClient;
  onComplete: (
    result: ReturnType<typeof calculatePhotographyResult>
  ) => void;
}

const STYLES: {
  id: PhotographyStyle;
  label: string;
  icon: string;
}[] = [
  { id: "portrait", label: "Portrait", icon: "🧑🏾‍💼" },
  { id: "event", label: "Event", icon: "🎉" },
  { id: "street", label: "Street", icon: "🚶🏾" },
  { id: "product", label: "Product", icon: "📦" },
  { id: "landscape", label: "Landscape", icon: "🏞️" },
];

const LIGHTING: {
  id: PhotographyLighting;
  label: string;
  icon: string;
}[] = [
  { id: "natural", label: "Natural", icon: "☀️" },
  { id: "studio", label: "Studio", icon: "💡" },
  { id: "golden-hour", label: "Golden Hour", icon: "🌅" },
  { id: "night", label: "Night", icon: "🌙" },
];

export default function PhotographerPanel({
  client,
  onComplete,
}: PhotographerPanelProps) {
  const [step, setStep] = useState<
    "brief" | "style" | "lighting" | "camera" | "result"
  >("brief");

  const [style, setStyle] =
    useState<PhotographyStyle>("portrait");

  const [lighting, setLighting] =
    useState<PhotographyLighting>("natural");

  const [focus, setFocus] = useState(0.8);
  const [composition, setComposition] = useState(0.8);
  const [exposure, setExposure] = useState(0.8);

  const result = useMemo(
    () =>
      calculatePhotographyResult(
        client,
        style,
        lighting,
        focus,
        composition,
        exposure
      ),
    [client, style, lighting, focus, composition, exposure]
  );

  function finishShoot() {
    setStep("result");
    onComplete(result);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
              Photography Studio
            </div>

            <h2 className="mt-2 text-2xl font-black">
              {client.name}'s Shoot
            </h2>

            <p className="mt-1 text-xs text-white/35">
              📍 {client.location}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
              Budget
            </div>

            <div className="mt-1 text-lg font-black">
              ₦{client.budget.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === "brief" && (
          <div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="text-5xl">📸</div>

              <h3 className="mt-4 text-xl font-black">
                Client Brief
              </h3>

              <p className="mt-3 leading-7 text-white/55">
                {client.request}
              </p>
            </div>

            <button
              onClick={() => setStep("style")}
              className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black transition hover:bg-cyan-300"
            >
              START SHOOT →
            </button>
          </div>
        )}

        {step === "style" && (
          <div>
            <h3 className="text-xl font-black">
              Choose photography style
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Match the style requested by the client.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    style === item.id
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
              onClick={() => setStep("lighting")}
              className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-black text-black"
            >
              CHOOSE LIGHTING →
            </button>
          </div>
        )}

        {step === "lighting" && (
          <div>
            <h3 className="text-xl font-black">
              Select lighting
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Pick the lighting that best matches the client's request.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {LIGHTING.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLighting(item.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    lighting === item.id
                      ? "border-blue-400/60 bg-blue-400/10"
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
              onClick={() => setStep("camera")}
              className="mt-6 w-full rounded-2xl bg-blue-400 px-5 py-4 text-sm font-black text-black"
            >
              SET CAMERA →
            </button>
          </div>
        )}

        {step === "camera" && (
          <div>
            <h3 className="text-xl font-black">
              Camera Setup
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Balance focus, composition and exposure before taking the shot.
            </p>

            <div className="mt-7 space-y-7">
              <div>
                <div className="mb-3 flex justify-between">
                  <span className="text-sm font-bold">Focus</span>
                  <span className="font-black text-cyan-300">
                    {Math.round(focus * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={focus}
                  onChange={(event) =>
                    setFocus(Number(event.target.value))
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <div className="mb-3 flex justify-between">
                  <span className="text-sm font-bold">
                    Composition
                  </span>
                  <span className="font-black text-blue-300">
                    {Math.round(composition * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={composition}
                  onChange={(event) =>
                    setComposition(Number(event.target.value))
                  }
                  className="w-full accent-blue-400"
                />
              </div>

              <div>
                <div className="mb-3 flex justify-between">
                  <span className="text-sm font-bold">
                    Exposure
                  </span>
                  <span className="font-black text-purple-300">
                    {Math.round(exposure * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={exposure}
                  onChange={(event) =>
                    setExposure(Number(event.target.value))
                  }
                  className="w-full accent-purple-400"
                />
              </div>
            </div>

            <button
              onClick={finishShoot}
              className="mt-7 w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-black transition hover:bg-emerald-300"
            >
              TAKE FINAL SHOT 📸
            </button>
          </div>
        )}

        {step === "result" && (
          <div className="text-center">
            <div className="text-6xl">
              {result.satisfaction >= 90
                ? "🔥"
                : result.satisfaction >= 75
                  ? "📸"
                  : "🙂"}
            </div>

            <h3 className="mt-4 text-2xl font-black">
              {result.message}
            </h3>

            <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                  Photo Quality
                </div>

                <div className="mt-2 text-2xl font-black text-cyan-300">
                  {result.quality}%
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">
                  Satisfaction
                </div>

                <div className="mt-2 text-2xl font-black text-blue-300">
                  {result.satisfaction}%
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

            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-white/10 bg-black/20 p-5 text-left text-sm">
              <div className="flex justify-between py-2">
                <span className="text-white/40">Style bonus</span>
                <span className="font-bold">
                  +₦{result.styleBonus.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-white/40">
                  Lighting bonus
                </span>
                <span className="font-bold">
                  +₦{result.lightingBonus.toLocaleString()}
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
                <span className="text-white/40">Tip</span>
                <span className="font-bold text-emerald-300">
                  +₦{result.tip.toLocaleString()}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                <span className="font-black">Reputation</span>
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
