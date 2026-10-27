export type StreamDifficulty = "easy" | "medium" | "hard" | "extreme";

export type StreamAction =
  | "play"
  | "interact"
  | "hype"
  | "challenge"
  | "shoutout"
  | "clutch";

export type StreamEventType =
  | "donation"
  | "subscriber"
  | "raid"
  | "viral"
  | "troll"
  | "lag"
  | "clutch"
  | "sponsor"
  | "hype";

export interface StreamGame {
  id: string;
  name: string;
  category: string;
  emoji: string;
  difficulty: StreamDifficulty;
  baseViewers: number;
  viewerMultiplier: number;
  baseDonation: number;
  description: string;
}

export interface FeaturedStreamer {
  id: string;
  name: string;
  country: string;
  flag: string;
  platform: string;
  followers: string;
  viewers: string;
  status: "live" | "offline" | "trending";
  verified: boolean;
}

export interface StreamEvent {
  id: string;
  type: StreamEventType;
  title: string;
  message: string;
  viewerChange: number;
  hypeChange: number;
  cashChange: number;
  reputationChange: number;
}

export interface StreamResult {
  viewers: number;
  peakViewers: number;
  likes: number;
  followersGained: number;
  subscribers: number;
  donations: number;
  sponsorIncome: number;
  cashEarned: number;
  reputationGained: number;
  hype: number;
  score: number;
  durationSeconds: number;
}

export const STREAM_GAMES: StreamGame[] = [
  {
    id: "abuja-streets",
    name: "Abuja Streets",
    category: "Open World",
    emoji: "🏙️",
    difficulty: "medium",
    baseViewers: 650,
    viewerMultiplier: 1.15,
    baseDonation: 450,
    description:
      "Explore Abuja, complete missions and create chaotic moments across the city.",
  },
  {
    id: "fc-champions",
    name: "FC Champions",
    category: "Sports",
    emoji: "⚽",
    difficulty: "easy",
    baseViewers: 900,
    viewerMultiplier: 1.2,
    baseDonation: 550,
    description:
      "Compete in high-pressure football matches while entertaining your audience.",
  },
  {
    id: "warzone",
    name: "Warzone",
    category: "FPS",
    emoji: "🎯",
    difficulty: "hard",
    baseViewers: 1200,
    viewerMultiplier: 1.35,
    baseDonation: 700,
    description:
      "Survive intense battles and turn clutch moments into viral clips.",
  },
  {
    id: "gta-night",
    name: "GTA Night",
    category: "Action",
    emoji: "🚘",
    difficulty: "hard",
    baseViewers: 1400,
    viewerMultiplier: 1.4,
    baseDonation: 850,
    description:
      "Cause absolute chaos during a late-night open-world stream.",
  },
  {
    id: "minecraft",
    name: "Minecraft",
    category: "Sandbox",
    emoji: "⛏️",
    difficulty: "easy",
    baseViewers: 700,
    viewerMultiplier: 1.1,
    baseDonation: 350,
    description:
      "Build, explore and let your community decide what happens next.",
  },
  {
    id: "fortnite",
    name: "Fortnite",
    category: "Battle Royale",
    emoji: "🪂",
    difficulty: "medium",
    baseViewers: 1100,
    viewerMultiplier: 1.3,
    baseDonation: 600,
    description:
      "Battle for the win while keeping your audience entertained.",
  },
  {
    id: "valorant",
    name: "Valorant",
    category: "Tactical FPS",
    emoji: "🔫",
    difficulty: "hard",
    baseViewers: 1250,
    viewerMultiplier: 1.32,
    baseDonation: 650,
    description:
      "Make tactical plays, clutch rounds and dominate the leaderboard.",
  },
  {
    id: "abuja-racing",
    name: "Abuja Racing",
    category: "Racing",
    emoji: "🏎️",
    difficulty: "extreme",
    baseViewers: 1600,
    viewerMultiplier: 1.5,
    baseDonation: 1000,
    description:
      "Race through Abuja at dangerous speeds while thousands watch live.",
  },
];

export const FEATURED_STREAMERS: FeaturedStreamer[] = [
  {
    id: "ilyas-el-maliki",
    name: "Ilyas El Maliki",
    country: "Morocco",
    flag: "🇲🇦",
    platform: "Kick",
    followers: "800K+",
    viewers: "LIVE",
    status: "live",
    verified: true,
  },
  {
    id: "carter-efe",
    name: "Carter Efe",
    country: "Nigeria",
    flag: "🇳🇬",
    platform: "YouTube",
    followers: "500K+",
    viewers: "LIVE",
    status: "live",
    verified: true,
  },
  {
    id: "shank-comics",
    name: "Shank Comics",
    country: "Nigeria",
    flag: "🇳🇬",
    platform: "YouTube",
    followers: "250K+",
    viewers: "18.4K",
    status: "trending",
    verified: true,
  },
  {
    id: "peller",
    name: "Peller",
    country: "Nigeria",
    flag: "🇳🇬",
    platform: "TikTok",
    followers: "1M+",
    viewers: "32.1K",
    status: "trending",
    verified: true,
  },
  {
    id: "rachel-kay",
    name: "Rachel Kay",
    country: "South Africa",
    flag: "🇿🇦",
    platform: "Twitch",
    followers: "140K+",
    viewers: "8.7K",
    status: "trending",
    verified: true,
  },
  {
    id: "lord-lamba",
    name: "Lord Lamba",
    country: "Nigeria",
    flag: "🇳🇬",
    platform: "YouTube",
    followers: "200K+",
    viewers: "OFFLINE",
    status: "offline",
    verified: true,
  },
];

export const STREAM_EVENTS: StreamEvent[] = [
  {
    id: "big-donation",
    type: "donation",
    title: "💰 BIG DONATION!",
    message: "A viewer just dropped a huge donation!",
    viewerChange: 350,
    hypeChange: 8,
    cashChange: 5000,
    reputationChange: 3,
  },
  {
    id: "new-subscriber",
    type: "subscriber",
    title: "⭐ NEW SUBSCRIBERS",
    message: "Your community is growing fast!",
    viewerChange: 180,
    hypeChange: 5,
    cashChange: 1200,
    reputationChange: 2,
  },
  {
    id: "stream-raid",
    type: "raid",
    title: "🚨 STREAM RAID!",
    message: "Another streamer just raided your channel!",
    viewerChange: 1800,
    hypeChange: 18,
    cashChange: 2500,
    reputationChange: 8,
  },
  {
    id: "viral-moment",
    type: "viral",
    title: "🔥 VIRAL MOMENT!",
    message: "That clip is exploding across social media!",
    viewerChange: 2500,
    hypeChange: 25,
    cashChange: 4500,
    reputationChange: 12,
  },
  {
    id: "chat-troll",
    type: "troll",
    title: "😈 CHAT TROLL",
    message: "A troll is trying to ruin the stream.",
    viewerChange: -450,
    hypeChange: -8,
    cashChange: 0,
    reputationChange: 0,
  },
  {
    id: "connection-problem",
    type: "lag",
    title: "⚠️ CONNECTION PROBLEM",
    message: "Your stream is starting to lag!",
    viewerChange: -700,
    hypeChange: -12,
    cashChange: -500,
    reputationChange: -2,
  },
  {
    id: "insane-clutch",
    type: "clutch",
    title: "🎯 INSANE CLUTCH!",
    message: "You just pulled off an unbelievable play!",
    viewerChange: 1200,
    hypeChange: 16,
    cashChange: 1800,
    reputationChange: 6,
  },
  {
    id: "sponsor-offer",
    type: "sponsor",
    title: "📢 SPONSOR OFFER",
    message: "A brand wants to sponsor your stream!",
    viewerChange: 500,
    hypeChange: 10,
    cashChange: 6500,
    reputationChange: 7,
  },
  {
    id: "chat-hype",
    type: "hype",
    title: "🔥 CHAT IS GOING CRAZY!",
    message: "Your audience is flooding the chat!",
    viewerChange: 650,
    hypeChange: 14,
    cashChange: 900,
    reputationChange: 4,
  },
];

const DIFFICULTY_MULTIPLIER: Record<StreamDifficulty, number> = {
  easy: 0.85,
  medium: 1,
  hard: 1.2,
  extreme: 1.45,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getStreamGame(gameId: string): StreamGame | undefined {
  return STREAM_GAMES.find((game) => game.id === gameId);
}

export function getRandomStreamEvent(): StreamEvent {
  return STREAM_EVENTS[
    Math.floor(Math.random() * STREAM_EVENTS.length)
  ];
}

export function getStreamDuration(game: StreamGame): number {
  const base = 180;

  switch (game.difficulty) {
    case "easy":
      return base + 60;
    case "medium":
      return base;
    case "hard":
      return base - 20;
    case "extreme":
      return base - 40;
  }
}

export function calculateStartingViewers(
  game: StreamGame,
  streamerLevel = 1,
  connectedTikTok = false,
): number {
  const levelBonus = Math.max(0, streamerLevel - 1) * 120;
  const socialBonus = connectedTikTok ? 850 : 0;

  return Math.max(
    50,
    Math.round(
      game.baseViewers +
        levelBonus +
        socialBonus +
        Math.random() * 350,
    ),
  );
}

export function performStreamAction(
  action: StreamAction,
  game: StreamGame,
  currentViewers: number,
  currentHype: number,
): {
  viewerChange: number;
  hypeChange: number;
  likes: number;
  followers: number;
  cash: number;
  reputation: number;
  message: string;
} {
  const difficulty =
    DIFFICULTY_MULTIPLIER[game.difficulty];

  let viewerChange = 0;
  let hypeChange = 0;
  let likes = 0;
  let followers = 0;
  let cash = 0;
  let reputation = 0;
  let message = "";

  switch (action) {
    case "play":
      viewerChange = Math.round(
        (80 + Math.random() * 180) * difficulty,
      );
      hypeChange = 3;
      likes = Math.round(currentViewers * 0.08);
      followers = Math.max(
        2,
        Math.round(currentViewers * 0.004),
      );
      cash = Math.round(
        game.baseDonation * (0.25 + Math.random() * 0.5),
      );
      reputation = 1;
      message = "🎮 Your gameplay is keeping viewers locked in!";
      break;

    case "interact":
      viewerChange = Math.round(
        150 + Math.random() * 250,
      );
      hypeChange = 7;
      likes = Math.round(currentViewers * 0.12);
      followers = Math.max(
        5,
        Math.round(currentViewers * 0.007),
      );
      cash = Math.round(
        game.baseDonation * (0.4 + Math.random() * 0.8),
      );
      reputation = 2;
      message = "💬 Your chat interaction is going crazy!";
      break;

    case "hype":
      viewerChange = Math.round(
        (250 + Math.random() * 500) *
          (1 + currentHype / 100),
      );
      hypeChange = 15;
      likes = Math.round(currentViewers * 0.2);
      followers = Math.max(
        8,
        Math.round(currentViewers * 0.01),
      );
      cash = Math.round(
        game.baseDonation * (0.8 + Math.random() * 1.2),
      );
      reputation = 3;
      message = "🔥 CHAT IS ON FIRE!";
      break;

    case "challenge":
      viewerChange = Math.round(
        (350 + Math.random() * 650) * difficulty,
      );
      hypeChange = 18;
      likes = Math.round(currentViewers * 0.25);
      followers = Math.max(
        10,
        Math.round(currentViewers * 0.014),
      );
      cash = Math.round(
        game.baseDonation * (1 + Math.random() * 2),
      );
      reputation = 5;
      message = "🏆 You challenged yourself and the chat loved it!";
      break;

    case "shoutout":
      viewerChange = Math.round(
        180 + Math.random() * 400,
      );
      hypeChange = 9;
      likes = Math.round(currentViewers * 0.15);
      followers = Math.max(
        6,
        Math.round(currentViewers * 0.009),
      );
      cash = Math.round(
        game.baseDonation * (0.5 + Math.random()),
      );
      reputation = 2;
      message = "📢 Your shoutout made the community happy!";
      break;

    case "clutch":
      viewerChange = Math.round(
        (500 + Math.random() * 1200) * difficulty,
      );
      hypeChange = 22;
      likes = Math.round(currentViewers * 0.3);
      followers = Math.max(
        15,
        Math.round(currentViewers * 0.02),
      );
      cash = Math.round(
        game.baseDonation * (1.5 + Math.random() * 2.5),
      );
      reputation = 7;
      message = "🎯 INSANE CLUTCH! THAT WAS CRAZY!";
      break;
  }

  return {
    viewerChange,
    hypeChange,
    likes,
    followers,
    cash,
    reputation,
    message,
  };
}

export function calculateStreamResult(params: {
  game: StreamGame;
  startingViewers: number;
  currentViewers: number;
  peakViewers: number;
  likes: number;
  followers: number;
  subscribers: number;
  donations: number;
  sponsorIncome: number;
  hype: number;
  durationSeconds: number;
}): StreamResult {
  const {
    game,
    startingViewers,
    currentViewers,
    peakViewers,
    likes,
    followers,
    subscribers,
    donations,
    sponsorIncome,
    hype,
    durationSeconds,
  } = params;

  const difficultyMultiplier =
    DIFFICULTY_MULTIPLIER[game.difficulty];

  const viewerPerformance = Math.max(
    0,
    currentViewers - startingViewers,
  );

  const score = Math.round(
    currentViewers * 0.35 +
      peakViewers * 0.25 +
      likes * 0.03 +
      followers * 1.5 +
      subscribers * 5 +
      hype * 15 +
      donations * 0.08 +
      sponsorIncome * 0.04 +
      viewerPerformance * 0.2,
  );

  const cashEarned = Math.round(
    donations +
      sponsorIncome +
      subscribers * 150 +
      score * 0.65 * difficultyMultiplier,
  );

  const reputationGained = Math.max(
    1,
    Math.round(
      4 +
        hype / 8 +
        followers / 40 +
        subscribers / 15 +
        peakViewers / 2500,
    ),
  );

  return {
    viewers: Math.max(0, currentViewers),
    peakViewers: Math.max(0, peakViewers),
    likes: Math.max(0, likes),
    followersGained: Math.max(0, followers),
    subscribers: Math.max(0, subscribers),
    donations: Math.max(0, donations),
    sponsorIncome: Math.max(0, sponsorIncome),
    cashEarned: Math.max(0, cashEarned),
    reputationGained,
    hype: clamp(hype, 0, 100),
    score: Math.max(0, score),
    durationSeconds: Math.max(0, durationSeconds),
  };
}
