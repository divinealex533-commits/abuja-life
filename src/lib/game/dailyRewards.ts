export interface DailyReward {
  day: number;
  cash: number;
  energy: number;
  reputation: number;
  experience: number;
  label: string;
}

export interface DailyRewardState {
  currentDay: number;
  claimedToday: boolean;
  lastClaimDate: string | null;
  totalClaims: number;
  streak: number;
}

const STORAGE_KEY = "abujaLifeDailyRewards";

export const DAILY_REWARDS: DailyReward[] = [
  {
    day: 1,
    cash: 1000,
    energy: 5,
    reputation: 1,
    experience: 20,
    label: "Welcome Back",
  },
  {
    day: 2,
    cash: 1500,
    energy: 5,
    reputation: 1,
    experience: 25,
    label: "City Regular",
  },
  {
    day: 3,
    cash: 2000,
    energy: 10,
    reputation: 2,
    experience: 30,
    label: "Abuja Explorer",
  },
  {
    day: 4,
    cash: 2500,
    energy: 10,
    reputation: 2,
    experience: 35,
    label: "Getting Known",
  },
  {
    day: 5,
    cash: 3500,
    energy: 15,
    reputation: 3,
    experience: 45,
    label: "City Player",
  },
  {
    day: 6,
    cash: 5000,
    energy: 15,
    reputation: 4,
    experience: 60,
    label: "Abuja Star",
  },
  {
    day: 7,
    cash: 10000,
    energy: 25,
    reputation: 5,
    experience: 100,
    label: "Weekly Champion",
  },
];

function getToday(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const DEFAULT_DAILY_REWARD_STATE: DailyRewardState = {
  currentDay: 1,
  claimedToday: false,
  lastClaimDate: null,
  totalClaims: 0,
  streak: 0,
};

export function loadDailyRewardState(): DailyRewardState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_DAILY_REWARD_STATE };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return { ...DEFAULT_DAILY_REWARD_STATE };
    }

    const parsed = JSON.parse(stored) as Partial<DailyRewardState>;

    return {
      currentDay:
        typeof parsed.currentDay === "number"
          ? Math.min(Math.max(parsed.currentDay, 1), 7)
          : 1,
      claimedToday: Boolean(parsed.claimedToday),
      lastClaimDate:
        typeof parsed.lastClaimDate === "string"
          ? parsed.lastClaimDate
          : null,
      totalClaims:
        typeof parsed.totalClaims === "number"
          ? parsed.totalClaims
          : 0,
      streak:
        typeof parsed.streak === "number"
          ? parsed.streak
          : 0,
    };
  } catch {
    return { ...DEFAULT_DAILY_REWARD_STATE };
  }
}

export function saveDailyRewardState(
  state: DailyRewardState
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

export function refreshDailyRewardState(): DailyRewardState {
  const state = loadDailyRewardState();
  const today = getToday();

  if (state.lastClaimDate === today) {
    return {
      ...state,
      claimedToday: true,
    };
  }

  return {
    ...state,
    claimedToday: false,
  };
}

export function getTodayReward(): DailyReward {
  const state = refreshDailyRewardState();

  return (
    DAILY_REWARDS[state.currentDay - 1] ??
    DAILY_REWARDS[0]
  );
}

export function canClaimDailyReward(): boolean {
  return !refreshDailyRewardState().claimedToday;
}

export function claimDailyReward(): {
  success: boolean;
  reward: DailyReward;
  state: DailyRewardState;
  message: string;
} {
  const state = refreshDailyRewardState();

  if (state.claimedToday) {
    return {
      success: false,
      reward: getTodayReward(),
      state,
      message: "You have already claimed today's reward.",
    };
  }

  const today = getToday();
  const yesterday = getYesterday();

  let nextStreak = state.streak;

  if (state.lastClaimDate === yesterday) {
    nextStreak += 1;
  } else {
    nextStreak = 1;
  }

  const reward =
    DAILY_REWARDS[state.currentDay - 1] ??
    DAILY_REWARDS[0];

  const nextDay =
    state.currentDay >= DAILY_REWARDS.length
      ? 1
      : state.currentDay + 1;

  const nextState: DailyRewardState = {
    currentDay: nextDay,
    claimedToday: true,
    lastClaimDate: today,
    totalClaims: state.totalClaims + 1,
    streak: nextStreak,
  };

  saveDailyRewardState(nextState);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("abujaLifeDailyRewardUpdated")
    );
  }

  return {
    success: true,
    reward,
    state: nextState,
    message: `Day ${state.currentDay} reward claimed!`,
  };
}

export function getDailyRewardDays(): DailyReward[] {
  return DAILY_REWARDS;
}

export function getDailyRewardStreak(): number {
  return refreshDailyRewardState().streak;
}

export function resetDailyRewards(): void {
  saveDailyRewardState({
    ...DEFAULT_DAILY_REWARD_STATE,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("abujaLifeDailyRewardUpdated")
    );
  }
}