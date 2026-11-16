// Abuja Life — justice system: charges, agencies, lawyers.
// Safe for client and server.

export type Agency = "police" | "efcc" | "nafdac" | "customs";
export type Severity = "minor" | "serious" | "financial";
export type LawyerTier = "legal_aid" | "private" | "san";

export interface Charge {
  key: string;
  title: string;
  agency: Agency;
  severity: Severity;
  details: string;
  fineMin: number;
  fineMax: number;
  /** Jail hours if convicted after a "not guilty" plea. */
  jailHours: number;
}

export const CHARGES: Record<string, Charge> = {
  bribery: {
    key: "bribery",
    title: "Offering a bribe to an official",
    agency: "police",
    severity: "minor",
    details: "Caught offering money to an officer to look the other way.",
    fineMin: 5_000,
    fineMax: 20_000,
    jailHours: 2,
  },
  pin_misuse: {
    key: "pin_misuse",
    title: "Collecting a customer's bank PIN",
    agency: "police",
    severity: "minor",
    details: "A customer reported that you asked for their ATM PIN.",
    fineMin: 10_000,
    fineMax: 30_000,
    jailHours: 2,
  },
  theft: {
    key: "theft",
    title: "Stealing a passenger's phone",
    agency: "police",
    severity: "serious",
    details: "A lost phone was tracked to you after you sold it.",
    fineMin: 30_000,
    fineMax: 80_000,
    jailHours: 6,
  },
  fraud_parts: {
    key: "fraud_parts",
    title: "Selling fake parts as original",
    agency: "police",
    severity: "serious",
    details: "A customer reported being charged for original parts but given copies.",
    fineMin: 25_000,
    fineMax: 70_000,
    jailHours: 4,
  },
  fake_drugs: {
    key: "fake_drugs",
    title: "Selling counterfeit medicine",
    agency: "nafdac",
    severity: "serious",
    details: "NAFDAC traced fake malaria drugs to your pharmacy.",
    fineMin: 80_000,
    fineMax: 200_000,
    jailHours: 8,
  },
  illegal_dispensing: {
    key: "illegal_dispensing",
    title: "Selling prescription drugs without prescription",
    agency: "nafdac",
    severity: "minor",
    details: "An inspector bought antibiotics from you without a prescription.",
    fineMin: 15_000,
    fineMax: 40_000,
    jailHours: 2,
  },
  property_fraud: {
    key: "property_fraud",
    title: "Advertising a property with forged documents",
    agency: "efcc",
    severity: "financial",
    details: "A tenant lost rent money on a property you listed with fake papers.",
    fineMin: 150_000,
    fineMax: 400_000,
    jailHours: 10,
  },
  smuggling: {
    key: "smuggling",
    title: "Selling a smuggled vehicle",
    agency: "customs",
    severity: "financial",
    details: "Customs seized a car you sold without paid import duty.",
    fineMin: 300_000,
    fineMax: 900_000,
    jailHours: 12,
  },
  official_corruption: {
    key: "official_corruption",
    title: "Accepting gratification as a public official",
    agency: "efcc",
    severity: "financial",
    details: "EFCC opened a file on money you received during official business.",
    fineMin: 500_000,
    fineMax: 1_500_000,
    jailHours: 16,
  },
  visa_racket: {
    key: "visa_racket",
    title: "Facilitating fraudulent visas",
    agency: "efcc",
    severity: "financial",
    details: "Visas you fast-tracked were linked to a trafficking network.",
    fineMin: 400_000,
    fineMax: 1_200_000,
    jailHours: 16,
  },
  contract_fraud: {
    key: "contract_fraud",
    title: "Contract inflation and nepotism",
    agency: "efcc",
    severity: "financial",
    details: "Auditors linked a failed contract you recommended to a relative of the director.",
    fineMin: 800_000,
    fineMax: 2_500_000,
    jailHours: 20,
  },
  false_reporting: {
    key: "false_reporting",
    title: "Falsifying regulatory reports",
    agency: "efcc",
    severity: "financial",
    details: "Satellite data showed the figures you reported to regulators were false.",
    fineMin: 600_000,
    fineMax: 2_000_000,
    jailHours: 18,
  },
  regulatory_breach: {
    key: "regulatory_breach",
    title: "Operating without a CBN licence",
    agency: "efcc",
    severity: "financial",
    details: "Your fintech kept taking customer money without the required licence.",
    fineMin: 500_000,
    fineMax: 1_800_000,
    jailHours: 12,
  },
};

export function getCharge(key: string | undefined | null): Charge | undefined {
  return key ? CHARGES[key] : undefined;
}

export const AGENCY_INFO: Record<Agency, { name: string; emoji: string; color: string }> = {
  police: { name: "Nigeria Police Force", emoji: "👮🏾", color: "text-sky-300" },
  efcc: { name: "EFCC", emoji: "🕵🏾", color: "text-red-300" },
  nafdac: { name: "NAFDAC", emoji: "💊", color: "text-emerald-300" },
  customs: { name: "Nigeria Customs Service", emoji: "🛃", color: "text-amber-300" },
};

export interface LawyerOption {
  tier: LawyerTier;
  name: string;
  description: string;
  /** Fee as a share of the maximum fine (min fee applies). */
  feeShare: number;
  minFee: number;
  /** How much this lawyer lowers the chance of conviction. */
  defence: number;
}

export const LAWYERS: Record<LawyerTier, LawyerOption> = {
  legal_aid: {
    tier: "legal_aid",
    name: "Legal Aid Council lawyer",
    description: "Free, but overworked. Meets you five minutes before the hearing.",
    feeShare: 0,
    minFee: 0,
    defence: 0,
  },
  private: {
    tier: "private",
    name: "Private chambers (Garki)",
    description: "Experienced litigator who knows the judges and the files.",
    feeShare: 0.35,
    minFee: 15_000,
    defence: 0.22,
  },
  san: {
    tier: "san",
    name: "Senior Advocate of Nigeria (SAN)",
    description: "One of the best in the country. Expensive, but cases tend to go away.",
    feeShare: 0.9,
    minFee: 100_000,
    defence: 0.42,
  },
};

export const BASE_CONVICTION: Record<Severity, number> = {
  minor: 0.5,
  serious: 0.62,
  financial: 0.7,
};

export function lawyerFee(charge: Pick<Charge, "fineMax">, tier: LawyerTier): number {
  const lawyer = LAWYERS[tier];
  if (lawyer.feeShare === 0) return 0;
  return Math.max(lawyer.minFee, Math.round(charge.fineMax * lawyer.feeShare));
}

/** Bail to leave jail early: game cash per remaining hour. */
export const BAIL_PER_HOUR = 15_000;
