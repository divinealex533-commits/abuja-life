"use client";

import { useCallback, useEffect, useState } from "react";

export default function PlayerFreezeGuard() {
  const [isFrozen, setIsFrozen] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkFreezeStatus = useCallback(
    async () => {
      try {
        const response = await fetch(
          "/api/player/freeze-status",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setChecking(false);
          return;
        }

        const data = await response.json();

        setIsFrozen(data.isFrozen === true);
      } catch (error) {
        console.error(
          "Could not check player freeze status:",
          error
        );
      } finally {
        setChecking(false);
      }
    },
    []
  );

  useEffect(() => {
    checkFreezeStatus();

    // Check periodically so an admin freeze
    // takes effect while the player is online.
    const interval = window.setInterval(
      checkFreezeStatus,
      10000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [checkFreezeStatus]);

  if (checking || !isFrozen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020605]/95 px-6 backdrop-blur-xl">
      <div className="w-full max-w-lg rounded-[2rem] border border-red-500/20 bg-[#0a1110] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-4xl">
          🔒
        </div>

        <div className="mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-red-400">
          Account Restricted
        </div>

        <h1 className="mt-3 text-3xl font-black text-white">
          Your Abuja Life account is frozen
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">
          Your account has temporarily been
          restricted by an administrator. You
          cannot perform game activities while
          this restriction is active.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              ℹ️
            </span>

            <div>
              <p className="text-sm font-black text-white">
                What this means
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your game progress is preserved.
                Once an administrator removes the
                restriction, you can continue playing.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            window.location.reload();
          }}
          className="mt-6 w-full rounded-xl bg-white/10 px-5 py-3 text-xs font-black text-white transition hover:bg-white/15"
        >
          Check Account Again
        </button>
      </div>
    </div>
  );
}
