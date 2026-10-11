// Abuja Life — Mission Gameplay System
// Handles starting, progressing and completing a mission.
// This is local game logic for now.
// Later we can connect it to Supabase for multiplayer persistence.

import {
  PlayerGameState,
  spendEnergy,
  completeJob,
} from "./player";

import { JobMission } from "./jobMissions";

export interface ActiveMission {
  missionId: string;
  progress: number;
  totalSteps: number;
  startedAt: number;
}

export interface MissionResult {
  player: PlayerGameState;
  success: boolean;
  message: string;
}

export function canStartMission(
  player: PlayerGameState,
  mission: JobMission
): boolean {
  return player.energy >= mission.energyCost;
}

export function startMission(
  player: PlayerGameState,
  mission: JobMission
): ActiveMission | null {
  if (!canStartMission(player, mission)) {
    return null;
  }

  return {
    missionId: mission.id,
    progress: 0,
    totalSteps: 4,
    startedAt: Date.now(),
  };
}

export function advanceMission(
  activeMission: ActiveMission
): ActiveMission {
  return {
    ...activeMission,
    progress: Math.min(
      activeMission.totalSteps,
      activeMission.progress + 1
    ),
  };
}

export function isMissionComplete(
  activeMission: ActiveMission
): boolean {
  return (
    activeMission.progress >= activeMission.totalSteps
  );
}

export function finishMission(
  player: PlayerGameState,
  mission: JobMission
): MissionResult {
  if (!canStartMission(player, mission)) {
    return {
      player,
      success: false,
      message: "You do not have enough energy for this mission.",
    };
  }

  const afterEnergy = spendEnergy(
    player,
    mission.energyCost
  );

  const updatedPlayer = completeJob(
    afterEnergy,
    mission.reward,
    mission.reputationGain
  );

  return {
    player: updatedPlayer,
    success: true,
    message: `Mission completed! You earned ₦${mission.reward.toLocaleString()}.`,
  };
}

export function getMissionProgressPercent(
  activeMission: ActiveMission
): number {
  if (activeMission.totalSteps <= 0) {
    return 0;
  }

  return Math.round(
    (activeMission.progress /
      activeMission.totalSteps) *
      100
  );
}