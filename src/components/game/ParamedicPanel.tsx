U"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ParamedicAction,
  ParamedicMission,
  ParamedicPatient,
  ParamedicResult,
  calculateParamedicResult,
  getAllParamedicMissions,
  getParamedicActionOutcome,
  getParamedicResponseTime,
  getParamedicSuccessMessage,
} from "@/lib/game/paramedic";
import {
  PlayerGameState,
  savePlayerState,
} from "@/lib/game/player";

type Screen =
  | "base"
  | "missions"
  | "briefing"
  | "response"
  | "result";

interface ParamedicPanelProps {
  player: PlayerGameState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerGameState>>;
}

const ENERGY_COST = 22;

const ACTIONS: {
  id: ParamedicAction;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "assess-patient",
    label: "Assess Patient",
    icon: "🩺",
    description: "Check vital signs and condition.",
  },
  {
    id: "control-bleeding",
    label: "Control Bleeding",
    icon: "🩸",
    description: "Apply pressure and control major bleeding.",
  },
  {
    id: "stabilize-patient",
    label: "Stabilize",
    icon: "❤️",
    description: "Stabilize the patient before transport.",
  },
  {
    id: "give-oxygen",
    label: "Give Oxygen",
    icon: "🫁",
    description: "Support patients with low oxygen.",
  },
  {
    id: "apply-neck-collar",
    label: "Neck Collar",
    icon: "🦴",
    description: "Protect a possible spinal injury.",
  },
  {
    id: "give-pain-relief",
    label: "Pain Relief",
    icon: "💊",
    description: "Manage severe pain where appropriate.",
  },
  {
    id: "start-iv",
    label: "Start IV",
    icon: "💉",
    description: "Establish IV access where required.",
  },
  {
    id: "reassess-patient",
    label: "Reassess",
    icon: "🔄",
    description: "Check whether treatment is working.",
  },
  {
    id: "call-hospital",
    label: "Call Hospital",
    icon: "📞",
    description: "Prepare the receiving hospital.",
  },
  {
    id: "transport-patient",
    label: "Transport",
    icon: "🚑",
    description: "Move a stabilized patient to hospital.",
  },
  {
    id: "manage-scene",
    label: "Manage Scene",
    icon: "🚧",
    description: "Reduce danger around the emergency.",
  },
];

function conditionClass(condition: ParamedicPatient["condition"]) {
  switch (condition) {
    case "critical":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    case "serious":
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
    case "moderate":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  }
}

function statusClass(status: ParamedicPatient["status"]) {
  switch (status) {
    case "critical":
      return "text-red-400";
    case "unstable":
      return "text-amber-400";
    case "improving":
      return "text-yellow-300";
    case "stable":
      return "text-emerald-400";
    case "transported":
      return "text-sky-400";
    default:
      return "text-white/60";
  }
}

export default function ParamedicPanel({
  player,
  setPlayer,
}: ParamedicPanelProps) {
  const missions = useMemo(
    () => getAllParamedicMissions(),
    []
  );

  const [screen, setScreen] = useState<Screen>("base");
  const [selectedMission, setSelectedMission] =
    useState<ParamedicMission | null>(null);

  const [patients, setPatients] = useState<
    ParamedicPatient[]
  >([]);

  const [selectedPatientId, setSelectedPatientId] =
    useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [patientsSaved, setPatientsSaved] = useState(0);
  const [patientsTransported, setPatientsTransported] =
    useState(0);

  const [timeLeft, setTimeLeft] = useState(0);
  const [responseTimer, setResponseTimer] = useState(0);

  const [activityLog, setActivityLog] = useState<string[]>(
    []
  );

  const [lastAction, setLastAction] = useState(
    "Select a patient and assess their condition."
  );

  const [result, setResult] =
    useState<ParamedicResult | null>(null);

  const selectedPatient =
    patients.find(
      (patient) => patient.id === selectedPatientId
    ) ?? null;

  function addLog(message: string) {
    setActivityLog((current) => [
      message,
      ...current.slice(0, 5),
    ]);
  }

  function startMission(mission: ParamedicMission) {
    if (player.energy < ENERGY_COST) {
      setLastAction(
        `You need ${ENERGY_COST} energy to respond to an emergency.`
      );
      return;
    }

    const freshPatients = mission.patients.map((patient) => ({
      ...patient,
    }));

    setSelectedMission({
      ...mission,
      patients: freshPatients,
    });

    setPatients(freshPatients);
    setSelectedPatientId(
      freshPatients[0]?.id ?? null
    );

    setScore(0);
    setMistakes(0);
    setPatientsSaved(0);
    setPatientsTransported(0);
    setTimeLeft(mission.timeLimit);
    setResponseTimer(0);
    setActivityLog([]);
    setResult(null);
    setLastAction(
      "Briefing complete. Choose your first patient."
    );
    setScreen("briefing");
  }

  function beginResponse() {
    if (!selectedMission) return;

    setTimeLeft(selectedMission.timeLimit);
    setResponseTimer(
      getParamedicResponseTime(
        selectedMission.difficulty
      )
    );

    addLog(
      `🚑 Responding to ${selectedMission.location}.`
    );

    setScreen("response");
  }

  function updatePatient(
    patientId: string,
    updates: Partial<ParamedicPatient>
  ) {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === patientId
          ? { ...patient, ...updates }
          : patient
      )
    );
  }

  function handleAction(action: ParamedicAction) {
    if (!selectedPatient || !selectedMission) {
      setLastAction(
        "Select a patient before choosing an action."
      );
      return;
    }

    if (selectedPatient.transported) {
      setLastAction(
        "This patient has already been transported."
      );
      return;
    }

    const actionResult = getParamedicActionOutcome(
      action,
      selectedPatient
    );

    setScore((current) =>
      Math.max(0, current + actionResult.score)
    );

    if (!actionResult.success) {
      setMistakes((current) => current + 1);
    }

    setLastAction(actionResult.message);
    addLog(
      `${actionResult.success ? "✅" : "⚠️"} ${
        actionResult.message
      }`
    );

    if (action === "assess-patient") {
      updatePatient(selectedPatient.id, {
        status:
          selectedPatient.condition === "critical"
            ? "critical"
            : selectedPatient.status,
      });
      return;
    }

    if (action === "control-bleeding") {
      if (actionResult.success) {
        updatePatient(selectedPatient.id, {
          needsBleedingControl: false,
          status: "improving",
        });
      }
      return;
    }

    if (action === "give-oxygen") {
      if (actionResult.success) {
        updatePatient(selectedPatient.id, {
          needsOxygen: false,
          oxygen: Math.min(
            98,
            selectedPatient.oxygen + 7
          ),
          status: "improving",
        });
      }
      return;
    }

    if (action === "start-iv") {
      if (actionResult.success) {
        updatePatient(selectedPatient.id, {
          needsIv: false,
          status: "improving",
        });
      }
      return;
    }

    if (action === "apply-neck-collar") {
      if (actionResult.success) {
        updatePatient(selectedPatient.id, {
          needsNeckCollar: false,
          status: "stable",
        });
      }
      return;
    }

    if (action === "give-pain-relief") {
      if (actionResult.success) {
        updatePatient(selectedPatient.id, {
          needsPainRelief: false,
          status: "improving",
        });
      }
      return;
    }

    if (action === "stabilize-patient") {
      const readyToStabilize =
        !selectedPatient.needsBleedingControl &&
        !selectedPatient.needsOxygen &&
        !selectedPatient.needsIv &&
        !selectedPatient.needsNeckCollar;

      if (readyToStabilize) {
        updatePatient(selectedPatient.id, {
          stabilized: true,
          status: "stable",
        });

        setPatientsSaved((current) => {
          const alreadySaved =
            selectedPatient.stabilized;

          return alreadySaved
            ? current
            : current + 1;
        });
      } else {
        setMistakes((current) => current + 1);

        setLastAction(
          "The patient still needs critical treatment before stabilization."
        );

        addLog(
          "⚠️ Stabilization attempted too early."
        );
      }

      return;
    }

    if (action === "reassess-patient") {
      const improvement =
        selectedPatient.stabilized ||
        selectedPatient.status === "improving";

      if (improvement) {
        updatePatient(selectedPatient.id, {
          status: "stable",
        });
      }

      return;
    }

    if (action === "call-hospital") {
      addLog(
        `📞 Hospital notified about ${selectedPatient.name}.`
      );
      return;
    }

    if (action === "transport-patient") {
      if (
        actionResult.success &&
        selectedPatient.stabilized
      ) {
        updatePatient(selectedPatient.id, {
          transported: true,
          status: "transported",
        });

        setPatientsTransported(
          (current) => current + 1
        );

        setLastAction(
          `${selectedPatient.name} is being transported to hospital.`
        );

        addLog(
          `🚑 ${selectedPatient.name} transported safely.`
        );
      } else {
        setMistakes((current) => current + 1);

        setLastAction(
          "You cannot safely transport this patient yet."
        );
      }

      return;
    }

    if (action === "manage-scene") {
      addLog(
        "🚧 Scene secured. Secondary accident risk reduced."
      );
    }
  }

  function finishMission() {
    if (!selectedMission) return;

    const currentPatients = patients;

    const saved = currentPatients.filter(
      (patient) =>
        patient.stabilized ||
        patient.transported
    ).length;

    const transported = currentPatients.filter(
      (patient) => patient.transported
    ).length;

    const finalResult = calculateParamedicResult({
      mission: selectedMission,
      score,
      patientsSaved: saved,
      patientsTransported: transported,
      mistakes,
    });

    setPatientsSaved(saved);
    setPatientsTransported(transported);
    setResult(finalResult);
    setScreen("result");
  }

  function collectReward() {
    if (!result) return;

    const updatedPlayer: PlayerGameState = {
      ...player,
      cash: player.cash + result.cash,
      energy: Math.max(
        0,
        player.energy - ENERGY_COST
      ),
      reputation:
        player.reputation + result.reputation,
      currentJobId: "paramedic",
      jobExperience:
        player.jobExperience + result.experience,
    };

    setPlayer(updatedPlayer);
    savePlayerState(updatedPlayer);

    setLastAction(
      `Mission complete! You earned ₦${result.cash.toLocaleString()}.`
    );

    setScreen("base");
    setSelectedMission(null);
    setPatients([]);
    setResult(null);
  }

  useEffect(() => {
    if (screen !== "response") return;

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);

          setLastAction(
            "⏰ Time expired. Emergency response ended."
          );

          window.setTimeout(() => {
            finishMission();
          }, 150);

          return 0;
        }

        return current - 1;
      });

      setResponseTimer((current) => {
        if (current <= 1) {
          return selectedMission
            ? getParamedicResponseTime(
                selectedMission.difficulty
              )
            : 8;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [screen, selectedMission]);

  function formatTime(seconds: number) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remaining = safeSeconds % 60;

    return `${minutes}:${remaining
      .toString()
      .padStart(2, "0")}`;
  }

  if (screen === "base") {
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950 via-slate-950 to-slate-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-red-400">
                Abuja Emergency Services
              </p>

              <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                🚑 Paramedic
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Answer emergency calls, reach accident
                scenes, assess patients, make treatment
                decisions and get people safely to hospital.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                Current Energy
              </p>

              <p className="mt-1 text-3xl font-black">
                ⚡ {player.energy}/{player.maxEnergy}
              </p>

              <p className="mt-1 text-xs text-white/40">
                Mission cost: {ENERGY_COST} energy
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Cash
            </p>
            <p className="mt-2 text-2xl font-black">
              ₦{player.cash.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Reputation
            </p>
            <p className="mt-2 text-2xl font-black">
              ⭐ {player.reputation}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Paramedic XP
            </p>
            <p className="mt-2 text-2xl font-black">
              🏅 {player.jobExperience}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">
                🚨 Emergency Dispatch
              </h2>

              <p className="mt-1 text-sm text-white/50">
                New incidents are waiting around Abuja.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setScreen("missions")}
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-black transition hover:bg-red-500 active:scale-[0.98]"
            >
              View Emergency Calls →
            </button>
          </div>
        </section>

        {lastAction && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
            {lastAction}
          </div>
        )}
      </div>
    );
  }

  if (screen === "missions") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-red-400">
              Dispatch Center
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Emergency Calls
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setScreen("base")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/5"
          >
            ← Back
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {missions.map((mission) => (
            <button
              key={mission.id}
              type="button"
              onClick={() => startMission(mission)}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-red-500/40 hover:bg-red-500/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-4xl">
                  {mission.type === "road-accident"
                    ? "🚗"
                    : mission.type === "medical-emergency"
                      ? "🏥"
                      : mission.type === "building-collapse"
                        ? "🏗️"
                        : mission.type ===
                            "mass-casualty"
                          ? "🚨"
                          : "⭐"}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${conditionClass(
                    mission.difficulty === "extreme"
                      ? "critical"
                      : mission.difficulty === "hard"
                        ? "serious"
                        : mission.difficulty ===
                            "medium"
                          ? "moderate"
                          : "stable"
                  )}`}
                >
                  {mission.difficulty}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black">
                {mission.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/50">
                {mission.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-black/20 p-3">
                  📍 {mission.location}
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  ⏱️ {formatTime(mission.timeLimit)}
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  👥 {mission.patients.length} patients
                </div>

                <div className="rounded-xl bg-black/20 p-3">
                  💰 ₦
                  {mission.rewardMin.toLocaleString()}+
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs font-bold text-white/40">
                  +{mission.reputation} reputation
                </span>

                <span className="font-black text-red-400 transition group-hover:text-red-300">
                  Respond →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "briefing" && selectedMission) {
    return (
      <div className="space-y-6">
        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
            Emergency Briefing
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {selectedMission.title}
          </h1>

          <p className="mt-2 text-white/50">
            📍 {selectedMission.location}
          </p>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">
            {selectedMission.description}
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">
              TIME LIMIT
            </p>
            <p className="mt-2 text-2xl font-black">
              ⏱️ {formatTime(selectedMission.timeLimit)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">
              CASUALTIES
            </p>
            <p className="mt-2 text-2xl font-black">
              👥 {selectedMission.patients.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs text-white/40">
              POSSIBLE PAY
            </p>
            <p className="mt-2 text-2xl font-black">
              ₦{selectedMission.rewardMin.toLocaleString()}–
              {selectedMission.rewardMax.toLocaleString()}
            </p>
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-black">
            Patient Briefing
          </h2>

          <div className="grid gap-4 lg:grid-cols-3">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black">
                    {patient.name}
                  </h3>

                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${conditionClass(
                      patient.condition
                    )}`}
                  >
                    {patient.condition}
                  </span>
                </div>

                <p className="mt-3 text-sm text-white/50">
                  {patient.gender}, {patient.age} years
                </p>

                <p className="mt-3 text-sm leading-6 text-white/60">
                  {patient.diagnosis}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setScreen("missions")}
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-white/60 hover:bg-white/5"
          >
            ← Change Call
          </button>

          <button
            type="button"
            onClick={beginResponse}
            className="rounded-xl bg-red-600 px-7 py-3 font-black hover:bg-red-500"
          >
            🚑 Respond to Emergency
          </button>
        </div>
      </div>
    );
  }

  if (screen === "response" && selectedMission) {
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-400">
                🚨 LIVE EMERGENCY
              </p>

              <h1 className="mt-1 text-2xl font-black">
                {selectedMission.title}
              </h1>

              <p className="text-sm text-white/50">
                📍 {selectedMission.location}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase text-white/40">
                  Time
                </p>
                <p className="text-xl font-black text-red-300">
                  {formatTime(timeLeft)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase text-white/40">
                  Score
                </p>
                <p className="text-xl font-black">
                  {score}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase text-white/40">
                  Mistakes
                </p>
                <p className="text-xl font-black text-amber-300">
                  {mistakes}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() =>
                    setSelectedPatientId(patient.id)
                  }
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedPatientId === patient.id
                      ? "border-red-500/70 bg-red-500/[0.08]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black">
                        {patient.name}
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {patient.gender} • {patient.age} yrs
                      </p>
                    </div>

                    <span
                      className={`text-xs font-black uppercase ${statusClass(
                        patient.status
                      )}`}
                    >
                      {patient.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[9px] text-white/30">
                        HR
                      </p>
                      <p className="font-black">
                        ❤️ {patient.heartRate}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[9px] text-white/30">
                        BP
                      </p>
                      <p className="text-xs font-black">
                        🩸 {patient.bloodPressure}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-2 text-center">
                      <p className="text-[9px] text-white/30">
                        SpO₂
                      </p>
                      <p className="font-black">
                        🫁 {patient.oxygen}%
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-white/50">
                    {patient.diagnosis}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {patient.needsBleedingControl && (
                      <span className="rounded-full bg-red-500/10 px-2 py-1 text-[9px] font-bold text-red-300">
                        Bleeding
                      </span>
                    )}

                    {patient.needsOxygen && (
                      <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[9px] font-bold text-sky-300">
                        Oxygen
                      </span>
                    )}

                    {patient.needsIv && (
                      <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[9px] font-bold text-purple-300">
                        IV
                      </span>
                    )}

                    {patient.needsNeckCollar && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-300">
                        Spine
                      </span>
                    )}

                    {patient.transported && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-300">
                        Transported
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedPatient && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/40">
                      Selected Patient
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {selectedPatient.name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {lastAction}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 px-4 py-3 text-center">
                    <p className="text-[10px] uppercase text-white/30">
                      Response Window
                    </p>
                    <p className="font-black text-amber-300">
                      {responseTimer}s
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {ACTIONS.map((action) => {
                    const disabled =
                      action.id ===
                        "transport-patient" &&
                      selectedPatient.transported;

                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          handleAction(action.id)
                        }
                        className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-red-500/40 hover:bg-red-500/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="text-2xl">
                          {action.icon}
                        </div>

                        <p className="mt-2 text-sm font-black">
                          {action.label}
                        </p>

                        <p className="mt-1 text-[11px] leading-4 text-white/40">
                          {action.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-black">
                🚑 Mission Progress
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">
                    Patients stabilized
                  </span>
                  <span className="font-black">
                    {patients.filter(
                      (p) => p.stabilized
                    ).length}
                    /{patients.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Transported
                  </span>
                  <span className="font-black">
                    {patientsTransported}/
                    {patients.length}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">
                    Mistakes
                  </span>
                  <span className="font-black text-amber-300">
                    {mistakes}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-black">
                📋 Mission Goals
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <p>
                  {patients.some((p) => p.stabilized)
                    ? "☑️"
                    : "⬜"}{" "}
                  Stabilize patients
                </p>

                <p>
                  {patientsTransported > 0
                    ? "☑️"
                    : "⬜"}{" "}
                  Transport patients
                </p>

                <p>
                  {mistakes <= 2 ? "☑️" : "⚠️"}{" "}
                  Maintain good scene management
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <h3 className="font-black">
                📡 Activity Log
              </h3>

              <div className="mt-3 space-y-2">
                {activityLog.length === 0 ? (
                  <p className="text-xs text-white/30">
                    No activity yet.
                  </p>
                ) : (
                  activityLog.map((entry, index) => (
                    <p
                      key={`${entry}-${index}`}
                      className="rounded-xl bg-white/[0.03] p-2 text-xs leading-5 text-white/50"
                    >
                      {entry}
                    </p>
                  ))
                )}
              </div>
            </section>

            <button
              type="button"
              onClick={finishMission}
              className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-black text-red-300 transition hover:bg-red-500/20"
            >
              End Mission
            </button>
          </aside>
        </div>
      </div>
    );
  }

  if (screen === "result" && result) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 p-8 text-center">
          <div className="text-6xl">
            {result.outcome === "legendary"
              ? "🏆"
              : result.outcome === "excellent"
                ? "🌟"
                : result.outcome === "good"
                  ? "🚑"
                  : result.outcome === "mixed"
                    ? "⚠️"
                    : "🩺"}
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
            Emergency Response Complete
          </p>

          <h1 className="mt-2 text-4xl font-black capitalize">
            {result.outcome}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/50">
            {getParamedicSuccessMessage(
              result.outcome
            )}
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-xs text-white/40">
              SCORE
            </p>
            <p className="mt-2 text-3xl font-black">
              {result.score}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-xs text-white/40">
              SAVED
            </p>
            <p className="mt-2 text-3xl font-black">
              ❤️ {result.patientsSaved}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-xs text-white/40">
              TRANSPORTED
            </p>
            <p className="mt-2 text-3xl font-black">
              🚑 {result.patientsTransported}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-xs text-white/40">
              MISTAKES
            </p>
            <p className="mt-2 text-3xl font-black">
              {result.mistakes}
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-white/40">
                Earnings
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-300">
                ₦{result.cash.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-white/40">
                Reputation
              </p>
              <p className="mt-1 text-2xl font-black">
                ⭐ +{result.reputation}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase text-white/40">
                Experience
              </p>
              <p className="mt-1 text-2xl font-black">
                🏅 +{result.experience} XP
              </p>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={collectReward}
          className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-black transition hover:bg-emerald-500 active:scale-[0.99]"
        >
          💰 Collect Earnings & Return to Base
        </button>
      </div>
    );
  }

  return null;
}
