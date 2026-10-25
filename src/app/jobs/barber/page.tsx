"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import BarberPanel from "@/components/game/BarberPanel";
import {
  BARBER_CUSTOMERS,
  type BarberCustomer,
} from "@/lib/game/barber";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  savePersistentPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

export default function BarberPage() {
  const [player, setPlayer] = useState<PlayerGameState>(
    DEFAULT_PLAYER_STATE
  );

  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<BarberCustomer | null>(null);

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    void loadPersistentPlayerState().then((state) => {
      if (!mounted) return;

      setPlayer(state);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const isBarber = player.currentJobId === "barber";

  const availableCustomers = useMemo(() => {
    return BARBER_CUSTOMERS;
  }, []);

  async function handleServiceComplete(result: {
    payment: number;
    tip: number;
    reputation: number;
    satisfaction: number;
    energyCost: number;
    message: string;
  }) {
    if (saving) return;

    const earnings = result.payment + result.tip;
    const energyCost = Math.ceil(result.energyCost);

    if (player.energy < energyCost) {
      setMessage(
        `You need ${energyCost} energy for this customer.`
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const updatedPlayer: PlayerGameState = {
        ...player,
        cash: player.cash + earnings,
        energy: Math.max(
          0,
          player.energy - energyCost
        ),
        reputation:
          player.reputation + result.reputation,
        jobExperience: player.jobExperience + 1,
      };

      const saved =
        await savePersistentPlayerState(updatedPlayer);

      setPlayer(saved);

      setMessage(
        `${result.message} You earned ₦${earnings.toLocaleString()}.`
      );

      setSelectedCustomer(null);
    } catch (error) {
      console.error(
        "Barber reward save error:",
        error
      );

      setMessage(
        "The service finished, but your payment could not be saved. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10070d] px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-7 text-center shadow-2xl">
          <div className="text-5xl">💈</div>

          <p className="mt-4 text-sm font-bold text-white/60">
            Loading your barber shop...
          </p>
        </div>
      </main>
    );
  }

  if (!isBarber) {
    return (
      <main className="min-h-screen bg-[#10070d] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/jobs"
              className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:bg-white/10"
            >
              ← BACK TO JOBS
            </Link>
          </div>

          <section className="rounded-[2rem] border border-pink-400/20 bg-gradient-to-br from-pink-500/10 via-[#171018] to-purple-500/10 p-8 text-center shadow-2xl sm:p-12">
            <div className="text-7xl">💈</div>

            <div className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-pink-300">
              Abuja Style Career
            </div>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Barber
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">
              Serve customers around Abuja, master different
              haircut styles, earn tips and build your barber
              reputation.
            </p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">✂️</div>

                <div className="mt-2 text-xs font-black">
                  Haircuts
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">💈</div>

                <div className="mt-2 text-xs font-black">
                  Styles
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-2xl">💰</div>

                <div className="mt-2 text-xs font-black">
                  Tips
                </div>
              </div>
            </div>

            <Link
              href="/jobs"
              className="mt-8 inline-flex rounded-2xl bg-pink-400 px-8 py-4 text-sm font-black text-black transition hover:bg-pink-300 active:scale-[0.98]"
            >
              APPLY FOR BARBER →
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (selectedCustomer) {
    return (
      <main className="min-h-screen bg-[#10070d] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => {
              setSelectedCustomer(null);
              setMessage("");
            }}
            className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black transition hover:bg-white/10"
          >
            ← BACK TO SHOP
          </button>

          <BarberPanel
            customer={selectedCustomer}
            onComplete={handleServiceComplete}
            onCancel={() => {
              setSelectedCustomer(null);
              setMessage("");
            }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#10070d] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-300">
              Abuja Careers / Style
            </div>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              Barber Shop
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Open your chair, serve customers and turn great
              haircuts into money and reputation.
            </p>
          </div>

          <Link
            href="/jobs"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black transition hover:border-pink-400/30 hover:bg-pink-400/10"
          >
            ← JOBS
          </Link>
        </div>

        {/* BARBER HUD */}
        <section className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Cash
            </div>

            <div className="mt-2 text-2xl font-black text-emerald-300">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Energy
            </div>

            <div className="mt-2 text-2xl font-black">
              {Math.round(player.energy)}
              <span className="text-sm text-white/30">
                {" "}
                / {Math.round(player.maxEnergy)}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-pink-400 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      (player.energy /
                        player.maxEnergy) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Reputation
            </div>

            <div className="mt-2 text-2xl font-black">
              ⭐ {player.reputation}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
              Job XP
            </div>

            <div className="mt-2 text-2xl font-black">
              {player.jobExperience}
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-pink-400/20 bg-pink-400/10 px-5 py-4 text-sm font-bold text-pink-200">
            {message}
          </div>
        )}

        {/* SHOP */}
        <section className="mb-7 rounded-[2rem] border border-pink-400/20 bg-gradient-to-br from-pink-500/10 via-white/[0.03] to-purple-500/10 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-3xl">💈</div>

              <h2 className="mt-3 text-3xl font-black">
                Open Your Chair
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Customers are waiting. Give them a professional
                haircut, keep them satisfied and build your name
                around Abuja.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 lg:min-w-[220px]">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Current Career
              </div>

              <div className="mt-2 font-black text-pink-300">
                Barber
              </div>

              <div className="mt-1 text-xs text-white/35">
                Active career
              </div>
            </div>
          </div>
        </section>

        {/* CUSTOMERS */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              Customers Waiting
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Choose a customer and start their service.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white/40">
            {availableCustomers.length} Customers
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableCustomers.map((customer) => (
            <article
              key={customer.id}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:border-pink-400/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-400/10 text-2xl">
                  {customer.emoji}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                    customer.difficulty === "easy"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : customer.difficulty === "medium"
                        ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                        : "border-red-400/20 bg-red-400/10 text-red-300"
                  }`}
                >
                  {customer.difficulty}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">
                {customer.customer}
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Wants{" "}
                <span className="font-bold text-white/70">
                  {customer.styleName}
                </span>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-[9px] uppercase tracking-wider text-white/30">
                    Price
                  </div>

                  <div className="mt-1 font-black text-emerald-300">
                    ₦{customer.basePrice.toLocaleString()}
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-[9px] uppercase tracking-wider text-white/30">
                    Patience
                  </div>

                  <div className="mt-1 font-black">
                    {customer.patience}%
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/25">
                  Requested Style
                </div>

                <div className="mt-1 text-xs font-bold text-pink-300">
                  {customer.styleName}
                </div>
              </div>

              <button
                type="button"
                disabled={
                  saving ||
                  player.energy <
                    (customer.difficulty === "hard"
                      ? 18
                      : customer.difficulty === "medium"
                        ? 14
                        : 10)
                }
                onClick={() => {
                  setMessage("");
                  setSelectedCustomer(customer);
                }}
                className="mt-5 w-full rounded-2xl bg-pink-400 px-4 py-4 text-xs font-black text-black transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                {player.energy <
                (customer.difficulty === "hard"
                  ? 18
                  : customer.difficulty === "medium"
                    ? 14
                    : 10)
                  ? "NOT ENOUGH ENERGY"
                  : saving
                    ? "SAVING..."
                    : "SERVE CUSTOMER ✂️"}
              </button>
            </article>
          ))}
        </div>

        {/* CAREER INFO */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-300">
            Barber Career
          </div>

          <h2 className="mt-2 text-2xl font-black">
            Build the most respected chair in Abuja
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
            Great haircuts bring repeat customers, tips and
            reputation. Master more difficult styles as you build
            your career experience.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">🗣️</div>

              <div className="mt-2 text-sm font-black">
                Consult
              </div>

              <div className="mt-1 text-xs text-white/35">
                Understand exactly what the customer wants.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">✂️</div>

              <div className="mt-2 text-sm font-black">
                Cut
              </div>

              <div className="mt-1 text-xs text-white/35">
                Match the requested style with precision.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-2xl">⭐</div>

              <div className="mt-2 text-sm font-black">
                Earn Reputation
              </div>

              <div className="mt-1 text-xs text-white/35">
                Happy customers improve your career.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
