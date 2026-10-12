"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  createdAt: string;
  updatedAt: string;
}

const locations = [
  { id: "garki", label: "Garki" },
  { id: "wuse", label: "Wuse" },
  { id: "maitama", label: "Maitama" },
  { id: "asokoro", label: "Asokoro" },
  { id: "jabi", label: "Jabi" },
  { id: "gwarinpa", label: "Gwarinpa" },
  { id: "central-area", label: "Central Area" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPlayerControlPage() {
  const params = useParams();

  const playerId = String(params.id);

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const [cashAmount, setCashAmount] = useState("");
  const [energy, setEnergy] = useState("");
  const [reputation, setReputation] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("garki");
  const [reason, setReason] = useState("");

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function loadPlayer() {
    try {
      setLoading(true);
      setFeedback("");

      const response = await fetch(
        `/api/admin/players?search=${encodeURIComponent(playerId)}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load player.");
      }

      const found = (data.players ?? []).find(
        (item: Player) => item.id === playerId
      );

      if (!found) {
        throw new Error("Player not found.");
      }

      setPlayer(found);

      setEnergy(String(found.energy));
      setReputation(String(found.reputation));
      setExperience(String(found.experience));
      setLocation(found.currentLocationId || "garki");
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load player."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayer();
  }, [playerId]);

  async function performAction(
    action: string,
    payload: Record<string, unknown> = {}
  ) {
    try {
      setBusy(true);
      setFeedback("");

      const response = await fetch(
        `/api/admin/players/${playerId}/control`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reason: reason.trim() || undefined,
            ...payload,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action failed.");
      }

      setFeedback("Admin action completed successfully.");

      await loadPlayer();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Action failed."
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            Loading player...
          </div>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/players"
            className="text-sm font-bold text-orange-400"
          >
            ← Back to Players
          </Link>

          <div className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {feedback || "Player not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/players"
              className="text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              ← Back to Players
            </Link>

            <h1 className="mt-3 text-3xl font-black">
              Manage Player
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Admin controls for {player.displayName}
            </p>
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-xs font-black ${
              (player as Player & { isFrozen?: boolean }).isFrozen
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            {(player as Player & { isFrozen?: boolean }).isFrozen
              ? "FROZEN"
              : "ACTIVE"}
          </div>
        </div>

        {feedback && (
          <div className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-sm font-bold text-orange-300">
            {feedback}
          </div>
        )}

        {/* PLAYER SUMMARY */}

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-3xl">{player.avatar}</div>
            <div className="mt-3 text-lg font-black">
              {player.displayName}
            </div>
            <div className="text-xs text-slate-500">
              @{player.username}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Cash
            </div>
            <div className="mt-2 text-2xl font-black text-green-400">
              {formatMoney(player.cash)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Energy
            </div>
            <div className="mt-2 text-2xl font-black">
              {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Level
            </div>
            <div className="mt-2 text-2xl font-black text-orange-400">
              {player.level}
            </div>
          </div>
        </section>

        {/* FREEZE */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">
            Account Control
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Temporarily prevent this player from participating in
            the game.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={() =>
                performAction("freeze")
              }
              className="rounded-xl bg-red-500 px-5 py-3 text-xs font-black text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              🔒 Freeze Player
            </button>

            <button
              disabled={busy}
              onClick={() =>
                performAction("unfreeze")
              }
              className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-xs font-black text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
            >
              🔓 Unfreeze Player
            </button>
          </div>
        </section>

        {/* ECONOMY */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">
            Economy Controls
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Adjust the player's virtual economy.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Cash adjustment
              </label>

              <input
                value={cashAmount}
                onChange={(e) =>
                  setCashAmount(e.target.value)
                }
                type="number"
                placeholder="+5000 or -5000"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
              />

              <button
                disabled={busy || !cashAmount}
                onClick={() =>
                  performAction("cash", {
                    amount: Number(cashAmount),
                  })
                }
                className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black disabled:opacity-40"
              >
                Apply Cash
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Energy
              </label>

              <input
                value={energy}
                onChange={(e) =>
                  setEnergy(e.target.value)
                }
                type="number"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
              />

              <button
                disabled={busy}
                onClick={() =>
                  performAction("energy", {
                    value: Number(energy),
                  })
                }
                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/15 disabled:opacity-40"
              >
                Set Energy
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Reputation
              </label>

              <input
                value={reputation}
                onChange={(e) =>
                  setReputation(e.target.value)
                }
                type="number"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
              />

              <button
                disabled={busy}
                onClick={() =>
                  performAction("reputation", {
                    value: Number(reputation),
                  })
                }
                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/15 disabled:opacity-40"
              >
                Set Reputation
              </button>
            </div>
          </div>
        </section>

        {/* PROGRESSION */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">
            Progression Controls
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Player XP
              </label>

              <input
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
                type="number"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
              />

              <button
                disabled={busy}
                onClick={() =>
                  performAction("experience", {
                    value: Number(experience),
                  })
                }
                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/15 disabled:opacity-40"
              >
                Set XP
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Player Location
              </label>

              <select
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
              >
                {locations.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                disabled={busy}
                onClick={() =>
                  performAction("location", {
                    locationId: location,
                  })
                }
                className="mt-2 w-full rounded-xl bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/15 disabled:opacity-40"
              >
                Move Player
              </button>
            </div>
          </div>
        </section>

        {/* REASON */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">
            Admin Reason
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This reason is saved with the admin action.
          </p>

          <textarea
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            placeholder="Why are you making this change?"
            rows={4}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-orange-500/50"
          />
        </section>

        {/* RESET */}

        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
          <h2 className="text-lg font-black text-red-400">
            Danger Zone
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Reset this player's game state back to the default
            starting state.
          </p>

          <button
            disabled={busy}
            onClick={() => {
              const confirmed = window.confirm(
                "Reset this player's game state? This cannot be undone."
              );

              if (confirmed) {
                performAction("reset");
              }
            }}
            className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-black text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            Reset Player Game State
          </button>
        </section>
      </div>
    </main>
  );
}
