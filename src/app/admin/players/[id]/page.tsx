"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

interface Player {
  id: string;
  username: string;
  displayName: string;
  avatar: string;

  level: number;
  experience: number;
  reputation: number;

  cash: number;
  energy: number;
  maxEnergy: number;

  currentJobId: string | null;
  jobExperience: number;

  currentLocationId: string;

  isFrozen: boolean;

  createdAt: string;
  updatedAt: string;
}

type Action =
  | "freeze"
  | "unfreeze"
  | "cash"
  | "energy"
  | "reputation"
  | "experience"
  | "location"
  | "reset";

const locations = [
  {
    id: "garki",
    label: "Garki",
  },
  {
    id: "wuse",
    label: "Wuse",
  },
  {
    id: "maitama",
    label: "Maitama",
  },
  {
    id: "asokoro",
    label: "Asokoro",
  },
  {
    id: "jabi",
    label: "Jabi",
  },
  {
    id: "gwarinpa",
    label: "Gwarinpa",
  },
  {
    id: "central-area",
    label: "Central Area",
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLocation(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function AdminPlayerManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [cashAmount, setCashAmount] =
    useState("");

  const [energy, setEnergy] =
    useState("");

  const [reputation, setReputation] =
    useState("");

  const [experience, setExperience] =
    useState("");

  const [location, setLocation] =
    useState("");

  async function loadPlayer() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/players/${id}`,
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to load player."
        );
      }

      if (!data?.player) {
        throw new Error(
          "Player data was not returned."
        );
      }

      setPlayer(data.player);

      setLocation(
        data.player.currentLocationId
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load player."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayer();
  }, [id]);

  async function performAction(
    action: Action,
    payload: Record<string, unknown> = {}
  ) {
    if (working) return;

    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/players/${id}/control`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            reason:
              reason.trim() || null,
            ...payload,
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to complete action."
        );
      }

      setSuccess(
        `${actionLabel(action)} completed successfully${
          data?.auditLogged
            ? " and recorded in the audit log."
            : "."
        }`
      );

      setReason("");
      setCashAmount("");
      setEnergy("");
      setReputation("");
      setExperience("");

      await loadPlayer();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete action."
      );
    } finally {
      setWorking(false);
    }
  }

  function actionLabel(action: Action) {
    switch (action) {
      case "freeze":
        return "Freeze";
      case "unfreeze":
        return "Unfreeze";
      case "cash":
        return "Cash adjustment";
      case "energy":
        return "Energy update";
      case "reputation":
        return "Reputation update";
      case "experience":
        return "XP update";
      case "location":
        return "Location update";
      case "reset":
        return "Player reset";
      default:
        return "Admin action";
    }
  }

  function submitCash() {
    const amount = Number(cashAmount);

    if (!Number.isFinite(amount) || amount === 0) {
      setError(
        "Enter a non-zero cash amount. Use a negative number to remove cash."
      );
      return;
    }

    if (
      Math.abs(amount) >= 100000 &&
      !window.confirm(
        `You are about to adjust this player's balance by ${formatMoney(
          amount
        )}. Continue?`
      )
    ) {
      return;
    }

    performAction("cash", {
      amount,
    });
  }

  function submitEnergy() {
    if (energy.trim() === "") {
      setError(
        "Enter an energy value."
      );
      return;
    }

    const value = Number(energy);

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      !player ||
      value > player.maxEnergy
    ) {
      setError(
        `Energy must be a whole number between 0 and ${
          player?.maxEnergy ?? 0
        }.`
      );
      return;
    }

    performAction("energy", {
      value,
    });
  }

  function submitReputation() {
    if (reputation.trim() === "") {
      setError(
        "Enter a reputation value."
      );
      return;
    }

    const value = Number(reputation);

    if (!Number.isInteger(value)) {
      setError(
        "Reputation must be a whole number."
      );
      return;
    }

    performAction("reputation", {
      value,
    });
  }

  function submitExperience() {
    if (experience.trim() === "") {
      setError(
        "Enter an XP value."
      );
      return;
    }

    const value = Number(experience);

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      setError(
        "XP must be a non-negative whole number."
      );
      return;
    }

    performAction("experience", {
      value,
    });
  }

  function submitLocation() {
    if (!location.trim()) {
      setError(
        "Select a location first."
      );
      return;
    }

    if (
      player &&
      location === player.currentLocationId
    ) {
      setError(
        "Player is already at this location."
      );
      return;
    }

    performAction("location", {
      locationId: location,
    });
  }

  function confirmReset() {
    if (!player) return;

    const confirmed =
      window.confirm(
        [
          `Reset ${player.displayName}'s Abuja Life state?`,
          "",
          "This will reset:",
          "• Cash to the current Admin default",
          "• Energy to the current maximum",
          "• Reputation to 0",
          "• XP to 0",
          "• Current job",
          "• Job experience",
          "• Location to Garki",
          "• Frozen status",
          "",
          "This action will be recorded in the audit history.",
        ].join("\n")
      );

    if (confirmed) {
      performAction("reset");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-slate-500">
            Loading player management...
          </p>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/players"
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            ← Back to Players
          </Link>

          <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {error ||
              "Player could not be found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin/players"
              className="text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              ← Back to Players
            </Link>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
                {player.avatar}
              </div>

              <div>
                <h1 className="text-3xl font-black">
                  {player.displayName}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  @{player.username}
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                  player.isFrozen
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-green-500/20 bg-green-500/10 text-green-400"
                }`}
              >
                {player.isFrozen
                  ? "🔒 Frozen"
                  : "● Active"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/player-actions?playerId=${player.id}`}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:text-white"
            >
              🧾 Action History
            </Link>

            <button
              onClick={loadPlayer}
              disabled={working || loading}
              className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-black transition hover:bg-orange-400 disabled:opacity-50"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* FEEDBACK */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-white"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-300">
            <span>{success}</span>

            <button
              onClick={() => setSuccess("")}
              className="text-green-400 hover:text-white"
              aria-label="Dismiss success"
            >
              ✕
            </button>
          </div>
        )}

        {/* PLAYER SUMMARY */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Wallet
            </p>

            <p className="mt-2 text-2xl font-black text-orange-400">
              {formatMoney(player.cash)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Energy
            </p>

            <p className="mt-2 text-2xl font-black">
              {player.energy}
              <span className="text-sm text-slate-600">
                {" "}
                / {player.maxEnergy}
              </span>
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Level / XP
            </p>

            <p className="mt-2 text-2xl font-black">
              {player.level}
            </p>

            <p className="text-xs text-slate-600">
              {player.experience.toLocaleString()} XP
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Reputation
            </p>

            <p className="mt-2 text-2xl font-black text-green-400">
              {player.reputation.toLocaleString()}
            </p>
          </div>

        </section>

        {/* PLAYER DETAILS */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-black">
            Player Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Player ID
              </p>

              <p className="mt-2 break-all text-xs text-slate-400">
                {player.id}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Location
              </p>

              <p className="mt-2 text-sm font-bold">
                {formatLocation(
                  player.currentLocationId
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Current Job
              </p>

              <p className="mt-2 text-sm font-bold">
                {player.currentJobId ||
                  "No active job"}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                Job XP:{" "}
                {player.jobExperience.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Last Updated
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {formatDate(
                  player.updatedAt
                )}
              </p>
            </div>

          </div>
        </section>

        {/* REASON */}

        <section className="mb-6 rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] p-6">

          <h2 className="font-black">
            Admin Action Reason
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            This reason is stored in the
            administrative audit history.
          </p>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Why are you making this change?"
            rows={3}
            maxLength={1000}
            className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
          />

          <div className="mt-2 text-right text-[10px] text-slate-700">
            {reason.length}/1000
          </div>

        </section>

        {/* ACCOUNT CONTROL */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <div className="mb-5">
            <h2 className="font-black">
              Account Control
            </h2>

            <p className="mt-1 text-xs text-slate-600">
              Control access to the player's
              Abuja Life account.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {player.isFrozen ? (
              <button
                onClick={() =>
                  performAction("unfreeze")
                }
                disabled={working}
                className="rounded-xl bg-green-500 px-6 py-3 text-xs font-black text-black transition hover:bg-green-400 disabled:opacity-50"
              >
                🔓 Unfreeze Player
              </button>
            ) : (
              <button
                onClick={() =>
                  performAction("freeze")
                }
                disabled={working}
                className="rounded-xl bg-red-500 px-6 py-3 text-xs font-black text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                🔒 Freeze Player
              </button>
            )}

          </div>

        </section>

        {/* ECONOMY */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-black">
            Economy Controls
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Add or remove money from the
            player's wallet.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">

            <input
              type="number"
              step="0.01"
              value={cashAmount}
              onChange={(event) =>
                setCashAmount(
                  event.target.value
                )
              }
              placeholder="Amount — use negative to remove"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
            />

            <button
              onClick={submitCash}
              disabled={
                working ||
                cashAmount.trim() === ""
              }
              className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black text-black transition hover:bg-orange-400 disabled:opacity-50"
            >
              💰 Adjust Cash
            </button>

          </div>

          <p className="mt-2 text-[10px] text-slate-700">
            Positive amount adds cash. Negative
            amount removes cash.
          </p>

        </section>

        {/* PLAYER PROGRESSION */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-black">
            Progression Controls
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Set the player's current energy,
            reputation and XP.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">

            {/* ENERGY */}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Energy
              </label>

              <p className="mt-1 text-[10px] text-slate-700">
                Allowed: 0–{player.maxEnergy}
              </p>

              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={player.maxEnergy}
                  value={energy}
                  onChange={(event) =>
                    setEnergy(
                      event.target.value
                    )
                  }
                  placeholder={`${player.energy}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
                />

                <button
                  onClick={submitEnergy}
                  disabled={
                    working ||
                    energy.trim() === ""
                  }
                  className="rounded-xl bg-white/10 px-4 text-xs font-black transition hover:bg-white/20 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

            {/* REPUTATION */}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Reputation
              </label>

              <p className="mt-1 text-[10px] text-slate-700">
                Whole number
              </p>

              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  step="1"
                  value={reputation}
                  onChange={(event) =>
                    setReputation(
                      event.target.value
                    )
                  }
                  placeholder={`${player.reputation}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
                />

                <button
                  onClick={submitReputation}
                  disabled={
                    working ||
                    reputation.trim() === ""
                  }
                  className="rounded-xl bg-white/10 px-4 text-xs font-black transition hover:bg-white/20 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

            {/* XP */}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                XP
              </label>

              <p className="mt-1 text-[10px] text-slate-700">
                Non-negative whole number
              </p>

              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={experience}
                  onChange={(event) =>
                    setExperience(
                      event.target.value
                    )
                  }
                  placeholder={`${player.experience}`}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
                />

                <button
                  onClick={submitExperience}
                  disabled={
                    working ||
                    experience.trim() === ""
                  }
                  className="rounded-xl bg-white/10 px-4 text-xs font-black transition hover:bg-white/20 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

          </div>

        </section>

        {/* LOCATION */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

          <h2 className="font-black">
            Location Control
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Move the player to another Abuja
            location.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <select
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
              className="min-w-[220px] rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/50"
            >
              {locations.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <button
              onClick={submitLocation}
              disabled={
                working ||
                !location
              }
              className="rounded-xl bg-white/10 px-6 py-3 text-xs font-black transition hover:bg-white/20 disabled:opacity-50"
            >
              📍 Move Player
            </button>

          </div>

        </section>

        {/* DANGER ZONE */}

        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6">

          <h2 className="font-black text-red-400">
            Danger Zone
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Reset this player's game state.
            The reset uses the current Admin
            Game Settings for default cash and
            maximum energy. This action is
            permanently recorded in the audit
            history.
          </p>

          <button
            onClick={confirmReset}
            disabled={working}
            className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-xs font-black text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {working
              ? "Working..."
              : "🔄 Reset Player State"}
          </button>

        </section>

        {/* WORKING INDICATOR */}

        {working && (
          <div className="fixed bottom-6 right-6 z-[200] rounded-2xl border border-orange-500/20 bg-[#09110f] px-5 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-orange-400" />

              <span className="text-xs font-black text-slate-300">
                Applying admin action...
              </span>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
