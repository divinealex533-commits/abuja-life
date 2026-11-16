// Abuja Life — real business advertising: plans, categories, districts.
// Prices here are DEFAULTS; change them in Admin → Prices.
// Safe for client and server.

export type AdPlanId = "basic" | "featured" | "premium";

export interface AdPlan {
  id: AdPlanId;
  name: string;
  defaultPriceNaira: number;
  days: number;
  rank: number;
  badge: string;
  perks: string[];
}

export const AD_PLANS: Record<AdPlanId, AdPlan> = {
  basic: {
    id: "basic",
    name: "Basic Listing",
    defaultPriceNaira: 5_000,
    days: 30,
    rank: 1,
    badge: "Sponsored",
    perks: [
      "Your business appears as a place in its Abuja district",
      "Listed in the Abuja Business Directory",
      "WhatsApp, phone and Instagram buttons",
      "Monthly stats: views, visits, contacts",
    ],
  },
  featured: {
    id: "featured",
    name: "Featured",
    defaultPriceNaira: 15_000,
    days: 30,
    rank: 2,
    badge: "⭐ Featured",
    perks: [
      "Everything in Basic",
      "Top of your district, above Basic listings",
      "Shown on the main game screen to every player",
      "Featured badge",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    defaultPriceNaira: 35_000,
    days: 30,
    rank: 3,
    badge: "👑 Premium",
    perks: [
      "Everything in Featured",
      "Your business in rewarded video ads players watch for rewards",
      "Top of the whole directory",
      "Premium badge and gold highlight",
    ],
  },
};

export const AD_PLAN_ORDER: AdPlanId[] = ["basic", "featured", "premium"];

export const BUSINESS_CATEGORIES = [
  { id: "restaurant", label: "Restaurant / Food", emoji: "🍲" },
  { id: "salon", label: "Salon / Barber / Beauty", emoji: "💇🏾‍♀️" },
  { id: "boutique", label: "Boutique / Fashion", emoji: "👗" },
  { id: "lounge", label: "Lounge / Club / Bar", emoji: "🍸" },
  { id: "pharmacy", label: "Pharmacy / Clinic", emoji: "💊" },
  { id: "supermarket", label: "Supermarket / Shop", emoji: "🛒" },
  { id: "gym", label: "Gym / Fitness", emoji: "🏋🏾" },
  { id: "hotel", label: "Hotel / Shortlet", emoji: "🏨" },
  { id: "services", label: "Services (repairs, logistics…)", emoji: "🛠️" },
  { id: "other", label: "Other", emoji: "🏪" },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]["id"];

/** Districts. `id` matches the in-game location slug where one exists. */
export const BUSINESS_DISTRICTS = [
  { id: "wuse", label: "Wuse" },
  { id: "wuse-2", label: "Wuse 2" },
  { id: "maitama", label: "Maitama" },
  { id: "garki", label: "Garki" },
  { id: "jabi", label: "Jabi" },
  { id: "cbd", label: "Central Business District" },
  { id: "gwarinpa", label: "Gwarinpa" },
  { id: "asokoro", label: "Asokoro" },
  { id: "utako", label: "Utako" },
  { id: "kubwa", label: "Kubwa" },
  { id: "lugbe", label: "Lugbe" },
  { id: "apo", label: "Apo" },
  { id: "lokogoma", label: "Lokogoma" },
  { id: "nyanya", label: "Nyanya" },
] as const;

export type BusinessDistrict = (typeof BUSINESS_DISTRICTS)[number]["id"];

export function isAdPlan(value: string): value is AdPlanId {
  return value in AD_PLANS;
}

export function isCategory(value: string): value is BusinessCategory {
  return BUSINESS_CATEGORIES.some((c) => c.id === value);
}

export function isDistrict(value: string): value is BusinessDistrict {
  return BUSINESS_DISTRICTS.some((d) => d.id === value);
}

export function districtLabel(id: string): string {
  return BUSINESS_DISTRICTS.find((d) => d.id === id)?.label ?? id;
}

export function categoryInfo(id: string) {
  return BUSINESS_CATEGORIES.find((c) => c.id === id) ?? BUSINESS_CATEGORIES[BUSINESS_CATEGORIES.length - 1];
}

/** Location page name ("Wuse 2") → district id ("wuse-2"). */
export function districtFromLocationName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export interface PublicListing {
  id: string;
  name: string;
  category: string;
  district: string;
  emoji: string;
  description: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  offerText: string | null;
  plan: AdPlanId;
}

export function whatsappLink(number: string, businessName: string): string {
  let digits = number.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  const text = encodeURIComponent(`Hi ${businessName}, I found you on Abuja Life 🎮`);
  return `https://wa.me/${digits}?text=${text}`;
}
