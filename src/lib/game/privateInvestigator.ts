// Abuja Life — Private Investigator Job
// Full investigation gameplay engine.

export type InvestigationDifficulty =
  | "easy"
  | "medium"
  | "hard"
  | "elite";

export type SuspectRelationship =
  | "guest"
  | "staff"
  | "security"
  | "vendor"
  | "stranger";

export type EvidenceType =
  | "cctv"
  | "phone"
  | "physical"
  | "document"
  | "testimony"
  | "digital";

export type InvestigationRank = "S" | "A" | "B" | "C" | "F";

export interface InvestigationEvidence {
  id: string;
  name: string;
  description: string;
  type: EvidenceType;
  strength: number;
  points: number;
  location: string;
}

export interface InterrogationQuestion {
  id: string;
  text: string;
  targetSuspectId: string;
  pressure: number;
  evidenceRequired?: string;
  revealsEvidence?: string;
  points: number;
}

export interface InvestigationSuspect {
  id: string;
  name: string;
  occupation: string;
  relationship: SuspectRelationship;
  statement: string;
  suspiciousLevel: number;
  alibi: string;
  tellsTruth: boolean;
  hiddenClue?: string;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: InvestigationDifficulty;
  location: string;
  reward: number;
  maxReward: number;
  reputation: number;
  experience: number;
  timeLimit: number;
  suspects: InvestigationSuspect[];
  evidence: InvestigationEvidence[];
  questions: InterrogationQuestion[];
  correctSuspectId: string;
  requiredEvidence: string[];
  briefing: string[];
}

export interface InvestigationResult {
  score: number;
  rank: InvestigationRank;
  reward: number;
  reputation: number;
  experience: number;
  correct: boolean;
  evidenceFound: number;
  questionsAsked: number;
  timeRemaining: number;
  message: string;
}

export const INVESTIGATION_CASES: InvestigationCase[] = [
  {
    id: "missing-jabi-necklace",
    caseNumber: "001",
    title: "The Missing Jabi Necklace",
    subtitle: "A luxury necklace disappeared during a private party.",
    description:
      "A valuable diamond necklace vanished during an exclusive party in Jabi. Five people had access to the property. Your job is to investigate the scene, collect evidence and identify the thief.",
    difficulty: "medium",
    location: "Jabi",
    reward: 12500,
    maxReward: 24000,
    reputation: 10,
    experience: 85,
    timeLimit: 180,

    briefing: [
      "The necklace was last seen at approximately 10:40 PM.",
      "The owner claims the necklace was inside a locked bedroom.",
      "The bedroom keycard was reported missing.",
      "CCTV cameras were partially disabled for 12 minutes.",
      "Someone left through the service corridor.",
    ],

    suspects: [
      {
        id: "photographer",
        name: "Daniel Okoro",
        occupation: "Event Photographer",
        relationship: "vendor",
        statement:
          "I was taking pictures around the garden. I never entered the bedroom.",
        suspiciousLevel: 42,
        alibi: "Garden camera footage",
        tellsTruth: true,
      },
      {
        id: "manager",
        name: "Grace Bello",
        occupation: "House Manager",
        relationship: "staff",
        statement:
          "I was preparing drinks for the guests. I didn't touch the necklace.",
        suspiciousLevel: 76,
        alibi: "Kitchen staff",
        tellsTruth: false,
        hiddenClue: "missing-keycard",
      },
      {
        id: "guest",
        name: "Victor Adeyemi",
        occupation: "Business Executive",
        relationship: "guest",
        statement:
          "I stayed in the lounge almost the entire night.",
        suspiciousLevel: 64,
        alibi: "Two guests",
        tellsTruth: false,
      },
      {
        id: "security",
        name: "Musa Ibrahim",
        occupation: "Security Guard",
        relationship: "security",
        statement:
          "I was monitoring the entrance and didn't leave my post.",
        suspiciousLevel: 55,
        alibi: "Entrance CCTV",
        tellsTruth: true,
      },
      {
        id: "rider",
        name: "Emeka James",
        occupation: "Delivery Rider",
        relationship: "stranger",
        statement:
          "I delivered a package and left immediately.",
        suspiciousLevel: 69,
        alibi: "Delivery record",
        tellsTruth: false,
        hiddenClue: "service-footprint",
      },
    ],

    evidence: [
      {
        id: "cctv-gap",
        name: "CCTV Time Gap",
        description:
          "The bedroom camera was disabled between 10:43 PM and 10:55 PM.",
        type: "cctv",
        strength: 7,
        points: 15,
        location: "Security Room",
      },
      {
        id: "service-footprint",
        name: "Service Corridor Footprint",
        description:
          "A fresh shoe print was found near the rear service entrance.",
        type: "physical",
        strength: 6,
        points: 15,
        location: "Service Corridor",
      },
      {
        id: "missing-keycard",
        name: "Missing Keycard",
        description:
          "The bedroom access card disappeared shortly before the CCTV outage.",
        type: "physical",
        strength: 9,
        points: 25,
        location: "Security Desk",
      },
      {
        id: "phone-location",
        name: "Phone Location",
        description:
          "A phone briefly connected to Wi-Fi near the bedroom during the theft window.",
        type: "digital",
        strength: 8,
        points: 20,
        location: "Network Records",
      },
      {
        id: "guest-message",
        name: "Suspicious Message",
        description:
          "A message mentions meeting someone near the service corridor.",
        type: "phone",
        strength: 7,
        points: 15,
        location: "Recovered Phone",
      },
      {
        id: "staff-testimony",
        name: "Staff Testimony",
        description:
          "A kitchen worker remembers seeing Grace leave the kitchen unexpectedly.",
        type: "testimony",
        strength: 8,
        points: 20,
        location: "Kitchen",
      },
    ],

    questions: [
      {
        id: "q-grace-1",
        text: "Why did you leave the kitchen at 10:45 PM?",
        targetSuspectId: "manager",
        pressure: 4,
        revealsEvidence: "staff-testimony",
        points: 10,
      },
      {
        id: "q-grace-2",
        text: "Who had access to the bedroom keycard?",
        targetSuspectId: "manager",
        pressure: 7,
        evidenceRequired: "missing-keycard",
        revealsEvidence: "cctv-gap",
        points: 20,
      },
      {
        id: "q-victor-1",
        text: "Why did your phone connect near the bedroom?",
        targetSuspectId: "guest",
        pressure: 6,
        revealsEvidence: "phone-location",
        points: 15,
      },
      {
        id: "q-musa-1",
        text: "Did anyone ask you to disable the camera?",
        targetSuspectId: "security",
        pressure: 8,
        revealsEvidence: "cctv-gap",
        points: 20,
      },
      {
        id: "q-emeka-1",
        text: "Why was your footprint found in the service corridor?",
        targetSuspectId: "rider",
        pressure: 8,
        revealsEvidence: "service-footprint",
        points: 15,
      },
      {
        id: "q-daniel-1",
        text: "Did you photograph the bedroom?",
        targetSuspectId: "photographer",
        pressure: 3,
        points: 8,
      },
    ],

    correctSuspectId: "manager",

    requiredEvidence: [
      "missing-keycard",
      "cctv-gap",
      "staff-testimony",
    ],
  },

  {
    id: "wuse-blackout",
    caseNumber: "002",
    title: "The Wuse Blackout",
    subtitle: "A mysterious power failure hides a valuable theft.",
    description:
      "During a crowded evening at a Wuse business center, the building suddenly lost power. When the lights returned, an expensive laptop containing sensitive business information was gone.",
    difficulty: "hard",
    location: "Wuse",
    reward: 18000,
    maxReward: 32000,
    reputation: 15,
    experience: 120,
    timeLimit: 210,

    briefing: [
      "The blackout lasted exactly seven minutes.",
      "Only one office was entered.",
      "The backup generator was manually disabled.",
      "A staff access card was used during the blackout.",
      "The stolen laptop was never connected to the building Wi-Fi afterward.",
    ],

    suspects: [
      {
        id: "technician",
        name: "Samuel Danjuma",
        occupation: "Technician",
        relationship: "vendor",
        statement:
          "I was checking the generator room when the lights went out.",
        suspiciousLevel: 82,
        alibi: "Generator maintenance log",
        tellsTruth: false,
        hiddenClue: "generator-log",
      },
      {
        id: "manager",
        name: "Amaka Yusuf",
        occupation: "Office Manager",
        relationship: "staff",
        statement:
          "I stayed at reception the entire time.",
        suspiciousLevel: 48,
        alibi: "Reception camera",
        tellsTruth: true,
      },
      {
        id: "intern",
        name: "Peter Chukwu",
        occupation: "Intern",
        relationship: "staff",
        statement:
          "I was downstairs when everything went dark.",
        suspiciousLevel: 57,
        alibi: "Elevator record",
        tellsTruth: false,
      },
      {
        id: "security",
        name: "Ibrahim Sani",
        occupation: "Security Officer",
        relationship: "security",
        statement:
          "Nobody entered the office corridor.",
        suspiciousLevel: 71,
        alibi: "Security desk",
        tellsTruth: false,
      },
    ],

    evidence: [
      {
        id: "generator-log",
        name: "Generator Log",
        description:
          "The generator was manually disabled from the control panel.",
        type: "document",
        strength: 9,
        points: 25,
        location: "Generator Room",
      },
      {
        id: "access-record",
        name: "Access Record",
        description:
          "A staff access card opened the office during the blackout.",
        type: "digital",
        strength: 9,
        points: 25,
        location: "Security System",
      },
      {
        id: "shoe-print",
        name: "Dusty Shoe Print",
        description:
          "A distinctive work boot print was found near the office.",
        type: "physical",
        strength: 7,
        points: 15,
        location: "Office Corridor",
      },
      {
        id: "backup-camera",
        name: "Backup Camera Frame",
        description:
          "A blurry frame shows someone carrying a laptop toward the generator room.",
        type: "cctv",
        strength: 8,
        points: 20,
        location: "Emergency Camera",
      },
    ],

    questions: [
      {
        id: "q-tech-1",
        text: "Who gave you permission to access the generator?",
        targetSuspectId: "technician",
        pressure: 6,
        revealsEvidence: "generator-log",
        points: 15,
      },
      {
        id: "q-tech-2",
        text: "Why were your boots covered in office dust?",
        targetSuspectId: "technician",
        pressure: 9,
        evidenceRequired: "shoe-print",
        revealsEvidence: "backup-camera",
        points: 25,
      },
      {
        id: "q-security-1",
        text: "Why did the access system record an entry?",
        targetSuspectId: "security",
        pressure: 8,
        revealsEvidence: "access-record",
        points: 20,
      },
      {
        id: "q-intern-1",
        text: "Why does the elevator record contradict you?",
        targetSuspectId: "intern",
        pressure: 6,
        points: 10,
      },
    ],

    correctSuspectId: "technician",

    requiredEvidence: [
      "generator-log",
      "access-record",
      "shoe-print",
    ],
  },
];

export function getInvestigationCase(
  caseId: string
): InvestigationCase | undefined {
  return INVESTIGATION_CASES.find((item) => item.id === caseId);
}

export function getDifficultyLabel(
  difficulty: InvestigationDifficulty
): string {
  switch (difficulty) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "elite":
      return "Elite";
  }
}

export function calculateInvestigationRank(
  score: number
): InvestigationRank {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "F";
}

export function calculateInvestigationResult(
  investigationCase: InvestigationCase,
  selectedSuspectId: string,
  foundEvidenceIds: string[],
  askedQuestionIds: string[],
  timeRemaining: number
): InvestigationResult {
  const uniqueEvidence = Array.from(new Set(foundEvidenceIds));
  const uniqueQuestions = Array.from(new Set(askedQuestionIds));

  const evidencePoints = investigationCase.evidence
    .filter((evidence) => uniqueEvidence.includes(evidence.id))
    .reduce((total, evidence) => total + evidence.points, 0);

  const requiredFound = investigationCase.requiredEvidence.filter(
    (id) => uniqueEvidence.includes(id)
  ).length;

  const requiredBonus =
    investigationCase.requiredEvidence.length > 0
      ? (requiredFound / investigationCase.requiredEvidence.length) * 30
      : 0;

  const questionPoints = investigationCase.questions
    .filter((question) => uniqueQuestions.includes(question.id))
    .reduce((total, question) => total + question.points, 0);

  const questionScore = Math.min(20, questionPoints / 2);

  const timeScore = Math.min(
    20,
    Math.max(0, timeRemaining / investigationCase.timeLimit) * 20
  );

  const correct = selectedSuspectId === investigationCase.correctSuspectId;

  const suspectScore = correct ? 30 : 0;

  const rawScore =
    evidencePoints / 2 +
    requiredBonus +
    questionScore +
    timeScore +
    suspectScore;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const rank = calculateInvestigationRank(score);

  const multiplier =
    rank === "S"
      ? 2
      : rank === "A"
        ? 1.65
        : rank === "B"
          ? 1.35
          : rank === "C"
            ? 1
            : 0.25;

  const reward = correct
    ? Math.round(investigationCase.reward * multiplier)
    : Math.round(investigationCase.reward * 0.25);

  const reputation = correct
    ? Math.max(
        1,
        Math.round(
          investigationCase.reputation *
            (rank === "S"
              ? 1.75
              : rank === "A"
                ? 1.4
                : rank === "B"
                  ? 1
                  : 0.7)
        )
      )
    : -Math.max(1, Math.round(investigationCase.reputation / 2));

  const experience = correct
    ? Math.round(investigationCase.experience * multiplier)
    : Math.round(investigationCase.experience * 0.2);

  let message = "";

  if (!correct) {
    message =
      "Case failed. Your accusation was incorrect. The real investigation continues.";
  } else if (rank === "S") {
    message =
      "Outstanding detective work! You solved the case with exceptional precision.";
  } else if (rank === "A") {
    message =
      "Excellent investigation. Your evidence chain was strong and convincing.";
  } else if (rank === "B") {
    message =
      "Good work. You solved the case, but there was room for a cleaner investigation.";
  } else {
    message =
      "Case solved, but your investigation was weak. Better evidence would improve your score.";
  }

  return {
    score,
    rank,
    reward: Math.min(reward, investigationCase.maxReward),
    reputation,
    experience,
    correct,
    evidenceFound: uniqueEvidence.length,
    questionsAsked: uniqueQuestions.length,
    timeRemaining,
    message,
  };
}
