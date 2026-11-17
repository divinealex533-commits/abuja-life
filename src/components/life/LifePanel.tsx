"use client";

import { useEffect, useRef, useState } from "react";

import LiveShift from "@/components/life/LiveShift";
import NeedsBars from "@/components/life/NeedsBars";
import { getLocationById } from "@/lib/game/locations";
import { finishActivity, useCurrentLocation, useLife } from "@/lib/life/client";
import { LIFE_ACTIVITIES, NEEDS, activityBlock, placeStatus, type LifeActivity } from "@/lib/life/needs";

interface Running {
  activity: LifeActivity;
  startedAt: number;
}

/**
 * The playable core on the game screen: live needs, mood, what's open
 * here, timed activities and the Work Shift button.
 */
export default function LifePanel() {
  const life = useLife();
  const locationId = useCurrentLocation();
  const [running, setRunning] = useState<Running | null>(null);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [, setClock] = useState(0);
  const finishing = useRef(false);

  // Re-check opening hours every 30s.
  useEffect(() => {
    const t = window.setInterval(() => setClock((c) => c + 1), 30_000);
    const open = () => setShiftOpen(true);
    window.addEventListener("abujaLifeStartShift", open);
    // Opened from the phone on another page: /game?shift=1
    if (new URLSearchParams(window.location.search).get("shift") === "1") {
      setShiftOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
    return () => {
      window.clearInterval(t);
      window.removeEventListener("abujaLifeStartShift", open);
    };
  }, []);

  // Drive the progress bar, then settle on the server.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(async () => {
      const pct = Math.min(100, ((Date.now() - running.startedAt) / (running.activity.seconds * 1000)) * 100);
      setProgress(pct);
      if (pct >= 100 && !finishing.current) {
        finishing.current = true;
        window.clearInterval(timer);
        const error = await finishActivity(running.activity.id, locationId);
        setToast(
          error
            ? { tone: "err", text: error }
            : { tone: "ok", text: `${running.activity.icon} ${running.activity.label} done!` }
        );
        setRunning(null);
        setProgress(0);
        finishing.current = false;
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [running, locationId]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!life.loaded || !life.loggedIn) return null;

  const location = getLocationById(locationId);
  const place = placeStatus(locationId);
  const lowNeed = NEEDS.find((n) => life.needs[n.id] < 25);

  function start(activity: LifeActivity) {
    if (running) return;
    if (activity.cost > life.cash) {
      setToast({ tone: "err", text: `You need ₦${activity.cost.toLocaleString()} for that.` });
      return;
    }
    if ((activity.energy ?? 0) < 0 && life.energy < Math.abs(activity.energy ?? 0)) {
      setToast({ tone: "err", text: "You're too tired. Rest first." });
      return;
    }
    setRunning({ activity, startedAt: Date.now() });
  }

  const available = LIFE_ACTIVITIES.map((a) => ({ activity: a, block: activityBlock(a, locationId) })).filter(
    (x) => x.block !== "Not available here"
  );

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      <div className="overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#1d1530] via-[#0f1424] to-[#0b1a17] shadow-2xl">
        {/* status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              {life.moodInfo.emoji}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">Your life</div>
              <div className={`text-lg font-black ${life.moodInfo.tone}`}>
                {life.moodInfo.label} · {life.mood}%
              </div>
              <div className="text-xs text-white/45">
                {life.moodInfo.payFactor > 1
                  ? "Good mood: +5% shift pay"
                  : life.moodInfo.payFactor < 1
                    ? `Low mood: −${Math.round((1 - life.moodInfo.payFactor) * 100)}% shift pay`
                    : "Normal shift pay"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-white/50">
              {location?.icon} {location?.name ?? "Abuja"}
            </div>
            <div className={`text-sm font-black ${place.open ? "text-emerald-300" : "text-red-300"}`}>
              {place.open ? "● " : "○ "}
              {place.text}
            </div>
            <div className="text-xs font-bold text-amber-200">₦{Math.round(life.cash).toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {!life.ready && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              Needs are not switched on yet. Admin: run <b>20261121_playable_life.sql</b> in Supabase.
            </div>
          )}

          <NeedsBars needs={life.needs} energy={life.energy} maxEnergy={life.maxEnergy} />

          {lowNeed && (
            <div className="animate-pulse rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
              {lowNeed.icon} {lowNeed.low}
            </div>
          )}

          {/* running activity */}
          {running ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-3">
                <span className="animate-bounce text-3xl">{running.activity.icon}</span>
                <div className="flex-1">
                  <div className="font-black">{running.activity.doing}</div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-black text-white/60">
                  {Math.max(0, Math.ceil(running.activity.seconds * (1 - progress / 100)))}s
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <button
                type="button"
                onClick={() => setShiftOpen(true)}
                className="col-span-2 rounded-2xl border-b-4 border-emerald-800 bg-gradient-to-b from-emerald-400 to-emerald-600 p-3 text-left text-black shadow-lg transition active:translate-y-0.5 active:border-b-2 sm:col-span-1"
              >
                <div className="text-2xl">💼</div>
                <div className="mt-1 text-sm font-black uppercase">Work shift</div>
                <div className="text-[11px] font-bold opacity-70">Earn money now</div>
              </button>

              <a
                href="/city"
                className="col-span-2 rounded-2xl border-b-4 border-sky-800 bg-gradient-to-b from-sky-400 to-blue-600 p-3 text-left text-white shadow-lg transition active:translate-y-0.5 active:border-b-2 sm:col-span-1"
              >
                <div className="text-2xl">🚶🏾</div>
                <div className="mt-1 text-sm font-black uppercase">Walk the city</div>
                <div className="text-[11px] font-bold opacity-80">Explore Abuja on foot</div>
              </a>

              {available.map(({ activity, block }) => (
                <button
                  key={activity.id}
                  type="button"
                  disabled={Boolean(block)}
                  onClick={() => start(activity)}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left transition hover:border-amber-300/40 hover:bg-white/[0.09] active:scale-[0.98] disabled:opacity-40"
                >
                  <div className="text-2xl">{activity.icon}</div>
                  <div className="mt-1 text-sm font-black">{activity.label}</div>
                  <div className="text-[11px] text-white/50">
                    {block ?? (activity.cost ? `₦${activity.cost.toLocaleString()}` : "Free")} · {activity.seconds}s
                  </div>
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-white/35">
            Needs keep dropping even when you&apos;re offline. Travel to other places for more to do: homes in
            Maitama and Gwarinpa for sleep and baths, Wuse 2 at night for clubs, Jabi for movies.
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-black shadow-2xl ${
            toast.tone === "ok" ? "bg-emerald-400 text-black" : "bg-red-500 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {shiftOpen && <LiveShift onClose={() => setShiftOpen(false)} />}
    </section>
  );
}
