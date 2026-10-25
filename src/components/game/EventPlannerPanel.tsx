"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  EVENT_CONTRACTS,
  calculateEventPlannerResult,
  type EventContract,
  type EventTheme,
} from "@/lib/game/eventPlanner";

interface EventPlannerPanelProps {
  onComplete: (result: {
    payment: number;
    reputation: number;
    experience: number;
    energyUsed: number;
  }) => void;
  onBack?: () => void;
}

type Step =
  | "contracts"
  | "venue"
  | "guests"
  | "budget"
  | "theme"
  | "execution"
  | "result";

const THEMES: {
  id: EventTheme;
  emoji: string;
  name: string;
  description: string;
}[] = [
  {
    id: "luxury",
    emoji: "💎",
    name: "Luxury",
    description: "Premium decoration, elegant lighting and VIP atmosphere.",
  },
  {
    id: "modern",
    emoji: "✨",
    name: "Modern",
    description: "Clean design, technology and contemporary entertainment.",
  },
  {
    id: "cultural",
    emoji: "🪘",
    name: "Cultural",
    description: "Abuja-inspired culture, traditional style and local flavor.",
  },
  {
    id: "street",
    emoji: "🔥",
    name: "Street",
    description: "High-energy entertainment with a bold Abuja nightlife feel.",
  },
  {
    id: "corporate",
    emoji: "🏢",
    name: "Corporate",
    description: "Professional presentation designed for executives and brands.",
  },
];

export default function EventPlannerPanel({
  onComplete,
  onBack,
}: EventPlannerPanelProps) {
  const [step, setStep] = useState<Step>("contracts");
  const [contract, setContract] = useState<EventContract | null>(null);

  const [venueScore, setVenueScore] = useState(75);
  const [guestScore, setGuestScore] = useState(75);
  const [budgetScore, setBudgetScore] = useState(75);
  const [themeScore, setThemeScore] = useState(75);
  const [executionScore, setExecutionScore] = useState(75);

  const [theme, setTheme] = useState<EventTheme>("modern");
  const [countdown, setCountdown] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const result = useMemo(() => {
    if (!contract) return null;

    return calculateEventPlannerResult(
      contract,
      venueScore,
      guestScore,
      budgetScore,
      themeScore,
      executionScore
    );
  }, [
    contract,
    venueScore,
    guestScore,
    budgetScore,
    themeScore,
    executionScore,
  ]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  function startContract(selected: EventContract) {
    setContract(selected);
    setVenueScore(75);
    setGuestScore(75);
    setBudgetScore(75);
    setThemeScore(75);
    setExecutionScore(75);
    setTheme("modern");
    setStep("venue");
    setCountdown(selected.deadline);
  }

  function nextStep() {
    if (step === "venue") setStep("guests");
    else if (step === "guests") setStep("budget");
    else if (step === "budget") setStep("theme");
    else if (step === "theme") setStep("execution");
    else if (step === "execution") {
      setStep("result");

      if (result && result.eventScore >= 80) {
        setCelebrating(true);

        window.setTimeout(() => {
          setCelebrating(false);
        }, 5000);
      }
    }
  }

  function finish() {
    if (!result) return;

    onComplete({
      payment: result.payment,
      reputation: result.reputation,
      experience: result.experience,
      energyUsed: result.energyUsed,
    });
  }

  if (step === "contracts") {
    return (
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 top-10 h-48 w-48 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-56 w-56 animate-pulse rounded-full bg-pink-500/10 blur-3xl [animation-delay:1s]" />

        <div className="relative space-y-7">
          <div className="animate-[fadeIn_0.6s_ease-out]">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-purple-300">
              🎪 EVENT COMMAND CENTER
            </div>

            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
              Build an unforgettable event.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Choose a contract, manage the event from planning to execution,
              and prove that you can become Abuja&apos;s next elite event
              planner.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {EVENT_CONTRACTS.map((item, index) => (
              <button
                key={item.id}
                onClick={() => startContract(item)}
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left opacity-0 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:bg-white/[0.065] hover:shadow-purple-950/30 animate-[slideUp_0.55s_ease-out_forwards]"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-purple-500/10 blur-2xl transition duration-500 group-hover:scale-150" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-3xl">
                        {item.type === "wedding"
                          ? "💍"
                          : item.type === "concert"
                            ? "🎤"
                            : item.type === "festival"
                              ? "🎡"
                              : item.type === "birthday"
                                ? "🎂"
                                : item.type === "launch"
                                  ? "🚀"
                                  : "🏢"}
                      </span>

                      <h3 className="mt-3 text-xl font-black text-white">
                        {item.title}
                      </h3>
                    </div>

                    <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[11px] font-black uppercase text-purple-300">
                      {item.difficulty}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/55">
                    {item.description}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <Info label="Guests" value={item.guests.toLocaleString()} />
                    <Info
                      label="Budget"
                      value={`₦${(item.budget / 1000).toFixed(0)}k`}
                    />
                    <Info
                      label="Pay"
                      value={`₦${item.basePay.toLocaleString()}`}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      📍 {formatVenue(item.venue)}
                    </span>

                    <span className="font-black text-purple-300 transition group-hover:translate-x-1">
                      Plan Event →
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              ← Back to Jobs
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!contract) return null;

  if (step === "result" && result) {
    return (
      <div className="relative overflow-hidden">
        {celebrating && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              {Array.from({ length: 18 }).map((_, index) => (
                <span
                  key={index}
                  className="absolute h-2 w-2 animate-[confetti_2.2s_ease-out_forwards] rounded-sm bg-purple-300"
                  style={{
                    left: `${5 + ((index * 17) % 90)}%`,
                    top: "-10px",
                    animationDelay: `${(index % 7) * 80}ms`,
                  }}
                />
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-72 animate-pulse bg-gradient-to-b from-purple-500/20 via-pink-500/10 to-transparent blur-2xl" />
          </>
        )}

        <div className="relative z-20 space-y-6">
          <div className="animate-[zoomIn_0.7s_ease-out] rounded-[2rem] border border-purple-400/20 bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-pink-500/10 p-7 text-center shadow-2xl">
            <div className="text-5xl animate-bounce">🎪</div>

            <div className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-purple-300">
              EVENT COMPLETED
            </div>

            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
              {result.headline}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/60">
              {result.verdict}
            </p>

            <div className="mx-auto mt-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-purple-400/30 bg-purple-400/10 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
              <div>
                <div className="text-3xl font-black text-white">
                  {result.eventScore}
                </div>
                <div className="text-[10px] font-bold uppercase text-purple-300">
                  Score
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ResultStat
              emoji="💰"
              label="Payment"
              value={`₦${result.payment.toLocaleString()}`}
            />
            <ResultStat
              emoji="⭐"
              label="Reputation"
              value={`+${result.reputation}`}
            />
            <ResultStat
              emoji="🧠"
              label="Job XP"
              value={`+${result.experience}`}
            />
            <ResultStat
              emoji="⚡"
              label="Energy"
              value={`-${result.energyUsed}`}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
            <h3 className="font-black text-white">Event Performance</h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Performance label="Venue" value={result.venueScore} />
              <Performance label="Guest Experience" value={result.guestScore} />
              <Performance label="Budget Control" value={result.budgetScore} />
              <Performance label="Theme & Design" value={result.themeScore} />
              <Performance label="Live Execution" value={result.executionScore} />
            </div>

            {result.bonus > 0 && (
              <div className="mt-5 animate-[slideUp_0.5s_ease-out] rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="font-black text-emerald-300">
                  🎁 Performance Bonuses
                </div>
                <div className="mt-1 text-sm text-emerald-200/70">
                  You earned an extra ₦{result.bonus.toLocaleString()} from
                  excellent planning decisions.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={finish}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-purple-500/20"
          >
            <span className="relative z-10">
              Collect Payment & Return to Jobs 🎉
            </span>

            <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        </div>
      </div>
    );
  }

  const stepData = {
    venue: {
      title: "Choose Your Venue Strategy",
      emoji: "🏟️",
      description:
        "A great venue creates the foundation for the entire event. Think about capacity, accessibility and atmosphere.",
      value: venueScore,
      setValue: setVenueScore,
      label: "Venue Planning",
    },
    guests: {
      title: "Manage the Guest Experience",
      emoji: "👥",
      description:
        "Your guests are the heart of the event. Plan seating, entry, comfort, entertainment and crowd flow.",
      value: guestScore,
      setValue: setGuestScore,
      label: "Guest Experience",
    },
    budget: {
      title: "Control the Budget",
      emoji: "💰",
      description:
        "Spend enough to impress the client without destroying the event budget.",
      value: budgetScore,
      setValue: setBudgetScore,
      label: "Budget Management",
    },
    theme: {
      title: "Choose the Event Identity",
      emoji: "🎨",
      description:
        "Every great event needs a memorable identity. Pick your theme and decide how creatively you want to push it.",
      value: themeScore,
      setValue: setThemeScore,
      label: "Creative Direction",
    },
    execution: {
      title: "LIVE EVENT — GO!",
      emoji: "🔥",
      description:
        "The guests have arrived. The music is playing. Something is always going wrong. Keep everything under control!",
      value: executionScore,
      setValue: setExecutionScore,
      label: "Live Execution",
    },
  }[step as "venue" | "guests" | "budget" | "theme" | "execution"];

  if (!stepData) return null;

  return (
    <div className="relative">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            ACTIVE EVENT
          </div>
          <div className="mt-1 font-black text-white">{contract.title}</div>
        </div>

        <div
          className={`rounded-xl px-4 py-2 text-center ${
            countdown <= 20
              ? "animate-pulse bg-red-400/10 text-red-300"
              : "bg-white/5 text-white/70"
          }`}
        >
          <div className="text-[9px] uppercase tracking-widest">
            Deadline
          </div>
          <div className="font-black">
            {Math.floor(countdown / 60)}:
            {String(countdown % 60).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-1">
        {["venue", "guests", "budget", "theme", "execution"].map(
          (item, index) => {
            const currentIndex = [
              "venue",
              "guests",
              "budget",
              "theme",
              "execution",
            ].indexOf(step);

            return (
              <div
                key={item}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  index <= currentIndex
                    ? "bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]"
                    : "bg-white/10"
                }`}
              />
            );
          }
        )}
      </div>

      <div
        key={step}
        className="animate-[slideIn_0.45s_ease-out]"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 animate-pulse rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative">
            <div className="text-5xl">{stepData.emoji}</div>

            <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
              {stepData.title}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              {stepData.description}
            </p>

            {step === "theme" ? (
              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {THEMES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTheme(item.id);
                      setThemeScore(
                        item.id === "luxury"
                          ? 92
                          : item.id === "modern"
                            ? 86
                            : item.id === "cultural"
                              ? 90
                              : item.id === "street"
                                ? 88
                                : 84
                      );
                    }}
                    className={`group rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-1 ${
                      theme === item.id
                        ? "border-purple-400/50 bg-purple-400/10 shadow-lg shadow-purple-950/20"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl transition duration-300 group-hover:scale-125">
                        {item.emoji}
                      </span>

                      <div>
                        <div className="font-black text-white">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/45">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-white/40">
                      {stepData.label}
                    </div>
                    <div className="mt-1 text-4xl font-black text-white">
                      {stepData.value}%
                    </div>
                  </div>

                  <div className="text-4xl">
                    {step === "execution"
                      ? "🎤"
                      : step === "guests"
                        ? "🙌"
                        : step === "budget"
                          ? "💵"
                          : "🏟️"}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stepData.value}
                  onChange={(event) =>
                    stepData.setValue(Number(event.target.value))
                  }
                  className="h-3 w-full cursor-pointer accent-purple-400"
                />

                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/30">
                  <span>Disaster</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>

                {step === "execution" && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <LiveCard emoji="🎤" text="Music" />
                    <LiveCard emoji="🍾" text="Guests" />
                    <LiveCard emoji="🎆" text="Atmosphere" />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={nextStep}
              className="group relative mt-8 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/20"
            >
              <span className="relative z-10">
                {step === "execution"
                  ? "Launch Event 🎉"
                  : "Continue Planning →"}
              </span>

              <span className="absolute inset-y-0 left-0 w-20 -translate-x-24 skew-x-[-20deg] bg-white/20 transition-transform duration-700 group-hover:translate-x-[700px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="text-[9px] uppercase tracking-wider text-white/30">
        {label}
      </div>
      <div className="mt-1 text-xs font-black text-white">{value}</div>
    </div>
  );
}

function LiveCard({
  emoji,
  text,
}: {
  emoji: string;
  text: string;
}) {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-[10px] font-bold text-white/50">{text}</div>
    </div>
  );
}

function ResultStat({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <div className="animate-[slideUp_0.5s_ease-out] rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="text-xl">{emoji}</div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-white/35">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function Performance({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-semibold text-white/60">{label}</span>
        <span className="font-black text-white">{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function formatVenue(venue: EventContract["venue"]) {
  switch (venue) {
    case "jabi-lake":
      return "Jabi Lake";
    case "maitama-garden":
      return "Maitama Garden";
    case "wuse-event-center":
      return "Wuse Event Center";
    case "abuja-international":
      return "Abuja International";
    case "central-arena":
      return "Central Arena";
    default:
      return venue;
  }
}
