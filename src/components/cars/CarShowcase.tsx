"use client";

import { useEffect, useRef, useState } from "react";

import CarModel from "@/components/cars/CarModel";
import { EngineSound } from "@/lib/cars/engine";
import { PAINTS, bodyFor, defaultPaint, paintHex } from "@/lib/cars/style";
import type { Vehicle } from "@/lib/game/vehicles";

/**
 * Showroom stage for one car: studio model in any paint, real photo,
 * start the engine, rev it, and drive it across the floor.
 */
export default function CarShowcase({
  vehicle,
  paint,
  onPaint,
}: {
  vehicle: Vehicle;
  paint: string;
  onPaint: (paintId: string) => void;
}) {
  const body = bodyFor(vehicle);
  const [view, setView] = useState<"studio" | "photo">("studio");
  const [photoOk, setPhotoOk] = useState(true);
  const [engineOn, setEngineOn] = useState(false);
  const [driving, setDriving] = useState(false);
  const [shake, setShake] = useState(false);
  const engine = useRef<EngineSound | null>(null);

  useEffect(() => () => engine.current?.stop(), []);

  function toggleEngine() {
    engine.current ??= new EngineSound();
    if (engine.current.running) {
      engine.current.stop();
      setEngineOn(false);
      setDriving(false);
    } else {
      engine.current.start(body);
      setEngineOn(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 1300);
    }
  }

  function rev() {
    if (!engineOn) return;
    engine.current?.rev();
    setShake(true);
    window.setTimeout(() => setShake(false), 900);
  }

  function drive() {
    if (!engineOn) toggleEngine();
    engine.current?.rev();
    setDriving(true);
    window.setTimeout(() => setDriving(false), 2600);
  }

  return (
    <div>
      <style>{`
        @keyframes cs-shake{0%,100%{transform:translate(0,0)}25%{transform:translate(1px,-1px)}50%{transform:translate(-1px,1px)}75%{transform:translate(1px,1px)}}
        @keyframes cs-drive{0%{transform:translateX(0)}45%{transform:translateX(120%)}46%{transform:translateX(-120%)}100%{transform:translateX(0)}}
        @keyframes cs-spot{0%,100%{opacity:.55}50%{opacity:.8}}
        @keyframes cs-floor{from{background-position:0 0}to{background-position:-200px 0}}
      `}</style>

      <div className="relative h-60 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f19] sm:h-72">
        {/* studio lights */}
        <div
          className="absolute left-1/2 top-0 h-full w-[120%] -translate-x-1/2"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.28), transparent 60%)",
            animation: "cs-spot 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background: "linear-gradient(180deg, #1e293b, #0b0f19), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 100px)",
            backgroundBlendMode: "screen",
            animation: driving ? "cs-floor .3s linear infinite" : "none",
          }}
        />

        {view === "studio" || !photoOk ? (
          <div
            className="absolute inset-x-3 bottom-3"
            style={{
              animation: driving ? "cs-drive 2.6s ease-in-out" : shake ? "cs-shake .09s linear infinite" : "none",
            }}
          >
            <CarModel body={body} color={paintHex(paint)} driving={driving} lights={engineOn} className="w-full" />
            {/* reflection */}
            <div className="pointer-events-none -mt-6 h-10 scale-y-[-1] opacity-20 blur-[2px]">
              <CarModel body={body} color={paintHex(paint)} className="w-full" />
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.image}
            alt={vehicle.name}
            onError={() => setPhotoOk(false)}
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        )}

        <div className="absolute left-3 top-3 flex rounded-full bg-black/60 p-1 text-xs font-black">
          {(["studio", "photo"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 capitalize ${view === v ? "bg-white text-black" : "text-white/60"}`}
            >
              {v === "studio" ? "🎨 Studio" : "📷 Photo"}
            </button>
          ))}
        </div>
        {engineOn && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase text-black">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" /> Engine on
          </div>
        )}
        {view === "photo" && !photoOk && (
          <div className="absolute bottom-2 left-3 text-[10px] text-white/50">Photo unavailable, showing studio model.</div>
        )}
      </div>

      {/* paint */}
      <div className="mt-4">
        <div className="text-xs font-black uppercase tracking-wider text-white/50">
          Paint · {PAINTS.find((p) => p.id === paint)?.label}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAINTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onPaint(p.id);
                setView("studio");
              }}
              aria-label={p.label}
              className={`h-9 w-9 rounded-full border-2 shadow-inner transition ${paint === p.id ? "scale-110 border-white" : "border-white/20"}`}
              style={{ background: `radial-gradient(circle at 30% 30%, #fff8, ${p.hex} 45%, #000a)` }}
            />
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={toggleEngine}
          className={`rounded-2xl py-3 text-sm font-black ${engineOn ? "bg-red-500" : "bg-emerald-500 text-black"}`}
        >
          {engineOn ? "⏹ Engine off" : "🔑 Start engine"}
        </button>
        <button type="button" onClick={rev} disabled={!engineOn} className="rounded-2xl bg-white/10 py-3 text-sm font-black disabled:opacity-40">
          🔥 Rev
        </button>
        <button type="button" onClick={drive} className="rounded-2xl bg-white/10 py-3 text-sm font-black">
          🏁 Drive
        </button>
      </div>
    </div>
  );
}

export { defaultPaint, bodyFor };
