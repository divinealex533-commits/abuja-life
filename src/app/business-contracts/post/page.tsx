"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BUSINESSES } from "@/lib/game/businesses";

const supabase = createClient();

const LOCATIONS = [
  { id: "garki", name: "Garki" },
  { id: "wuse", name: "Wuse" },
  { id: "wuse-2", name: "Wuse 2" },
  { id: "maitama", name: "Maitama" },
  { id: "jabi", name: "Jabi" },
  { id: "gwarinpa", name: "Gwarinpa" },
  { id: "cbd", name: "Central Business District" },
  { id: "kado", name: "Kado" },
  { id: "asokoro", name: "Asokoro" },
];

export default function PostBusinessContractPage() {
  const router = useRouter();

  const [businessId, setBusinessId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("garki");
  const [reward, setReward] = useState("");
  const [reputationReward, setReputationReward] = useState("5");
  const [experienceReward, setExperienceReward] = useState("25");

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedBusiness = useMemo(
    () => BUSINESSES.find((business) => business.id === businessId),
    [businessId]
  );

  useEffect(() => {
    async function loadWallet() {
      try {
        setLoadingWallet(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: walletError } = await supabase
          .from("player_wallets")
          .select("balance")
          .eq("player_id", user.id)
          .maybeSingle();

        if (walletError) {
          throw walletError;
        }

        setWalletBalance(Number(data?.balance ?? 0));
      } catch (err) {
        console.error(err);
        setError("Unable to load your wallet.");
      } finally {
        setLoadingWallet(false);
      }
    }

    loadWallet();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numericReward = Number(reward);
    const numericRep = Number(reputationReward);
    const numericExperience = Number(experienceReward);

    if (!businessId) {
      setError("Please choose the business category.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a contract title.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the work you need.");
      return;
    }

    if (!Number.isFinite(numericReward) || numericReward <= 0) {
      setError("Enter a valid reward amount.");
      return;
    }

    try {
      setPosting(true);

      const { data, error: rpcError } = await supabase.rpc(
        "create_player_business_contract",
        {
          p_business_id: businessId,
          p_title: title.trim(),
          p_description: description.trim(),
          p_location_id: locationId,
          p_reward: numericReward,
          p_reputation_reward: numericRep,
          p_experience_reward: numericExperience,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      if (!data) {
        throw new Error("The contract could not be created.");
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.success === false) {
        throw new Error(
          result.message || "The contract could not be created."
        );
      }

      setSuccess(
        `Contract posted successfully! ₦${numericReward.toLocaleString()} has been secured in escrow.`
      );

      setWalletBalance(
        result?.wallet_balance !== undefined
          ? Number(result.wallet_balance)
          : Math.max(
              0,
              (walletBalance ?? numericReward) - numericReward
            )
      );

      setTitle("");
      setDescription("");
      setReward("");

      setTimeout(() => {
        router.push("/business-contracts");
      }, 1400);
    } catch (err) {
      console.error("Post contract error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while posting the contract.";

      setError(message);
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/business-contracts"
              className="mb-3 inline-block text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to Contract Marketplace
            </Link>

            <h1 className="text-3xl font-black tracking-tight">
              Post a Contract
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Hire another player to complete work for you.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-emerald-300">
              Wallet Balance
            </p>

            <p className="mt-1 text-xl font-black text-emerald-400">
              {loadingWallet
                ? "Loading..."
                : `₦${(walletBalance ?? 0).toLocaleString()}`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <h2 className="text-xl font-bold">1. Choose the type of work</h2>

            <p className="mt-1 text-sm text-slate-400">
              What kind of player or business do you need?
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BUSINESSES.map((business) => {
                const selected = businessId === business.id;

                return (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => setBusinessId(business.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-emerald-400 bg-emerald-400/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="text-2xl">
  💼
</div>

                    <div className="mt-3 font-bold">
                      {business.name}
                    </div>

                    {business.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {business.description}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedBusiness && (
              <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-300">
                Selected: <strong>{selectedBusiness.name}</strong>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <h2 className="text-xl font-bold">2. Contract details</h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Contract title
                </label>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Design my restaurant interior"
                  maxLength={120}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  What do you need done?
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Explain exactly what you want the other player to do..."
                  rows={6}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400"
                />

                <p className="mt-1 text-right text-xs text-slate-600">
                  {description.length}/2000
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Work location
                </label>

                <select
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                >
                  {LOCATIONS.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
            <h2 className="text-xl font-bold">3. Set the reward</h2>

            <p className="mt-1 text-sm text-slate-400">
              The reward will be locked in escrow immediately when you post
              the contract.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Payment
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                    ₦
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={reward}
                    onChange={(event) => setReward(event.target.value)}
                    placeholder="5000"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-9 pr-4 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Reputation
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reputationReward}
                  onChange={(event) =>
                    setReputationReward(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Experience
                </label>

                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={experienceReward}
                  onChange={(event) =>
                    setExperienceReward(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              {success}
            </div>
          )}

          <section className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="font-bold text-amber-300">
              🔐 Escrow protection
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Your reward is locked when the contract is created. The worker
              receives the payment only after the contract is successfully
              completed.
            </p>
          </section>

          <button
            type="submit"
            disabled={posting || loadingWallet}
            className="w-full rounded-2xl bg-emerald-500 px-6 py-4 text-base font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting
              ? "Posting Contract..."
              : "💼 Post Contract & Secure Payment"}
          </button>
        </form>
      </div>
    </main>
  );
}