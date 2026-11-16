import { NextResponse } from "next/server";

import { getJobById } from "@/lib/game/jobs";
import { getPrice } from "@/lib/pricing/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  applyPlayerDelta,
  type PlayerSnapshot,
  friendlyEconomyError,
  getRequestUser,
} from "@/lib/vip/server";

/**
 * POST /api/jobs/apply { jobId }
 * Apply for one of the classic jobs. Charges the application fee set
 * in Admin → Prices (game cash), or asks for a Paystack payment when
 * the fee is in real Naira. Re-applying to your current job is free.
 */
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const job = getJobById(String(body?.jobId ?? ""));

  if (!job) {
    return NextResponse.json({ error: "Unknown job." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  await admin.rpc("abuja_ensure_player_row", { p_user_id: user.id });

  const { data: state } = await admin
    .from("player_game_states")
    .select("current_job_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (state?.current_job_id === job.id) {
    return NextResponse.json({ success: true, alreadyEmployed: true, player: null });
  }

  const price = await getPrice(admin, `job:${job.id}`);

  if (!price || !price.active) {
    return NextResponse.json({ error: `${job.name} isn't hiring right now.` }, { status: 400 });
  }

  if (price.method === "naira") {
    return NextResponse.json({ checkout: true, productId: `job:${job.id}` });
  }

  let player: PlayerSnapshot | null = null;

  if (price.method === "cash" && price.amount > 0) {
    try {
      player = await applyPlayerDelta(admin, user.id, { cash: -price.amount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      return NextResponse.json(
        {
          error: message.includes("NOT_ENOUGH_CASH")
            ? `The ${job.name} application fee is ₦${price.amount.toLocaleString("en-NG")}. You don't have enough cash yet.`
            : friendlyEconomyError(message),
        },
        { status: 400 }
      );
    }
  }

  const { error } = await admin
    .from("player_game_states")
    .update({ current_job_id: job.id })
    .eq("user_id", user.id);

  if (error) {
    // Give the fee back if the job couldn't be saved.
    if (player && price.method === "cash") {
      await applyPlayerDelta(admin, user.id, { cash: price.amount }).catch(() => undefined);
    }
    return NextResponse.json({ error: "Could not save your new job." }, { status: 500 });
  }

  return NextResponse.json({ success: true, paid: price.method === "cash" ? price.amount : 0, player });
}
