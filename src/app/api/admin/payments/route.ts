"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Transaction = {
  id: string;
  user_id: string | null;
  provider: string;
  reference: string;
  amount: number | string;
  currency: string;
  purpose: string | null;
  status: string;
  provider_transaction_id: string | null;
  customer_email: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Settlement = {
  id: string;
  provider: string;
  reference: string;
  amount: number | string;
  currency: string;
  status: string;
  settlement_date: string | null;
  notes: string | null;
  created_at: string;
};

type PaymentSettings = {
  id: number | string;
  provider: string;
  is_enabled: boolean;
  currency: string;
  business_name: string | null;
  settlement_bank_name: string | null;
  settlement_account_name: string | null;
  settlement_account_last4: string | null;
  public_key_configured: boolean;
  secret_key_configured: boolean;
  updated_at: string | null;
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
  completedSettlementCount?: number;
};

type PaymentsResponse = {
  transactions: Transaction[];
  settlements: Settlement[];
  settings: PaymentSettings | null;
  summary: Summary;
  error?: string;
};

function money(value: number | string | null | undefined, currency = "NGN") {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
      return "border-green-500/20 bg-green-500/10 text-green-400";

    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-400";

    case "refunded":
      return "border-purple-500/20 bg-purple-500/10 text-purple-400";

    default:
      return "border-white/10 bg-white/5 text-slate-400";
  }
}

function maskReference(reference: string) {
  if (!reference) return "—";

  if (reference.length <= 18) {
    return reference;
  }

  return `${reference.slice(0, 8)}...${reference.slice(-6)}`;
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [provider, setProvider] = useState("paystack");
  const [currency, setCurrency] = useState("NGN");
  const [isEnabled, setIsEnabled] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountLast4, setAccountLast4] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/payments", {
        cache: "no-store",
      });

      const result =
        (await response.json()) as PaymentsResponse;

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to load payment data."
        );
      }

      setData(result);

      const settings = result.settings;

      if (settings) {
        setProvider(settings.provider || "paystack");
        setCurrency(settings.currency || "NGN");
        setIsEnabled(Boolean(settings.is_enabled));
        setBusinessName(settings.business_name || "");
        setBankName(
          settings.settlement_bank_name || ""
        );
        setAccountName(
          settings.settlement_account_name || ""
        );
        setAccountLast4(
          settings.settlement_account_last4 || ""
        );
      }
    } catch (err) {
      console.error("Admin payments load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payment data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();

    const interval = window.setInterval(() => {
      void loadPayments();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadPayments]);

  async function saveSettings() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (
        accountLast4.trim() &&
        !/^\d{4}$/.test(accountLast4.trim())
      ) {
        setError(
          "Settlement account last 4 digits must be exactly 4 numbers."
        );
        return;
      }

      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          currency,
          is_enabled: isEnabled,
          business_name: businessName,
          settlement_bank_name: bankName,
          settlement_account_name: accountName,
          settlement_account_last4:
            accountLast4.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to save payment settings."
        );
      }

      setMessage(
        "Payment settings saved successfully."
      );

      await loadPayments();
    } catch (err) {
      console.error("Payment settings save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save payment settings."
      );
    } finally {
      setSaving(false);
    }
  }

  const transactions = data?.transactions ?? [];
  const settlements = data?.settlements ?? [];
  const summary = data?.summary;

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return [
        transaction.reference,
        transaction.provider_transaction_id,
        transaction.customer_email,
        transaction.purpose,
        transaction.status,
        transaction.provider,
        transaction.user_id,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    }
  );

  return (
    <main className="min-h-screen bg-[#050b0a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              <Link
                href="/admin"
                className="transition hover:text-white"
              >
                Admin
              </Link>

              <span className="text-slate-700">/</span>

              <span>Payments</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Payment Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage payment configuration, monitor transactions,
              and track settlements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadPayments()}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </section>

        {/* FEEDBACK */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-bold text-green-300">
            {message}
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Successful"
            value={money(summary?.totalSuccessful)}
            count={summary?.successfulCount ?? 0}
            description="Successful payments"
          />

          <SummaryCard
            label="Pending"
            value={money(summary?.totalPending)}
            count={summary?.pendingCount ?? 0}
            description="Awaiting completion"
          />

          <SummaryCard
            label="Failed"
            value={money(summary?.totalFailed)}
            count={summary?.failedCount ?? 0}
            description="Failed payments"
          />

          <SummaryCard
            label="Refunded"
            value={money(summary?.totalRefunded)}
            count={summary?.refundedCount ?? 0}
            description="Refunded payments"
          />

          <SummaryCard
            label="Settled"
            value={money(summary?.totalSettled)}
            count={
              summary?.completedSettlementCount ??
              0
            }
            description="Completed settlements"
          />
        </section>

        {/* PAYMENT SETTINGS */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#08110f]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                  Configuration
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Payment Settings
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Control how the game accepts payments.
                </p>
              </div>

              <div
                className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                  isEnabled
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {isEnabled
                  ? "Payments Enabled"
                  : "Payments Disabled"}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Provider">
                  <select
                    value={provider}
                    onChange={(event) =>
                      setProvider(event.target.value)
                    }
                    className="admin-input"
                  >
                    <option value="paystack">
                      Paystack
                    </option>
                  </select>
                </Field>

                <Field label="Currency">
                  <select
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value)
                    }
                    className="admin-input"
                  >
                    <option value="NGN">
                      NGN — Nigerian Naira
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Business Name">
                <input
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  placeholder="Abuja Life"
                  maxLength={120}
                  className="admin-input"
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <p className="text-sm font-black">
                    Accept Payments
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Turn player payments on or off.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(event) =>
                    setIsEnabled(event.target.checked)
                  }
                  className="h-5 w-5 accent-orange-500"
                />
              </label>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Settlement Bank">
                  <input
                    value={bankName}
                    onChange={(event) =>
                      setBankName(event.target.value)
                    }
                    placeholder="Bank name"
                    maxLength={120}
                    className="admin-input"
                  />
                </Field>

                <Field label="Account Name">
                  <input
                    value={accountName}
                    onChange={(event) =>
                      setAccountName(event.target.value)
                    }
                    placeholder="Account holder name"
                    maxLength={120}
                    className="admin-input"
                  />
                </Field>
              </div>

              <Field label="Account Last 4 Digits">
                <input
                  value={accountLast4}
                  onChange={(event) =>
                    setAccountLast4(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4)
                    )
                  }
                  placeholder="0000"
                  inputMode="numeric"
                  maxLength={4}
                  className="admin-input"
                />
              </Field>

              <div className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.04] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                  Security
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ConfigStatus
                    label="Public Key"
                    configured={
                      data?.settings
                        ?.public_key_configured ??
                      false
                    }
                  />

                  <ConfigStatus
                    label="Secret Key"
                    configured={
                      data?.settings
                        ?.secret_key_configured ??
                      false
                    }
                  />
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-600">
                  Secret payment credentials are never displayed
                  here. They remain in the server environment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-white/10 bg-black/10 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
            <p className="text-[11px] text-slate-600">
              Last settings update:{" "}
              {formatDate(data?.settings?.updated_at)}
            </p>

            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving}
              className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Payment Settings"}
            </button>
          </div>
        </section>

        {/* PROVIDER STATUS */}
        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Provider"
            value={
              data?.settings?.provider
                ? data.settings.provider.toUpperCase()
                : "NOT SET"
            }
            detail={
              data?.settings?.is_enabled
                ? "Ready to accept payments"
                : "Payment collection is disabled"
            }
          />

          <InfoCard
            title="Currency"
            value={data?.settings?.currency || "NGN"}
            detail="Configured payment currency"
          />

          <InfoCard
            title="Transactions"
            value={String(summary?.transactionCount ?? 0)}
            detail={`${summary?.successfulCount ?? 0} successful`}
          />
        </section>

        {/* TRANSACTIONS */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#08110f]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                Payment Activity
              </p>

              <h2 className="mt-1 text-xl font-black">
                Transactions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredTransactions.length} of{" "}
                {transactions.length} transactions shown
              </p>
            </div>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search reference, email, status..."
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs font-medium text-white outline-none placeholder:text-slate-700 focus:border-orange-500/40 lg:w-80"
            />
          </div>

          {loading && !data ? (
            <LoadingBlock />
          ) : filteredTransactions.length === 0 ? (
            <EmptyBlock text="No payment transactions found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-wider text-slate-600">
                    <th className="px-5 py-4">
                      Reference
                    </th>
                    <th className="px-5 py-4">
                      Customer
                    </th>
                    <th className="px-5 py-4">
                      Purpose
                    </th>
                    <th className="px-5 py-4">
                      Amount
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Provider
                    </th>
                    <th className="px-5 py-4">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-white/[0.05] transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono text-xs font-bold text-slate-300">
                            {maskReference(
                              transaction.reference
                            )}
                          </p>

                          {transaction.provider_transaction_id && (
                            <p className="mt-1 text-[9px] text-slate-700">
                              ID:{" "}
                              {
                                transaction.provider_transaction_id
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-xs font-bold text-slate-300">
                            {transaction.customer_email ||
                              "Unknown customer"}
                          </p>

                          {transaction.user_id && (
                            <p className="mt-1 font-mono text-[9px] text-slate-700">
                              {transaction.user_id.slice(
                                0,
                                8
                              )}
                              ...
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-400">
                          {transaction.purpose ||
                            "Payment"}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-black text-white">
                            {money(
                              transaction.amount,
                              transaction.currency
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${statusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                          {transaction.provider}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-[11px] text-slate-600">
                          {formatDate(
                            transaction.paid_at ||
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
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#08110f]">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Revenue Movement
            </p>

            <h2 className="mt-1 text-xl font-black">
              Settlements
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Money that has been marked as settled by the
              payment system.
            </p>
          </div>

          {settlements.length === 0 ? (
            <EmptyBlock text="No settlement records found." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-wider text-slate-600">
                    <th className="px-5 py-4">
                      Reference
                    </th>
                    <th className="px-5 py-4">
                      Provider
                    </th>
                    <th className="px-5 py-4">
                      Amount
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Settlement Date
                    </th>
                    <th className="px-5 py-4">
                      Notes
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {settlements.map((settlement) => (
                    <tr
                      key={settlement.id}
                      className="border-b border-white/[0.05] hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-300">
                        {maskReference(
                          settlement.reference
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-bold uppercase text-slate-500">
                        {settlement.provider}
                      </td>

                      <td className="px-5 py-4 text-xs font-black text-white">
                        {money(
                          settlement.amount,
                          settlement.currency
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${statusClass(
                            settlement.status
                          )}`}
                        >
                          {settlement.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-[11px] text-slate-600">
                        {formatDate(
                          settlement.settlement_date ||
                            settlement.created_at
                        )}
                      </td>

                      <td className="max-w-[260px] px-5 py-4 text-xs text-slate-500">
                        {settlement.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* IMPORTANT PAYMENT NOTE */}
        <section className="rounded-3xl border border-orange-500/10 bg-orange-500/[0.03] p-5 sm:p-7">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-lg">
              ₦
            </div>

            <div>
              <h3 className="text-sm font-black">
                Payment & Settlement Security
              </h3>

              <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
                Abuja Life does not store or display your actual
                payment secret key or full bank account number in
                this dashboard. Paystack credentials remain in the
                server environment, while only safe configuration
                and masked settlement information are shown here.
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          outline: none;
          transition: border-color 150ms ease;
        }

        .admin-input::placeholder {
          color: rgb(51 65 85);
        }

        .admin-input:focus {
          border-color: rgba(249, 115, 22, 0.4);
        }

        .admin-input option {
          background: #08110f;
          color: white;
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  count,
  description,
}: {
  label: string;
  value: string;
  count: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08110f] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-bold text-slate-600">
        {count.toLocaleString()} · {description}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08110f] p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">
        {title}
      </p>

      <p className="mt-2 text-lg font-black uppercase text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
        {label}
      </span>

      {children}
    </label>
  );
}

function ConfigStatus({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3">
      <span className="text-[10px] font-bold text-slate-500">
        {label}
      </span>

      <span
        className={`text-[9px] font-black uppercase ${
          configured
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {configured ? "Configured" : "Missing"}
      </span>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex min-h-[180px] items-center justify-center">
      <p className="text-xs font-bold text-slate-600">
        Loading payment data...
      </p>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center px-6 text-center">
      <p className="text-xs font-bold text-slate-600">
        {text}
      </p>
    </div>
  );
}
