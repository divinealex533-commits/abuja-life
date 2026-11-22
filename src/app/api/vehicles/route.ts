import { NextResponse } from "next/server";

import { PAINTS } from "@/lib/cars/style";
import { getVehicleById } from "@/lib/game/vehicles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, friendlyEconomyError, getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const SETUP = "Car buying isn't switched on yet. The admin needs to run 20261124_cars.sql in Supabase.";

/** GET → cars I own (saved on the server). */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false, vehicles: [] });
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("player_vehicles")
    .select("id, vehicle_id, paint, purchased_at")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: true });
  if (error) return NextResponse.json({ loggedIn: true, setupMissing: true, vehicles: [] });
  return NextResponse.json({ loggedIn: true, vehicles: data ?? [] });
}

/** POST { vehicleId, paint } → buy a car with game cash. */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const vehicle = getVehicleById(String(body?.vehicleId ?? ""));
  if (!vehicle) return NextResponse.json({ error: "Car not found." }, { status: 404 });
  const paint = PAINTS.some((p) => p.id === body?.paint) ? String(body.paint) : "black";

  const admin = createAdminSupabaseClient();

  const { data: state } = await admin
    .from("player_game_states")
    .select("reputation")
    .eq("user_id", user.id)
    .maybeSingle();
  if (Number(state?.reputation ?? 0) < vehicle.reputationRequired) {
    return NextResponse.json(
      { error: `You need ${vehicle.reputationRequired} reputation to buy the ${vehicle.name}.` },
      { status: 400 }
    );
  }

  // Check the table exists before taking money.
  const { error: tableError } = await admin.from("player_vehicles").select("id", { head: true, count: "exact" }).limit(1);
  if (tableError) return NextResponse.json({ error: SETUP }, { status: 503 });

  let snapshot;
  try {
    snapshot = await applyPlayerDelta(admin, user.id, { cash: -vehicle.price, reputation: 1 });
  } catch (err) {
    return NextResponse.json({ error: friendlyEconomyError(err instanceof Error ? err.message : "") }, { status: 400 });
  }

  const { data: row, error } = await admin
    .from("player_vehicles")
    .insert({ user_id: user.id, vehicle_id: vehicle.id, paint, price_paid: vehicle.price })
    .select("id, vehicle_id, paint, purchased_at")
    .single();

  if (error) {
    await applyPlayerDelta(admin, user.id, { cash: vehicle.price, reputation: -1 }).catch(() => null);
    return NextResponse.json({ error: "Couldn't complete the purchase. You weren't charged." }, { status: 500 });
  }

  return NextResponse.json({ success: true, vehicle: row, player: snapshot });
}
