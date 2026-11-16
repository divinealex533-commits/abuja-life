"use client";

import Link from "next/link";
import { useState } from "react";

import VipBadge from "@/components/vip/VipBadge";
import VipSection from "@/components/vip/VipSection";
import WeekendRewardPanel from "@/components/vip/WeekendRewardPanel";
import {
  formatNaira,
  STORE_PRODUCTS,
  VIP_TIERS,
  type StoreProduct,
  type VipTier,
} from "@/lib/vip/catalog";
import { usePrices } from "@/lib/pricing/client";
import { startCheckout, useVip } from "@/lib/vip/client";

const TIER_ORDER: VipTier[] = ["silver", "gold", "diamond"];

export default function VipStorePage() {
  const { vip, loggedIn, loading } = useVip();
  const { prices } = usePrices();

  // Admin → Prices decides the real price and whether it's on sale.
  const priceOf = (product: StoreProduct) =>
    prices[`product:${product.id}`]?.amount ?? product.priceNaira;
  const onSale = (product: StoreProduct) =>
    prices[`product:${product.id}`]?.active !== false;
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function buy(product: StoreProduct) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }

    setBuying(product.id);
    setError("");

    const problem = await startCheckout(product.id);

    if (problem) {
      setError(problem);
      setBuying(null);
    }
    // On success the browser is already going to Paystack.
  }

  const vipProducts = STORE_PRODUCTS.filter((p) => p.kind === "vip" && onSale(p));
  const bundles = STORE_PRODUCTS.filter((p) => p.kind === "bundle" && onSale(p));

  return (
    <main className="min-h-screen bg-[#0b0805] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0805]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60 hover:text-white">
            ← BACK TO GAME
          </Link>
          <div className="text-sm font-black tracking-wide">
            ABUJA LIFE <span className="text-amber-300">VIP</span>
          </div>
          <div className="min-w-[90px] text-right">
            {vip.active && <VipBadge tier={vip.tier} />}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-amber-400/25 bg-gradient-to-br from-amber-500/20 via-[#1a1206] to-violet-600/15 p-8 text-center shadow-2xl sm:p-14">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative">
            <div className="text-6xl">👑</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
              Live the <span className="text-amber-300">VIP Life</span> in Abuja
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
              Earn more on every shift, unlock elite careers like Surgeon and
              Diplomat, enter private lounges and multiply your weekend rewards.
            </p>

            {!loading && vip.active && (
              <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-amber-400/25 bg-black/30 px-5 py-3">
                <VipBadge tier={vip.tier} size="md" />
                <span className="text-sm font-bold text-white/70">
                  Active · {vip.daysLeft} day{vip.daysLeft === 1 ? "" : "s"} left
                </span>
                <span className="text-xs text-white/40">
                  Buying again adds more days.
                </span>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {/* TIERS */}
        <section className="mt-10">
          <h2 className="text-2xl font-black">Choose your VIP level</h2>
          <p className="mt-1 text-sm text-white/45">
            Secure payment with Paystack: card, bank transfer or USSD.
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {TIER_ORDER.map((tierId) => {
              const tier = VIP_TIERS[tierId];
              const products = vipProducts.filter((p) => p.vipTier === tierId);
              const isCurrent = vip.active && vip.tier === tierId;
              const featured = tierId === "gold";

              return (
                <article
                  key={tierId}
                  className={`relative flex flex-col rounded-[2rem] border bg-gradient-to-b ${tier.gradient} p-6 ${
                    featured
                      ? "border-amber-400/50 shadow-[0_0_60px_-15px_rgba(251,191,36,0.45)]"
                      : tier.border
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-[10px] font-black text-black">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-4xl">{tier.emoji}</div>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black text-emerald-300">
                        YOUR PLAN
                      </span>
                    )}
                  </div>

                  <h3 className={`mt-4 text-2xl font-black ${tier.color}`}>{tier.name}</h3>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex gap-2 text-sm text-white/75">
                        <span className="text-emerald-400">✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 space-y-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        disabled={buying !== null}
                        onClick={() => buy(product)}
                        className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-black transition disabled:opacity-50 ${
                          featured
                            ? "bg-amber-400 text-black hover:bg-amber-300"
                            : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        <span>
                          {buying === product.id
                            ? "Opening Paystack..."
                            : `${product.vipDays} days`}
                        </span>
                        <span>{formatNaira(priceOf(product))}</span>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* BUNDLES */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Packs & game cash</h2>
          <p className="mt-1 text-sm text-white/45">
            Buy a house, a car or start a business faster.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {bundles.map((product) => (
              <article
                key={product.id}
                className="relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                {product.highlight && (
                  <span className="absolute right-4 top-4 rounded-full bg-emerald-400/15 px-3 py-1 text-[9px] font-black text-emerald-300">
                    {product.highlight}
                  </span>
                )}
                <div className="text-3xl">{product.vipTier ? "🎁" : "💰"}</div>
                <h3 className="mt-3 text-lg font-black">{product.name}</h3>
                <p className="mt-1 flex-1 text-sm text-white/50">{product.description}</p>
                <button
                  type="button"
                  disabled={buying !== null}
                  onClick={() => buy(product)}
                  className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {buying === product.id
                    ? "Opening Paystack..."
                    : `BUY · ${formatNaira(priceOf(product))}`}
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* WEEKEND + DAILY PERKS */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <WeekendRewardPanel />
          <VipSection area="hub" />
        </div>

        {/* FAQ */}
        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-xl font-black">Questions</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div>
              <div className="text-sm font-black">When does VIP start?</div>
              <p className="mt-1 text-sm text-white/45">
                Right after Paystack confirms your payment, usually within seconds.
              </p>
            </div>
            <div>
              <div className="text-sm font-black">Does it renew automatically?</div>
              <p className="mt-1 text-sm text-white/45">
                No. You pay once for the days you choose. Buying again adds days on top.
              </p>
            </div>
            <div>
              <div className="text-sm font-black">Is game cash real money?</div>
              <p className="mt-1 text-sm text-white/45">
                No. Game cash and rewards stay in Abuja Life and can&apos;t be withdrawn.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
