"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const adminSections = [
  {
    icon: "📢",
    title: "Announcements",
    description:
      "Publish announcements and important messages that appear to Abuja Life players.",
    href: "/admin/announcements",
  },
  {
    icon: "💰",
    title: "Revenue",
    description:
      "Monitor Abuja Life revenue, monetization sources and financial activity.",
    href: "/admin/revenue",
  },
  {
    icon: "🎯",
    title: "Player Tasks",
    description:
      "Create tasks for players, assign rewards and track task completion.",
    href: "/admin/tasks",
  },
  {
    icon: "💬",
    title: "Admin Chat",
    description:
      "Communicate directly with Abuja Life players and handle support.",
    href: "/admin/chat",
  },
  {
    icon: "👥",
    title: "Players",
    description:
      "Inspect player accounts, activity, progression and important player data.",
    href: "/admin/players",
  },
  {
    icon: "🧪",
    title: "Testing Center",
    description:
      "Test Abuja Life systems before launch and monitor important game functionality.",
    href: "/admin/testing",
  },
];

const revenueSources = [
  {
    key: "marketplace",
    label: "Marketplace",
    icon: "🛒",
  },
  {
    key: "vip",
    label: "VIP",
    icon: "👑",
  },
  {
    key: "business_promotion",
    label: "Business Promotion",
    icon: "🏢",
  },
  {
    key: "sponsored_event",
    label: "Sponsored Events",
    icon: "🎉",
  },
];

type RevenueData = {
  summary?: {
    today?: number;
    thisMonth?: number;
    total?: number;
    completed?: number;
    pending?: number;
    refunded?: number;
  };
  sourceTotals?: Record<string, number>;
};

type VisitorData = {
  totalVisitors?: number;
  visitorsToday?: number;
  visitorsThisMonth?: number;
};

function formatNGN(value: number | undefined | null) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatNumber(value: number | undefined | null) {
  return new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
}

export default function AdminPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [visitors, setVisitors] = useState<VisitorData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboardData = useCallback(async (manualRefresh = false) => {
    try {
      setError("");

      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [revenueResponse, visitorsResponse] = await Promise.all([
        fetch("/api/admin/revenue", {
          cache: "no-store",
        }),
        fetch("/api/admin/visitors", {
          cache: "no-store",
        }),
      ]);

      const revenueJson = await revenueResponse.json().catch(() => ({}));
      const visitorsJson = await visitorsResponse.json().catch(() => ({}));

      if (!revenueResponse.ok) {
        throw new Error(
          revenueJson?.error || "Unable to load revenue data."
        );
      }

      if (!visitorsResponse.ok) {
        throw new Error(
          visitorsJson?.error || "Unable to load visitor data."
        );
      }

      setRevenue(revenueJson);
      setVisitors(visitorsJson);
    } catch (err) {
      console.error("Admin dashboard data error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const interval = window.setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboardData]);

  const todayRevenue = revenue?.summary?.today ?? 0;
  const monthlyRevenue = revenue?.summary?.thisMonth ?? 0;
  const totalRevenue = revenue?.summary?.total ?? 0;

  const visitorsToday = visitors?.visitorsToday ?? 0;
  const visitorsThisMonth = visitors?.visitorsThisMonth ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* HEADER */}
      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8 shadow-2xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              ADMIN ACCESS ACTIVE
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Abuja Life
              <span className="block text-orange-400">
                Admin Control Center
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Control the Abuja Life world, manage players, monitor
              monetization, publish announcements and prepare the game
              for launch.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 px-5 py-3 text-sm font-black text-orange-300 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "↻ Refresh Data"}
            </button>

            <Link
              href="/game"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-200 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white"
            >
              ← Back to Game
            </Link>
          </div>
        </div>
      </section>

      {/* DASHBOARD DATA STATUS */}
      {error && (
        <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-400">
                Dashboard Data Error
              </p>

              <p className="mt-1 text-sm text-red-200">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20"
            >
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* REVENUE */}
      <section className="mt-8">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
              Abuja Life Revenue
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Monetization Overview
            </h2>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {loading
              ? "Loading financial data..."
              : "Live financial data • refreshes every 30 seconds"}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* TODAY */}
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Today
              </span>

              <span className="text-xl">💰</span>
            </div>

            <p className="mt-4 text-2xl font-black">
              {loading ? "..." : formatNGN(todayRevenue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Completed revenue recorded today
            </p>
          </div>

          {/* MONTH */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                This Month
              </span>

              <span className="text-xl">📈</span>
            </div>

            <p className="mt-4 text-2xl font-black">
              {loading ? "..." : formatNGN(monthlyRevenue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Completed monthly revenue
            </p>
          </div>

          {/* TOTAL */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Total Revenue
              </span>

              <span className="text-xl">🏦</span>
            </div>

            <p className="mt-4 text-2xl font-black">
              {loading ? "..." : formatNGN(totalRevenue)}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Lifetime completed revenue
            </p>
          </div>

          {/* VISITORS */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Visitors Today
              </span>

              <span className="text-xl">👀</span>
            </div>

            <p className="mt-4 text-2xl font-black">
              {loading ? "..." : formatNumber(visitorsToday)}
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Unique visitors recorded today
            </p>
          </div>
        </div>
      </section>

      {/* REVENUE SOURCES */}
      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {revenueSources.map((source) => {
            const value = revenue?.sourceTotals?.[source.key] ?? 0;

            return (
              <div
                key={source.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl">
                    {source.icon}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400">
                      {source.label}
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {loading ? "..." : formatNGN(value)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VISITOR ANALYTICS */}
      <section className="mt-8">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Visitor Analytics
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Abuja Life Traffic
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Visitors Today
            </p>

            <p className="mt-3 text-3xl font-black">
              {loading ? "..." : formatNumber(visitorsToday)}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Unique visitors recorded today
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Visitors This Month
            </p>

            <p className="mt-3 text-3xl font-black">
              {loading ? "..." : formatNumber(visitorsThisMonth)}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Unique visitor-day records this month
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Lifetime Visitor Records
            </p>

            <p className="mt-3 text-3xl font-black">
              {loading
                ? "..."
                : formatNumber(visitors?.totalVisitors ?? 0)}
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Visitor-day records stored
            </p>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="mt-10">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
            Live World
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Abuja Life Activity
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Registered Players
            </p>

            <p className="mt-3 text-3xl font-black">
              —
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Player statistics connection
              pending
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Players Online
            </p>

            <p className="mt-3 text-3xl font-black">
              —
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Multiplayer presence connection
              pending
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold text-slate-500">
              Active City Events
            </p>

            <p className="mt-3 text-3xl font-black">
              —
            </p>

            <p className="mt-1 text-[10px] text-slate-600">
              Live event statistics connection
              pending
            </p>
          </div>
        </div>
      </section>

      {/* ADMIN SYSTEMS */}
      <section className="mt-10">
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">
            Administration
          </p>

          <h2 className="mt-1 text-2xl font-black">
            Control Systems
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section) => (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl transition group-hover:bg-orange-500/10">
                {section.icon}
              </div>

              <h3 className="mt-5 text-lg font-black">
                {section.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {section.description}
              </p>

              <div className="mt-5 text-xs font-black text-orange-400">
                Open Control →
              </div>
            </Link>
          ))}

          {/* PAYMENTS */}
          <Link
            href="/admin/payments"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-green-500/30 hover:bg-green-500/[0.05]"
          >
            <div className="text-2xl">💳</div>

            <h3 className="mt-4 font-black">
              Payments & Settlements
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Monitor customer payments, Paystack transactions,
              settlements and business payment status.
            </p>

            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-green-400">
              Open Payments Center →
            </div>
          </Link>

          {/* SETTINGS */}
          <Link
            href="/admin/settings"
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/[0.05]"
          >
            <div className="text-2xl">⚙️</div>

            <h3 className="mt-4 font-black">
              Game Settings
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Control registrations, multiplayer, economy,
              payments, maintenance mode and player defaults.
            </p>

            <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-orange-400">
              Open Settings →
            </div>
          </Link>
        </div>
      </section>

      {/* SYSTEM STATUS */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-black">
              Abuja Life System Status
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Administrative systems are being connected progressively.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Foundation Restored
          </div>
        </div>
      </section>
    </div>
  );
}
