"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatNaira, VIP_TIERS, type VipTier } from "@/lib/vip/catalog";

type AdminVipData = {
  activeMembers: Array<{ user_id: string; tier: VipTier; started_at: string; expires_at: string }>;
  tierCounts: Record<VipTier, number>;
  salesByProduct: Array<{ productId: string; name: string; price: number; count: number; revenue: number }>;
  totalStoreRevenue: number;
  failedDeliveries: Array<{ reference: string; user_id: string; product_id: string; error: string | null; created_at: string }>;
  weekendSettings: {
    enabled: boolean;
    saturday_amount: number;
    sunday_amount: number;
    both_days_bonus: number;
  } | null;
  weekendPaidOutLast14Days: number;
  weekendClaimsLast14Days: number;
};

export default function AdminVipPage() {
  const [data, setData] = useState<AdminVipData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [weekend, setWeekend] = useState({
    enabled: true,
    saturday_amount: 5000,
    sunday_amount: 7500,
    both_days_bonus: 5000,
  });

  const [grant, setGrant] = useState({ userId: "", tier: "gold" as VipTier, days: 7 });

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/vip", { cache: "no-store" });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setError(json?.error || "Could not load VIP data.");
      return;
    }
    setData(json);
    if (json.weekendSettings) setWeekend(json.weekendSettings);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(payload: Record<string, unknown>, success: string) {
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/vip", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      setError(json?.error || "Update failed.");
      return;
    }
    setNotice(success);
    void load();
  }

  const input =
    "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link href="/admin" className="text-xs font-bold text-orange-400 hover:text-orange-300">
        ← Admin Dashboard
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">VIP, Store & Weekend Rewards</h1>
      <p className="mt-2 text-sm text-slate-500">
        What players are buying, who is VIP, and how much weekend cash you give out.
      </p>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}
      {notice && (
        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">{notice}</div>
      )}

      {/* STATS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Store revenue</p>
          <p className="mt-3 text-2xl font-black">{formatNaira(data?.totalStoreRevenue ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-500">delivered purchases</p>
        </div>
        {(["silver", "gold", "diamond"] as VipTier[]).map((tier) => (
          <div key={tier} className={`rounded-2xl border ${VIP_TIERS[tier].border} bg-white/[0.03] p-5`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${VIP_TIERS[tier].color}`}>
              {VIP_TIERS[tier].emoji} {tier} active
            </p>
            <p className="mt-3 text-2xl font-black">{data?.tierCounts[tier] ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">players</p>
          </div>
        ))}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Weekend cash (14d)</p>
          <p className="mt-3 text-2xl font-black">{formatNaira(data?.weekendPaidOutLast14Days ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-500">{data?.weekendClaimsLast14Days ?? 0} claims · game cash only</p>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* WEEKEND SETTINGS */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">Weekend rewards</h2>
          <p className="mt-1 text-xs text-slate-500">
            Base game-cash amounts. VIP multiplies them (Silver 2×, Gold 3×, Diamond 5×).
          </p>

          <label className="mt-5 flex items-center gap-3 text-sm font-bold">
            <input
              type="checkbox"
              checked={weekend.enabled}
              onChange={(e) => setWeekend({ ...weekend, enabled: e.target.checked })}
            />
            Weekend rewards enabled
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(
              [
                ["saturday_amount", "Saturday ₦"],
                ["sunday_amount", "Sunday ₦"],
                ["both_days_bonus", "Both-day bonus ₦"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs font-bold text-slate-400">
                {label}
                <input
                  type="number"
                  min={0}
                  className={`${input} mt-1`}
                  value={weekend[key]}
                  onChange={(e) => setWeekend({ ...weekend, [key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => patch({ action: "weekend_settings", ...weekend }, "Weekend rewards saved.")}
            className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-400"
          >
            Save weekend rewards
          </button>
        </section>

        {/* GRANT VIP */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-black">Gift VIP</h2>
          <p className="mt-1 text-xs text-slate-500">
            For giveaways, competition winners or support cases. Copy the player ID from Admin → Players.
          </p>

          <div className="mt-5 space-y-3">
            <input
              className={input}
              placeholder="Player ID (uuid)"
              value={grant.userId}
              onChange={(e) => setGrant({ ...grant, userId: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className={input}
                value={grant.tier}
                onChange={(e) => setGrant({ ...grant, tier: e.target.value as VipTier })}
              >
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
              </select>
              <input
                type="number"
                min={1}
                max={365}
                className={input}
                value={grant.days}
                onChange={(e) => setGrant({ ...grant, days: Number(e.target.value) })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => patch({ action: "grant_vip", ...grant }, "VIP granted.")}
            className="mt-5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black text-black hover:bg-amber-400"
          >
            Grant VIP
          </button>
        </section>
      </div>

      {/* SALES */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-black">Sales by product</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="py-2">Product</th>
                <th>Price</th>
                <th>Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data?.salesByProduct ?? []).map((p) => (
                <tr key={p.productId} className="border-t border-white/5">
                  <td className="py-2 font-bold">{p.name}</td>
                  <td>{formatNaira(p.price)}</td>
                  <td>{p.count}</td>
                  <td className="font-black text-green-400">{formatNaira(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAILED DELIVERIES */}
      {(data?.failedDeliveries.length ?? 0) > 0 && (
        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-6">
          <h2 className="text-lg font-black text-red-300">Paid but not delivered</h2>
          <p className="mt-1 text-xs text-slate-500">
            These retry automatically when Paystack resends the webhook or the player reopens the payment page.
          </p>
          <ul className="mt-4 space-y-2 text-xs">
            {data?.failedDeliveries.map((f) => (
              <li key={f.reference} className="rounded-xl bg-black/30 p-3">
                <span className="font-black">{f.product_id}</span> · {f.reference} · {f.user_id}
                <div className="mt-1 text-red-300">{f.error}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* MEMBERS */}
      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-lg font-black">Active VIP members ({data?.activeMembers.length ?? 0})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="py-2">Player</th>
                <th>Tier</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {(data?.activeMembers ?? []).map((m) => (
                <tr key={m.user_id} className="border-t border-white/5">
                  <td className="py-2 font-mono">
                    <Link href={`/admin/players/${m.user_id}`} className="hover:text-orange-300">
                      {m.user_id}
                    </Link>
                  </td>
                  <td className={VIP_TIERS[m.tier]?.color}>
                    {VIP_TIERS[m.tier]?.emoji} {m.tier}
                  </td>
                  <td>{new Date(m.expires_at).toLocaleString("en-NG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
