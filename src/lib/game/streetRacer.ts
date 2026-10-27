export type RaceDifficulty = "easy" | "medium" | "hard" | "extreme";

export type RaceAction =
  | "accelerate"
  | "brake"
  | "drift"
  | "boost"
  | "overtake";

export interface StreetRace {
  id: string;
  name: string;
  location: string;
  distance: number;
  difficulty: RaceDifficulty;
  description: string;
  prizeMultiplier: number;
  traffic: number;
  corners: number;
}

export interface RaceResult {
  raceId: string;
  position: number;
  totalRacers: number;
  prize: number;
  reputation: number;
  score: number;
  crashes: number;
  time: number;
  perfectMoves: number;
  message: string;
}

export const STREET_RACES: StreetRace[] = [
  {
    id: "wuse-night-run",
    name: "Wuse Night Run",
    location: "Wuse",
    distance: 3.2,
    difficulty: "easy",
    description:
      "A fast night race through Wuse with moderate traffic and wide corners.",
    prizeMultiplier: 1,
    traffic: 25,
    corners: 4,
  },
  {
    id: "jabi-lake-sprint",
    name: "Jabi Lake Sprint",
    location: "Jabi",
    distance: 4.5,
    difficulty: "medium",
    description:
      "A high-speed sprint around Jabi with sharp turns and aggressive racers.",
    prizeMultiplier: 1.35,
    traffic: 35,
    corners: 6,
  },
  {
    id: "garki-street-clash",
    name: "Garki Street Clash",
    location: "Garki",
    distance: 5.1,
    difficulty: "medium",
    description:
      "A competitive street race packed with traffic, tight corners and risky overtakes.",
    prizeMultiplier: 1.55,
    traffic: 48,
    corners: 7,
  },
  {
    id: "maitama-midnight",
    name: "Maitama Midnight",
    location: "Maitama",
    distance: 6.4,
    difficulty: "hard",
    description:
      "A technical midnight race where precision matters more than raw speed.",
    prizeMultiplier: 1.9,
    traffic: 42,
    corners: 9,
  },
  {
    id: "cbd-danger-run",
    name: "CBD Danger Run",
    location: "Central Business District",
    distance: 7.8,
    difficulty: "extreme",
    description:
      "Abuja's most dangerous underground race. Fast cars, heavy traffic and almost no room for mistakes.",
    prizeMultiplier: 2.5,
    traffic: 65,
    corners: 12,
  },
];

const BASE_PRIZE = 5500;

const DIFFICULTY_MULTIPLIER: Record<RaceDifficulty, number> = {
  easy: 1,
  medium: 1.25,
  hard: 1.6,
  extreme: 2.1,
};

export const RACE_ACTIONS: Array<{
  id: RaceAction;
  label: string;
  description: string;
}> = [
  {
    id: "accelerate",
    label: "ACCELERATE",
    description: "Push the car harder and gain speed.",
  },
  {
    id: "brake",
    label: "BRAKE",
    description: "Slow down and prepare for danger.",
  },
  {
    id: "drift",
    label: "DRIFT",
    description: "Take a corner aggressively and gain style points.",
  },
  {
    id: "boost",
    label: "NITRO BOOST",
    description: "Use nitro for a huge burst of speed.",
  },
  {
    id: "overtake",
    label: "OVERTAKE",
    description: "Attempt a risky move against another racer.",
  },
];

export function getRaceById(id: string) {
  return STREET_RACES.find((race) => race.id === id) ?? STREET_RACES[0];
}

export function getRaceTimeLimit(race: StreetRace) {
  const difficultySeconds: Record<RaceDifficulty, number> = {
    easy: 42,
    medium: 52,
    hard: 62,
    extreme: 74,
  };

  return difficultySeconds[race.difficulty];
}

export function getActionOutcome(
  race: StreetRace,
  action: RaceAction,
  currentSpeed: number,
  currentPosition: number,
  currentCrashes: number
) {
  const roll = Math.random();

  let speedChange = 0;
  let positionChange = 0;
  let crash = false;
  let perfect = false;

  switch (action) {
    case "accelerate":
      speedChange = 8 + Math.floor(Math.random() * 8);

      if (roll < race.traffic / 300) {
        crash = true;
        positionChange = 2;
      } else {
        positionChange = roll < 0.55 ? -1 : 0;
      }
      break;

    case "brake":
      speedChange = -10;

      if (currentSpeed > 75) {
        positionChange = 1;
      } else {
        positionChange = 0;
      }
      break;

    case "drift":
      speedChange = 4;

      if (roll < 0.68) {
        positionChange = -2;
        perfect = true;
      } else if (roll < 0.88) {
        positionChange = -1;
      } else {
        crash = true;
        positionChange = 2;
      }
      break;

    case "boost":
      speedChange = 22;

      if (roll < Math.max(0.08, race.traffic / 500)) {
        crash = true;
        positionChange = 3;
      } else {
        positionChange = -2;
        perfect = true;
      }
      break;

    case "overtake":
      speedChange = 12;

      if (roll < 0.58) {
        positionChange = -2;
        perfect = true;
      } else if (roll < 0.82) {
        positionChange = -1;
      } else {
        crash = true;
        positionChange = 3;
      }
      break;
  }

  const nextSpeed = Math.max(20, Math.min(150, currentSpeed + speedChange));

  return {
    speed: nextSpeed,
    position: Math.max(1, Math.min(8, currentPosition + positionChange)),
    crash,
    crashes: currentCrashes + (crash ? 1 : 0),
    perfect,
  };
}

export function calculateRaceResult(params: {
  race: StreetRace;
  position: number;
  totalRacers: number;
  crashes: number;
  time: number;
  perfectMoves: number;
}) {
  const {
    race,
    position,
    totalRacers,
    crashes,
    time,
    perfectMoves,
  } = params;

  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[race.difficulty];

  const positionMultiplier =
    position === 1
      ? 2.5
      : position === 2
        ? 1.9
        : position === 3
          ? 1.55
          : position === 4
            ? 1.25
            : position === 5
              ? 1
              : 0.75;

  const cleanRaceBonus = crashes === 0 ? 1200 : Math.max(0, 1200 - crashes * 350);

  const perfectBonus = perfectMoves * 350;

  const speedBonus =
    time <= getRaceTimeLimit(race) * 0.75
      ? 1000
      : time <= getRaceTimeLimit(race) * 0.9
        ? 500
        : 0;

  const baseReward =
    BASE_PRIZE *
    race.prizeMultiplier *
    difficultyMultiplier *
    positionMultiplier;

  const prize = Math.max(
    1000,
    Math.round(baseReward + cleanRaceBonus + perfectBonus + speedBonus)
  );

  const reputation =
    Math.max(
      2,
      Math.round(
        (totalRacers - position + 1) * 2 +
          perfectMoves +
          (crashes === 0 ? 5 : 0)
      )
    );

  const score = Math.max(
    0,
    Math.round(
      1000 +
        (totalRacers - position) * 550 +
        perfectMoves * 250 -
        crashes * 500 +
        (position === 1 ? 1500 : 0)
    )
  );

  let message = "You finished the race.";

  if (position === 1) {
    message = "🏆 CHAMPION! Abuja knows your name now.";
  } else if (position === 2) {
    message = "🥈 Almost there! You were one move away from victory.";
  } else if (position === 3) {
    message = "🥉 Podium finish! Your racing reputation is rising.";
  } else if (crashes >= 2) {
    message = "💥 That race was chaotic. Fix the car and try again.";
  } else if (position <= 5) {
    message = "🔥 Solid finish. You are getting faster.";
  }

  return {
    raceId: race.id,
    position,
    totalRacers,
    prize,
    reputation,
    score,
    crashes,
    time,
    perfectMoves,
    message,
  } satisfies RaceResult;
}
