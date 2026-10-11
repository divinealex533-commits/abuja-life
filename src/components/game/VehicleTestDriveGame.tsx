"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Vehicle } from "@/lib/game/vehicles";

interface VehicleTestDriveGameProps {
  vehicle: Vehicle;
  onComplete: (result: TestDriveResult) => void;
  onCancel?: () => void;
}

export interface TestDriveResult {
  score: number;
  speedScore: number;
  handlingScore: number;
  reactionScore: number;
  controlScore: number;
  mistakes: number;
  distanceKm: number;
  completed: boolean;
}

type DrivePhase =
  | "briefing"
  | "launch"
  | "driving"
  | "finish"
  | "result";

type TrafficEvent = {
  id: number;
  type: "car" | "pedestrian" | "obstacle";
  position: number;
  lane: number;
};

const TEST_DISTANCE_KM = 3;
const TOTAL_TIME_SECONDS = 30;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent Driver";
  if (score >= 75) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Practice";
  return "Dangerous Driver";
}

export default function VehicleTestDriveGame({
  vehicle,
  onComplete,
  onCancel,
}: VehicleTestDriveGameProps) {
  const [phase, setPhase] =
    useState<DrivePhase>("briefing");

  const [timeLeft, setTimeLeft] =
    useState(TOTAL_TIME_SECONDS);

  const [speed, setSpeed] = useState(0);

  const [position, setPosition] = useState(50);

  const [distance, setDistance] = useState(0);

  const [mistakes, setMistakes] = useState(0);

  const [speedScore, setSpeedScore] = useState(0);

  const [handlingScore, setHandlingScore] =
    useState(100);

  const [reactionScore, setReactionScore] =
    useState(100);

  const [controlScore, setControlScore] =
    useState(100);

  const [trafficEvents, setTrafficEvents] =
    useState<TrafficEvent[]>([]);

  const [message, setMessage] =
    useState("Get ready...");

  const [completedResult, setCompletedResult] =
    useState<TestDriveResult | null>(null);

  const maxSpeed = useMemo(
    () =>
      Math.max(
        60,
        Math.round(
          vehicle.speed * 1.7
        )
      ),
    [vehicle.speed]
  );

  /* ------------------------------------------------------------------------ */
  /* START                                                                     */
  /* ------------------------------------------------------------------------ */

  function startDrive() {
    setPhase("launch");
    setMessage("Starting engine...");
  }

  useEffect(() => {
    if (phase !== "launch") return;

    const timer = window.setTimeout(() => {
      setPhase("driving");
      setMessage("Drive carefully and avoid traffic!");
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [phase]);

  /* ------------------------------------------------------------------------ */
  /* TIMER                                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (phase !== "driving") return;

    if (timeLeft <= 0) {
      finishDrive();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) =>
        Math.max(0, current - 1)
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, timeLeft]);

  /* ------------------------------------------------------------------------ */
  /* DRIVE LOOP                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (phase !== "driving") return;

    const timer = window.setInterval(() => {
      const speedFactor =
        speed / Math.max(1, maxSpeed);

      const distanceGain =
        0.045 + speedFactor * 0.09;

      setDistance((current) => {
        const next = Math.min(
          TEST_DISTANCE_KM,
          current + distanceGain
        );

        if (next >= TEST_DISTANCE_KM) {
          window.setTimeout(() => {
            finishDrive();
          }, 0);
        }

        return next;
      });

      setTrafficEvents((events) =>
        events
          .map((event) => ({
            ...event,
            position:
              event.position +
              2 +
              speedFactor * 3,
          }))
          .filter(
            (event) => event.position < 110
          )
      );

      if (Math.random() < 0.08) {
        spawnTraffic();
      }
    }, 300);

    return () => window.clearInterval(timer);
  }, [phase, speed, maxSpeed]);

  /* ------------------------------------------------------------------------ */
  /* CONTROLS                                                                  */
  /* ------------------------------------------------------------------------ */

  function accelerate() {
    if (phase !== "driving") return;

    setSpeed((current) =>
      clamp(
        current + 8,
        0,
        maxSpeed
      )
    );
  }

  function brake() {
    if (phase !== "driving") return;

    setSpeed((current) =>
      clamp(
        current - 14,
        0,
        maxSpeed
      )
    );
  }

  function steerLeft() {
    if (phase !== "driving") return;

    setPosition((current) =>
      clamp(current - 8, 12, 88)
    );

    setHandlingScore((current) =>
      clamp(current + 1, 0, 100)
    );
  }

  function steerRight() {
    if (phase !== "driving") return;

    setPosition((current) =>
      clamp(current + 8, 12, 88)
    );

    setHandlingScore((current) =>
      clamp(current + 1, 0, 100)
    );
  }

  function reactToTraffic() {
    if (phase !== "driving") return;

    const dangerousEvent =
      trafficEvents.find(
        (event) =>
          event.position > 65 &&
          event.position < 100
      );

    if (!dangerousEvent) {
      setReactionScore((current) =>
        clamp(current - 2, 0, 100)
      );

      setMessage(
        "No obstacle needed a reaction."
      );

      return;
    }

    setTrafficEvents((events) =>
      events.filter(
        (event) =>
          event.id !== dangerousEvent.id
      )
    );

    setReactionScore((current) =>
      clamp(current + 3, 0, 100)
    );

    setMessage("Good reaction! 👏");
  }

  function handleLaneChange(direction: "left" | "right") {
    if (direction === "left") {
      steerLeft();
    } else {
      steerRight();
    }
  }

  /* ------------------------------------------------------------------------ */
  /* TRAFFIC                                                                   */
  /* ------------------------------------------------------------------------ */

  function spawnTraffic() {
    const event: TrafficEvent = {
      id: Date.now() + Math.random(),
      type:
        Math.random() > 0.75
          ? "obstacle"
          : "car",
      position: -10,
      lane:
        Math.random() > 0.5
          ? 35
          : 65,
    };

    setTrafficEvents((events) => [
      ...events.slice(-4),
      event,
    ]);
  }

  /* ------------------------------------------------------------------------ */
  /* KEYBOARD                                                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (phase !== "driving") return;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "ArrowUp" ||
        event.key === "w"
      ) {
        event.preventDefault();
        accelerate();
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "s"
      ) {
        event.preventDefault();
        brake();
      }

      if (
        event.key === "ArrowLeft" ||
        event.key === "a"
      ) {
        event.preventDefault();
        steerLeft();
      }

      if (
        event.key === "ArrowRight" ||
        event.key === "d"
      ) {
        event.preventDefault();
        steerRight();
      }

      if (
        event.key === " " ||
        event.key === "e"
      ) {
        event.preventDefault();
        reactToTraffic();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [phase, speed]);

  /* ------------------------------------------------------------------------ */
  /* FINISH                                                                    */
  /* ------------------------------------------------------------------------ */

  function finishDrive() {
    if (
      phase === "finish" ||
      phase === "result"
    ) {
      return;
    }

    setPhase("finish");
    setSpeed(0);
    setMessage("Calculating your driving performance...");

    window.setTimeout(() => {
      const idealSpeed =
        vehicle.speed >= 90
          ? 0.72
          : vehicle.speed >= 75
          ? 0.68
          : 0.6;

      const averageSpeedRatio =
        clamp(
          distance /
            TEST_DISTANCE_KM,
          0,
          1
        );

      const calculatedSpeedScore = clamp(
        Math.round(
          vehicle.speed * 0.45 +
            averageSpeedRatio * 35 +
            idealSpeed * 20
        ),
        0,
        100
      );

      const finalSpeedScore =
        Math.min(
          100,
          Math.round(
            (calculatedSpeedScore +
              speed) /
              2
          )
        );

      const finalHandlingScore =
        clamp(
          Math.round(
            handlingScore -
              mistakes * 7
          ),
          0,
          100
        );

      const finalReactionScore =
        clamp(
          reactionScore -
            mistakes * 5,
          0,
          100
        );

      const finalControlScore =
        clamp(
          Math.round(
            controlScore -
              Math.abs(
                speed / maxSpeed - 0.65
              ) *
                35 -
              mistakes * 5
          ),
          0,
          100
        );

      const score = clamp(
        Math.round(
          finalSpeedScore * 0.3 +
            finalHandlingScore * 0.25 +
            finalReactionScore * 0.2 +
            finalControlScore * 0.25
        ),
        0,
        100
      );

      const result: TestDriveResult = {
        score,
        speedScore: finalSpeedScore,
        handlingScore: finalHandlingScore,
        reactionScore: finalReactionScore,
        controlScore: finalControlScore,
        mistakes,
        distanceKm: Number(
          distance.toFixed(2)
        ),
        completed: true,
      };

      setCompletedResult(result);
      setPhase("result");
      setMessage(getScoreLabel(score));

      onComplete(result);
    }, 1200);
  }

  /* ------------------------------------------------------------------------ */
  /* BRIEFING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (phase === "briefing") {
    return (
      <div className="rounded-3xl border border-orange-500/20 bg-black p-5 text-white shadow-2xl md:p-8">
        <div className="text-center">
          <div className="text-7xl">
            {vehicle.icon}
          </div>

          <div className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
            Test Drive
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {vehicle.name}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {vehicle.brand} •{" "}
            {vehicle.class}
          </p>

          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
            <h3 className="font-black">
              Your Test Drive
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-gray-400">
              <li>
                🏁 Drive approximately{" "}
                {TEST_DISTANCE_KM} km
              </li>

              <li>
                🚦 React to traffic and
                obstacles
              </li>

              <li>
                🎯 Control your speed
                carefully
              </li>

              <li>
                🛣️ Stay in control while
                changing lanes
              </li>

              <li>
                ⏱️ Complete the route
                efficiently
              </li>
            </ul>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-gray-500">
                Speed
              </div>
              <div className="mt-1 font-black text-orange-400">
                {vehicle.speed}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-gray-500">
                Handling
              </div>
              <div className="mt-1 font-black text-orange-400">
                {vehicle.handling}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-gray-500">
                Comfort
              </div>
              <div className="mt-1 font-black text-orange-400">
                {vehicle.comfort}
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-xs text-gray-500">
                Reliability
              </div>
              <div className="mt-1 font-black text-orange-400">
                {vehicle.reliability}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-black hover:bg-white/10"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={startDrive}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-3 font-black text-black hover:bg-orange-400"
            >
              🏁 Start Test Drive
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* LAUNCH                                                                    */
  /* ------------------------------------------------------------------------ */

  if (phase === "launch") {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-black p-8 text-center text-white">
        <div>
          <div className="animate-pulse text-8xl">
            {vehicle.icon}
          </div>

          <h2 className="mt-6 text-3xl font-black">
            Starting {vehicle.name}
          </h2>

          <p className="mt-2 text-gray-500">
            {message}
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* FINISH                                                                    */
  /* ------------------------------------------------------------------------ */

  if (phase === "finish") {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-black p-8 text-center text-white">
        <div>
          <div className="animate-bounce text-7xl">
            🏁
          </div>

          <h2 className="mt-5 text-3xl font-black">
            Test Drive Complete
          </h2>

          <p className="mt-2 text-gray-500">
            {message}
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* RESULT                                                                    */
  /* ------------------------------------------------------------------------ */

  if (
    phase === "result" &&
    completedResult
  ) {
    return (
      <div className="rounded-3xl border border-orange-500/20 bg-black p-5 text-white md:p-8">
        <div className="text-center">
          <div className="text-6xl">
            {completedResult.score >= 75
              ? "🏆"
              : completedResult.score >= 50
              ? "🏁"
              : "🚗"}
          </div>

          <div className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
            Test Drive Result
          </div>

          <h2 className="mt-2 text-3xl font-black">
            {getScoreLabel(
              completedResult.score
            )}
          </h2>

          <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full border-8 border-orange-500/30 bg-orange-500/10">
            <div>
              <div className="text-4xl font-black text-orange-400">
                {completedResult.score}
              </div>

              <div className="text-[10px] uppercase text-gray-500">
                Score
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <ResultStat
            label="Speed"
            value={completedResult.speedScore}
          />

          <ResultStat
            label="Handling"
            value={completedResult.handlingScore}
          />

          <ResultStat
            label="Reaction"
            value={completedResult.reactionScore}
          />

          <ResultStat
            label="Control"
            value={completedResult.controlScore}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-gray-500">
              Distance
            </div>

            <div className="mt-1 font-black">
              {completedResult.distanceKm} km
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-gray-500">
              Mistakes
            </div>

            <div className="mt-1 font-black">
              {completedResult.mistakes}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="font-black">
            Vehicle verdict
          </div>

          <p className="mt-1 text-sm leading-6 text-gray-400">
            The {vehicle.name} gave you a{" "}
            <strong className="text-white">
              {completedResult.score}/100
            </strong>{" "}
            test-drive performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onComplete(completedResult)
          }
          className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 font-black text-black hover:bg-orange-400"
        >
          Return to Showroom
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* DRIVING                                                                   */
  /* ------------------------------------------------------------------------ */

  const progress =
    (distance / TEST_DISTANCE_KM) * 100;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#080808] text-white">
      {/* HUD */}
      <div className="border-b border-white/10 bg-black p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Test Drive
            </div>

            <div className="font-black">
              {vehicle.name}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 px-4 py-2 text-center">
            <div className="text-[10px] text-gray-500">
              TIME
            </div>

            <div className="font-black">
              {timeLeft}s
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Route</span>
            <span>
              {distance.toFixed(1)} /{" "}
              {TEST_DISTANCE_KM} km
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ROAD */}
      <div className="relative h-[430px] overflow-hidden bg-gradient-to-b from-sky-950/50 via-gray-900 to-black">
        {/* sky */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-950/30 to-transparent" />

        {/* road */}
        <div className="absolute bottom-0 left-[8%] right-[8%] top-0 overflow-hidden border-x-4 border-white/5 bg-gray-800">
          {/* lane markings */}
          <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 border-l-4 border-dashed border-white/20" />

          {/* road edges */}
          <div className="absolute inset-y-0 left-3 w-1 bg-orange-500/30" />
          <div className="absolute inset-y-0 right-3 w-1 bg-orange-500/30" />

          {/* traffic */}
          {trafficEvents.map((event) => (
            <div
              key={event.id}
              className="absolute transition-all duration-300"
              style={{
                left: `${event.lane}%`,
                top: `${event.position}%`,
                transform:
                  "translateX(-50%)",
              }}
            >
              <div className="text-4xl">
                {event.type === "car"
                  ? "🚙"
                  : event.type ===
                    "pedestrian"
                  ? "🚶"
                  : "🚧"}
              </div>
            </div>
          ))}

          {/* player car */}
          <div
            className="absolute bottom-10 text-6xl transition-all duration-150"
            style={{
              left: `${position}%`,
              transform:
                "translateX(-50%)",
            }}
          >
            {vehicle.icon}
          </div>
        </div>

        {/* speed */}
        <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur">
          <div className="text-[10px] text-gray-500">
            SPEED
          </div>

          <div className="text-3xl font-black text-orange-400">
            {Math.round(speed)}
          </div>

          <div className="text-[10px] text-gray-600">
            km/h
          </div>
        </div>

        {/* message */}
        <div className="absolute bottom-4 left-1/2 w-[80%] -translate-x-1/2 rounded-xl border border-white/10 bg-black/80 px-4 py-3 text-center text-xs font-bold text-gray-300">
          {message}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="border-t border-white/10 bg-black p-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              handleLaneChange("left")
            }
            className="rounded-xl border border-white/10 bg-white/5 py-4 text-2xl hover:bg-white/10"
          >
            ◀️
          </button>

          <button
            type="button"
            onClick={accelerate}
            className="rounded-xl bg-orange-500 py-4 text-xl font-black text-black hover:bg-orange-400"
          >
            ⬆️
            <span className="ml-1 text-sm">
              Accelerate
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleLaneChange("right")
            }
            className="rounded-xl border border-white/10 bg-white/5 py-4 text-2xl hover:bg-white/10"
          >
            ▶️
          </button>

          <button
            type="button"
            onClick={brake}
            className="rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-black text-red-300 hover:bg-red-500/20"
          >
            🛑 Brake
          </button>

          <button
            type="button"
            onClick={reactToTraffic}
            className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 py-3 text-sm font-black text-yellow-300 hover:bg-yellow-500/20"
          >
            ⚠️ React
          </button>

          <button
            type="button"
            onClick={finishDrive}
            className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-black text-gray-300 hover:bg-white/10"
          >
            🏁 Finish
          </button>
        </div>

        <div className="mt-3 text-center text-[10px] text-gray-600">
          Keyboard: W / ↑ accelerate • S / ↓ brake •
          A / ← and D / → steer • Space / E react
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* RESULT STAT                                                                 */
/* -------------------------------------------------------------------------- */

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {label}
        </span>

        <span className="font-black text-orange-400">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-500"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}