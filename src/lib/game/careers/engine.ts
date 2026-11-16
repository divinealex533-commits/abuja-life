// Abuja Life — Advanced Careers: shift engine.
// Pure functions: the server uses computeShift() to decide real pay,
// the client uses the helpers to show ranks and previews.

import type {
  Career,
  CareerRank,
  CityEvent,
  ShiftDecision,
  ShiftResult,
  ShiftScenario,
} from "./types";

export const SCENARIOS_PER_SHIFT = 3;

/** Minimum seconds between shifts for one player (anti-spam). */
export const SHIFT_COOLDOWN_SECONDS = 20;

export function makeRanks(titles: [string, string, string, string, string]): CareerRank[] {
  const thresholds = [0, 40, 120, 280, 600];
  const multipliers = [1, 1.3, 1.7, 2.2, 3];
  return titles.map((title, i) => ({
    title,
    minXp: thresholds[i],
    payMultiplier: multipliers[i],
  }));
}

export function rankIndexForXp(career: Career, xp: number): number {
  let index = 0;
  career.ranks.forEach((rank, i) => {
    if (xp >= rank.minXp) index = i;
  });
  return index;
}

export function nextRank(career: Career, xp: number): CareerRank | null {
  const index = rankIndexForXp(career, xp);
  return career.ranks[index + 1] ?? null;
}

export function shiftPayAtRank(career: Career, rankIndex: number): number {
  return Math.round(career.basePay * career.ranks[rankIndex].payMultiplier);
}

/** Pick N different scenarios for a new shift. */
export function pickScenarios(
  career: Career,
  count = SCENARIOS_PER_SHIFT,
  random: () => number = Math.random
): ShiftScenario[] {
  const pool = [...career.scenarios];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export const CITY_EVENTS: CityEvent[] = [
  { id: "traffic", text: "Heavy traffic on Airport Road slowed everything down.", payModifier: -0.1 },
  { id: "rain", text: "Sudden Abuja downpour — fewer people out today.", payModifier: -0.08 },
  { id: "power", text: "NEPA took light for hours. You managed on generator.", payModifier: -0.05 },
  { id: "salary", text: "Civil servants just got paid — money is moving!", payModifier: 0.2 },
  { id: "festive", text: "Festive season rush. Everyone is spending.", payModifier: 0.15 },
  { id: "vip-visit", text: "A big shot noticed your work and tipped generously.", payModifier: 0.25 },
  { id: "viral", text: "Someone posted about you online. Customers came looking for you.", payModifier: 0.12 },
];

/** 35% chance of a city event on any shift. */
export function rollCityEvent(random: () => number = Math.random): CityEvent | null {
  if (random() > 0.35) return null;
  return CITY_EVENTS[Math.floor(random() * CITY_EVENTS.length)];
}

export type ValidationError =
  | "WRONG_COUNT"
  | "DUPLICATE_SCENARIO"
  | "UNKNOWN_SCENARIO"
  | "UNKNOWN_CHOICE"
  | "RANK_TOO_LOW";

export function validateDecisions(
  career: Career,
  decisions: ShiftDecision[],
  rankIndex: number
): ValidationError | null {
  if (!Array.isArray(decisions) || decisions.length !== SCENARIOS_PER_SHIFT) {
    return "WRONG_COUNT";
  }

  const seen = new Set<string>();

  for (const decision of decisions) {
    if (seen.has(decision.scenarioId)) return "DUPLICATE_SCENARIO";
    seen.add(decision.scenarioId);

    const scenario = career.scenarios.find((s) => s.id === decision.scenarioId);
    if (!scenario) return "UNKNOWN_SCENARIO";

    const choice = scenario.choices.find((c) => c.id === decision.choiceId);
    if (!choice) return "UNKNOWN_CHOICE";

    if ((choice.minRank ?? 0) > rankIndex) return "RANK_TOO_LOW";
  }

  return null;
}

/**
 * Work out a full shift. Call validateDecisions() first.
 * `random` is injectable so results are decided on the server.
 */
export function computeShift(
  career: Career,
  decisions: ShiftDecision[],
  careerXp: number,
  vipPayBonus: number,
  random: () => number = Math.random
): ShiftResult {
  const rankBefore = rankIndexForXp(career, careerXp);
  const basePay = shiftPayAtRank(career, rankBefore);
  const perDecision = basePay / SCENARIOS_PER_SHIFT;

  let decisionPay = 0;
  let reputation = 0;
  let xp = 0;

  const results = decisions.map((decision) => {
    const scenario = career.scenarios.find((s) => s.id === decision.scenarioId)!;
    const choice = scenario.choices.find((c) => c.id === decision.choiceId)!;

    let pay = perDecision * choice.payFactor;
    let rep = choice.reputation;
    let text = choice.successText;
    let success = true;

    if (choice.risk && random() < choice.risk.chance) {
      success = false;
      pay = pay * (1 - (choice.risk.payLoss ?? 1));
      rep = -Math.abs(choice.risk.reputationLoss);
      text = choice.risk.failText;
    }

    // You still learn from mistakes, just less.
    const gainedXp = success ? choice.xp : Math.max(1, Math.floor(choice.xp / 2));

    decisionPay += pay;
    reputation += rep;
    xp += gainedXp;

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      choiceLabel: choice.label,
      success,
      text,
      pay: Math.round(pay),
      reputation: rep,
      xp: gainedXp,
      ...(!success && choice.risk?.charge ? { charge: choice.risk.charge } : {}),
    };
  });

  const event = rollCityEvent(random);
  const eventBonus = event ? decisionPay * event.payModifier : 0;
  const beforeVip = Math.max(0, decisionPay + eventBonus);
  const vipBonus = beforeVip * Math.max(0, vipPayBonus);
  const totalPay = Math.round(beforeVip + vipBonus);

  const rankAfter = rankIndexForXp(career, careerXp + xp);

  return {
    decisions: results,
    event,
    basePay,
    decisionPay: Math.round(decisionPay),
    eventBonus: Math.round(eventBonus),
    vipBonus: Math.round(vipBonus),
    totalPay,
    reputation,
    xp,
    rankBefore,
    rankAfter,
    promoted: rankAfter > rankBefore,
  };
}

/** Rough risk label for the UI. */
export function riskLabel(chance: number | undefined): "Safe" | "Some risk" | "Risky" | "Very risky" {
  if (!chance) return "Safe";
  if (chance < 0.2) return "Some risk";
  if (chance < 0.4) return "Risky";
  return "Very risky";
}
