"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SHOPS,
  getShopProducts,
  getProductItem,
  purchaseShopProduct,
  type ShopCategory,
} from "@/lib/game/shops";
import {
  loadPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";

const CATEGORIES: Array<{
  id: "all" | ShopCategory;
  label: string;
  icon: string;
}> = [
  { id: "all", label: "All Shops", icon: "🛍️" },
  { id: "fashion", label: "Fashion", icon: "👕" },
  { id: "food", label: "Food", icon: "🍛" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "tools", label: "Tools", icon: "🧰" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "events", label: "Events", icon: "🎟️" },
  { id: "luxury", label: "Luxury", icon: "💎" },
];

export default function ShopsPage() {
  const [category, setCategory] =
    useState<"all" | ShopCategory>("all");

  const [player, setPlayer] =
    useState<PlayerGameState>(() => loadPlayerState());

  const [message, setMessage] = useState("");

  const shops = useMemo(() => {
    if (category === "all") {
      return SHOPS;
    }

    return SHOPS.filter(
      (shop) => shop.category === category
    );
  }, [category]);

  function buyItem(
    shopId: string,
    itemId: string
  ) {
    const result = purchaseShopProduct(
      shopId,
      itemId
    );

    setPlayer(result.player);
    setMessage(result.message);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/game"
              className="mb-3 inline-block text-sm text-cyan-400 hover:text-cyan-300"
            >
              ← Back to Abuja Life
            </Link>

            <h1 className="text-4xl font-black">
              Abuja Shops
            </h1>

            <p className="mt-2 text-slate-400">
              Visit stores around Abuja and buy items
              for your life, career and adventures.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-xs uppercase tracking-wider text-slate-400">
              Wallet
            </div>

            <div className="mt-1 text-2xl font-black text-emerald-400">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
            {message}
          </div>
        )}

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition ${
                category === item.id
                  ? "bg-cyan-500 text-black"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {shops.map((shop) => {
            const products =
              getShopProducts(shop.id);

            return (
              <section
                key={shop.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
              >
                <div className="border-b border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-4xl">
                        {shop.icon}
                      </div>

                      <h2 className="mt-3 text-xl font-black">
                        {shop.name}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {shop.description}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400">
                      Open {shop.openHour}:00–
                      {shop.closeHour}:00
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    📍 {shop.locationId}
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {products.map((product) => {
                    const item =
                      getProductItem(product);

                    if (!item) {
                      return null;
                    }

                    return (
                      <div
                        key={product.itemId}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
                            {item.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-bold">
                                {item.name}
                              </h3>

                              {product.featured && (
                                <span className="text-[10px] font-black uppercase text-amber-400">
                                  Featured
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {item.description}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <span className="font-black text-emerald-400">
                                ₦
                                {product.price.toLocaleString()}
                              </span>

                              <button
                                onClick={() =>
                                  buyItem(
                                    shop.id,
                                    product.itemId
                                  )
                                }
                                className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-black transition hover:bg-cyan-400"
                              >
                                Buy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/inventory"
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
          >
            🎒 Open Inventory
          </Link>

          <Link
            href="/game"
            className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold hover:bg-white/15"
          >
            🗺️ Return to City
          </Link>
        </div>
      </div>
    </main>
  );
}