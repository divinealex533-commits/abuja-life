"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import VipBadge from "@/components/vip/VipBadge";
import { ACCENT_CLASSES, getCareer } from "@/lib/game/careers";
import {
  nextRank,
  pickScenarios,
  rankIndexForXp,
  riskLabel,
  shiftPayAtRank,
} from "@/lib/game/careers/engine";
import type { ShiftDecision, ShiftResult, ShiftScenario } from "@/lib/game/careers/types";
import {
  DEFAULT_PLAYER_STATE,
  loadPersistentPlayerState,
  loadPlayerState,
  savePlayerState,
  type PlayerGameState,
} from "@/lib/game/player";
import { formatNaira, tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { usePrices } from "@/lib/pricing/client";
import { formatPrice } from "@/lib/pricing/items";
import { startCheckout, syncPlayerSnapshot, useVip } from "@/lib/vip/client";

type Phase =
  | { kind: "overview" }
  | { kind: "shift"; scenarios: ShiftScenario[]; index: number; decisions: ShiftDecision[] }
  | { kind: "submitting" }
  | { kind: "report"; result: ShiftResult; rankTitle: string };

export default function CareerPage() {
  const params = useParams<{ careerId: string }>();
  const career = getCareer(String(params?.careerId ?? ""));
  const { vip } = useVip();
  const { prices } = usePrices();
  const [unlocked, setUnlocked] = useState(false);

  const [player, setPlayer] = useState<PlayerGameState>(DEFAULT_PLAYER_STATE);
  const [careerXp, setCareerXp] = useState(0);
  const [shifts, setShifts] = useState(0);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>({ kind: "overview" });
  const [error, setError] = useState("");
  const [taking, setTaking] = useState(false);

  const load = useCallback(async () => {
    const [state, careers] = await Promise.all([
      loadPersistentPlayerState(),
      fetch("/api/careers", { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => null),
    ]);
    setPlayer(state);
    if (career && careers?.progress?.[career.id]) {
      setCareerXp(careers.progress[career.id].xp);
      setShifts(careers.progress[career.id].shifts);
    }
    setCurrentJobId(careers?.currentJobId ?? state.currentJobId);
    setUnlocked(Boolean(career && (careers?.unlocked ?? []).includes(career.id)));
    setLoading(false);
  }, [career]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!career) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] text-white">
        <div className="text-center">
          <div className="text-5xl">🤷</div>
          <p className="mt-4 font-bold">That career doesn&apos;t exist.</p>
          <Link href="/careers" className="mt-4 inline-block text-sm font-black text-emerald-300">
            ← All careers
          </Link>
        </div>
      </main>
    );
  }

  const accent = ACCENT_CLASSES[career.accent];
  const rank = rankIndexForXp(career, careerXp);
  const upcoming = nextRank(career, careerXp);
  const currentRank = career.ranks[rank];
  const rankProgress = upcoming
    ? ((careerXp - currentRank.minXp) / (upcoming.minXp - currentRank.minXp)) * 100
    : 100;
  const locked = Boolean(career.vipTier && !(vip.active && tierAtLeast(vip.tier, career.vipTier)));
  const employed = currentJobId === career.id;
  const vipBonus = vip.active && vip.info ? vip.info.jobPayBonus : 0;

  async function takeJob() {
    if (!career) return;
    setTaking(true);
    setError("");
    try {
      const response = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId: career.id }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (response.ok && data?.checkout) {
        // Licence is priced in real Naira → pay with Paystack.
        const problem = await startCheckout(data.productId);
        if (problem) setError(problem);
        return;
      }
      if (!response.ok) {
        setError(data?.error || "Could not take this job.");
        return;
      }
      if (data?.player) {
        syncPlayerSnapshot(data.player);
        setPlayer((p) => ({ ...p, ...data.player }));
      }
      setUnlocked(true);
      setCurrentJobId(career.id);
      // Keep the rest of the game in step with the new job.
      savePlayerState({ ...loadPlayerState(), currentJobId: career.id });
      window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
    } finally {
      setTaking(false);
    }
  }

  function startShift() {
    if (!career) return;
    setError("");
    if (player.energy < career.energyCost) {
      setError(`You need ${career.energyCost} energy for a shift. You have ${Math.round(player.energy)}.`);
      return;
    }
    setPhase({ kind: "shift", scenarios: pickScenarios(career), index: 0, decisions: [] });
  }

  async function choose(choiceId: string) {
    if (!career || phase.kind !== "shift") return;

    const scenario = phase.scenarios[phase.index];
    const decisions = [...phase.decisions, { scenarioId: scenario.id, choiceId }];

    if (phase.index + 1 < phase.scenarios.length) {
      setPhase({ ...phase, index: phase.index + 1, decisions });
      return;
    }

    setPhase({ kind: "submitting" });

    try {
      const response = await fetch("/api/careers/shift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId: career.id, decisions }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "The shift could not be completed.");
        setPhase({ kind: "overview" });
        return;
      }

      if (data.player) {
        syncPlayerSnapshot(data.player);
        setPlayer((p) => ({ ...p, ...data.player }));
      }
      setCareerXp(data.careerXp);
      setShifts((s) => s + 1);
      setPhase({ kind: "report", result: data.result, rankTitle: data.rankTitle });
    } catch {
      setError("Network error. Your shift wasn't counted — try again.");
      setPhase({ kind: "overview" });
    }
  }

  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b10]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/careers" className="text-xs font-black text-white/60 hover:text-white">← CAREERS</Link>
          <div className="flex items-center gap-4 text-xs font-black">
            <span className="text-emerald-300">{formatNaira(player.cash)}</span>
            <span>⚡ {Math.round(player.energy)}/{Math.round(player.maxEnergy)}</span>
            <span>⭐ {player.reputation}</span>
            {vip.active && <VipBadge tier={vip.tier} size="xs" />}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* HEADER */}
        <section className={`rounded-[2rem] border ${accent.border} bg-gradient-to-br ${accent.glow} via-[#0c1118] to-transparent p-6 sm:p-8`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${accent.bg}`}>
                {career.emoji}
              </div>
              <div>
                <div className={`text-[10px] font-black uppercase tracking-[0.25em] ${accent.text}`}>
                  📍 {career.district}
                </div>
                <h1 className="mt-1 text-3xl font-black sm:text-4xl">{career.name}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{career.description}</p>
              </div>
            </div>
            {career.vipTier && <VipBadge tier={career.vipTier} size="md" />}
          </div>

          {/* RANK */}
          <div className="mt-6 rounded-2xl bg-black/30 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black">
                Rank {rank + 1}: <span className={accent.text}>{currentRank.title}</span>
              </span>
              <span className="text-white/40">
                {upcoming ? `${careerXp}/${upcoming.minXp} XP → ${upcoming.title}` : "Top rank reached 🏆"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`h-full rounded-full ${accent.button.split(" ")[0]}`} style={{ width: `${Math.min(100, Math.max(0, rankProgress))}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-white/35">Shift pay</div>
                <div className="font-black text-emerald-300">
                  {formatNaira(shiftPayAtRank(career, rank))}
                  {vipBonus > 0 && <span className="text-amber-300"> +{Math.round(vipBonus * 100)}%</span>}
                </div>
              </div>
              <div>
                <div className="text-white/35">Energy per shift</div>
                <div className="font-black">⚡ {career.energyCost}</div>
              </div>
              <div>
                <div className="text-white/35">Shifts worked</div>
                <div className="font-black">{shifts}</div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {/* BODY */}
        <section className="mt-6">
          {loading ? (
            <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          ) : locked ? (
            <div className="rounded-3xl border border-amber-400/25 bg-amber-400/[0.06] p-8 text-center">
              <div className="text-5xl">🔒</div>
              <h2 className="mt-4 text-2xl font-black">{VIP_TIERS[career.vipTier!].name} career</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
                {career.name} pays up to {formatNaira(shiftPayAtRank(career, 4))} per shift at top rank.
                Upgrade to unlock it.
              </p>
              <Link href="/vip" className="mt-6 inline-block rounded-2xl bg-amber-400 px-8 py-4 text-sm font-black text-black hover:bg-amber-300">
                GET {VIP_TIERS[career.vipTier!].name.toUpperCase()} →
              </Link>
            </div>
          ) : !employed ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <h2 className="text-2xl font-black">Work as a {career.name}?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                You can only have one job at a time. Taking this job replaces your current one.
              </p>
              {!unlocked && prices[`career:${career.id}`] && (
                <div className="mx-auto mt-5 inline-block rounded-2xl border border-amber-400/25 bg-amber-400/10 px-5 py-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-amber-200/70">
                    One-time licence fee
                  </div>
                  <div className="mt-1 text-lg font-black text-amber-300">
                    {formatPrice(prices[`career:${career.id}`])}
                  </div>
                </div>
              )}
              {unlocked && (
                <div className="mt-4 text-xs font-black text-emerald-300">✓ You own this licence</div>
              )}
              <button
                type="button"
                onClick={takeJob}
                disabled={taking}
                className={`mt-6 rounded-2xl px-8 py-4 text-sm font-black transition disabled:opacity-50 ${accent.button}`}
              >
                {taking
                  ? "SIGNING CONTRACT..."
                  : unlocked || prices[`career:${career.id}`]?.method === "free"
                    ? "TAKE THIS JOB →"
                    : "PAY LICENCE & TAKE JOB →"}
              </button>
            </div>
          ) : phase.kind === "overview" ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="text-5xl">{career.emoji}</div>
              <h2 className="mt-4 text-2xl font-black">Ready for your shift?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
                You&apos;ll face 3 situations. Think about each choice — risky moves pay more but can cost you money and reputation.
              </p>
              <button
                type="button"
                onClick={startShift}
                className={`mt-6 rounded-2xl px-10 py-4 text-sm font-black transition ${accent.button}`}
              >
                START SHIFT (⚡{career.energyCost})
              </button>
            </div>
          ) : phase.kind === "shift" ? (
            <ScenarioCard
              key={phase.scenarios[phase.index].id}
              scenario={phase.scenarios[phase.index]}
              step={phase.index + 1}
              total={phase.scenarios.length}
              rank={rank}
              rankTitles={career.ranks.map((r) => r.title)}
              accentText={accent.text}
              onChoose={choose}
            />
          ) : phase.kind === "submitting" ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="animate-pulse text-5xl">⏳</div>
              <p className="mt-4 text-sm font-bold text-white/60">Finishing your shift...</p>
            </div>
          ) : (
            <ShiftReport
              result={phase.result}
              rankTitle={phase.rankTitle}
              accentButton={accent.button}
              canContinue={player.energy >= career.energyCost}
              onNext={startShift}
              onDone={() => setPhase({ kind: "overview" })}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function ScenarioCard({
  scenario,
  step,
  total,
  rank,
  rankTitles,
  accentText,
  onChoose,
}: {
  scenario: ShiftScenario;
  step: number;
  total: number;
  rank: number;
  rankTitles: string[];
  accentText: string;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${accentText}`}>
          Situation {step} of {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full ${i < step ? "bg-white/70" : "bg-white/15"}`} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-4">
        <div className="text-4xl">{scenario.emoji}</div>
        <div>
          <h2 className="text-2xl font-black">{scenario.title}</h2>
          <p className="mt-2 text-sm leading-7 text-white/65">{scenario.situation}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {scenario.choices.map((choice) => {
          const available = (choice.minRank ?? 0) <= rank;
          const risk = riskLabel(choice.risk?.chance);
          const riskColor =
            risk === "Safe"
              ? "text-emerald-300 bg-emerald-400/10"
              : risk === "Some risk"
                ? "text-yellow-300 bg-yellow-400/10"
                : risk === "Risky"
                  ? "text-orange-300 bg-orange-400/10"
                  : "text-red-300 bg-red-400/10";

          return (
            <button
              key={choice.id}
              type="button"
              disabled={!available}
              onClick={() => onChoose(choice.id)}
              className="group rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-white/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-black">{available ? choice.label : `🔒 ${choice.label}`}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${riskColor}`}>{risk}</span>
              </div>
              <p className="mt-1 text-xs text-white/50">{choice.detail}</p>
              {choice.risk && available && (
                <p className="mt-2 text-[11px] font-bold text-orange-200/80">⚠️ {choice.risk.warning}</p>
              )}
              {!available && (
                <p className="mt-2 text-[11px] font-bold text-white/50">
                  Unlocks at rank {(choice.minRank ?? 0) + 1}: {rankTitles[choice.minRank ?? 0]}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShiftReport({
  result,
  rankTitle,
  accentButton,
  canContinue,
  onNext,
  onDone,
}: {
  result: ShiftResult;
  rankTitle: string;
  accentButton: string;
  canContinue: boolean;
  onNext: () => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-4">
      {result.promoted && (
        <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-400/20 to-transparent p-6 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-2 text-2xl font-black text-amber-200">Promoted to {rankTitle}!</h2>
          <p className="mt-1 text-sm text-white/60">Your shift pay just went up, and new choices are unlocked.</p>
        </div>
      )}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="text-2xl font-black">Shift report</h2>

        <div className="mt-5 space-y-3">
          {result.decisions.map((d) => (
            <div
              key={d.scenarioId}
              className={`rounded-2xl border p-4 ${d.success ? "border-emerald-400/20 bg-emerald-400/[0.05]" : "border-red-400/25 bg-red-400/[0.06]"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-black">
                  {d.success ? "✅" : "❌"} {d.scenarioTitle}
                </span>
                <span className="text-xs font-black">
                  <span className="text-emerald-300">{formatNaira(d.pay)}</span>
                  <span className={d.reputation >= 0 ? "text-sky-300" : "text-red-300"}>
                    {" "}· {d.reputation >= 0 ? "+" : ""}{d.reputation} rep
                  </span>
                  <span className="text-white/50"> · +{d.xp} XP</span>
                </span>
              </div>
              <div className="mt-1 text-xs text-white/40">You chose: {d.choiceLabel}</div>
              <p className="mt-2 text-sm text-white/75">{d.text}</p>
            </div>
          ))}
        </div>

        {result.event && (
          <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${result.event.payModifier >= 0 ? "bg-emerald-400/10 text-emerald-200" : "bg-orange-400/10 text-orange-200"}`}>
            🏙️ City event: {result.event.text} ({result.eventBonus >= 0 ? "+" : ""}{formatNaira(result.eventBonus)})
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/35">Work pay</div>
            <div className="mt-1 font-black">{formatNaira(result.decisionPay)}</div>
          </div>
          <div className="rounded-2xl bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/35">VIP bonus</div>
            <div className="mt-1 font-black text-amber-300">
              {result.vipBonus > 0 ? `+${formatNaira(result.vipBonus)}` : <Link href="/vip" className="text-xs underline">Get VIP</Link>}
            </div>
          </div>
          <div className="rounded-2xl bg-black/30 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/35">Reputation</div>
            <div className="mt-1 font-black">{result.reputation >= 0 ? "+" : ""}{result.reputation}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
            <div className="text-[10px] uppercase tracking-wider text-emerald-200/70">Total earned</div>
            <div className="mt-1 text-xl font-black text-emerald-300">{formatNaira(result.totalPay)}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className={`flex-1 rounded-2xl px-6 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 ${accentButton}`}
          >
            {canContinue ? "NEXT SHIFT →" : "TOO TIRED — REST FIRST"}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-black hover:bg-white/10"
          >
            DONE FOR NOW
          </button>
        </div>
      </div>
    </div>
  );
}
