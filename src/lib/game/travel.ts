// Abuja Life — Travel System
// Handles movement between locations, travel time, energy, cost,
// live city conditions and destination updates.
//
// This extends the existing travel engine rather than creating
// a separate travel system.

import {
  generateCityState,
  type CityState,
} from "@/lib/game/city";

export type TransportType =
  | "walk"
  | "bus"
  | "taxi"
  | "bike"
  | "car";

export interface TravelLocation {
  id: string;
  name: string;
  neighborhood: string;
}

export interface TravelOption {
  type: TransportType;
  name: string;
  icon: string;
  description: string;
  speed: number;
  baseCost: number;
  distanceCostPerKm: number;
  energyMultiplier: number;
}

export interface TravelConditions {
  traffic: string;
  weather: string;
  temperature: number;
  trafficMultiplier: number;
  weatherMultiplier: number;
  costMultiplier: number;
  energyMultiplier: number;
  summary: string;
}

export interface TravelResult {
  success: boolean;
  message: string;
  transport: TransportType;
  from: string;
  to: string;

  distanceKm: number;

  /**
   * Final simulated journey duration after
   * traffic and weather effects.
   */
  travelMinutes: number;

  /**
   * Base journey duration before live conditions.
   */
  baseTravelMinutes: number;

  cost: number;
  energyCost: number;

  /**
   * Fare before live traffic/weather adjustments.
   */
  baseCost: number;

  /**
   * Energy before live condition adjustments.
   */
  baseEnergyCost: number;

  traffic: string;
  weather: string;

  trafficMultiplier: number;
  weatherMultiplier: number;

  /**
   * Useful for UI and future notifications.
   */
  estimatedArrivalAt: number;

  /**
   * Human-readable explanation of current conditions.
   */
  conditionSummary: string;
}

export const TRAVEL_OPTIONS: TravelOption[] = [
  {
    type: "walk",
    name: "Walk",
    icon: "🚶",
    description: "Free, but slow and tiring.",
    speed: 4,
    baseCost: 0,
    distanceCostPerKm: 0,
    energyMultiplier: 1.5,
  },

  {
    type: "bus",
    name: "Bus",
    icon: "🚌",
    description: "Cheap public transport.",
    speed: 25,
    baseCost: 500,
    distanceCostPerKm: 100,
    energyMultiplier: 0.25,
  },

  {
    type: "taxi",
    name: "Taxi",
    icon: "🚕",
    description: "Fast and convenient.",
    speed: 40,
    baseCost: 1200,
    distanceCostPerKm: 125,
    energyMultiplier: 0.15,
  },

  {
    type: "bike",
    name: "Bike",
    icon: "🏍️",
    description: "Fast and affordable.",
    speed: 35,
    baseCost: 700,
    distanceCostPerKm: 110,
    energyMultiplier: 0.35,
  },

  {
    type: "car",
    name: "Personal Car",
    icon: "🚗",
    description: "Your own vehicle.",
    speed: 50,
    baseCost: 350,
    distanceCostPerKm: 75,
    energyMultiplier: 0.1,
  },
];

/*
|--------------------------------------------------------------------------
| Travel constants
|--------------------------------------------------------------------------
*/

/**
 * Real Abuja roads are not the same as a straight-line calculation.
 *
 * This multiplier represents:
 * - junctions
 * - traffic lights
 * - turns
 * - road access
 * - normal city driving conditions
 *
 * Traffic/weather modifiers are applied afterwards.
 */
const URBAN_TRAVEL_TIME_MULTIPLIER = 1.5;

/**
 * Prevents extremely short journeys from becoming zero-minute trips.
 */
const MIN_TRAVEL_MINUTES = 1;

/**
 * Travel conditions are recalculated when the trip is created.
 */
const ARRIVAL_TIME_BUFFER_MS = 60_000;

/*
|--------------------------------------------------------------------------
| Transport helpers
|--------------------------------------------------------------------------
*/

export function getTravelOption(
  type: TransportType
): TravelOption {
  return (
    TRAVEL_OPTIONS.find(
      (option) => option.type === type
    ) ?? TRAVEL_OPTIONS[0]
  );
}

/*
|--------------------------------------------------------------------------
| Traffic
|--------------------------------------------------------------------------
*/

function getTrafficEffects(traffic: string): {
  timeMultiplier: number;
  costMultiplier: number;
  energyMultiplier: number;
} {
  const value = traffic.toLowerCase();

  if (
    value.includes("heavy") ||
    value.includes("gridlock") ||
    value.includes("jam")
  ) {
    return {
      timeMultiplier: 1.45,
      costMultiplier: 1.15,
      energyMultiplier: 1.15,
    };
  }

  if (
    value.includes("busy") ||
    value.includes("high")
  ) {
    return {
      timeMultiplier: 1.25,
      costMultiplier: 1.08,
      energyMultiplier: 1.08,
    };
  }

  if (
    value.includes("moderate") ||
    value.includes("normal")
  ) {
    return {
      timeMultiplier: 1,
      costMultiplier: 1,
      energyMultiplier: 1,
    };
  }

  if (
    value.includes("light") ||
    value.includes("low")
  ) {
    return {
      timeMultiplier: 0.9,
      costMultiplier: 0.98,
      energyMultiplier: 0.96,
    };
  }

  return {
    timeMultiplier: 1,
    costMultiplier: 1,
    energyMultiplier: 1,
  };
}

/*
|--------------------------------------------------------------------------
| Weather
|--------------------------------------------------------------------------
*/

function getWeatherEffects(weather: string): {
  timeMultiplier: number;
  costMultiplier: number;
  energyMultiplier: number;
} {
  const value = weather.toLowerCase();

  if (
    value.includes("storm") ||
    value.includes("thunder")
  ) {
    return {
      timeMultiplier: 1.35,
      costMultiplier: 1.12,
      energyMultiplier: 1.2,
    };
  }

  if (
    value.includes("rain") ||
    value.includes("shower")
  ) {
    return {
      timeMultiplier: 1.18,
      costMultiplier: 1.06,
      energyMultiplier: 1.1,
    };
  }

  if (
    value.includes("haze") ||
    value.includes("dust")
  ) {
    return {
      timeMultiplier: 1.08,
      costMultiplier: 1.02,
      energyMultiplier: 1.06,
    };
  }

  if (value.includes("wind")) {
    return {
      timeMultiplier: 1.08,
      costMultiplier: 1.01,
      energyMultiplier: 1.05,
    };
  }

  if (
    value.includes("cloud") ||
    value.includes("overcast")
  ) {
    return {
      timeMultiplier: 1.03,
      costMultiplier: 1,
      energyMultiplier: 1.02,
    };
  }

  return {
    timeMultiplier: 1,
    costMultiplier: 1,
    energyMultiplier: 1,
  };
}

/*
|--------------------------------------------------------------------------
| City conditions
|--------------------------------------------------------------------------
*/

export function getCurrentTravelConditions(
  city?: CityState
): TravelConditions {
  const currentCity =
    city ??
    generateCityState(
      new Date().getHours(),
      new Date().getMinutes()
    );

  const trafficEffects =
    getTrafficEffects(currentCity.traffic);

  const weatherEffects =
    getWeatherEffects(currentCity.weather);

  const combinedTimeMultiplier =
    trafficEffects.timeMultiplier *
    weatherEffects.timeMultiplier;

  const combinedCostMultiplier =
    trafficEffects.costMultiplier *
    weatherEffects.costMultiplier;

  const combinedEnergyMultiplier =
    trafficEffects.energyMultiplier *
    weatherEffects.energyMultiplier;

  let summary =
    `Traffic is ${currentCity.traffic.toLowerCase()} and ` +
    `the weather is ${currentCity.weather.toLowerCase()}.`;

  if (
    trafficEffects.timeMultiplier > 1 ||
    weatherEffects.timeMultiplier > 1
  ) {
    summary +=
      " Current conditions may make the journey slower.";
  } else if (
    trafficEffects.timeMultiplier < 1
  ) {
    summary +=
      " Roads are moving faster than usual.";
  }

  return {
    traffic: currentCity.traffic,
    weather: currentCity.weather,
    temperature: currentCity.temperature,

    trafficMultiplier:
      trafficEffects.timeMultiplier,

    weatherMultiplier:
      weatherEffects.timeMultiplier,

    costMultiplier:
      combinedCostMultiplier,

    energyMultiplier:
      combinedEnergyMultiplier,

    summary,
  };
}

/*
|--------------------------------------------------------------------------
| Travel calculation
|--------------------------------------------------------------------------
*/

export function calculateTravel(
  from: TravelLocation,
  to: TravelLocation,
  transport: TransportType,
  distanceKm: number,
  city?: CityState
): TravelResult {
  const option = getTravelOption(transport);

  const conditions =
    getCurrentTravelConditions(city);

  const safeDistance = Math.max(
    0.1,
    Number.isFinite(distanceKm)
      ? distanceKm
      : 0.1
  );

  /*
   * Base journey time.
   */
  const baseTravelMinutes = Math.max(
    MIN_TRAVEL_MINUTES,
    Math.ceil(
      (safeDistance / option.speed) *
        60 *
        URBAN_TRAVEL_TIME_MULTIPLIER
    )
  );

  /*
   * Traffic + weather affect the journey.
   */
  const conditionTimeMultiplier =
    conditions.trafficMultiplier *
    conditions.weatherMultiplier;

  const travelMinutes = Math.max(
    MIN_TRAVEL_MINUTES,
    Math.ceil(
      baseTravelMinutes *
        conditionTimeMultiplier
    )
  );

  /*
   * Base fare.
   *
   * Example:
   * Taxi + 8km:
   * ₦1,200 + (8 × ₦125)
   * = ₦2,200
   */
  const baseDistanceCost =
    option.type === "walk"
      ? 0
      : Math.ceil(
          safeDistance *
            option.distanceCostPerKm
        );

  const baseCost =
    option.baseCost +
    baseDistanceCost;

  /*
   * Traffic/weather can influence paid transport.
   *
   * Walking remains free.
   */
  const cost =
    option.type === "walk"
      ? 0
      : Math.max(
          0,
          Math.ceil(
            baseCost *
              conditions.costMultiplier
          )
        );

  /*
   * Base energy.
   */
  const baseEnergyCost = Math.max(
    1,
    Math.ceil(
      safeDistance *
        option.energyMultiplier
    )
  );

  /*
   * Live conditions affect energy.
   */
  const energyCost = Math.max(
    1,
    Math.ceil(
      baseEnergyCost *
        conditions.energyMultiplier
    )
  );

  /*
   * Estimated arrival timestamp.
   *
   * We don't actually wait the full simulated
   * journey time in the UI. This is useful for
   * future missions, notifications and events.
   */
  const estimatedArrivalAt =
    Date.now() +
    Math.max(
      ARRIVAL_TIME_BUFFER_MS,
      travelMinutes *
        60_000
    );

  return {
    success: true,

    message:
      `Traveling from ${from.name} to ${to.name}.`,

    transport,

    from: from.id,
    to: to.id,

    distanceKm: safeDistance,

    travelMinutes,

    baseTravelMinutes,

    cost,

    energyCost,

    baseCost,

    baseEnergyCost,

    traffic: conditions.traffic,

    weather: conditions.weather,

    trafficMultiplier:
      conditions.trafficMultiplier,

    weatherMultiplier:
      conditions.weatherMultiplier,

    estimatedArrivalAt,

    conditionSummary:
      conditions.summary,
  };
}

/*
|--------------------------------------------------------------------------
| Travel validation
|--------------------------------------------------------------------------
*/

export function canTravel(
  cash: number,
  energy: number,
  result: TravelResult
): boolean {
  return (
    cash >= result.cost &&
    energy >= result.energyCost
  );
}

/*
|--------------------------------------------------------------------------
| Complete travel
|--------------------------------------------------------------------------
*/

export function completeTravel(
  cash: number,
  energy: number,
  result: TravelResult
): {
  cash: number;
  energy: number;
  locationId: string;
} {
  return {
    cash: Math.max(
      0,
      cash - result.cost
    ),

    energy: Math.max(
      0,
      energy - result.energyCost
    ),

    locationId: result.to,
  };
}