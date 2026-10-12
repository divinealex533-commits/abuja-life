"use client";

import { useState } from "react";
import Link from "next/link";

type Check = {
  id: string;
  name: string;
  category: string;
  status: "pass" | "warn" | "fail";
  message: string;
  durationMs: number;
};

type Result = {
  checkedAt: string;
  summary: {
    total: number;
    pass: number;
    warn: number;
    fail: number;
  };
  checks: Check[];
};

export default function AdminTestingPage() {
  const [result, setResult] =
    useState<Result | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function runDiagnostics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/testing",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Unable to run diagnostics."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run diagnostics."
      );
    } finally {
      setLoading(false);
    }
  }

  function statusClass(
    status: Check["status"]
  ) {
    if (status === "pass") {
      return "border-green-500/20 bg-green-500/5 text-green-400";
    }

    if (status === "warn") {
      return "border-yellow-500/20 bg-yellow-500/5 text-yellow-400";
    }

    return "border-red-500/20 bg-red-500/5 text-red-400";
  }

  function statusIcon(
    status: Check["status"]
  ) {
    if (status === "pass") return "✓";
    if (status === "warn") return "!";
    return "×";
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm font-semibold text-orange-400 hover:text-orange-300"
      >
        ← Admin Dashboard
      </Link>

      <section className="mt-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-400">
              🧪 TESTING CENTER
            </div>

            <h1 className="mt-5 text-4xl font-black">
              Abuja Life Diagnostics
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Admin-only health checks for the
              database, player state, payments,
              announcements and core Admin systems.
            </p>
          </div>

          <button
            type="button"
            onClick={runDiagnostics}
            disabled={loading}
            className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black text-white transition hover:bg-orange-400 disabled:opacity-50"
          >
            {loading
              ? "Running Diagnostics..."
              : "Run Diagnostics"}
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
          {error}
        </div>
      )}

      {!result && !error && (
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <div className="text-5xl">🧪</div>

          <h2 className="mt-5 text-2xl font-black">
            Testing Center Ready
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Run diagnostics whenever you want to
            inspect Abuja Life's infrastructure.
          </p>
        </section>
      )}

      {result && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Total Checks
              </p>
              <p className="mt-2 text-3xl font-black">
                {result.summary.total}
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60">
                Passed
              </p>
              <p className="mt-2 text-3xl font-black text-green-400">
                {result.summary.pass}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60">
                Warnings
              </p>
              <p className="mt-2 text-3xl font-black text-yellow-400">
                {result.summary.warn}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500/60">
                Failed
              </p>
              <p className="mt-2 text-3xl font-black text-red-400">
                {result.summary.fail}
              </p>
            </div>
          </section>

          <section className="mt-8 space-y-3">
            {result.checks.map((check) => (
              <div
                key={check.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl font-black ${statusClass(
                      check.status
                    )}`}
                  >
                    {statusIcon(check.status)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">
                        {check.name}
                      </h3>

                      <span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        {check.category}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {check.message}
                    </p>
                  </div>

                  <div className="text-[10px] font-bold text-slate-700">
                    {check.durationMs}ms
                  </div>
                </div>
              </div>
            ))}
          </section>

          <p className="mt-5 text-right text-[10px] text-slate-700">
            Last checked{" "}
            {new Date(
              result.checkedAt
            ).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
