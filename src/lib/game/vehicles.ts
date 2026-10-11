// src/lib/game/vehicles.ts

export type VehicleClass =
  | "economy"
  | "sedan"
  | "suv"
  | "luxury"
  | "sports"
  | "supercar"
  | "hypercar"
  | "performance";

export type DealershipId =
  | "abuja-motors"
  | "abuja-auto-gallery"
  | "capital-luxury-motors"
  | "abuja-performance-garage";

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  class: VehicleClass;
  dealershipId: DealershipId;
  image: string;
imageCredit?: string;
imageSource?: string;

  price: number;
  resaleValue: number;

  speed: number;
  handling: number;
  comfort: number;
  reliability: number;
  fuelEfficiency: number;

  description: string;
  icon: string;

  condition: number;
  customizationLevel: number;
  upgradeSlots: number;

  reputationRequired: number;
  cashRequired: number;

  tags: string[];
}

export interface OwnedVehicle {
  vehicleId: string;
  purchasedAt: string;

  condition: number;
  customizationLevel: number;

  mileage: number;
  fuel: number;

  performanceLevel: number;
  handlingLevel: number;
  comfortLevel: number;

  upgrades: string[];
}

export interface Dealership {
  id: DealershipId;
  name: string;
  neighborhood: string;
  description: string;
  icon: string;

  vehicleClasses: VehicleClass[];

  luxuryLevel: number;
  reputationRequired: number;

  tags: string[];
}

/* -------------------------------------------------------------------------- */
/* DEALERSHIPS                                                                 */
/* -------------------------------------------------------------------------- */

export const DEALERSHIPS: Dealership[] = [
  {
    id: "abuja-motors",
    name: "Abuja Motors",
    neighborhood: "Wuse",
    description:
      "A major city dealership offering reliable everyday vehicles for new and established players.",
    icon: "🚗",
    vehicleClasses: ["economy", "sedan", "suv"],
    luxuryLevel: 1,
    reputationRequired: 0,
    tags: ["Affordable", "Daily Cars", "Family Cars"],
  },

  {
    id: "abuja-auto-gallery",
    name: "Abuja Auto Gallery",
    neighborhood: "Kado",
    description:
      "A premium showroom filled with exotic sports cars and high-performance machines.",
    icon: "🏎️",
    vehicleClasses: ["luxury", "sports", "supercar"],
    luxuryLevel: 4,
    reputationRequired: 10,
    tags: ["Luxury", "Exotic", "Sports Cars"],
  },

  {
    id: "capital-luxury-motors",
    name: "Capital Luxury Motors",
    neighborhood: "Maitama",
    description:
      "An exclusive dealership for wealthy players looking for the highest level of comfort and prestige.",
    icon: "💎",
    vehicleClasses: ["luxury", "suv", "supercar"],
    luxuryLevel: 5,
    reputationRequired: 25,
    tags: ["Ultra Luxury", "VIP", "Prestige"],
  },

  {
    id: "abuja-performance-garage",
    name: "Abuja Performance Garage",
    neighborhood: "Jabi",
    description:
      "A specialist performance garage where players can buy fast cars and improve their machines.",
    icon: "🔧",
    vehicleClasses: ["sports", "supercar", "hypercar", "performance"],
    luxuryLevel: 5,
    reputationRequired: 35,
    tags: ["Performance", "Tuning", "Custom Builds"],
  },
];

/* -------------------------------------------------------------------------- */
/* VEHICLE INVENTORY                                                           */
/* -------------------------------------------------------------------------- */

export const VEHICLES: Vehicle[] = [
  // ─────────────────────────────────────────────
  // ABUJA MOTORS — WUSE
  // Everyday / attainable cars
  // ─────────────────────────────────────────────

  {
    id: "toyota-camry",
    name: "Toyota Camry",
    brand: "Toyota",
    class: "sedan",
    dealershipId: "abuja-motors",
    price: 42_000_000,
    resaleValue: 34_000_000,
    speed: 72,
    handling: 70,
    comfort: 78,
    reliability: 94,
    fuelEfficiency: 86,
    description:
      "A dependable Abuja executive sedan built for comfort, reliability and everyday city driving.",
    icon: "🚘",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Toyota%20Camry.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource: "https://commons.wikimedia.org/wiki/File:Toyota_Camry.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 3,
    reputationRequired: 0,
    cashRequired: 42_000_000,
    tags: ["toyota", "sedan", "reliable", "daily", "executive"],
  },

  {
    id: "honda-accord",
    name: "Honda Accord",
    brand: "Honda",
    class: "sedan",
    dealershipId: "abuja-motors",
    price: 39_000_000,
    resaleValue: 31_000_000,
    speed: 74,
    handling: 73,
    comfort: 79,
    reliability: 91,
    fuelEfficiency: 84,
    description:
      "A stylish and practical executive sedan with strong handling and excellent everyday comfort.",
    icon: "🚘",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Honda-Accord.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource: "https://commons.wikimedia.org/wiki/File:Honda-Accord.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 3,
    reputationRequired: 0,
    cashRequired: 39_000_000,
    tags: ["honda", "accord", "sedan", "daily", "executive"],
  },

  {
    id: "hyundai-sonata",
    name: "Hyundai Sonata",
    brand: "Hyundai",
    class: "sedan",
    dealershipId: "abuja-motors",
    price: 35_000_000,
    resaleValue: 27_000_000,
    speed: 70,
    handling: 69,
    comfort: 81,
    reliability: 84,
    fuelEfficiency: 85,
    description:
      "A modern sedan offering comfort, technology and smooth Abuja cruising.",
    icon: "🚘",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/HyundaiSonata.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource: "https://commons.wikimedia.org/wiki/File:HyundaiSonata.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 3,
    reputationRequired: 0,
    cashRequired: 35_000_000,
    tags: ["hyundai", "sonata", "sedan", "modern", "daily"],
  },

  // ─────────────────────────────────────────────
  // CAPITAL LUXURY MOTORS — MAITAMA
  // Luxury / executive cars
  // ─────────────────────────────────────────────

  {
    id: "mercedes-c-class",
    name: "Mercedes-Benz C-Class",
    brand: "Mercedes-Benz",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 78_000_000,
    resaleValue: 63_000_000,
    speed: 82,
    handling: 82,
    comfort: 91,
    reliability: 86,
    fuelEfficiency: 76,
    description:
      "A premium Mercedes-Benz executive sedan combining luxury, technology and sharp handling.",
    icon: "⭐",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes%20Benz%20C%20Class.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Mercedes_Benz_C_Class.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 4,
    reputationRequired: 10,
    cashRequired: 78_000_000,
    tags: ["mercedes", "benz", "c-class", "luxury", "executive"],
  },

  {
    id: "bmw-5-series",
    name: "BMW 5 Series",
    brand: "BMW",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 92_000_000,
    resaleValue: 74_000_000,
    speed: 85,
    handling: 88,
    comfort: 90,
    reliability: 84,
    fuelEfficiency: 74,
    description:
      "A premium BMW executive sedan for players who want luxury without giving up driving performance.",
    icon: "⭐",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/BMW%205-Series%20%28G60%29%20530i%20xDrive%20%282024%29%20%2853797791357%29.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:BMW_5-Series_(G60)_530i_xDrive_(2024)_(53797791357).jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 4,
    reputationRequired: 12,
    cashRequired: 92_000_000,
    tags: ["bmw", "5-series", "luxury", "executive", "performance"],
  },

  {
    id: "audi-a6",
    name: "Audi A6",
    brand: "Audi",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 88_000_000,
    resaleValue: 70_000_000,
    speed: 83,
    handling: 84,
    comfort: 92,
    reliability: 85,
    fuelEfficiency: 75,
    description:
      "A sophisticated Audi executive sedan with a premium cabin and confident road manners.",
    icon: "⭐",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Audi%20A6%20%2850827949361%29.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Audi_A6_(50827949361).jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 4,
    reputationRequired: 12,
    cashRequired: 88_000_000,
    tags: ["audi", "a6", "luxury", "executive", "premium"],
  },

  {
    id: "mercedes-gle",
    name: "Mercedes-Benz GLE",
    brand: "Mercedes-Benz",
    class: "suv",
    dealershipId: "capital-luxury-motors",
    price: 125_000_000,
    resaleValue: 100_000_000,
    speed: 84,
    handling: 78,
    comfort: 95,
    reliability: 87,
    fuelEfficiency: 68,
    description:
      "A luxury Mercedes-Benz SUV built for Abuja roads, family travel and executive status.",
    icon: "🚙",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes-Benz%20GLE%20450%204Matic%20Genf%202019%201Y7A5103.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_GLE_450_4Matic_Genf_2019_1Y7A5103.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 5,
    reputationRequired: 15,
    cashRequired: 125_000_000,
    tags: ["mercedes", "gle", "suv", "luxury", "executive"],
  },

  {
    id: "range-rover-sv-autobiography",
    name: "Range Rover SV Autobiography",
    brand: "Range Rover",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 190_000_000,
    resaleValue: 152_000_000,
    speed: 87,
    handling: 79,
    comfort: 99,
    reliability: 82,
    fuelEfficiency: 60,
    description:
      "A high-status luxury SUV designed for players who want presence, comfort and prestige.",
    icon: "🚙",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Range%20Rover%20SV%20Autobiography.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Range_Rover_SV_Autobiography.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 5,
    reputationRequired: 20,
    cashRequired: 190_000_000,
    tags: ["range-rover", "suv", "luxury", "autobiography", "status"],
  },

  {
    id: "rolls-royce-cullinan",
    name: "Rolls-Royce Cullinan",
    brand: "Rolls-Royce",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 420_000_000,
    resaleValue: 340_000_000,
    speed: 89,
    handling: 76,
    comfort: 100,
    reliability: 90,
    fuelEfficiency: 45,
    description:
      "The ultimate luxury SUV for Abuja's wealthiest players.",
    icon: "👑",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rolls-Royce%20Cullinan%20%281%29.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Rolls-Royce_Cullinan_(1).jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 6,
    reputationRequired: 35,
    cashRequired: 420_000_000,
    tags: ["rolls-royce", "cullinan", "luxury", "elite", "status"],
  },

  {
    id: "bentley-bentayga",
    name: "Bentley Bentayga",
    brand: "Bentley",
    class: "luxury",
    dealershipId: "capital-luxury-motors",
    price: 330_000_000,
    resaleValue: 265_000_000,
    speed: 88,
    handling: 78,
    comfort: 99,
    reliability: 88,
    fuelEfficiency: 48,
    description:
      "A handcrafted luxury SUV combining Bentley comfort with serious road performance.",
    icon: "👑",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Bentley%20bentayga.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Bentley_bentayga.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 6,
    reputationRequired: 30,
    cashRequired: 330_000_000,
    tags: ["bentley", "bentayga", "luxury", "suv", "elite"],
  },

  // ─────────────────────────────────────────────
  // ABUJA AUTO GALLERY — KADO
  // Supercars / exotic cars
  // ─────────────────────────────────────────────

  {
    id: "porsche-911",
    name: "Porsche 911",
    brand: "Porsche",
    class: "sports",
    dealershipId: "abuja-auto-gallery",
    price: 185_000_000,
    resaleValue: 150_000_000,
    speed: 94,
    handling: 96,
    comfort: 82,
    reliability: 91,
    fuelEfficiency: 63,
    description:
      "A legendary sports car offering exceptional handling and serious performance.",
    icon: "🏎️",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Porsche%20911.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Porsche_911.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 6,
    reputationRequired: 25,
    cashRequired: 185_000_000,
    tags: ["porsche", "911", "sports", "exotic", "performance"],
  },

  {
    id: "lamborghini-huracan-tecnica",
    name: "Lamborghini Huracán Tecnica",
    brand: "Lamborghini",
    class: "supercar",
    dealershipId: "abuja-auto-gallery",
    price: 390_000_000,
    resaleValue: 320_000_000,
    speed: 98,
    handling: 97,
    comfort: 68,
    reliability: 82,
    fuelEfficiency: 38,
    description:
      "An exotic Lamborghini supercar built for speed, attention and elite status.",
    icon: "🏎️",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lamborghini%20Huracan%20Tecnica.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Lamborghini_Huracan_Tecnica.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 7,
    reputationRequired: 40,
    cashRequired: 390_000_000,
    tags: ["lamborghini", "huracan", "tecnica", "supercar", "exotic"],
  },

  {
    id: "ferrari-488-gtb",
    name: "Ferrari 488 GTB",
    brand: "Ferrari",
    class: "supercar",
    dealershipId: "abuja-auto-gallery",
    price: 430_000_000,
    resaleValue: 350_000_000,
    speed: 98,
    handling: 95,
    comfort: 70,
    reliability: 80,
    fuelEfficiency: 36,
    description:
      "A Ferrari supercar for players who have reached the upper levels of Abuja wealth.",
    icon: "🏎️",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ferrari%20488%20GTB%201.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Ferrari_488_GTB_1.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 7,
    reputationRequired: 45,
    cashRequired: 430_000_000,
    tags: ["ferrari", "488", "gtb", "supercar", "exotic"],
  },

  {
    id: "mclaren-750s",
    name: "McLaren 750S",
    brand: "McLaren",
    class: "supercar",
    dealershipId: "abuja-auto-gallery",
    price: 510_000_000,
    resaleValue: 415_000_000,
    speed: 99,
    handling: 99,
    comfort: 65,
    reliability: 81,
    fuelEfficiency: 34,
    description:
      "A lightweight McLaren supercar focused on extreme acceleration and cornering.",
    icon: "🏎️",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/2024%20McLaren%20750S.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:2024_McLaren_750S.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 7,
    reputationRequired: 50,
    cashRequired: 510_000_000,
    tags: ["mclaren", "750s", "supercar", "performance", "exotic"],
  },

  // ─────────────────────────────────────────────
  // ABUJA PERFORMANCE GARAGE — JABI
  // Performance cars
  // ─────────────────────────────────────────────

  {
    id: "audi-rs7",
    name: "Audi RS7",
    brand: "Audi",
    class: "performance",
    dealershipId: "abuja-performance-garage",
    price: 210_000_000,
    resaleValue: 170_000_000,
    speed: 95,
    handling: 93,
    comfort: 88,
    reliability: 84,
    fuelEfficiency: 55,
    description:
      "A performance luxury liftback combining Audi comfort with serious RS performance.",
    icon: "🏁",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/Audi%20RS7.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Audi_RS7.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 7,
    reputationRequired: 28,
    cashRequired: 210_000_000,
    tags: ["audi", "rs7", "performance", "luxury", "quattro"],
  },

  {
    id: "bmw-m5",
    name: "BMW M5",
    brand: "BMW",
    class: "performance",
    dealershipId: "abuja-performance-garage",
    price: 235_000_000,
    resaleValue: 190_000_000,
    speed: 96,
    handling: 95,
    comfort: 87,
    reliability: 85,
    fuelEfficiency: 50,
    description:
      "A BMW M performance sedan built for players who want executive comfort and track-level power.",
    icon: "🏁",
    image:
      "https://commons.wikimedia.org/wiki/Special:Redirect/file/BMW%20M5%20%28G90%29%20IMG%203266.jpg",
    imageCredit: "Wikimedia Commons",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:BMW_M5_(G90)_IMG_3266.jpg",
    condition: 100,
    customizationLevel: 0,
    upgradeSlots: 7,
    reputationRequired: 30,
    cashRequired: 235_000_000,
    tags: ["bmw", "m5", "m-power", "performance", "sedan"],
  },
];
 
/* -------------------------------------------------------------------------- */
/* HELPERS                                                                     */
/* -------------------------------------------------------------------------- */

export function getVehicleById(
  vehicleId: string
): Vehicle | undefined {
  return VEHICLES.find((vehicle) => vehicle.id === vehicleId);
}

export function getVehiclesByDealership(
  dealershipId: DealershipId
): Vehicle[] {
  return VEHICLES.filter(
    (vehicle) => vehicle.dealershipId === dealershipId
  );
}

export function getVehiclesByClass(
  vehicleClass: VehicleClass
): Vehicle[] {
  return VEHICLES.filter(
    (vehicle) => vehicle.class === vehicleClass
  );
}

export function searchVehicles(
  searchTerm: string
): Vehicle[] {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return VEHICLES;
  }

  return VEHICLES.filter((vehicle) => {
    return (
      vehicle.name.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.class.toLowerCase().includes(query) ||
      vehicle.tags.some((tag) =>
        tag.toLowerCase().includes(query)
      )
    );
  });
}

/* -------------------------------------------------------------------------- */
/* OWNERSHIP                                                                   */
/* -------------------------------------------------------------------------- */

export function canBuyVehicle(
  vehicle: Vehicle,
  cash: number,
  reputation: number
): boolean {
  return (
    cash >= vehicle.cashRequired &&
    reputation >= vehicle.reputationRequired
  );
}

export function purchaseVehicle(
  vehicleId: string,
  cash: number,
  reputation: number
): {
  success: boolean;
  message: string;
  ownedVehicle: OwnedVehicle | null;
  remainingCash: number;
} {
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    return {
      success: false,
      message: "Vehicle not found.",
      ownedVehicle: null,
      remainingCash: cash,
    };
  }

  if (cash < vehicle.cashRequired) {
    return {
      success: false,
      message: "You do not have enough cash to purchase this vehicle.",
      ownedVehicle: null,
      remainingCash: cash,
    };
  }

  if (reputation < vehicle.reputationRequired) {
    return {
      success: false,
      message: `You need ${vehicle.reputationRequired} reputation to purchase this vehicle.`,
      ownedVehicle: null,
      remainingCash: cash,
    };
  }

  const ownedVehicle: OwnedVehicle = {
    vehicleId: vehicle.id,
    purchasedAt: new Date().toISOString(),

    condition: 100,
    customizationLevel: 0,

    mileage: 0,
    fuel: 100,

    performanceLevel: 0,
    handlingLevel: 0,
    comfortLevel: 0,

    upgrades: [],
  };

  return {
    success: true,
    message: `${vehicle.name} is now yours.`,
    ownedVehicle,
    remainingCash: cash - vehicle.price,
  };
}

/* -------------------------------------------------------------------------- */
/* VEHICLE STATS                                                               */
/* -------------------------------------------------------------------------- */

export function getVehicleSpeed(
  vehicle: Vehicle,
  ownedVehicle?: OwnedVehicle | null
): number {
  const upgrade =
    ownedVehicle?.performanceLevel ?? 0;

  return Math.min(100, vehicle.speed + upgrade * 2);
}

export function getVehicleHandling(
  vehicle: Vehicle,
  ownedVehicle?: OwnedVehicle | null
): number {
  const upgrade =
    ownedVehicle?.handlingLevel ?? 0;

  return Math.min(100, vehicle.handling + upgrade * 2);
}

export function getVehicleComfort(
  vehicle: Vehicle,
  ownedVehicle?: OwnedVehicle | null
): number {
  const upgrade =
    ownedVehicle?.comfortLevel ?? 0;

  return Math.min(100, vehicle.comfort + upgrade * 2);
}

/* -------------------------------------------------------------------------- */
/* CONDITION / MAINTENANCE                                                     */
/* -------------------------------------------------------------------------- */

export function applyVehicleWear(
  ownedVehicle: OwnedVehicle,
  distanceKm: number
): OwnedVehicle {
  const wear = Math.max(
    1,
    Math.ceil(distanceKm * 0.4)
  );

  return {
    ...ownedVehicle,
    mileage: ownedVehicle.mileage + distanceKm,
    condition: Math.max(
      0,
      ownedVehicle.condition - wear
    ),
    fuel: Math.max(
      0,
      ownedVehicle.fuel - Math.ceil(distanceKm * 0.8)
    ),
  };
}

export function calculateMaintenanceCost(
  vehicle: Vehicle,
  ownedVehicle: OwnedVehicle
): number {
  const missingCondition =
    100 - ownedVehicle.condition;

  if (missingCondition <= 0) {
    return 0;
  }

  const baseCost =
    vehicle.price * 0.00008;

  return Math.max(
    5000,
    Math.ceil(baseCost * missingCondition)
  );
}

export function maintainVehicle(
  vehicle: Vehicle,
  ownedVehicle: OwnedVehicle,
  cash: number
): {
  success: boolean;
  message: string;
  ownedVehicle: OwnedVehicle;
  remainingCash: number;
} {
  const cost = calculateMaintenanceCost(
    vehicle,
    ownedVehicle
  );

  if (cash < cost) {
    return {
      success: false,
      message: `You need ₦${cost.toLocaleString()} to maintain this vehicle.`,
      ownedVehicle,
      remainingCash: cash,
    };
  }

  return {
    success: true,
    message: `${vehicle.name} has been fully serviced.`,
    ownedVehicle: {
      ...ownedVehicle,
      condition: 100,
      fuel: 100,
    },
    remainingCash: cash - cost,
  };
}

/* -------------------------------------------------------------------------- */
/* RESALE                                                                      */
/* -------------------------------------------------------------------------- */

export function calculateVehicleResaleValue(
  vehicle: Vehicle,
  ownedVehicle: OwnedVehicle
): number {
  const conditionMultiplier =
    Math.max(0.4, ownedVehicle.condition / 100);

  const mileagePenalty = Math.min(
    0.25,
    ownedVehicle.mileage / 100000
  );

  return Math.max(
    0,
    Math.floor(
      vehicle.resaleValue *
        conditionMultiplier *
        (1 - mileagePenalty)
    )
  );
}

/* -------------------------------------------------------------------------- */
/* DEALERSHIP ACCESS                                                           */
/* -------------------------------------------------------------------------- */

export function canAccessDealership(
  dealership: Dealership,
  reputation: number
): boolean {
  return reputation >= dealership.reputationRequired;
}

export function getAvailableDealerships(
  reputation: number
): Dealership[] {
  return DEALERSHIPS.filter((dealership) =>
    canAccessDealership(dealership, reputation)
  );
}