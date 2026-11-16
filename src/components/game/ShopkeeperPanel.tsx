"use client";

import { useMemo, useState } from "react";

import {
  SHOPKEEPER_ORDERS,
  calculateShopkeeperSale,
  getShopkeeperProduct,
} from "@/lib/game/shopkeeper";
import {
  loadPersistentPlayerState,
  savePersistentPlayerState,
} from "@/lib/game/player";

export default function ShopkeeperPanel() {
  const [orderIndex, setOrderIndex] = useState(0);
  const [price, setPrice] = useState(0);
  const [service, setService] = useState(75);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const order = SHOPKEEPER_ORDERS[orderIndex];

  const product = useMemo(
    () => getShopkeeperProduct(order.productId),
    [order.productId]
  );

  if (!product) {
    return null;
  }

  const defaultPrice = product.basePrice;

  async function serveCustomer() {
    if (working) return;

    setWorking(true);
    setMessage("");

    try {
      const player = await loadPersistentPlayerState();

      const sellingPrice =
        price > 0 ? Math.round(price) : defaultPrice;

      const result = calculateShopkeeperSale(
        order,
        sellingPrice,
        service
      );

      if (!result) {
        setMessage("Unable to process this order.");
        return;
      }

      const energyCost = 10;

      if (player.energy < energyCost) {
        setMessage(
          "You are too tired. Restore your energy before serving another customer."
        );
        return;
      }

      if (!result.accepted) {
        const updatedPlayer = {
          ...player,
          energy: Math.max(0, player.energy - energyCost),
          reputation: Math.max(
            0,
            player.reputation - 1
          ),
        };

        await savePersistentPlayerState(updatedPlayer);

        setMessage(
          `Customer ${order.customer} walked away. Improve your pricing and service.`
        );

        setOrderIndex(
          (current) =>
            (current + 1) % SHOPKEEPER_ORDERS.length
        );

        setPrice(0);
        setService(75);

        return;
      }

      const updatedPlayer = {
        ...player,
        cash: player.cash + result.profit,
        energy: Math.max(0, player.energy - energyCost),
        reputation:
          player.reputation +
          (result.satisfaction >= 90
            ? 4
            : result.satisfaction >= 75
              ? 3
              : 1),
        jobExperience:
          player.jobExperience +
          (result.satisfaction >= 90
            ? 35
            : result.satisfaction >= 75
              ? 25
              : 18),
      };

      await savePersistentPlayerState(updatedPlayer);

      setMessage(
        `Sale completed! +₦${result.profit.toLocaleString()} profit${
          result.tip
            ? ` including ₦${result.tip.toLocaleString()} tip`
            : ""
        }. Customer satisfaction: ${result.satisfaction}%.`
      );

      setOrderIndex(
        (current) =>
          (current + 1) % SHOPKEEPER_ORDERS.length
      );

      setPrice(0);
      setService(75);
    } catch (error) {
      console.error("Shopkeeper shift error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong during the shift."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Customer
          </p>
          <p className="mt-2 text-xl font-black">
            {order.customer}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Order
          </p>
          <p className="mt-2 text-xl font-black">
            {order.quantity} × {product.name}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
            Market Price
          </p>
          <p className="mt-2 text-xl font-black">
            ₦{product.basePrice.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-white/[0.03] to-emerald-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-4xl">
            {product.emoji}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-orange-300">
              Customer Request
            </p>

            <h2 className="mt-1 text-2xl font-black">
              {order.quantity} × {product.name}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              The customer wants a fair price and good service.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-white/50">
              Your Selling Price
            </label>

            <span className="text-sm font-black text-orange-300">
              ₦{(price || defaultPrice).toLocaleString()}
            </span>
          </div>

          <input
            type="range"
            min={Math.max(50, Math.round(product.basePrice * 0.65))}
            max={Math.round(product.basePrice * 1.45)}
            step={50}
            value={price || defaultPrice}
            onChange={(event) =>
              setPrice(Number(event.target.value))
            }
            className="mt-4 w-full accent-orange-400"
          />

          <div className="mt-2 flex justify-between text-[10px] font-bold text-white/30">
            <span>Cheap</span>
            <span>Fair</span>
            <span>Premium</span>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-widest text-white/50">
              Customer Service
            </label>

            <span className="text-sm font-black text-emerald-300">
              {service}%
            </span>
          </div>

          <input
            type="range"
            min="45"
            max="100"
            value={service}
            onChange={(event) =>
              setService(Number(event.target.value))
            }
            className="mt-4 w-full accent-emerald-400"
          />

          <div className="mt-2 flex justify-between text-[10px] font-bold text-white/30">
            <span>Basic</span>
            <span>Professional</span>
            <span>Excellent</span>
          </div>
        </div>

        <button
          type="button"
          disabled={working}
          onClick={() => void serveCustomer()}
          className="mt-8 w-full rounded-2xl bg-orange-400 px-6 py-4 text-sm font-black text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {working ? "SERVING CUSTOMER..." : "COMPLETE SALE →"}
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm font-bold text-white/70">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Demand
          </p>
          <p className="mt-1 font-black capitalize">
            {product.demand}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Order
          </p>
          <p className="mt-1 font-black">
            {orderIndex + 1}/{SHOPKEEPER_ORDERS.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
            Energy Cost
          </p>
          <p className="mt-1 font-black">10</p>
        </div>
      </div>
    </section>
  );
}
