// Abuja Life — deliver what a player paid for.
//
// Called by BOTH the Paystack webhook and the verify route after a
// payment is confirmed. It is safe to call many times for the same
// payment: the payment_fulfillments table (unique reference) makes
// sure each payment is delivered exactly once.

import type { SupabaseClient } from "@supabase/supabase-js";

import { AD_PLANS, isAdPlan } from "@/lib/business/catalog";
import { getCosmetic } from "@/lib/cosmetics/catalog";
import { getCareer } from "@/lib/game/careers";
import { getJobById } from "@/lib/game/jobs";
import { parsePurchaseKind } from "@/lib/payments/purchasables";
import { logServerError } from "@/lib/system/errors";
import { getProduct } from "@/lib/vip/catalog";
import { applyPlayerDelta } from "@/lib/vip/server";
import { getVenue } from "@/lib/vip/venues";

export interface FulfillableTransaction {
  user_id: string | null;
  reference: string;
  metadata: Record<string, unknown> | null;
}

export type FulfillmentResult =
  | { status: "delivered"; productId: string }
  | { status: "already_delivered"; productId: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export function getTransactionProductId(
  transaction: FulfillableTransaction
): string | null {
  const productId = transaction.metadata?.product_id;
  return typeof productId === "string" && productId ? productId : null;
}

async function claimFulfillment(
  admin: SupabaseClient,
  reference: string,
  userId: string,
  productId: string
): Promise<"claimed" | "already_delivered" | "busy"> {
  const { error: insertError } = await admin
    .from("payment_fulfillments")
    .insert({
      reference,
      user_id: userId,
      product_id: productId,
      status: "processing",
    });

  if (!insertError) {
    return "claimed";
  }

  // 23505 = unique violation: someone already started this payment.
  if (insertError.code !== "23505") {
    throw new Error(insertError.message);
  }

  const { data: existing } = await admin
    .from("payment_fulfillments")
    .select("status")
    .eq("reference", reference)
    .maybeSingle();

  if (existing?.status === "completed") {
    return "already_delivered";
  }

  if (existing?.status === "failed") {
    // Retry a previously failed delivery. Only one caller can win
    // this update because of the status filter.
    const { data: retried } = await admin
      .from("payment_fulfillments")
      .update({ status: "processing", error: null })
      .eq("reference", reference)
      .eq("status", "failed")
      .select("reference");

    return retried && retried.length > 0 ? "claimed" : "busy";
  }

  return "busy";
}

export async function fulfillPayment(
  admin: SupabaseClient,
  transaction: FulfillableTransaction
): Promise<FulfillmentResult> {
  const productId = getTransactionProductId(transaction);

  if (!productId) {
    return { status: "skipped", reason: "NO_PRODUCT" };
  }

  if (!transaction.user_id) {
    return { status: "failed", reason: "NO_USER" };
  }

  const { kind, id } = parsePurchaseKind(productId);

  const known =
    kind === "product"
      ? Boolean(getProduct(id))
      : kind === "venue"
        ? Boolean(getVenue(id))
        : kind === "career"
          ? Boolean(getCareer(id))
          : kind === "ad"
            ? isAdPlan(id.split(":")[0] ?? "") && Boolean(id.split(":")[1])
            : kind === "cosmetic"
              ? Boolean(getCosmetic(id))
              : kind === "partyvip"
                ? Boolean(id)
                : Boolean(getJobById(id));

  if (!known) {
    return { status: "failed", reason: "UNKNOWN_PRODUCT" };
  }

  const claim = await claimFulfillment(
    admin,
    transaction.reference,
    transaction.user_id,
    productId
  );

  if (claim === "already_delivered" || claim === "busy") {
    // Delivered already, or another request (webhook/verify) is on it.
    return { status: "already_delivered", productId };
  }

  const grantError = await deliver(admin, transaction.user_id, kind, id);

  if (grantError) {
    await logServerError(
      `payment-delivery ${productId}`,
      new Error(`${grantError} (ref ${transaction.reference})`),
      transaction.user_id
    );

    await admin
      .from("payment_fulfillments")
      .update({ status: "failed", error: grantError })
      .eq("reference", transaction.reference);

    return { status: "failed", reason: grantError };
  }

  await admin
    .from("payment_fulfillments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      error: null,
    })
    .eq("reference", transaction.reference);

  return { status: "delivered", productId };
}

/** Hand over the item. Returns an error message, or null when done. */
async function deliver(
  admin: SupabaseClient,
  userId: string,
  kind: ReturnType<typeof parsePurchaseKind>["kind"],
  id: string
): Promise<string | null> {
  try {
    if (kind === "product") {
      const product = getProduct(id)!;
      // VIP time and cash together, in one database transaction.
      const { error } = await admin.rpc("abuja_grant_purchase", {
        p_user_id: userId,
        p_tier: product.vipTier ?? null,
        p_days: product.vipDays ?? 0,
        p_cash: product.bonusCash ?? 0,
      });
      return error ? error.message : null;
    }

    if (kind === "venue") {
      const venue = getVenue(id)!;
      await applyPlayerDelta(admin, userId, venue.reward);
      return null;
    }

    if (kind === "ad") {
      const [planId, listingId] = id.split(":");
      if (!isAdPlan(planId)) return "UNKNOWN_PLAN";
      const { error } = await admin.rpc("abuja_extend_listing", {
        p_listing_id: listingId,
        p_owner: userId,
        p_plan: planId,
        p_days: AD_PLANS[planId].days,
      });
      return error ? error.message : null;
    }

    if (kind === "partyvip") {
      const { error } = await admin
        .from("party_guests")
        .upsert(
          { party_id: id, user_id: userId, vip: true, last_seen_at: new Date().toISOString() },
          { onConflict: "party_id,user_id" }
        );
      return error ? error.message : null;
    }

    if (kind === "cosmetic") {
      const { error } = await admin
        .from("player_cosmetics")
        .upsert(
          { user_id: userId, cosmetic_id: id },
          { onConflict: "user_id,cosmetic_id", ignoreDuplicates: true }
        );
      return error ? error.message : null;
    }

    if (kind === "career") {
      const { error: unlockError } = await admin
        .from("career_unlocks")
        .upsert(
          { user_id: userId, career_id: id, method: "naira" },
          { onConflict: "user_id,career_id", ignoreDuplicates: true }
        );
      if (unlockError) return unlockError.message;
    }

    // career or job: start working there straight away.
    await admin.rpc("abuja_ensure_player_row", { p_user_id: userId });
    const { error } = await admin
      .from("player_game_states")
      .update({ current_job_id: id })
      .eq("user_id", userId);
    return error ? error.message : null;
  } catch (error) {
    return error instanceof Error ? error.message : "DELIVERY_FAILED";
  }
}
