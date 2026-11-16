// Abuja Life — what can be bought with real money, and for how much.
//
// Product IDs the browser may send to /api/payments/paystack/initialize:
//   "vip_gold_month", "starter_pack", …   (store catalog)
//   "venue:hotel_presidential_suite"        (VIP place set to real Naira)
//   "career:surgeon" / "job:pilot"          (licence set to real Naira)
//
// The price always comes from Admin → Prices on the server.

import type { SupabaseClient } from "@supabase/supabase-js";

import { AD_PLANS, isAdPlan } from "@/lib/business/catalog";
import { getCosmetic } from "@/lib/cosmetics/catalog";
import { getCareer } from "@/lib/game/careers";
import { getJobById } from "@/lib/game/jobs";
import { getPrice } from "@/lib/pricing/server";
import { getProduct, tierAtLeast, VIP_TIERS, type VipTier } from "@/lib/vip/catalog";
import { getVipStatus } from "@/lib/vip/server";
import { getVenue } from "@/lib/vip/venues";

export type PurchaseKind = "product" | "venue" | "career" | "job" | "ad" | "cosmetic";

export interface ResolvedPurchase {
  kind: PurchaseKind;
  productId: string;
  name: string;
  description: string;
  priceNaira: number;
  purpose: "vip" | "wallet" | "other" | "business_promotion";
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
  if (prefix === "ad" && id) return { kind: "ad", id };
  if (prefix === "cosmetic" && id) return { kind: "cosmetic", id };
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

  if (kind === "ad") {
    // productId: "ad:<plan>:<listingId>"
    const [planId, listingId] = id.split(":");
    if (!planId || !listingId || !isAdPlan(planId)) {
      return { ok: false, error: "Unknown advert plan.", status: 400 };
    }
    const price = await getPrice(admin, `ad:${planId}`);
    if (!price || !price.active || price.method !== "naira") return notForSale;

    const { data: listing } = await admin
      .from("business_listings")
      .select("id, name, owner_id, status")
      .eq("id", listingId)
      .maybeSingle();

    if (!listing || listing.owner_id !== userId) {
      return { ok: false, error: "Business listing not found.", status: 404 };
    }

    return {
      ok: true,
      purchase: {
        kind,
        productId: `ad:${planId}:${listing.id}`,
        name: `${AD_PLANS[planId].name} — ${listing.name}`,
        description: `${AD_PLANS[planId].days} days of advertising in Abuja Life`,
        priceNaira: price.amount,
        purpose: "business_promotion",
        oncePerAccount: false,
      },
    };
  }

  if (kind === "cosmetic") {
    const cosmetic = getCosmetic(id);
    if (!cosmetic) return { ok: false, error: "Unknown style item.", status: 400 };
    const price = await getPrice(admin, `cosmetic:${id}`);
    if (!price || !price.active || price.method !== "naira") return notForSale;
    return {
      ok: true,
      purchase: {
        kind,
        productId: `cosmetic:${cosmetic.id}`,
        name: cosmetic.name,
        description: "Style shop item (looks only)",
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
