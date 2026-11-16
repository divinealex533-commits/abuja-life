// Abuja Life — what can be bought with real money, and for how much.
//
// Product IDs the browser may send to /api/payments/paystack/initialize:
//   "vip_gold_month", "starter_pack", …   (store catalog)
//   "venue:hotel_presidential_suite"        (VIP place set to real Naira)
//   "career:surgeon" / "job:pilot"          (licence set to real Naira)
//
// The price always comes from Admin → Prices on the server.

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCareer } from "@/lib/game/careers";
import { getJobById } from "@/lib/game/jobs";
import { getPrice } from "@/lib/pricing/server";
import { getProduct, tierAtLeast, VIP_TIERS, type VipTier } from "@/lib/vip/catalog";
import { getVipStatus } from "@/lib/vip/server";
import { getVenue } from "@/lib/vip/venues";

export type PurchaseKind = "product" | "venue" | "career" | "job";

export interface ResolvedPurchase {
  kind: PurchaseKind;
  productId: string;
  name: string;
  description: string;
  priceNaira: number;
  purpose: "vip" | "wallet" | "other";
  oncePerAccount: boolean;
}

export type ResolveResult =
  | { ok: true; purchase: ResolvedPurchase }
  | { ok: false; error: string; status: number };

export function parsePurchaseKind(productId: string): { kind: PurchaseKind; id: string } {
  const [prefix, ...rest] = productId.split(":");
  const id = rest.join(":");
  if (prefix === "venue" && id) return { kind: "venue", id };
  if (prefix === "career" && id) return { kind: "career", id };
  if (prefix === "job" && id) return { kind: "job", id };
  return { kind: "product", id: productId };
}

async function requireTier(
  admin: SupabaseClient,
  userId: string,
  tier: VipTier | undefined,
  name: string
): Promise<ResolveResult | null> {
  if (!tier) return null;
  const vip = await getVipStatus(admin, userId);
  if (vip.active && tierAtLeast(vip.tier, tier)) return null;
  return {
    ok: false,
    error: `${name} needs ${VIP_TIERS[tier].name} or higher.`,
    status: 403,
  };
}

export async function resolvePurchase(
  admin: SupabaseClient,
  userId: string,
  productId: string
): Promise<ResolveResult> {
  const { kind, id } = parsePurchaseKind(productId);
  const notForSale: ResolveResult = { ok: false, error: "This item isn't for sale right now.", status: 400 };

  if (kind === "product") {
    const product = getProduct(id);
    if (!product) return { ok: false, error: "Unknown product.", status: 400 };
    const price = await getPrice(admin, `product:${id}`);
    if (!price || !price.active || price.method !== "naira") return notForSale;
    return {
      ok: true,
      purchase: {
        kind,
        productId: product.id,
        name: product.name,
        description: product.description,
        priceNaira: price.amount,
        purpose: product.purpose,
        oncePerAccount: product.oncePerAccount === true,
      },
    };
  }

  if (kind === "venue") {
    const venue = getVenue(id);
    if (!venue) return { ok: false, error: "Unknown VIP place.", status: 400 };
    const price = await getPrice(admin, `venue:${id}`);
    if (!price || !price.active || price.method !== "naira") return notForSale;
    const tierProblem = await requireTier(admin, userId, venue.minTier, venue.name);
    if (tierProblem) return tierProblem;
    return {
      ok: true,
      purchase: {
        kind,
        productId: `venue:${venue.id}`,
        name: venue.name,
        description: venue.place,
        priceNaira: price.amount,
        purpose: "vip",
        oncePerAccount: false,
      },
    };
  }

  if (kind === "career") {
    const career = getCareer(id);
    if (!career) return { ok: false, error: "Unknown career.", status: 400 };
    const price = await getPrice(admin, `career:${id}`);
    if (!price || !price.active || price.method !== "naira") return notForSale;
    const tierProblem = await requireTier(admin, userId, career.vipTier, career.name);
    if (tierProblem) return tierProblem;
    return {
      ok: true,
      purchase: {
        kind,
        productId: `career:${career.id}`,
        name: `${career.name} licence`,
        description: "Unlocks this career permanently.",
        priceNaira: price.amount,
        purpose: "other",
        oncePerAccount: true,
      },
    };
  }

  const job = getJobById(id);
  if (!job) return { ok: false, error: "Unknown job.", status: 400 };
  const price = await getPrice(admin, `job:${id}`);
  if (!price || !price.active || price.method !== "naira") return notForSale;
  return {
    ok: true,
    purchase: {
      kind,
      productId: `job:${job.id}`,
      name: `${job.name} application`,
      description: "Application fee for this job.",
      priceNaira: price.amount,
      purpose: "other",
      oncePerAccount: false,
    },
  };
}
