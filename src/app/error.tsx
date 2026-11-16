"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportClientError } from "@/components/system/ErrorReporter";

/** Friendly screen when a page crashes. The error is sent to Admin → Test Center. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(`Page crashed: ${error.message}${error.digest ? ` (digest ${error.digest})` : ""}`, error.stack);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110f] px-4 text-white">
      <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="text-5xl">🛠️</div>
        <h1 className="mt-4 text-2xl font-black">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/55">
          We&apos;ve been notified and will fix it. Try again, or go back to the game.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-black">
            Try again
          </button>
          <Link href="/game" className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-black">
            Back to game
          </Link>
        </div>
      </div>
    </main>
  );
}
