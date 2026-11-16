// Abuja Life — Advanced Careers: shared types.

import type { VipTier } from "@/lib/vip/catalog";

export interface ChoiceRisk {
  /** 0–1 chance that this choice goes wrong. */
  chance: number;
  /** Shown to the player before choosing, e.g. "Customer may report you". */
  warning: string;
  /** Shown in the shift report when it goes wrong. */
  failText: string;
  /** Reputation lost when it goes wrong. */
  reputationLoss: number;
  /** Share of this decision's pay lost (0–1). Defaults to 1. */
  payLoss?: number;
}

export interface ShiftChoice {
  id: string;
  label: string;
  detail: string;
  /** Pay for this decision as a share of one-third of the shift pay (e.g. 1.2). */
  payFactor: number;
  reputation: number;
  xp: number;
  successText: string;
  risk?: ChoiceRisk;
  /** Only available from this rank index (0-based). */
  minRank?: number;
}

export interface ShiftScenario {
  id: string;
  emoji: string;
  title: string;
  situation: string;
  choices: ShiftChoice[];
}

export interface CareerRank {
  title: string;
  minXp: number;
  payMultiplier: number;
}

export type CareerAccent =
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "orange"
  | "lime";

export interface Career {
  id: string;
  name: string;
  emoji: string;
  district: string;
  tagline: string;
  description: string;
  accent: CareerAccent;
  /** Required VIP tier, if this is a VIP career. */
  vipTier?: VipTier;
  /** Shift pay at the first rank, before decisions and bonuses. */
  basePay: number;
  energyCost: number;
  ranks: CareerRank[];
  scenarios: ShiftScenario[];
}

export interface ShiftDecision {
  scenarioId: string;
  choiceId: string;
}

export interface DecisionResult {
  scenarioId: string;
  scenarioTitle: string;
  choiceLabel: string;
  success: boolean;
  text: string;
  pay: number;
  reputation: number;
  xp: number;
}

export interface CityEvent {
  id: string;
  text: string;
  payModifier: number;
}

export interface ShiftResult {
  decisions: DecisionResult[];
  event: CityEvent | null;
  basePay: number;
  decisionPay: number;
  eventBonus: number;
  vipBonus: number;
  totalPay: number;
  reputation: number;
  xp: number;
  rankBefore: number;
  rankAfter: number;
  promoted: boolean;
}
