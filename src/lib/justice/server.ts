// Abuja Life — justice system, server side. Server only.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BAIL_PER_HOUR,
  BASE_CONVICTION,
  getCharge,
  LAWYERS,
  lawyerFee,
  type LawyerTier,
} from "@/lib/justice/catalog";
import { applyPlayerDelta } from "@/lib/vip/server";

export interface LegalStatus {
  jailedUntil: string | null;
  jailed: boolean;
  openCases: number;
  overdueCases: number;
}

export async function getLegalStatus(admin: SupabaseClient, userId: string): Promise<LegalStatus> {
  const nowIso = new Date().toISOString();

  const [{ data: state }, { count: open }, { count: overdue }] = await Promise.all([
    admin.from("player_game_states").select("jailed_until").eq("user_id", userId).maybeSingle(),
    admin
      .from("court_cases")
      .select("id", { count: "exact", head: true })
      .eq("defendant_id", userId)
      .eq("status", "awaiting_trial"),
    admin
      .from("court_cases")
      .select("id", { count: "exact", head: true })
      .eq("defendant_id", userId)
      .eq("status", "awaiting_trial")
      .lt("deadline_at", nowIso),
  ]);

  const jailedUntil = state?.jailed_until ?? null;

  return {
    jailedUntil,
    jailed: Boolean(jailedUntil && new Date(jailedUntil).getTime() > Date.now()),
    openCases: open ?? 0,
    overdueCases: overdue ?? 0,
  };
}

/** Why a player can't work right now, or null if they can. */
export function workBlockReason(status: LegalStatus): string | null {
  if (status.jailed && status.jailedUntil) {
    const mins = Math.ceil((new Date(status.jailedUntil).getTime() - Date.now()) / 60_000);
    return `You're in Kuje Prison for another ${mins >= 60 ? `${Math.ceil(mins / 60)}h` : `${mins}m`}. Visit the Court page to pay bail.`;
  }
  if (status.overdueCases > 0) {
    return "There's a bench warrant for you: you missed a court date. Go to the Court page to answer your case.";
  }
  return null;
}

/** Open a court case for a charge (skips if the same charge is already open). */
export async function fileCase(
  admin: SupabaseClient,
  userId: string,
  chargeKey: string,
  careerId: string | null
): Promise<{ id: string; charge: string } | null> {
  const charge = getCharge(chargeKey);
  if (!charge) return null;

  const { data: existing } = await admin
    .from("court_cases")
    .select("id")
    .eq("defendant_id", userId)
    .eq("charge_key", charge.key)
    .eq("status", "awaiting_trial")
    .limit(1);

  if (existing && existing.length > 0) return null;

  const { data, error } = await admin
    .from("court_cases")
    .insert({
      defendant_id: userId,
      charge_key: charge.key,
      charge: charge.title,
      agency: charge.agency,
      severity: charge.severity,
      details: charge.details,
      career_id: careerId,
      fine_min: charge.fineMin,
      fine_max: charge.fineMax,
    })
    .select("id")
    .single();

  if (error || !data) return null;

  await admin.from("notifications").insert({
    player_id: userId,
    type: "system",
    title: charge.agency === "efcc" ? "🚨 EFCC has opened a case against you" : "⚖️ You've been charged",
    message: `${charge.title}. You have 48 hours to appear in court.`,
    action_url: "/court",
    actor_id: null,
  });

  return { id: data.id, charge: charge.title };
}

export interface TrialOutcome {
  status: "acquitted" | "fined" | "jailed";
  verdict: string;
  fine: number;
  jailHours: number;
  lawyerFee: number;
}

/**
 * Hold the trial. Pleading guilty: smaller fine, no jail.
 * Not guilty: chance of acquittal depends on lawyer and reputation.
 * If the player can't pay a fine, they serve jail time instead.
 */
export async function holdTrial(
  admin: SupabaseClient,
  userId: string,
  caseId: string,
  plea: "guilty" | "not_guilty",
  tier: LawyerTier
): Promise<{ ok: true; outcome: TrialOutcome } | { ok: false; error: string }> {
  const { data: courtCase } = await admin
    .from("court_cases")
    .select("*")
    .eq("id", caseId)
    .eq("defendant_id", userId)
    .maybeSingle();

  if (!courtCase) return { ok: false, error: "Case not found." };
  if (courtCase.status !== "awaiting_trial") return { ok: false, error: "This case is closed." };

  const charge = getCharge(courtCase.charge_key);
  if (!charge) return { ok: false, error: "Unknown charge." };

  const fee = plea === "guilty" ? 0 : lawyerFee(charge, tier);

  // Pay the lawyer first (game cash).
  if (fee > 0) {
    try {
      await applyPlayerDelta(admin, userId, { cash: -fee });
    } catch {
      return { ok: false, error: `You can't afford this lawyer's ₦${fee.toLocaleString("en-NG")} fee.` };
    }
  }

  // Lock the case so it can only be tried once.
  const { data: locked } = await admin
    .from("court_cases")
    .update({ plea, lawyer_tier: plea === "guilty" ? null : tier, lawyer_fee: fee })
    .eq("id", caseId)
    .eq("status", "awaiting_trial")
    .is("plea", null)
    .select("id");

  if (!locked || locked.length === 0) {
    if (fee > 0) await applyPlayerDelta(admin, userId, { cash: fee }).catch(() => undefined);
    return { ok: false, error: "This case is already being heard." };
  }

  const { data: profile } = await admin
    .from("player_game_states")
    .select("reputation")
    .eq("user_id", userId)
    .maybeSingle();

  const reputationShield = Math.min(0.1, Math.max(0, Number(profile?.reputation ?? 0)) / 1500);
  const overduePenalty = new Date(courtCase.deadline_at).getTime() < Date.now() ? 0.1 : 0;

  let outcome: TrialOutcome;

  if (plea === "guilty") {
    outcome = {
      status: "fined",
      verdict: "You pleaded guilty. The judge was lenient and gave you the minimum fine.",
      fine: charge.fineMin,
      jailHours: 0,
      lawyerFee: 0,
    };
  } else {
    const convictionChance = Math.min(
      0.95,
      Math.max(0.05, BASE_CONVICTION[charge.severity] - LAWYERS[tier].defence - reputationShield + overduePenalty)
    );

    if (Math.random() >= convictionChance) {
      outcome = {
        status: "acquitted",
        verdict: `Not guilty! ${tier === "san" ? "Your SAN tore the prosecution's evidence apart." : tier === "private" ? "Your lawyer found holes in the evidence." : "The prosecution couldn't prove its case."}`,
        fine: 0,
        jailHours: 0,
        lawyerFee: fee,
      };
    } else {
      const fine = Math.round(charge.fineMin + Math.random() * (charge.fineMax - charge.fineMin));
      outcome = {
        status: "jailed",
        verdict: "Guilty. You were fined and sentenced to jail time at Kuje Prison.",
        fine,
        jailHours: charge.jailHours,
        lawyerFee: fee,
      };
    }
  }

  // Collect the fine; if they can't pay, add jail time instead.
  let finePaid = 0;
  let jailHours = outcome.jailHours;

  if (outcome.fine > 0) {
    try {
      await applyPlayerDelta(admin, userId, { cash: -outcome.fine });
      finePaid = outcome.fine;
    } catch {
      const extra = Math.max(1, Math.ceil(outcome.fine / BAIL_PER_HOUR));
      jailHours += extra;
      outcome.verdict += ` You couldn't pay the ₦${outcome.fine.toLocaleString("en-NG")} fine, so ${extra} hour(s) were added to your sentence.`;
    }
  }

  if (outcome.status === "fined" && jailHours > 0) outcome.status = "jailed";

  if (jailHours > 0) {
    const { data: state } = await admin
      .from("player_game_states")
      .select("jailed_until")
      .eq("user_id", userId)
      .maybeSingle();
    const base = Math.max(Date.now(), state?.jailed_until ? new Date(state.jailed_until).getTime() : 0);
    await admin
      .from("player_game_states")
      .update({ jailed_until: new Date(base + jailHours * 3_600_000).toISOString() })
      .eq("user_id", userId);
  }

  // Reputation hit for convictions.
  if (outcome.status !== "acquitted") {
    await applyPlayerDelta(admin, userId, {
      reputation: charge.severity === "financial" ? -15 : charge.severity === "serious" ? -8 : -3,
    }).catch(() => undefined);
  }

  await admin
    .from("court_cases")
    .update({
      status: outcome.status,
      verdict: outcome.verdict,
      fine_paid: finePaid,
      jail_hours: jailHours,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", caseId);

  return { ok: true, outcome: { ...outcome, jailHours } };
}

/** Pay bail to leave jail now. */
export async function payBail(admin: SupabaseClient, userId: string) {
  const status = await getLegalStatus(admin, userId);
  if (!status.jailed || !status.jailedUntil) return { ok: false as const, error: "You're not in jail." };

  const hours = Math.ceil((new Date(status.jailedUntil).getTime() - Date.now()) / 3_600_000);
  const bail = hours * BAIL_PER_HOUR;

  try {
    await applyPlayerDelta(admin, userId, { cash: -bail });
  } catch {
    return { ok: false as const, error: `Bail is ₦${bail.toLocaleString("en-NG")}. You don't have enough cash.` };
  }

  await admin.from("player_game_states").update({ jailed_until: null }).eq("user_id", userId);
  return { ok: true as const, bail };
}
