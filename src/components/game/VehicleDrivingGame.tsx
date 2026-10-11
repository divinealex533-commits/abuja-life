"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  OwnedVehicle,
  Vehicle,
} from "@/lib/game/vehicles";

import type { CityState } from "@/lib/game/city";

import {
  calculateConditionLoss,
  calculateDrivingScore,
  getDrivingFuelUsage,
  getDrivingMessage,
  type DrivingDestination,
  type DrivingResult,
} from "@/lib/game/vehicleDriving";

interface VehicleDrivingGameProps {
  vehicle: Vehicle;
  ownedVehicle: OwnedVehicle;
  destination: DrivingDestination;
  city: CityState;
  onComplete: (result: DrivingResult) => void;
  onCancel: () => void;
}

interface TrafficCar {
  id: number;
  lane: number;
  position: number;
  speed: number;
}

export default function VehicleDrivingGame({
  vehicle,
  ownedVehicle,
  destination,
  city,
  onComplete,
  onCancel,
}: VehicleDrivingGameProps) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [speed, setSpeed] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);

  const [distance, setDistance] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const [safetyScore, setSafetyScore] = useState(100);
  const [speedScore, setSpeedScore] = useState(100);
  const [controlScore, setControlScore] = useState(100);
  const [trafficScore, setTrafficScore] = useState(100);

  const [trafficCars, setTrafficCars] = useState<TrafficCar[]>([]);

  const [message, setMessage] = useState(
    "Press START DRIVE to begin."
  );

  const maxSpeed = useMemo(() => {
    return Math.max(
      80,
      Math.min(
        280,
        Math.round(
          vehicle.speed *
            (1 + ownedVehicle.performanceLevel * 0.04)
        )
      )
    );
  }, [
    vehicle.speed,
    ownedVehicle.performanceLevel,
  ]);

  const weatherPenalty = useMemo(() => {
    const weather = city.weather.toLowerCase();

    if (
      weather.includes("storm") ||
      weather.includes("heavy rain")
    ) {
      return 18;
    }

    if (weather.includes("rain")) {
      return 10;
    }

    if (weather.includes("haze")) {
      return 6;
    }

    return 0;
  }, [city.weather]);

  const finishDrive = useCallback(() => {
    if (finished) return;

    const finalSafety = Math.max(
      0,
      Math.min(100, safetyScore)
    );

    const finalSpeed = Math.max(
      0,
      Math.min(100, speedScore)
    );

    const finalControl = Math.max(
      0,
      Math.min(100, controlScore)
    );

    const finalTraffic = Math.max(
      0,
      Math.min(100, trafficScore)
    );

    const score = calculateDrivingScore(
      finalSafety,
      finalSpeed,
      finalControl,
      finalTraffic
    );

    const fuelUsed = getDrivingFuelUsage(
      vehicle,
      ownedVehicle,
      destination.distanceKm,
      destination.trafficLevel
    );

    const conditionLoss = calculateConditionLoss(
      vehicle,
      mistakes,
      destination.trafficLevel
    );

    setFinished(true);

    onComplete({
      completed: true,
      score,
      safetyScore: finalSafety,
      speedScore: finalSpeed,
      controlScore: finalControl,
      trafficScore: finalTraffic,
      mistakes,
      distanceKm: destination.distanceKm,
      fuelUsed,
      conditionLoss,
      message: getDrivingMessage(score, mistakes),
    });
  }, [
    finished,
    safetyScore,
    speedScore,
    controlScore,
    trafficScore,
    vehicle,
    ownedVehicle,
    destination,
    mistakes,
    onComplete,
  ]);

  const createTraffic = useCallback(() => {
    const cars: TrafficCar[] = [];

    const count =
      destination.trafficLevel >= 65
        ? 5
        : destination.trafficLevel >= 45
          ? 4
          : 3;

    for (let index = 0; index < count; index += 1) {
      cars.push({
        id: Date.now() + index,
        lane: Math.floor(Math.random() * 3),
        position: -20 - index * 25,
        speed:
          25 +
          Math.random() * 45 +
          destination.trafficLevel * 0.15,
      });
    }

    setTrafficCars(cars);
  }, [destination.trafficLevel]);

  useEffect(() => {
    if (!started || finished) return;

    const interval = window.setInterval(() => {
      setTrafficCars((currentCars) => {
        return currentCars
          .map((car) => ({
            ...car,
            position:
              car.position +
              Math.max(1.2, car.speed / 25),
          }))
          .filter((car) => car.position < 120);
      });

      setDistance((currentDistance) => {
        const movement =
          Math.max(0.01, speed / 3600);

        const nextDistance =
          currentDistance + movement;

        if (
          nextDistance >=
          destination.distanceKm
        ) {
          window.setTimeout(
            finishDrive,
            100
          );
          return destination.distanceKm;
        }

        return nextDistance;
      });

      setSafetyScore((current) => {
        const target =
          100 -
          mistakes * 7 -
          weatherPenalty * 0.35;

        return Math.max(
          0,
          Math.min(100, current * 0.9 + target * 0.1)
        );
      });

      setSpeedScore((current) => {
        const idealSpeed =
          destination.difficulty === "hard"
            ? maxSpeed * 0.65
            : maxSpeed * 0.72;

        const difference =
          Math.abs(speed - idealSpeed);

        const next =
          100 -
          Math.min(
            60,
            difference / 2.5
          );

        return Math.max(
          0,
          Math.min(
            100,
            current * 0.9 + next * 0.1
          )
        );
      });
    }, 250);

    return () =>
      window.clearInterval(interval);
  }, [
    started,
    finished,
    speed,
    destination.distanceKm,
    destination.difficulty,
    maxSpeed,
    mistakes,
    weatherPenalty,
    finishDrive,
  ]);

  useEffect(() => {
    if (!started || finished) return;

    const collisionCheck =
      window.setInterval(() => {
        const dangerCars =
          trafficCars.filter(
            (car) =>
              car.lane === playerLane &&
              car.position > 65 &&
              car.position < 90
          );

        if (dangerCars.length > 0 && speed > 35) {
          setMistakes((current) => current + 1);

          setSafetyScore((current) =>
            Math.max(0, current - 10)
          );

          setControlScore((current) =>
            Math.max(0, current - 8)
          );

          setTrafficScore((current) =>
            Math.max(0, current - 7)
          );

          setSpeed((current) =>
            Math.max(0, current - 20)
          );

          setMessage(
            "⚠️ Close call! Watch the traffic."
          );

          setTrafficCars((cars) =>
            cars.filter(
              (car) =>
                !dangerCars.some(
                  (danger) =>
                    danger.id === car.id
                )
            )
          );
        }
      }, 300);

    return () =>
      window.clearInterval(collisionCheck);
  }, [
    started,
    finished,
    trafficCars,
    playerLane,
    speed,
  ]);

  useEffect(() => {
    if (!started || finished) return;

    const keyboard = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "a"
      ) {
        setPlayerLane((lane) =>
          Math.max(0, lane - 1)
        );
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        setPlayerLane((lane) =>
          Math.min(2, lane + 1)
        );
      }

      if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "w"
      ) {
        setSpeed((current) =>
          Math.min(maxSpeed, current + 8)
        );
      }

      if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s"
      ) {
        setSpeed((current) =>
          Math.max(0, current - 12)
        );
      }

      if (event.code === "Space") {
        event.preventDefault();

        setSpeed((current) =>
          Math.max(0, current - 28)
        );
      }
    };

    window.addEventListener(
      "keydown",
      keyboard
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyboard
      );
  }, [
    started,
    finished,
    maxSpeed,
  ]);

  const startDrive = () => {
    createTraffic();
    setStarted(true);
    setMessage(
      "Drive carefully. Watch the traffic!"
    );
  };

  const progress =
    destination.distanceKm > 0
      ? Math.min(
          100,
          (distance /
            destination.distanceKm) *
            100
        )
      : 100;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#030807] text-white">
      <div className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
        {!started && !finished && (
          <div className="flex min-h-[85vh] items-center justify-center">
            <div className="w-full max-w-2xl rounded-3xl border border-emerald-400/20 bg-[#0b1916] p-6 shadow-2xl md:p-10">
              <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                Vehicle Driving
              </div>

              <h1 className="mt-2 text-4xl font-black">
                Drive to {destination.name}
              </h1>

              <p className="mt-3 text-white/50">
                {destination.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/30 p-4">
                  <div className="text-xs text-white/40">
                    VEHICLE
                  </div>
                  <div className="mt-1 font-black">
                    {vehicle.name}
                  </div>
                </div>

                <div className="rounded-2xl bg-black/30 p-4">
                  <div className="text-xs text-white/40">
                    DISTANCE
                  </div>
                  <div className="mt-1 font-black">
                    {destination.distanceKm} km
                  </div>
                </div>

                <div className="rounded-2xl bg-black/30 p-4">
                  <div className="text-xs text-white/40">
                    TRAFFIC
                  </div>
                  <div className="mt-1 font-black">
                    {destination.trafficLevel}%
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="font-black">
                  🎮 Controls
                </div>

                <div className="mt-3 grid gap-2 text-sm text-white/60 sm:grid-cols-2">
                  <div>W / ↑ — Accelerate</div>
                  <div>S / ↓ — Brake</div>
                  <div>A / ← — Steer left</div>
                  <div>D / → — Steer right</div>
                  <div>SPACE — Emergency brake</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={startDrive}
                  className="flex-1 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-black"
                >
                  🚗 START DRIVE
                </button>
              </div>
            </div>
          </div>
        )}

        {started && !finished && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-300">
                  LIVE DRIVE
                </div>

                <h1 className="text-2xl font-black">
                  {destination.name}
                </h1>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                {vehicle.name}
              </div>
            </div>

            <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <div className="relative h-[620px] overflow-hidden rounded-3xl border border-white/10 bg-[#17201d]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#21342e] to-[#070b0a]" />

                <div className="absolute left-1/2 top-0 h-full w-[72%] -translate-x-1/2 bg-[#252b29]" />

                <div className="absolute left-[39%] top-0 h-full w-1 bg-white/20" />
                <div className="absolute left-[61%] top-0 h-full w-1 bg-white/20" />

                {trafficCars.map((car) => (
                  <div
                    key={car.id}
                    className="absolute z-10 h-20 w-12 rounded-xl bg-gradient-to-b from-red-400 to-red-700 shadow-xl transition-all"
                    style={{
                      left:
                        `${28 + car.lane * 22}%`,
                      top:
                        `${car.position}%`,
                    }}
                  >
                    <div className="mx-auto mt-2 h-3 w-7 rounded bg-white/60" />
                    <div className="mx-auto mt-8 h-2 w-8 rounded bg-black/50" />
                  </div>
                ))}

                <div
                  className="absolute bottom-16 z-20 h-28 w-16 rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-300 to-emerald-700 shadow-[0_0_40px_rgba(52,211,153,0.35)] transition-all"
                  style={{
                    left:
                      `${27 + playerLane * 22}%`,
                  }}
                >
                  <div className="mx-auto mt-3 h-5 w-10 rounded bg-cyan-100/80" />

                  <div className="mx-auto mt-7 h-3 w-10 rounded bg-black/50" />
                </div>

                <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    Weather
                  </div>

                  <div className="mt-1 font-black">
                    {city.weather}
                  </div>
                </div>

                <div className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-right backdrop-blur">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">
                    Traffic
                  </div>

                  <div className="mt-1 font-black">
                    {city.traffic}
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-4 text-center backdrop-blur">
                  <div className="text-sm font-bold text-yellow-300">
                    {message}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-xs uppercase tracking-widest text-white/40">
                    Speed
                  </div>

                  <div className="mt-2 text-5xl font-black text-emerald-300">
                    {Math.round(speed)}
                    <span className="ml-2 text-lg text-white/40">
                      km/h
                    </span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (speed / maxSpeed) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setSpeed((current) =>
                        Math.min(
                          maxSpeed,
                          current + 12
                        )
                      )
                    }
                    className="rounded-2xl bg-emerald-400 p-4 font-black text-black"
                  >
                    ⬆️ ACCELERATE
                  </button>

                  <button
                    onClick={() =>
                      setSpeed((current) =>
                        Math.max(
                          0,
                          current - 18
                        )
                      )
                    }
                    className="rounded-2xl bg-white/10 p-4 font-black"
                  >
                    🛑 BRAKE
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setPlayerLane((lane) =>
                        Math.max(0, lane - 1)
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 text-2xl"
                  >
                    ⬅️
                  </button>

                  <button
                    onClick={() =>
                      setPlayerLane((lane) =>
                        Math.min(2, lane + 1)
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 text-2xl"
                  >
                    ➡️
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-xs uppercase tracking-widest text-white/40">
                    Trip
                  </div>

                  <div className="mt-3 flex justify-between">
                    <span className="text-white/50">
                      Distance
                    </span>

                    <span className="font-black">
                      {distance.toFixed(1)} /{" "}
                      {destination.distanceKm} km
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span className="text-white/50">
                      Mistakes
                    </span>

                    <span className="font-black text-yellow-300">
                      {mistakes}
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span className="text-white/50">
                      Condition
                    </span>

                    <span className="font-black">
                      {ownedVehicle.condition}%
                    </span>
                  </div>

                  <div className="mt-2 flex justify-between">
                    <span className="text-white/50">
                      Fuel
                    </span>

                    <span className="font-black">
                      {ownedVehicle.fuel}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={onCancel}
                  className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 font-bold text-red-300"
                >
                  End Drive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}