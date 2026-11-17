import { NextResponse } from "next/server";

import {
  activityBlock,
  addToNeeds,
  getActivity,
  moodInfo,
  moodScore,
  placeStatus,
} from "@/lib/life/needs";
import { loadLife, saveNeeds } from "@/lib/life/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, friendlyEconomyError, getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const NOT_READY =
  "Needs aren't switched on yet. The admin needs to run 20261121_playable_life.sql in Supabase.";

function describe(life: Awaited<ReturnType<typeof loadLife>>) {
  const mood = moodScore(life.needs, life.energy, life.maxEnergy);
  const place = placeStatus(life.locationId);
  return {
    ready: life.ready,
    needs: life.needs,
    cash: life.cash,
    energy: life.energy,
    maxEnergy: life.maxEnergy,
    locationId: life.locationId,
    place: { open: place.open, text: place.text },
    mood,
    moodInfo: moodInfo(mood),
    serverTime: new Date().toISOString(),
  };
}

/** GET → my needs, mood, cash, energy and where I am. */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false });

  const admin = createAdminSupabaseClient();
  const life = await loadLife(admin, user.id);
  return NextResponse.json({ loggedIn: true, ...describe(life) });
}

/**
 * POST { activityId, locationId } → finish a life activity (eat, bath, sleep...).
 * Cost, energy and need changes are all decided here.
 */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const activity = getActivity(String(body?.activityId ?? ""));
  if (!activity) return NextResponse.json({ error: "Unknown activity." }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const life = await loadLife(admin, user.id);
  if (!life.ready) return NextResponse.json({ error: NOT_READY }, { status: 503 });

  // The browser may be a step ahead of the server on location; trust a known place id.
  const locationId =
    typeof body?.locationId === "string" && placeStatus(body.locationId).location
      ? body.locationId
      : life.locationId;

  const blocked = activityBlock(activity, locationId);
  if (blocked) return NextResponse.json({ error: `${activity.label}: ${blocked.toLowerCase()}.` }, { status: 400 });

  if (activity.cost > life.cash) {
    return NextResponse.json({ error: `You need ₦${activity.cost.toLocaleString()} for that.` }, { status: 400 });
  }

  try {
    const snapshot =
      activity.cost || activity.energy
        ? await applyPlayerDelta(admin, user.id, { cash: -activity.cost, energy: activity.energy ?? 0 })
        : { cash: life.cash, energy: life.energy, maxEnergy: life.maxEnergy };

    const needs = addToNeeds(life.needs, activity.needs);
    await saveNeeds(admin, user.id, needs);

    return NextResponse.json({
      success: true,
      player: snapshot,
      ...describe({ ...life, needs, cash: snapshot.cash, energy: snapshot.energy, maxEnergy: snapshot.maxEnergy }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: friendlyEconomyError(error instanceof Error ? error.message : "") },
      { status: 400 }
    );
  }
}
