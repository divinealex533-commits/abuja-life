"use client";

import React, { useEffect, useRef, useState } from "react";

interface TaxiDrivingGameProps {
  traffic: "light" | "normal" | "heavy";
  distanceKm: number;
  onComplete: (performance: number) => void;
}

interface TrafficCar {
  id: number;
  lane: number;
  y: number;
  speed: number;
}

const LANES = [25, 50, 75];

export default function TaxiDrivingGame({
  traffic,
  distanceKm,
  onComplete,
}: TaxiDrivingGameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);

  const [lane, setLane] = useState(1);
  const [playerY, setPlayerY] = useState(82);
  const [distance, setDistance] = useState(0);
  const [hits, setHits] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [trafficCars, setTrafficCars] = useState<TrafficCar[]>([]);
  const [speed, setSpeed] = useState(1);

  const targetDistance = Math.max(100, distanceKm * 100);

  function startDriving() {
    setStarted(true);
    setFinished(false);
    setDistance(0);
    setHits(0);
    setPlayerY(82);

    setTrafficCars([
      {
        id: 1,
        lane: 0,
        y: 10,
        speed: 0.7,
      },
      {
        id: 2,
        lane: 2,
        y: 35,
        speed: 0.9,
      },
    ]);
  }

  function moveLeft() {
    if (!started || finished) return;

    setLane((current) => Math.max(0, current - 1));
  }

  function moveRight() {
    if (!started || finished) return;

    setLane((current) => Math.min(2, current + 1));
  }

  function slowDown() {
    if (!started || finished) return;

    setSpeed((current) => Math.max(0.5, current - 0.2));
  }

  function accelerate() {
    if (!started || finished) return;

    setSpeed((current) => Math.min(1.5, current + 0.2));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        moveLeft();
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        moveRight();
      }

      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        accelerate();
      }

      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        slowDown();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  useEffect(() => {
    if (!started || finished) return;

    const trafficMultiplier =
      traffic === "heavy"
        ? 1.35
        : traffic === "normal"
        ? 1
        : 0.7;

    const timer = window.setInterval(() => {
      setDistance((current) => {
        const next = current + speed * trafficMultiplier;

        if (next >= targetDistance) {
          setFinished(true);

          const basePerformance =
            1 - Math.min(0.45, hits * 0.12);

          onComplete(
            Math.max(0.5, Math.min(1, basePerformance))
          );

          return targetDistance;
        }

        return next;
      });

      setTrafficCars((cars) =>
        cars
          .map((car) => ({
            ...car,
            y: car.y + car.speed * trafficMultiplier,
          }))
          .filter((car) => car.y < 100)
      );

      if (Math.random() < 0.15) {
        setTrafficCars((cars) => [
          ...cars,
          {
            id: Date.now(),
            lane: Math.floor(Math.random() * 3),
            y: -10,
            speed:
              0.5 +
              Math.random() * 0.8,
          },
        ]);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [
    started,
    finished,
    speed,
    traffic,
    targetDistance,
    hits,
    onComplete,
  ]);

  useEffect(() => {
    if (!started || finished) return;

    const collisionTimer = window.setInterval(() => {
      setTrafficCars((cars) => {
        const collision = cars.some(
          (car) =>
            car.lane === lane &&
            car.y > playerY - 8 &&
            car.y < playerY + 8
        );

        if (collision) {
          setHits((current) => current + 1);
        }

        return cars;
      });
    }, 250);

    return () =>
      window.clearInterval(collisionTimer);
  }, [started, finished, lane, playerY]);

  const progress = Math.min(
    100,
    Math.round(
      (distance / targetDistance) * 100
    )
  );

  if (!started) {
    return (
      <section className="rounded-3xl border border-emerald-400/20 bg-black/30 p-6 shadow-2xl">
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
          🚕 Abuja Driving Mission
        </div>

        <h2 className="mt-3 text-3xl font-black text-white">
          Get ready to drive
        </h2>

        <p className="mt-2 text-white/60">
          Drive through Abuja and reach the destination
          without causing too many crashes.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-white/40">
              Distance
            </div>

            <div className="mt-1 font-black text-white">
              {distanceKm} km
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <div className="text-xs text-white/40">
              Traffic
            </div>

            <div className="mt-1 font-black capitalize text-white">
              {traffic}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          <div className="font-bold text-white">
            🎮 Controls
          </div>

          <p className="mt-2">
            Use <b>← →</b> or <b>A / D</b> to change lanes.
          </p>

          <p className="mt-1">
            Use <b>↑ / W</b> to accelerate.
          </p>

          <p className="mt-1">
            Use <b>↓ / S</b> to slow down.
          </p>
        </div>

        <button
          onClick={startDriving}
          className="mt-6 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black transition hover:bg-emerald-300"
        >
          START DRIVING 🚕
        </button>
      </section>
    );
  }

  if (finished) {
    const performance =
      hits === 0
        ? "Excellent"
        : hits === 1
        ? "Good"
        : hits === 2
        ? "Okay"
        : "Rough Trip";

    return (
      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-6 shadow-2xl">
        <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
          Trip Complete
        </div>

        <h2 className="mt-3 text-4xl font-black text-white">
          🏁 You made it!
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-xs text-white/40">
              Driving
            </div>

            <div className="mt-1 font-black text-emerald-300">
              {performance}
            </div>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="text-xs text-white/40">
              Traffic Hits
            </div>

            <div className="mt-1 font-black text-white">
              {hits}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            🚕 Live Drive
          </div>

          <h2 className="mt-1 text-2xl font-black text-white">
            Drive to destination
          </h2>
        </div>

        <div className="rounded-xl bg-white/5 px-3 py-2 text-right">
          <div className="text-xs text-white/40">
            Traffic
          </div>

          <div className="font-bold capitalize text-white">
            {traffic}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-xs font-bold text-white/50">
          <span>Journey</span>
          <span>{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div
        ref={gameRef}
        className="relative mx-auto h-[520px] max-w-[430px] overflow-hidden rounded-3xl border border-white/10 bg-slate-900"
      >
        {/* Sky */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-sky-900/60 to-slate-800" />

        {/* City */}
        <div className="absolute inset-x-0 top-[18%] h-[20%] opacity-60">
          <div className="absolute left-[5%] bottom-0 h-24 w-12 bg-slate-700" />
          <div className="absolute left-[20%] bottom-0 h-32 w-16 bg-slate-600" />
          <div className="absolute right-[20%] bottom-0 h-28 w-14 bg-slate-700" />
          <div className="absolute right-[5%] bottom-0 h-20 w-12 bg-slate-600" />
        </div>

        {/* Road */}
        <div className="absolute inset-x-[10%] bottom-0 top-[30%] bg-slate-700">
          <div className="absolute inset-y-0 left-1/3 border-l-4 border-dashed border-white/30" />
          <div className="absolute inset-y-0 left-2/3 border-l-4 border-dashed border-white/30" />

          <div className="absolute inset-x-0 top-0 border-t-4 border-white/20" />
          <div className="absolute inset-x-0 bottom-0 border-b-4 border-white/20" />
        </div>

        {/* Traffic */}
        {trafficCars.map((car) => (
          <div
            key={car.id}
            className="absolute z-20 h-14 w-10 rounded-xl bg-red-500 shadow-lg transition-all"
            style={{
              left: `${10 + LANES[car.lane] * 0.8}%`,
              top: `${30 + car.y * 0.65}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="absolute left-1 top-2 h-3 w-8 rounded bg-slate-900/70" />
          </div>
        ))}

        {/* Player taxi */}
        <div
          className="absolute z-30 h-20 w-14 rounded-2xl bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.35)] transition-all duration-150"
          style={{
            left: `${10 + LANES[lane] * 0.8}%`,
            top: `${playerY}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="absolute left-1 top-3 h-7 w-12 rounded-lg bg-slate-900/80" />

          <div className="absolute -bottom-1 left-1 h-3 w-3 rounded-full bg-black" />
          <div className="absolute -bottom-1 right-1 h-3 w-3 rounded-full bg-black" />
        </div>

        {/* Destination */}
        <div className="absolute right-3 top-3 z-40 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black">
          DESTINATION
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={moveLeft}
          className="rounded-2xl bg-white/10 px-4 py-4 text-2xl font-black text-white active:scale-95"
        >
          ◀
        </button>

        <button
          onClick={moveRight}
          className="rounded-2xl bg-white/10 px-4 py-4 text-2xl font-black text-white active:scale-95"
        >
          ▶
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={slowDown}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white"
        >
          BRAKE
        </button>

        <button
          onClick={accelerate}
          className="rounded-2xl bg-emerald-400 px-4 py-3 font-black text-black"
        >
          ACCELERATE
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Progress
          </div>

          <div className="mt-1 font-black text-white">
            {progress}%
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Speed
          </div>

          <div className="mt-1 font-black text-white">
            {speed.toFixed(1)}x
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <div className="text-white/40">
            Hits
          </div>

          <div className="mt-1 font-black text-white">
            {hits}
          </div>
        </div>
      </div>
    </section>
  );
}