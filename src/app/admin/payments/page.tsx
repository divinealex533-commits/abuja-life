"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Transaction = {
  id: string;
  user_id: string | null;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  purpose: string;
  status: string;
  provider_transaction_id: string | null;
  customer_email: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Settlement = {
  id: string;
  provider: string;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
  settlement_date: string | null;
  notes: string | null;
  created_at: string;
};

type Settings = {
  id: string;
  provider: string;
  is_enabled: boolean;
  currency: string;
  business_name: string | null;
  settlement_bank_name: string | null;
  settlement_account_name: string | null;
  settlement_account_last4: string | null;
  public_key_configured: boolean;
  secret_key_configured: boolean;
  updated_at: string;
};

type Summary = {
  totalSuccessful: number;
  totalPending: number;
  totalFailed: number;
  totalRefunded: number;
  totalSettled: number;
  transactionCount: number;
  successfulCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  settlementCount: number;
};

function formatMoney(amount: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: string) {
  switch (status) {
    case "success":
    case "completed":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "pending":
    case "processing":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "failed":
    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "refunded":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    default:
      return "border-white/10 bg-white/5 text-slate-400";
  }
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/payments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load payments."
        );
      }

      setTransactions(data.transactions ?? []);
      setSettlements(data.settlements ?? []);
      setSettings(data.settings ?? null);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredTransactions = transactions.filter((transaction) => {
    const term = search.toLowerCase().trim();

    if (!term) return true;

    return (
      transaction.reference
        .toLowerCase()
        .includes(term) ||
      transaction.customer_email
        ?.toLowerCase()
        .includes(term) ||
      transaction.purpose
        .toLowerCase()
        .includes(term) ||
      transaction.status
        .toLowerCase()
        .includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link
            href="/admin"
            className="text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            ← Admin Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Payments & Settlements
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor customer payments, payment status,
            settlement records and the business payment
            configuration.
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black transition hover:border-orange-500/30 hover:bg-orange-500/10 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* PAYMENT STATUS */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-400">
            Successful
          </p>
          <p className="mt-3 text-2xl font-black">
            {formatMoney(summary?.totalSuccessful ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.successfulCount ?? 0} transactions
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            Pending
          </p>
          <p className="mt-3 text-2xl font-black">
            {formatMoney(summary?.totalPending ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.pendingCount ?? 0} transactions
          </p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
            Failed
          </p>
          <p className="mt-3 text-2xl font-black">
            {formatMoney(summary?.totalFailed ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.failedCount ?? 0} transactions
          </p>
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">
            Refunded
          </p>
          <p className="mt-3 text-2xl font-black">
            {formatMoney(summary?.totalRefunded ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.refundedCount ?? 0} transactions
          </p>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">
            Settled
          </p>
          <p className="mt-3 text-2xl font-black">
            {formatMoney(summary?.totalSettled ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {summary?.settlementCount ?? 0} settlements
          </p>
        </div>
      </section>

      {/* PROVIDER */}
      <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Payment Provider
            </p>

            <h2 className="mt-2 text-xl font-black">
              {settings?.provider
                ? settings.provider.toUpperCase()
                : "Not configured"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Currency: {settings?.currency ?? "NGN"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                settings?.is_enabled
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {settings?.is_enabled
                ? "Payments Enabled"
                : "Payments Not Enabled"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                settings?.public_key_configured
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}
            >
              Public Key{" "}
              {settings?.public_key_configured
                ? "Ready"
                : "Missing"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${
                settings?.secret_key_configured
                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                  : "border-red-500/20 bg-red-500/10 text-red-400"
              }`}
            >
              Secret Key{" "}
              {settings?.secret_key_configured
                ? "Ready"
                : "Missing"}
            </span>
          </div>
        </div>

        {(settings?.business_name ||
          settings?.settlement_bank_name ||
          settings?.settlement_account_name ||
          settings?.settlement_account_last4) && (
          <div className="mt-6 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Business
              </p>
              <p className="mt-1 text-sm font-bold">
                {settings?.business_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Bank
              </p>
              <p className="mt-1 text-sm font-bold">
                {settings?.settlement_bank_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Account Name
              </p>
              <p className="mt-1 text-sm font-bold">
                {settings?.settlement_account_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                Account
              </p>
              <p className="mt-1 text-sm font-bold">
                {settings?.settlement_account_last4
                  ? `•••• ${settings.settlement_account_last4}`
                  : "Not configured"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* TRANSACTIONS */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black">
              Payment Transactions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {summary?.transactionCount ?? 0} recorded transactions
            </p>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search reference, email, purpose..."
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 md:w-80"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">💳</div>
            <h3 className="mt-4 font-black">
              No payment transactions
            </h3>
            <p className="mt-2 text-xs text-slate-500">
              Payment records will appear here once
              Abuja Life starts receiving payments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <th className="px-6 py-4">
                    Reference
                  </th>
                  <th className="px-6 py-4">
                    Customer
                  </th>
                  <th className="px-6 py-4">
                    Purpose
                  </th>
                  <th className="px-6 py-4">
                    Amount
                  </th>
                  <th className="px-6 py-4">
                    Status
                  </th>
                  <th className="px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map(
                  (transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <p className="max-w-[220px] truncate text-xs font-bold">
                          {transaction.reference}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {transaction.provider}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-300">
                          {transaction.customer_email ||
                            "Unknown customer"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-slate-400">
                          {transaction.purpose.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-black">
                        {formatMoney(
                          Number(transaction.amount),
                          transaction.currency
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[10px] text-slate-500">
                        {formatDate(
                          transaction.created_at
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SETTLEMENTS */}
      <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-lg font-black">
            Revenue Settlements
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Money transferred/settled by the payment provider.
          </p>
        </div>

        {settlements.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No settlement records yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-600">
                  <th className="px-6 py-4">
                    Reference
                  </th>
                  <th className="px-6 py-4">
                    Provider
                  </th>
                  <th className="px-6 py-4">
                    Amount
                  </th>
                  <th className="px-6 py-4">
                    Status
                  </th>
                  <th className="px-6 py-4">
                    Settlement Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {settlements.map((settlement) => (
                  <tr
                    key={settlement.id}
                    className="border-b border-white/5"
                  >
                    <td className="px-6 py-4 text-xs font-bold">
                      {settlement.reference || "—"}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {settlement.provider}
                    </td>

                    <td className="px-6 py-4 text-xs font-black">
                      {formatMoney(
                        Number(settlement.amount),
                        settlement.currency
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(
                          settlement.status
                        )}`}
                      >
                        {settlement.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[10px] text-slate-500">
                      {formatDate(
                        settlement.settlement_date
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
