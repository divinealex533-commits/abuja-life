// Abuja Life — Paramedic job logic.
// Missions, patients, treatment rules and rewards used by ParamedicPanel.

export type ParamedicAction =
  | "assess-patient"
  | "control-bleeding"
  | "stabilize-patient"
  | "give-oxygen"
  | "apply-neck-collar"
  | "give-pain-relief"
  | "start-iv"
  | "reassess-patient"
  | "call-hospital"
  | "transport-patient"
  | "manage-scene";

export type ParamedicMissionType =
  | "road-accident"
  | "medical-emergency"
  | "building-collapse"
  | "mass-casualty";

export type ParamedicDifficulty = "easy" | "medium" | "hard" | "extreme";

export type PatientCondition = "critical" | "serious" | "moderate" | "stable";

export type PatientStatus =
  | "critical"
  | "unstable"
  | "improving"
  | "stable"
  | "transported";

export interface ParamedicPatient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  diagnosis: string;
  condition: PatientCondition;
  status: PatientStatus;
  heartRate: number;
  bloodPressure: string;
  oxygen: number;
  needsBleedingControl: boolean;
  needsOxygen: boolean;
  needsIv: boolean;
  needsNeckCollar: boolean;
  needsPainRelief: boolean;
  stabilized: boolean;
  transported: boolean;
}

export interface ParamedicMission {
  id: string;
  type: ParamedicMissionType;
  title: string;
  description: string;
  location: string;
  difficulty: ParamedicDifficulty;
  /** Seconds available for the whole response. */
  timeLimit: number;
  rewardMin: number;
  rewardMax: number;
  reputation: number;
  patients: ParamedicPatient[];
}

export type ParamedicOutcome = "legendary" | "excellent" | "good" | "mixed" | "poor";

export interface ParamedicResult {
  outcome: ParamedicOutcome;
  score: number;
  patientsSaved: number;
  patientsTransported: number;
  mistakes: number;
  cash: number;
  reputation: number;
  experience: number;
}

export interface ParamedicActionResult {
  success: boolean;
  score: number;
  message: string;
}

type PatientSeed = Pick<
  ParamedicPatient,
  "name" | "age" | "gender" | "diagnosis" | "condition" | "heartRate" | "bloodPressure" | "oxygen"
> &
  Partial<
    Pick<
      ParamedicPatient,
      "needsBleedingControl" | "needsOxygen" | "needsIv" | "needsNeckCollar" | "needsPainRelief"
    >
  >;

function patient(missionId: string, index: number, seed: PatientSeed): ParamedicPatient {
  return {
    id: `${missionId}-p${index + 1}`,
    status: seed.condition === "critical" ? "critical" : seed.condition === "stable" ? "stable" : "unstable",
    needsBleedingControl: false,
    needsOxygen: false,
    needsIv: false,
    needsNeckCollar: false,
    needsPainRelief: false,
    stabilized: false,
    transported: false,
    ...seed,
  };
}

function mission(
  data: Omit<ParamedicMission, "patients">,
  seeds: PatientSeed[]
): ParamedicMission {
  return { ...data, patients: seeds.map((seed, i) => patient(data.id, i, seed)) };
}

const MISSIONS: ParamedicMission[] = [
  mission(
    {
      id: "airport-road-crash",
      type: "road-accident",
      title: "Airport Road Collision",
      description: "A car and a bus collided near the Lugbe junction. Two people are hurt.",
      location: "Airport Road, Lugbe",
      difficulty: "easy",
      timeLimit: 120,
      rewardMin: 6_000,
      rewardMax: 10_000,
      reputation: 4,
    },
    [
      {
        name: "Chinedu Okafor",
        age: 34,
        gender: "Male",
        diagnosis: "Deep cut on the forearm, heavy bleeding.",
        condition: "serious",
        heartRate: 112,
        bloodPressure: "100/65",
        oxygen: 95,
        needsBleedingControl: true,
        needsPainRelief: true,
      },
      {
        name: "Halima Bello",
        age: 27,
        gender: "Female",
        diagnosis: "Neck pain after whiplash.",
        condition: "moderate",
        heartRate: 92,
        bloodPressure: "118/76",
        oxygen: 98,
        needsNeckCollar: true,
      },
    ]
  ),
  mission(
    {
      id: "wuse-market-collapse",
      type: "medical-emergency",
      title: "Collapse at Wuse Market",
      description: "A trader collapsed in the heat and is struggling to breathe.",
      location: "Wuse Market",
      difficulty: "medium",
      timeLimit: 100,
      rewardMin: 9_000,
      rewardMax: 15_000,
      reputation: 6,
    },
    [
      {
        name: "Mama Ngozi",
        age: 61,
        gender: "Female",
        diagnosis: "Severe asthma attack and dehydration.",
        condition: "critical",
        heartRate: 128,
        bloodPressure: "90/60",
        oxygen: 84,
        needsOxygen: true,
        needsIv: true,
      },
    ]
  ),
  mission(
    {
      id: "kubwa-building-collapse",
      type: "building-collapse",
      title: "Building Collapse in Kubwa",
      description: "Part of an uncompleted building fell. Workers are trapped and injured.",
      location: "Kubwa, Phase 4",
      difficulty: "hard",
      timeLimit: 150,
      rewardMin: 15_000,
      rewardMax: 25_000,
      reputation: 9,
    },
    [
      {
        name: "Musa Ibrahim",
        age: 29,
        gender: "Male",
        diagnosis: "Crushed leg, bleeding, possible spinal injury.",
        condition: "critical",
        heartRate: 134,
        bloodPressure: "85/55",
        oxygen: 90,
        needsBleedingControl: true,
        needsNeckCollar: true,
        needsIv: true,
        needsPainRelief: true,
      },
      {
        name: "Emeka Nwosu",
        age: 41,
        gender: "Male",
        diagnosis: "Dust inhalation, breathing difficulty.",
        condition: "serious",
        heartRate: 110,
        bloodPressure: "125/80",
        oxygen: 88,
        needsOxygen: true,
      },
      {
        name: "Sadiq Umar",
        age: 23,
        gender: "Male",
        diagnosis: "Minor cuts and bruises.",
        condition: "moderate",
        heartRate: 95,
        bloodPressure: "120/78",
        oxygen: 97,
        needsPainRelief: true,
      },
    ]
  ),
  mission(
    {
      id: "nyanya-mass-casualty",
      type: "mass-casualty",
      title: "Mass Casualty at Nyanya Park",
      description: "A tanker accident near the motor park. Many injured — work fast and prioritise.",
      location: "Nyanya Motor Park",
      difficulty: "extreme",
      timeLimit: 180,
      rewardMin: 25_000,
      rewardMax: 40_000,
      reputation: 14,
    },
    [
      {
        name: "Blessing Eze",
        age: 32,
        gender: "Female",
        diagnosis: "Burns and smoke inhalation.",
        condition: "critical",
        heartRate: 138,
        bloodPressure: "88/58",
        oxygen: 82,
        needsOxygen: true,
        needsIv: true,
        needsPainRelief: true,
      },
      {
        name: "Yusuf Danjuma",
        age: 45,
        gender: "Male",
        diagnosis: "Head and neck injury from a fall.",
        condition: "critical",
        heartRate: 58,
        bloodPressure: "150/95",
        oxygen: 91,
        needsNeckCollar: true,
        needsOxygen: true,
      },
      {
        name: "Aisha Lawal",
        age: 19,
        gender: "Female",
        diagnosis: "Deep leg wound, heavy bleeding.",
        condition: "serious",
        heartRate: 120,
        bloodPressure: "98/62",
        oxygen: 95,
        needsBleedingControl: true,
        needsIv: true,
      },
      {
        name: "Tunde Bakare",
        age: 37,
        gender: "Male",
        diagnosis: "Broken arm, in severe pain.",
        condition: "moderate",
        heartRate: 104,
        bloodPressure: "130/85",
        oxygen: 97,
        needsPainRelief: true,
      },
    ]
  ),
  mission(
    {
      id: "maitama-heart-attack",
      type: "medical-emergency",
      title: "Chest Pain in Maitama",
      description: "A businessman collapsed during a meeting with chest pain.",
      location: "Maitama District",
      difficulty: "medium",
      timeLimit: 90,
      rewardMin: 10_000,
      rewardMax: 16_000,
      reputation: 7,
    },
    [
      {
        name: "Chief Adewale",
        age: 58,
        gender: "Male",
        diagnosis: "Suspected heart attack.",
        condition: "critical",
        heartRate: 130,
        bloodPressure: "160/100",
        oxygen: 89,
        needsOxygen: true,
        needsIv: true,
      },
    ]
  ),
];

export function getAllParamedicMissions(): ParamedicMission[] {
  return MISSIONS.map((m) => ({ ...m, patients: m.patients.map((p) => ({ ...p })) }));
}

/** Seconds before the next "pressure" tick, by difficulty. */
export function getParamedicResponseTime(difficulty: ParamedicDifficulty): number {
  switch (difficulty) {
    case "extreme":
      return 5;
    case "hard":
      return 6;
    case "medium":
      return 8;
    default:
      return 10;
  }
}

export function getParamedicActionOutcome(
  action: ParamedicAction,
  patient: ParamedicPatient
): ParamedicActionResult {
  const name = patient.name;

  switch (action) {
    case "assess-patient":
      return { success: true, score: 5, message: `Assessed ${name}: ${patient.diagnosis}` };

    case "control-bleeding":
      return patient.needsBleedingControl
        ? { success: true, score: 20, message: `Bleeding controlled for ${name}.` }
        : { success: false, score: -5, message: `${name} has no major bleeding.` };

    case "give-oxygen":
      return patient.needsOxygen
        ? { success: true, score: 18, message: `Oxygen given. ${name} is breathing easier.` }
        : { success: false, score: -5, message: `${name}'s oxygen level is already fine.` };

    case "start-iv":
      return patient.needsIv
        ? { success: true, score: 18, message: `IV line started for ${name}.` }
        : { success: false, score: -5, message: `${name} doesn't need an IV right now.` };

    case "apply-neck-collar":
      return patient.needsNeckCollar
        ? { success: true, score: 18, message: `Neck collar applied. ${name}'s spine is protected.` }
        : { success: false, score: -4, message: `No spinal injury suspected for ${name}.` };

    case "give-pain-relief":
      return patient.needsPainRelief
        ? { success: true, score: 10, message: `Pain relief given to ${name}.` }
        : { success: false, score: -4, message: `${name} doesn't need pain relief.` };

    case "stabilize-patient": {
      const ready =
        !patient.needsBleedingControl && !patient.needsOxygen && !patient.needsIv && !patient.needsNeckCollar;
      return ready
        ? { success: true, score: 25, message: `${name} is now stable.` }
        : { success: false, score: -10, message: `${name} still needs urgent treatment first.` };
    }

    case "reassess-patient":
      return patient.stabilized || patient.status === "improving"
        ? { success: true, score: 6, message: `${name} is responding well to treatment.` }
        : { success: false, score: -2, message: `${name} isn't improving yet. Treat the main problem.` };

    case "call-hospital":
      return { success: true, score: 8, message: `Hospital is ready to receive ${name}.` };

    case "transport-patient":
      return patient.stabilized
        ? { success: true, score: 30, message: `${name} is on the way to hospital.` }
        : { success: false, score: -15, message: `Moving ${name} before stabilising is dangerous.` };

    case "manage-scene":
      return { success: true, score: 6, message: "Scene secured. Bystanders moved back." };

    default:
      return { success: false, score: 0, message: "Nothing happened." };
  }
}

export function calculateParamedicResult(params: {
  mission: ParamedicMission;
  score: number;
  patientsSaved: number;
  patientsTransported: number;
  mistakes: number;
}): ParamedicResult {
  const { mission, score, patientsSaved, patientsTransported, mistakes } = params;
  const total = Math.max(1, mission.patients.length);

  const savedRatio = patientsSaved / total;
  const transportRatio = patientsTransported / total;
  const performance = Math.max(
    0,
    Math.min(1, savedRatio * 0.45 + transportRatio * 0.45 + Math.min(score, 200) / 2000 - mistakes * 0.05)
  );

  const outcome: ParamedicOutcome =
    performance >= 0.9 && mistakes === 0
      ? "legendary"
      : performance >= 0.75
        ? "excellent"
        : performance >= 0.55
          ? "good"
          : performance >= 0.3
            ? "mixed"
            : "poor";

  const cash = Math.round(mission.rewardMin + (mission.rewardMax - mission.rewardMin) * performance);

  const reputation =
    outcome === "legendary"
      ? mission.reputation + 4
      : outcome === "excellent"
        ? mission.reputation
        : outcome === "good"
          ? Math.ceil(mission.reputation / 2)
          : outcome === "mixed"
            ? 1
            : 0;

  const experience = Math.round(5 + performance * 15 + patientsSaved * 2);

  return {
    outcome,
    score: Math.max(0, score),
    patientsSaved,
    patientsTransported,
    mistakes,
    cash: outcome === "poor" ? Math.round(mission.rewardMin * 0.4) : cash,
    reputation,
    experience,
  };
}

export function getParamedicSuccessMessage(outcome: ParamedicOutcome): string {
  switch (outcome) {
    case "legendary":
      return "Flawless response. Every patient saved — Abuja is talking about you.";
    case "excellent":
      return "Outstanding work. The hospital praised your quick, correct treatment.";
    case "good":
      return "Good response. Most patients got the care they needed.";
    case "mixed":
      return "Some patients were helped, but mistakes slowed you down.";
    default:
      return "A tough call. Review the patients' needs and try again.";
  }
}
