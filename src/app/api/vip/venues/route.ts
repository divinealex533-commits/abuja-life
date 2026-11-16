import { NextResponse } from "next/server";

import { getPrice } from "@/lib/pricing/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { tierAtLeast, VIP_TIERS } from "@/lib/vip/catalog";
import { describeReward } from "@/lib/vip/perks";
import {
  applyPlayerDelta,
  friendlyEconomyError,
  getRequestUser,
  getVipStatus,
  releaseDailyUse,
  reserveDailyUse,
} from "@/lib/vip/server";
import { getVenue } from "@/lib/vip/venues";

/**
 * POST /api/vip/venues { venueId }
 * Book a VIP place. If the admin set it to game cash, the cash is
 * taken and the reward given right here. If it's set to real Naira,
 * the response tells the browser to open Paystack instead.
 */
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const venue = getVenue(String(body?.venueId ?? ""));

  if (!venue) {
    return NextResponse.json({ error: "Unknown VIP place." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const vip = await getVipStatus(admin, user.id);

  if (!vip.active || !tierAtLeast(vip.tier, venue.minTier)) {
    return NextResponse.json(
      {
        error: `${venue.name} is for ${VIP_TIERS[venue.minTier].name} members and above.`,
        code: "VIP_REQUIRED",
      },
      { status: 403 }
    );
  }

  const price = await getPrice(admin, `venue:${venue.id}`);

  if (!price || !price.active) {
    return NextResponse.json({ error: "This VIP place is closed right now." }, { status: 400 });
  }

  if (price.method === "naira") {
    return NextResponse.json({ checkout: true, productId: `venue:${venue.id}` });
  }

  const key = `venue:${venue.id}`;
  const reservation = await reserveDailyUse(admin, user.id, key, venue.usesPerDay);

  if (!reservation.ok) {
    return NextResponse.json(
      {
        error:
          reservation.reason === "LIMIT"
            ? "You've already booked this today. Come back tomorrow!"
            : "Please try again.",
      },
      { status: reservation.reason === "LIMIT" ? 429 : 409 }
    );
  }

  try {
    const cost = price.method === "cash" ? price.amount : 0;

    // Charge and reward in one atomic step: fails with
    // NOT_ENOUGH_CASH instead of letting cash go negative.
    const player = await applyPlayerDelta(admin, user.id, {
      ...venue.reward,
      cash: (venue.reward.cash ?? 0) - cost,
    });

    return NextResponse.json({
      success: true,
      paid: cost,
      rewardText: describeReward(venue.reward),
      player,
    });
  } catch (error) {
    await releaseDailyUse(admin, user.id, key, reservation.usedBefore);

    const message = error instanceof Error ? error.message : "";

    return NextResponse.json(
      {
        error: message.includes("NOT_ENOUGH_CASH")
          ? `You need ₦${price.amount.toLocaleString("en-NG")} game cash to book ${venue.name}.`
          : friendlyEconomyError(message),
        code: message.includes("NOT_ENOUGH_CASH") ? "NOT_ENOUGH_CASH" : undefined,
      },
      { status: 400 }
    );
  }
}
