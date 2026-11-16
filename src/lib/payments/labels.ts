// Abuja Life — friendly names for purchased product IDs (client-safe).

import { AD_PLANS, isAdPlan } from "@/lib/business/catalog";
import { getCosmetic } from "@/lib/cosmetics/catalog";
import { getCareer } from "@/lib/game/careers";
import { getJobById } from "@/lib/game/jobs";
import { getProduct } from "@/lib/vip/catalog";
import { getVenue } from "@/lib/vip/venues";

export function describePurchase(
  productId: string | null | undefined
): { name: string; href: string; cta: string } | null {
  if (!productId) return null;

  const [prefix, ...rest] = productId.split(":");
  const id = rest.join(":");

  if (prefix === "venue") {
    const venue = getVenue(id);
    return venue ? { name: `${venue.name} booking`, href: "/vip", cta: "Back to VIP" } : null;
  }

  if (prefix === "career") {
    const career = getCareer(id);
    return career
      ? { name: `${career.name} licence`, href: `/careers/${career.id}`, cta: "Start working" }
      : null;
  }

  if (prefix === "ad") {
    const planId = rest[0] ?? "";
    return isAdPlan(planId)
      ? { name: `${AD_PLANS[planId].name} advert`, href: "/advertise/my", cta: "See my business" }
      : null;
  }

  if (prefix === "cosmetic") {
    const cosmetic = getCosmetic(id);
    return cosmetic ? { name: cosmetic.name, href: "/style", cta: "Wear it now" } : null;
  }

  if (prefix === "job") {
    const job = getJobById(id);
    return job ? { name: `${job.name} job`, href: job.id === "shopkeeper" ? "/jobs/Shopkeeper" : `/jobs/${job.id}`, cta: "Start working" } : null;
  }

  const product = getProduct(productId);
  return product ? { name: product.name, href: "/vip", cta: "See my VIP" } : null;
}
