export type TimeOfDay =
  | "dawn"
  | "morning"
  | "afternoon"
  | "evening"
  | "night"
  | "late-night";

export type WeatherType =
  | "clear"
  | "cloudy"
  | "light-rain"
  | "heavy-rain"
  | "storm"
  | "harmattan";

export type TrafficLevel =
  | "quiet"
  | "normal"
  | "busy"
  | "heavy"
  | "gridlock";

export type CityMood =
  | "peaceful"
  | "busy"
  | "exciting"
  | "romantic"
  | "chaotic"
  | "festive";

export interface CityState {
  hour: number;
  minute: number;

  timeOfDay: TimeOfDay;

  weather: WeatherType;
  traffic: TrafficLevel;
  mood: CityMood;

  temperature: number;

  policeActivity: number;
  nightlifeActivity: number;
  shoppingActivity: number;
  businessActivity: number;

  cityEnergy: number;

  lastUpdated: string;
}

export interface CityEventEffect {
  trafficModifier: number;
  nightlifeModifier: number;
  shoppingModifier: number;
  businessModifier: number;
  cityEnergyModifier: number;
}

/*
|--------------------------------------------------------------------------
| ABUJA CITY
|--------------------------------------------------------------------------
|
| Abuja is not static.
|
| The city changes throughout the day.
|
| Morning:
| - workers begin moving
| - traffic rises
| - businesses open
|
| Afternoon:
| - business activity peaks
| - shopping increases
|
| Evening:
| - restaurants become busy
| - nightlife begins
| - traffic changes
|
| Night:
| - clubs/events become active
| - some locations become quieter
|
|--------------------------------------------------------------------------
*/

export const DEFAULT_CITY_STATE: CityState = {
  hour: 8,
  minute: 0,

  timeOfDay: "morning",

  weather: "clear",
  traffic: "normal",
  mood: "busy",

  temperature: 28,

  policeActivity: 35,
  nightlifeActivity: 15,
  shoppingActivity: 60,
  businessActivity: 75,

  cityEnergy: 65,

  lastUpdated: new Date().toISOString(),
};

/*
|--------------------------------------------------------------------------
| TIME
|--------------------------------------------------------------------------
*/

export function getTimeOfDay(
  hour: number
): TimeOfDay {
  if (hour >= 5 && hour < 7) {
    return "dawn";
  }

  if (hour >= 7 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  if (hour >= 21 && hour < 24) {
    return "night";
  }

  return "late-night";
}

/*
|--------------------------------------------------------------------------
| WEATHER
|--------------------------------------------------------------------------
*/

export const WEATHER_INFO: Record<
  WeatherType,
  {
    name: string;
    icon: string;
    description: string;
    trafficModifier: number;
    cityEnergyModifier: number;
  }
> = {
  clear: {
    name: "Clear Skies",
    icon: "☀️",
    description:
      "Clear Abuja skies. The city is active and moving.",
    trafficModifier: 0,
    cityEnergyModifier: 5,
  },

  cloudy: {
    name: "Cloudy",
    icon: "☁️",
    description:
      "Clouds are gathering over the city.",
    trafficModifier: 5,
    cityEnergyModifier: 0,
  },

  "light-rain": {
    name: "Light Rain",
    icon: "🌦️",
    description:
      "Light rain is falling across parts of Abuja.",
    trafficModifier: 15,
    cityEnergyModifier: -5,
  },

  "heavy-rain": {
    name: "Heavy Rain",
    icon: "🌧️",
    description:
      "Heavy rain is making movement around the city slower.",
    trafficModifier: 30,
    cityEnergyModifier: -10,
  },

  storm: {
    name: "Thunderstorm",
    icon: "⛈️",
    description:
      "A storm is passing through Abuja. Outdoor activity is reduced.",
    trafficModifier: 45,
    cityEnergyModifier: -20,
  },

  harmattan: {
    name: "Harmattan",
    icon: "🌫️",
    description:
      "Dry dusty air has reduced visibility around the city.",
    trafficModifier: 20,
    cityEnergyModifier: -5,
  },
};

/*
|--------------------------------------------------------------------------
| TRAFFIC
|--------------------------------------------------------------------------
*/

export const TRAFFIC_INFO: Record<
  TrafficLevel,
  {
    label: string;
    icon: string;
    score: number;
  }
> = {
  quiet: {
    label: "Quiet Roads",
    icon: "🟢",
    score: 15,
  },

  normal: {
    label: "Normal Traffic",
    icon: "🟡",
    score: 35,
  },

  busy: {
    label: "Busy Roads",
    icon: "🟠",
    score: 55,
  },

  heavy: {
    label: "Heavy Traffic",
    icon: "🔴",
    score: 75,
  },

  gridlock: {
    label: "Traffic Gridlock",
    icon: "🚨",
    score: 100,
  },
};

export function getTrafficLevel(
  hour: number,
  weather: WeatherType
): TrafficLevel {
  let score = 30;

  /*
   * Morning rush hour.
   */
  if (hour >= 7 && hour <= 9) {
    score += 35;
  }

  /*
   * Afternoon movement.
   */
  if (hour >= 13 && hour <= 15) {
    score += 15;
  }

  /*
   * Evening rush hour.
   */
  if (hour >= 16 && hour <= 19) {
    score += 40;
  }

  /*
   * Late night roads become quieter.
   */
  if (hour >= 22 || hour < 6) {
    score -= 20;
  }

  score += WEATHER_INFO[weather].trafficModifier;

  if (score >= 95) {
    return "gridlock";
  }

  if (score >= 75) {
    return "heavy";
  }

  if (score >= 55) {
    return "busy";
  }

  if (score <= 20) {
    return "quiet";
  }

  return "normal";
}

/*
|--------------------------------------------------------------------------
| CITY MOOD
|--------------------------------------------------------------------------
*/

export function getCityMood(
  timeOfDay: TimeOfDay,
  weather: WeatherType,
  cityEnergy: number
): CityMood {
  if (
    weather === "storm" ||
    cityEnergy < 25
  ) {
    return "chaotic";
  }

  if (
    timeOfDay === "night" &&
    cityEnergy >= 70
  ) {
    return "exciting";
  }

  if (
    timeOfDay === "evening" &&
    weather === "clear"
  ) {
    return "romantic";
  }

  if (cityEnergy >= 85) {
    return "festive";
  }

  if (cityEnergy <= 40) {
    return "peaceful";
  }

  return "busy";
}

/*
|--------------------------------------------------------------------------
| WEATHER GENERATION
|--------------------------------------------------------------------------
*/

export function generateWeather(
  hour: number
): WeatherType {
  /*
   * Keep weather believable rather than completely random.
   */

  const roll = Math.random();

  /*
   * Night and early morning can have clearer conditions.
   */
  if (hour >= 22 || hour < 6) {
    if (roll < 0.65) {
      return "clear";
    }

    if (roll < 0.85) {
      return "cloudy";
    }

    return "harmattan";
  }

  if (roll < 0.50) {
    return "clear";
  }

  if (roll < 0.72) {
    return "cloudy";
  }

  if (roll < 0.87) {
    return "light-rain";
  }

  if (roll < 0.96) {
    return "heavy-rain";
  }

  return "storm";
}

/*
|--------------------------------------------------------------------------
| TEMPERATURE
|--------------------------------------------------------------------------
*/

export function getTemperature(
  hour: number,
  weather: WeatherType
): number {
  let temperature = 27;

  if (hour >= 11 && hour <= 16) {
    temperature += 5;
  }

  if (hour >= 0 && hour <= 5) {
    temperature -= 3;
  }

  if (weather === "heavy-rain") {
    temperature -= 3;
  }

  if (weather === "storm") {
    temperature -= 4;
  }

  if (weather === "harmattan") {
    temperature -= 2;
  }

  return temperature;
}

/*
|--------------------------------------------------------------------------
| CITY ACTIVITY
|--------------------------------------------------------------------------
*/

export function calculateCityActivity(
  hour: number,
  weather: WeatherType
) {
  let businessActivity = 30;
  let shoppingActivity = 30;
  let nightlifeActivity = 5;
  let policeActivity = 25;

  /*
   * Business hours.
   */
  if (hour >= 8 && hour <= 17) {
    businessActivity += 45;
  }

  /*
   * Shopping peaks in the afternoon.
   */
  if (hour >= 12 && hour <= 19) {
    shoppingActivity += 45;
  }

  /*
   * Nightlife.
   */
  if (hour >= 19 && hour <= 23) {
    nightlifeActivity += 70;
  }

  /*
   * Late-night activity drops.
   */
  if (hour >= 1 && hour <= 5) {
    nightlifeActivity -= 20;
  }

  /*
   * Police presence increases around busy periods.
   */
  if (
    (hour >= 7 && hour <= 10) ||
    (hour >= 18 && hour <= 23)
  ) {
    policeActivity += 25;
  }

  /*
   * Bad weather reduces outdoor activity.
   */
  if (
    weather === "heavy-rain" ||
    weather === "storm"
  ) {
    shoppingActivity -= 15;
    nightlifeActivity -= 20;
  }

  return {
    businessActivity: Math.max(
      0,
      Math.min(100, businessActivity)
    ),

    shoppingActivity: Math.max(
      0,
      Math.min(100, shoppingActivity)
    ),

    nightlifeActivity: Math.max(
      0,
      Math.min(100, nightlifeActivity)
    ),

    policeActivity: Math.max(
      0,
      Math.min(100, policeActivity)
    ),
  };
}

/*
|--------------------------------------------------------------------------
| CITY STATE GENERATOR
|--------------------------------------------------------------------------
*/

export function generateCityState(
  hour: number,
  minute = 0,
  previousWeather?: WeatherType
): CityState {
  const timeOfDay = getTimeOfDay(hour);

  /*
   * Don't change weather every few seconds.
   * If an existing weather state is supplied,
   * keep it most of the time.
   */
  const weather =
    previousWeather && Math.random() < 0.8
      ? previousWeather
      : generateWeather(hour);

  const traffic = getTrafficLevel(
    hour,
    weather
  );

  const temperature = getTemperature(
    hour,
    weather
  );

  const activity =
    calculateCityActivity(
      hour,
      weather
    );

  const cityEnergy = Math.round(
    (
      activity.businessActivity +
      activity.shoppingActivity +
      activity.nightlifeActivity
    ) /
      3 +
      WEATHER_INFO[weather]
        .cityEnergyModifier
  );

  const mood = getCityMood(
    timeOfDay,
    weather,
    cityEnergy
  );

  return {
    hour,
    minute,

    timeOfDay,

    weather,
    traffic,
    mood,

    temperature,

    policeActivity:
      activity.policeActivity,

    nightlifeActivity:
      activity.nightlifeActivity,

    shoppingActivity:
      activity.shoppingActivity,

    businessActivity:
      activity.businessActivity,

    cityEnergy: Math.max(
      0,
      Math.min(100, cityEnergy)
    ),

    lastUpdated:
      new Date().toISOString(),
  };
}

/*
|--------------------------------------------------------------------------
| EVENT EFFECTS
|--------------------------------------------------------------------------
*/

export function applyCityEventEffect(
  city: CityState,
  effect: CityEventEffect
): CityState {
  return {
    ...city,

    traffic:
      city.traffic,

    nightlifeActivity: Math.max(
      0,
      Math.min(
        100,
        city.nightlifeActivity +
          effect.nightlifeModifier
      )
    ),

    shoppingActivity: Math.max(
      0,
      Math.min(
        100,
        city.shoppingActivity +
          effect.shoppingModifier
      )
    ),

    businessActivity: Math.max(
      0,
      Math.min(
        100,
        city.businessActivity +
          effect.businessModifier
      )
    ),

    cityEnergy: Math.max(
      0,
      Math.min(
        100,
        city.cityEnergy +
          effect.cityEnergyModifier
      )
    ),
  };
}

/*
|--------------------------------------------------------------------------
| FORMATTING
|--------------------------------------------------------------------------
*/

export function formatCityTime(
  hour?: number,
  minute?: number
): string {
  const now = new Date();

  const currentHour =
    typeof hour === "number" ? hour : now.getHours();

  const currentMinute =
    typeof minute === "number" ? minute : now.getMinutes();

  const normalizedHour =
    ((currentHour % 24) + 24) % 24;

  const displayHour =
    normalizedHour % 12 || 12;

  const period =
    normalizedHour >= 12 ? "PM" : "AM";

  return `${displayHour}:${String(
    currentMinute
  ).padStart(2, "0")} ${period}`;
}

export function getCityStatusText(
  city: CityState
): string {
  if (city.mood === "festive") {
    return "Abuja is buzzing tonight.";
  }

  if (city.mood === "exciting") {
    return "The city is alive.";
  }

  if (city.mood === "romantic") {
    return "Abuja is settling into the evening.";
  }

  if (city.mood === "chaotic") {
    return "Something is happening across the city.";
  }

  if (city.mood === "peaceful") {
    return "The city is unusually calm.";
  }

  return "Abuja is active and moving.";
}