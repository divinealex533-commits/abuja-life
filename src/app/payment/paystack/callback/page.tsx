"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerifyResult = {
  success?: boolean;
  paymentVerified?: boolean;
  revenueRecorded?: boolean;
  alreadyProcessed?: boolean;
  reference?: string;
  amount?: number;
  currency?: string;
  purpose?: string;
  status?: string;
  message?: string;
  error?: string;
};

export default function PaystackCallbackPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] =
    useState(true);

  const [result, setResult] =
    useState<VerifyResult | null>(null);

  useEffect(() => {
    const reference =
      searchParams.get("reference") ||
      searchParams.get("trxref");

    if (!reference) {
      setResult({
        success: false,
        error:
          "No payment reference was provided.",
      });

      setLoading(false);

      return;
    }

    async function verify() {
      try {
        const response =
          await fetch(
            "/api/payments/paystack/verify",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                reference,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({
              error:
                "Invalid verification response.",
            }));

        setResult(data);
      } catch {
        setResult({
          success: false,
          error:
            "Unable to verify payment.",
        });
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b0a] px-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
        {loading ? (
          <>
            <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-orange-500/10 text-3xl">
              ₦
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Verifying Payment
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Please wait while Abuja Life
              confirms your payment.
            </p>
          </>
        ) : result?.paymentVerified ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-3xl">
              ✓
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Payment Successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your payment has been verified
              and recorded as Abuja Life revenue.
            </p>

            {result.amount != null && (
              <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Amount Paid
                </div>

                <div className="mt-2 text-3xl font-black text-green-400">
                  ₦
                  {result.amount.toLocaleString(
                    "en-NG",
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                </div>
              </div>
            )}

            <Link
              href="/game"
              className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white transition hover:bg-orange-400"
            >
              Return to Abuja Life
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-3xl">
              !
            </div>

            <h1 className="mt-6 text-2xl font-black">
              Payment Not Completed
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {result?.message ||
                result?.error ||
                "The payment could not be confirmed."}
            </p>

            <Link
              href="/game"
              className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Return to Abuja Life
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
