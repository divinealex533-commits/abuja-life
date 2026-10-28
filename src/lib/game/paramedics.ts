"use client";

export type ParamedicDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "extreme";

export type PatientCondition =
  | "critical"
  | "serious"
  | "moderate"
  | "stable";

export type ParamedicAction =
  | "assess-patient"
  | "control-bleeding"
  | "stabilize-patient"
  | "give-oxygen"
  | "apply-neck-collar"
  | "give-pain-relief"
  | "start-iv"
  | "call-hospital"
  | "transport-patient"
  | "reassess-patient"
  | "manage-scene";

export type EmergencyType =
  | "road-accident"
  | "medical-emergency"
  | "fire-injury"
  | "building-collapse"
  | "mass-casualty"
  | "vip-emergency";

export type PatientStatus =
  | "unstable"
  | "improving"
  | "stable"
  | "critical"
  | "transported";

export interface ParamedicPatient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  condition: PatientCondition;
  status: PatientStatus;
  heartRate: number;
  bloodPressure: string;
  oxygen: number;
  diagnosis: string;
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
  title: string;
  type: EmergencyType;
  location: string;
  description: string;
  difficulty: ParamedicDifficulty;
  timeLimit: number;
  patients: ParamedicPatient[];
  rewardMin: number;
  rewardMax: number;
  reputation: number;
  experience: number;
}

export interface ParamedicActionResult {
  success: boolean;
  score: number;
  message: string;
  patientId?: string;
  patientStatus?: PatientStatus;
}

export interface ParamedicResult {
  mission: ParamedicMission;
  score: number;
  patientsSaved: number;
  patientsTransported: number;
  mistakes: number;
  cash: number;
  reputation: number;
  experience: number;
  outcome:
    | "legendary"
    | "excellent"
    | "good"
    | "mixed"
    | "poor"
    | "critical";
}

const MISSIONS: ParamedicMission[] = [
  {
    id: "wuse-motor-accident",
    title: "Motor Accident — Wuse",
    type: "road-accident",
    location: "Ahmadu Bello Way, Wuse",
    description:
      "A serious road accident has been reported. Multiple casualties are at the scene. Stabilize the patients and get critical cases to hospital.",
    difficulty: "easy",
    timeLimit: 165,
    rewardMin: 8000,
    rewardMax: 18000,
    reputation: 12,
    experience: 120,
    patients: [
      {
        id: "patient-a",
        name: "Patient A",
        age: 32,
        gender: "Male",
        condition: "critical",
        status: "critical",
        heartRate: 128,
        bloodPressure: "80/50",
        oxygen: 87,
        diagnosis: "Head injury with possible internal trauma.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: true,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-b",
        name: "Patient B",
        age: 28,
        gender: "Female",
        condition: "serious",
        status: "unstable",
        heartRate: 110,
        bloodPressure: "95/60",
        oxygen: 94,
        diagnosis: "Heavy bleeding from lower leg.",
        needsBleedingControl: true,
        needsOxygen: false,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-c",
        name: "Patient C",
        age: 25,
        gender: "Male",
        condition: "moderate",
        status: "stable",
        heartRate: 98,
        bloodPressure: "120/80",
        oxygen: 97,
        diagnosis: "Possible concussion. Confused but responsive.",
        needsBleedingControl: false,
        needsOxygen: false,
        needsIv: false,
        needsNeckCollar: true,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
    ],
  },
  {
    id: "jabi-medical-emergency",
    title: "Medical Emergency — Jabi",
    type: "medical-emergency",
    location: "Jabi District",
    description:
      "A patient has collapsed at a busy location. Assess the patient quickly and prepare them for emergency transport.",
    difficulty: "medium",
    timeLimit: 145,
    rewardMin: 10000,
    rewardMax: 22000,
    reputation: 15,
    experience: 160,
    patients: [
      {
        id: "patient-a",
        name: "Patient A",
        age: 46,
        gender: "Female",
        condition: "critical",
        status: "critical",
        heartRate: 142,
        bloodPressure: "75/45",
        oxygen: 82,
        diagnosis: "Severe respiratory distress.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-b",
        name: "Patient B",
        age: 51,
        gender: "Male",
        condition: "serious",
        status: "unstable",
        heartRate: 118,
        bloodPressure: "90/55",
        oxygen: 91,
        diagnosis: "Chest pain and dizziness.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
    ],
  },
  {
    id: "maitama-vip-emergency",
    title: "VIP Medical Emergency — Maitama",
    type: "vip-emergency",
    location: "Maitama",
    description:
      "A high-profile patient requires immediate medical attention. Keep the scene controlled while treating the patient.",
    difficulty: "hard",
    timeLimit: 125,
    rewardMin: 14000,
    rewardMax: 30000,
    reputation: 20,
    experience: 220,
    patients: [
      {
        id: "patient-a",
        name: "VIP Patient",
        age: 39,
        gender: "Male",
        condition: "critical",
        status: "critical",
        heartRate: 136,
        bloodPressure: "82/48",
        oxygen: 85,
        diagnosis: "Cardiac emergency with severe weakness.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-b",
        name: "Security Officer",
        age: 34,
        gender: "Male",
        condition: "moderate",
        status: "stable",
        heartRate: 104,
        bloodPressure: "118/78",
        oxygen: 96,
        diagnosis: "Minor trauma after attempting to assist.",
        needsBleedingControl: true,
        needsOxygen: false,
        needsIv: false,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
    ],
  },
  {
    id: "garki-building-collapse",
    title: "Building Collapse — Garki",
    type: "building-collapse",
    location: "Garki",
    description:
      "A partial building collapse has produced several casualties. The scene is dangerous and requires careful management.",
    difficulty: "hard",
    timeLimit: 180,
    rewardMin: 16000,
    rewardMax: 36000,
    reputation: 24,
    experience: 280,
    patients: [
      {
        id: "patient-a",
        name: "Patient A",
        age: 41,
        gender: "Male",
        condition: "critical",
        status: "critical",
        heartRate: 132,
        bloodPressure: "78/46",
        oxygen: 84,
        diagnosis: "Crush injury and breathing difficulty.",
        needsBleedingControl: true,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: true,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-b",
        name: "Patient B",
        age: 19,
        gender: "Female",
        condition: "serious",
        status: "unstable",
        heartRate: 116,
        bloodPressure: "92/58",
        oxygen: 90,
        diagnosis: "Possible spinal injury.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: true,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-c",
        name: "Patient C",
        age: 57,
        gender: "Male",
        condition: "moderate",
        status: "stable",
        heartRate: 102,
        bloodPressure: "122/82",
        oxygen: 95,
        diagnosis: "Arm injury and shock symptoms.",
        needsBleedingControl: true,
        needsOxygen: false,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
    ],
  },
  {
    id: "abuja-mass-casualty",
    title: "Mass Casualty Emergency",
    type: "mass-casualty",
    location: "Central Abuja",
    description:
      "A major incident has occurred. Multiple patients require triage and rapid treatment before hospital transport.",
    difficulty: "extreme",
    timeLimit: 220,
    rewardMin: 22000,
    rewardMax: 50000,
    reputation: 32,
    experience: 420,
    patients: [
      {
        id: "patient-a",
        name: "Patient A",
        age: 30,
        gender: "Female",
        condition: "critical",
        status: "critical",
        heartRate: 148,
        bloodPressure: "70/42",
        oxygen: 79,
        diagnosis: "Severe trauma and respiratory distress.",
        needsBleedingControl: true,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: true,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-b",
        name: "Patient B",
        age: 36,
        gender: "Male",
        condition: "serious",
        status: "unstable",
        heartRate: 124,
        bloodPressure: "88/52",
        oxygen: 89,
        diagnosis: "Heavy bleeding and possible fracture.",
        needsBleedingControl: true,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-c",
        name: "Patient C",
        age: 22,
        gender: "Female",
        condition: "moderate",
        status: "stable",
        heartRate: 100,
        bloodPressure: "116/76",
        oxygen: 96,
        diagnosis: "Minor trauma and anxiety.",
        needsBleedingControl: false,
        needsOxygen: false,
        needsIv: false,
        needsNeckCollar: false,
        needsPainRelief: true,
        stabilized: false,
        transported: false,
      },
      {
        id: "patient-d",
        name: "Patient D",
        age: 63,
        gender: "Male",
        condition: "serious",
        status: "unstable",
        heartRate: 130,
        bloodPressure: "85/50",
        oxygen: 88,
        diagnosis: "Chest trauma and breathing difficulty.",
        needsBleedingControl: false,
        needsOxygen: true,
        needsIv: true,
        needsNeckCollar: true,
        needsPainRelief: false,
        stabilized: false,
        transported: false,
      },
    ],
  },
];

function clonePatient(patient: ParamedicPatient): ParamedicPatient {
  return { ...patient };
}

export function getAllParamedicMissions(): ParamedicMission[] {
  return MISSIONS.map((mission) => ({
    ...mission,
    patients: mission.patients.map(clonePatient),
  }));
}

export function getParamedicMission(
  missionId: string
): ParamedicMission | null {
  const mission = MISSIONS.find((item) => item.id === missionId);

  if (!mission) {
    return null;
  }

  return {
    ...mission,
    patients: mission.patients.map(clonePatient),
  };
}

export function getRandomParamedicMission(): ParamedicMission {
  const mission =
    MISSIONS[Math.floor(Math.random() * MISSIONS.length)];

  return {
    ...mission,
    patients: mission.patients.map(clonePatient),
  };
}

export function getParamedicActionOutcome(
  action: ParamedicAction,
  patient: ParamedicPatient
): ParamedicActionResult {
  switch (action) {
    case "assess-patient":
      return {
        success: true,
        score: 5,
        message: `${patient.name} assessed. Vital signs reviewed.`,
        patientId: patient.id,
        patientStatus: patient.status,
      };

    case "control-bleeding":
      if (!patient.needsBleedingControl) {
        return {
          success: false,
          score: -8,
          message:
            "There is no major bleeding to control on this patient.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 18,
        message:
          "Bleeding controlled successfully. Patient is more stable.",
        patientId: patient.id,
        patientStatus: "improving",
      };

    case "give-oxygen":
      if (!patient.needsOxygen) {
        return {
          success: false,
          score: -6,
          message:
            "Oxygen was not the priority for this patient.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 16,
        message:
          "Oxygen administered. Patient's breathing is improving.",
        patientId: patient.id,
        patientStatus: "improving",
      };

    case "start-iv":
      if (!patient.needsIv) {
        return {
          success: false,
          score: -5,
          message:
            "IV access is not currently required for this patient.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 15,
        message:
          "IV access established and fluids started.",
        patientId: patient.id,
        patientStatus: "improving",
      };

    case "apply-neck-collar":
      if (!patient.needsNeckCollar) {
        return {
          success: false,
          score: -5,
          message:
            "A neck collar is not required based on the current assessment.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 14,
        message:
          "Neck stabilized. Possible spinal injury protected.",
        patientId: patient.id,
        patientStatus: "stable",
      };

    case "give-pain-relief":
      if (!patient.needsPainRelief) {
        return {
          success: false,
          score: -4,
          message:
            "Pain relief is not currently the priority.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 10,
        message:
          "Pain managed and patient is more comfortable.",
        patientId: patient.id,
        patientStatus: "improving",
      };

    case "stabilize-patient":
      return {
        success: true,
        score: 12,
        message:
          "Patient stabilized. Continue monitoring vital signs.",
        patientId: patient.id,
        patientStatus: "stable",
      };

    case "reassess-patient":
      return {
        success: true,
        score: 8,
        message:
          "Patient reassessed. Vital signs updated.",
        patientId: patient.id,
        patientStatus: patient.status,
      };

    case "call-hospital":
      return {
        success: true,
        score: 10,
        message:
          "Receiving hospital notified and prepared for arrival.",
        patientId: patient.id,
      };

    case "transport-patient":
      if (!patient.stabilized) {
        return {
          success: false,
          score: -12,
          message:
            "Patient is not sufficiently stabilized for transport.",
          patientId: patient.id,
        };
      }

      return {
        success: true,
        score: 20,
        message:
          "Patient transported safely toward the hospital.",
        patientId: patient.id,
        patientStatus: "transported",
      };

    case "manage-scene":
      return {
        success: true,
        score: 8,
        message:
          "Scene secured. Secondary injury risk reduced.",
      };

    default:
      return {
        success: false,
        score: -5,
        message: "Action could not be completed.",
        patientId: patient.id,
      };
  }
}

export function getParamedicResponseTime(
  difficulty: ParamedicDifficulty
): number {
  switch (difficulty) {
    case "easy":
      return 12;
    case "medium":
      return 9;
    case "hard":
      return 7;
    case "extreme":
      return 5;
    default:
      return 8;
  }
}

export function calculateParamedicResult(params: {
  mission: ParamedicMission;
  score: number;
  patientsSaved: number;
  patientsTransported: number;
  mistakes: number;
}): ParamedicResult {
  const {
    mission,
    score,
    patientsSaved,
    patientsTransported,
    mistakes,
  } = params;

  const patientBonus = patientsSaved * 120;
  const transportBonus = patientsTransported * 80;

  const performanceRatio =
    Math.max(0, score) /
    Math.max(1, mission.patients.length * 70);

  let outcome: ParamedicResult["outcome"];

  if (performanceRatio >= 1.15 && mistakes <= 1) {
    outcome = "legendary";
  } else if (performanceRatio >= 0.9 && mistakes <= 2) {
    outcome = "excellent";
  } else if (performanceRatio >= 0.7 && mistakes <= 4) {
    outcome = "good";
  } else if (performanceRatio >= 0.45) {
    outcome = "mixed";
  } else if (performanceRatio >= 0.2) {
    outcome = "poor";
  } else {
    outcome = "critical";
  }

  const multiplier =
    outcome === "legendary"
      ? 1.5
      : outcome === "excellent"
        ? 1.25
        : outcome === "good"
          ? 1
          : outcome === "mixed"
            ? 0.8
            : outcome === "poor"
              ? 0.55
              : 0.3;

  const cash = Math.round(
    Math.max(
      1000,
      (mission.rewardMin +
        (mission.rewardMax - mission.rewardMin) *
          Math.min(1, performanceRatio)) *
        multiplier
    )
  );

  return {
    mission,
    score,
    patientsSaved,
    patientsTransported,
    mistakes,
    cash,
    reputation:
      mission.reputation +
      Math.max(0, Math.round(score / 20)),
    experience:
      mission.experience +
      patientBonus +
      transportBonus,
    outcome,
  };
}

export function getParamedicSuccessMessage(
  outcome: ParamedicResult["outcome"]
): string {
  switch (outcome) {
    case "legendary":
      return "Outstanding response! Abuja's emergency services are talking about your performance.";
    case "excellent":
      return "Excellent work. Your patients received fast and professional care.";
    case "good":
      return "Good response. Most patients were handled effectively.";
    case "mixed":
      return "Mixed response. Some decisions could have been better.";
    case "poor":
      return "The response was below standard. More training is needed.";
    case "critical":
      return "Critical performance failure. Emergency response training is required.";
    default:
      return "Mission completed.";
  }
}
