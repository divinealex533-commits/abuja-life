"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import VipBadge from "@/components/vip/VipBadge";
import VipSection from "@/components/vip/VipSection";
import { ACCENT_CLASSES, CAREERS } from "@/lib/game/careers";
import { rankIndexForXp, shiftPayAtRank } from "@/lib/game/careers/engine";
import type { Career } from "@/lib/game/careers/types";
import { formatNaira, tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { usePrices } from "@/lib/pricing/client";
import { formatPrice, type EffectivePrice } from "@/lib/pricing/items";
import { useVip, type ClientVipStatus } from "@/lib/vip/client";

type Progress = Record<string, { xp: number; shifts: number; totalEarned: number }>;

function CareerCard({
  career,
  progress,
  currentJobId,
  vip,
  licence,
  owned,
}: {
  career: Career;
  progress: Progress;
  currentJobId: string | null;
  vip: ClientVipStatus;
  licence: EffectivePrice | undefined;
  owned: boolean;
}) {
  const accent = ACCENT_CLASSES[career.accent];
  const xp = progress[career.id]?.xp ?? 0;
  const rank = rankIndexForXp(career, xp);
  const locked = Boolean(career.vipTier && !(vip.active && tierAtLeast(vip.tier, career.vipTier)));
  const isCurrent = currentJobId === career.id;

  return (
    <Link
      href={`/careers/${career.id}`}
      className={`group relative flex flex-col rounded-3xl border bg-gradient-to-br ${accent.glow} via-white/[0.02] to-transparent p-5 transition hover:-translate-y-1 ${
        isCurrent ? accent.border : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${accent.bg} ${locked ? "grayscale" : ""}`}>
          {career.emoji}
        </div>
        <div className="flex flex-col items-end gap-1">
          {career.vipTier && <VipBadge tier={career.vipTier} />}
          {isCurrent && (
            <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[9px] font-black text-emerald-300">
              YOUR JOB
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-4 text-xl font-black">{career.name}</h3>
      <div className={`text-xs font-bold ${accent.text}`}>📍 {career.district}</div>
      <p className="mt-2 flex-1 text-sm leading-6 text-white/50">{career.tagline}</p>

      <div className="mt-3 text-xs font-bold">
        {owned ? (
          <span className="text-emerald-300">✓ Licence owned</span>
        ) : licence ? (
          <span className="text-amber-200">🎫 Licence: {formatPrice(licence)}</span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-black/25 p-2">
          <div className="text-[9px] uppercase tracking-wider text-white/30">Shift pay</div>
          <div className="text-xs font-black text-emerald-300">{formatNaira(shiftPayAtRank(career, rank))}</div>
        </div>
        <div className="rounded-xl bg-black/25 p-2">
          <div className="text-[9px] uppercase tracking-wider text-white/30">Energy</div>
          <div className="text-xs font-black">⚡{career.energyCost}</div>
        </div>
        <div className="rounded-xl bg-black/25 p-2">
          <div className="text-[9px] uppercase tracking-wider text-white/30">Rank</div>
          <div className="truncate text-xs font-black">{rank + 1}/5</div>
        </div>
      </div>

      <div className={`mt-4 rounded-2xl px-4 py-3 text-center text-xs font-black ${locked ? "border border-amber-400/30 bg-amber-400/10 text-amber-200" : accent.button}`}>
        {locked
          ? `🔒 NEEDS ${VIP_TIERS[career.vipTier!].name.toUpperCase()}`
          : isCurrent
            ? "GO TO WORK →"
            : "VIEW CAREER →"}
      </div>
    </Link>
  );
}

export default function CareersPage() {
  const { vip } = useVip();
  const [progress, setProgress] = useState<Progress>({});
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const { prices } = usePrices();

  useEffect(() => {
    fetch("/api/careers", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setProgress(data?.progress ?? {});
        setCurrentJobId(data?.currentJobId ?? null);
        setUnlocked(data?.unlocked ?? []);
      })
      .catch(() => undefined);
  }, []);

  const standard = CAREERS.filter((c) => !c.vipTier);
  const vipCareers = CAREERS.filter((c) => c.vipTier);

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/jobs" className="text-xs font-black text-white/60 hover:text-white">← ALL JOBS</Link>
          <div className="text-sm font-black">ABUJA <span className="text-emerald-400">CAREERS</span></div>
          <Link href="/vip" className="text-xs font-black text-amber-300">👑 VIP</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <header>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Advanced careers</div>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">Real jobs. Real decisions.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
            Every shift gives you three situations from Abuja working life. Choose
            safe or risky, honest or shady — your choices decide your pay, your
            reputation and how fast you get promoted.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-2xl font-black">Open to everyone</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {standard.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                progress={progress}
                currentJobId={currentJobId}
                vip={vip}
                licence={prices[`career:${career.id}`]}
                owned={unlocked.includes(career.id)}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">👑 VIP careers</h2>
              <p className="mt-1 text-sm text-white/45">2–6× the pay of normal jobs, and much bigger stakes.</p>
            </div>
            {!vip.active && (
              <Link href="/vip" className="rounded-2xl bg-amber-400 px-5 py-3 text-xs font-black text-black hover:bg-amber-300">
                UNLOCK VIP →
              </Link>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vipCareers.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                progress={progress}
                currentJobId={currentJobId}
                vip={vip}
                licence={prices[`career:${career.id}`]}
                owned={unlocked.includes(career.id)}
              />
            ))}
          </div>
        </section>

        <div className="mt-12">
          <VipSection area="jobs" />
        </div>
      </div>
    </main>
  );
}
