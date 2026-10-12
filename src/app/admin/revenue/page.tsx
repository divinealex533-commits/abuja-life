"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RevenueEvent = {
  id: string;
  user_id: string | null;
  source: string;
  description: string;
  amount: number | string;
  currency: string;
  reference: string | null;
  status: string;
  created_at: string;
};

type RevenueSummary = {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  completedCount: number;
  pendingCount: number;
  refundedCount: number;
};

type RevenueResponse = {
  summary: RevenueSummary;
  sourceTotals: Record<string, number>;
  events: RevenueEvent[];
};

const sourceInfo: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  vip: {
    label: "VIP",
    icon: "👑",
  },

  marketplace: {
    label: "Marketplace",
    icon: "🛒",
  },

  business_promotion: {
    label: "Business Promotion",
    icon: "🏢",
  },

  sponsored_event: {
    label: "Sponsored Events",
    icon: "🎉",
  },

  ads: {
    label: "Advertising",
    icon: "📢",
  },

  other: {
    label: "Other",
    icon: "💰",
  },
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatSource(source: string) {
  return (
    sourceInfo[source]?.label ??
    source.replace(/_/g, " ")
  );
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-500/10 text-green-400";

    case "pending":
      return "bg-yellow-500/10 text-yellow-400";

    case "refunded":
      return "bg-orange-500/10 text-orange-400";

    case "failed":
      return "bg-red-500/10 text-red-400";

    default:
      return "bg-white/5 text-slate-400";
  }
}

export default function AdminRevenuePage() {
  const [data, setData] =
    useState<RevenueResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRevenue() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/revenue",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to load revenue."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load revenue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRevenue();
  }, []);

  const summary = data?.summary;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
      >
        ← Admin Dashboard
      </Link>

      {/* HEADER */}
      <section className="mt-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
          💰 ABUJA LIFE REVENUE
        </div>

        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-black">
              Revenue Center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Monitor every monetization source,
              revenue transaction and financial
              activity across Abuja Life.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRevenue}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh Revenue"}
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* MAIN TOTALS */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Total Revenue
            </span>

            <span className="text-xl">
              🏦
            </span>
          </div>

          <p className="mt-4 text-2xl font-black">
            {loading
              ? "..."
              : formatNaira(
                  summary?.totalRevenue ?? 0
                )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Lifetime completed revenue
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Today
            </span>

            <span className="text-xl">
              📅
            </span>
          </div>

          <p className="mt-4 text-2xl font-black">
            {loading
              ? "..."
              : formatNaira(
                  summary?.todayRevenue ?? 0
                )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Revenue generated today
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              This Month
            </span>

            <span className="text-xl">
              📈
            </span>
          </div>

          <p className="mt-4 text-2xl font-black">
            {loading
              ? "..."
              : formatNaira(
                  summary?.monthRevenue ?? 0
                )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Current month revenue
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Pending
            </span>

            <span className="text-xl">
              ⏳
            </span>
          </div>

          <p className="mt-4 text-2xl font-black">
            {loading
              ? "..."
              : formatNaira(
                  summary?.pendingRevenue ?? 0
                )}
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Awaiting completion
          </p>
        </div>
      </section>

      {/* SOURCES */}
      <section className="mt-10">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
            Monetization
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Revenue Sources
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(sourceInfo).map(
            ([source, info]) => (
              <div
                key={source}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">
                    {info.icon}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      {info.label}
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {loading
                        ? "..."
                        : formatNaira(
                            data?.sourceTotals[
                              source
                            ] ?? 0
                          )}
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* STATUS */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold text-slate-500">
            Completed Transactions
          </p>

          <p className="mt-3 text-3xl font-black">
            {loading
              ? "..."
              : summary?.completedCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold text-slate-500">
            Pending Transactions
          </p>

          <p className="mt-3 text-3xl font-black">
            {loading
              ? "..."
              : summary?.pendingCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold text-slate-500">
            Refunded Transactions
          </p>

          <p className="mt-3 text-3xl font-black">
            {loading
              ? "..."
              : summary?.refundedCount ?? 0}
          </p>
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              Financial Ledger
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Recent Revenue
            </h2>
          </div>

          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-500">
            {data?.events.length ?? 0} records
          </span>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="rounded-xl bg-black/20 p-8 text-center text-sm text-slate-500">
              Loading revenue records...
            </div>
          ) : data?.events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
              <div className="text-4xl">
                💰
              </div>

              <p className="mt-3 font-bold text-slate-400">
                No revenue recorded yet
              </p>

              <p className="mt-1 text-xs text-slate-600">
                Revenue transactions will appear
                here as Abuja Life starts generating
                income.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-3">
                    Date
                  </th>

                  <th className="px-3 py-3">
                    Source
                  </th>

                  <th className="px-3 py-3">
                    Description
                  </th>

                  <th className="px-3 py-3">
                    Reference
                  </th>

                  <th className="px-3 py-3 text-right">
                    Amount
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {data?.events?.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-3 py-4 text-xs text-slate-500">
                      {new Date(
                        event.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-2 text-xs font-bold">
                        <span>
                          {sourceInfo[
                            event.source
                          ]?.icon ?? "💰"}
                        </span>

                        {formatSource(
                          event.source
                        )}
                      </span>
                    </td>

                    <td className="max-w-[260px] px-3 py-4 text-xs text-slate-400">
                      {event.description}
                    </td>

                    <td className="px-3 py-4 text-xs text-slate-600">
                      {event.reference ?? "—"}
                    </td>

                    <td className="px-3 py-4 text-right text-sm font-black">
                      {formatNaira(
                        Number(event.amount)
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* INFO */}
      <section className="mt-8 rounded-2xl border border-orange-500/10 bg-orange-500/5 p-6">
        <div className="flex gap-4">
          <div className="text-2xl">
            💡
          </div>

          <div>
            <h3 className="font-black">
              Revenue tracking foundation
            </h3>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              This ledger is designed to receive
              real transactions from Abuja Life
              monetization systems. VIP purchases,
              marketplace payments, business
              promotions, sponsored events and
              advertising can all feed into this
              central revenue system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
