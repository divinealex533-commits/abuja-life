import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { getLocationById } from "@/lib/game/locations";
import { formatPrice } from "@/lib/pricing/items";
import { getPrice } from "@/lib/pricing/server";
import { changeNeeds } from "@/lib/life/server";
import {
  MAX_SPRAY_PER_REQUEST,
  PARTY_COST,
  PARTY_HOURS,
  SPRAYS_PER_MINUTE,
  getTheme,
} from "@/lib/party/catalog";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, friendlyEconomyError, getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const SETUP = "Parties aren't switched on yet. The admin needs to run 20261123_parties.sql in Supabase.";

function missing(message?: string) {
  return Boolean(message && /does not exist|schema cache|Could not find the function/i.test(message));
}

/**
 * GET            → parties happening now
 * GET ?id=<uuid> → one party: guests, top sprayers, recent sprays
 */
export async function GET(request: Request) {
  const user = await getRequestUser();
  const admin = createAdminSupabaseClient();
  const id = new URL(request.url).searchParams.get("id");
  const nowIso = new Date().toISOString();

  if (!id) {
    const { data, error } = await admin
      .from("parties")
      .select("id, host_id, title, theme, location_id, ends_at, created_at")
      .gt("ends_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ setupMissing: missing(error.message), parties: [] });

    const ids = (data ?? []).map((p) => p.id);
    const hostIds = (data ?? []).map((p) => p.host_id);
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const [{ data: guests }, { data: hosts }, { data: sprays }] = await Promise.all([
      ids.length
        ? admin.from("party_guests").select("party_id").in("party_id", ids).gt("last_seen_at", since)
        : Promise.resolve({ data: [] as { party_id: string }[] }),
      hostIds.length
        ? admin.from("player_profiles").select("id, display_name").in("id", hostIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
      ids.length
        ? admin.from("party_sprays").select("party_id, amount").in("party_id", ids).limit(5000)
        : Promise.resolve({ data: [] as { party_id: string; amount: number }[] }),
    ]);

    return NextResponse.json({
      loggedIn: Boolean(user),
      parties: (data ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        theme: p.theme,
        locationId: p.location_id,
        locationName: getLocationById(p.location_id)?.name ?? "Abuja",
        endsAt: p.ends_at,
        hostName: (hosts ?? []).find((h) => h.id === p.host_id)?.display_name ?? "Player",
        mine: p.host_id === user?.id,
        guestsNow: (guests ?? []).filter((g) => g.party_id === p.id).length,
        sprayed: (sprays ?? []).filter((s) => s.party_id === p.id).reduce((sum, s) => sum + Number(s.amount), 0),
      })),
    });
  }

  const { data: party, error } = await admin.from("parties").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: missing(error.message) ? SETUP : error.message }, { status: 503 });
  if (!party) return NextResponse.json({ error: "Party not found." }, { status: 404 });

  const [{ data: guests }, { data: recent }] = await Promise.all([
    admin
      .from("party_guests")
      .select("*")
      .eq("party_id", id)
      .order("sprayed_total", { ascending: false })
      .limit(60),
    admin
      .from("party_sprays")
      .select("from_id, to_id, amount, created_at")
      .eq("party_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  const userIds = new Set<string>([party.host_id]);
  (guests ?? []).forEach((g) => userIds.add(g.user_id));
  (recent ?? []).forEach((s) => {
    userIds.add(s.from_id);
    userIds.add(s.to_id);
  });
  const { data: profiles } = await admin
    .from("player_profiles")
    .select("id, display_name, appearance")
    .in("id", [...userIds]);
  const who = (uid: string) => (profiles ?? []).find((p) => p.id === uid);

  return NextResponse.json({
    me: user?.id ?? null,
    party: {
      id: party.id,
      title: party.title,
      theme: party.theme,
      locationId: party.location_id,
      locationName: getLocationById(party.location_id)?.name ?? "Abuja",
      endsAt: party.ends_at,
      ended: new Date(party.ends_at).getTime() <= Date.now(),
      hostId: party.host_id,
      hostName: who(party.host_id)?.display_name ?? "Player",
    },
    guests: (guests ?? []).map((g) => ({
      id: g.user_id,
      name: who(g.user_id)?.display_name ?? "Player",
      appearance: who(g.user_id)?.appearance ?? null,
      sprayed: Number(g.sprayed_total),
      received: Number(g.received_total),
      vip: Boolean(g.vip),
    })),
    vipPrice: await getPrice(admin, "partyvip:section").then((p) => (p && p.active ? formatPrice(p) : null), () => null),
    recent: (recent ?? []).map((s) => ({
      from: who(s.from_id)?.display_name ?? "Player",
      to: who(s.to_id)?.display_name ?? "Player",
      amount: Number(s.amount),
      at: s.created_at,
    })),
  });
}

/**
 * POST { action: "create", title, theme, locationId }
 * POST { action: "join", partyId }
 * POST { action: "spray", partyId, toId, amount }
 * POST { action: "vibe", partyId }   → fun + social while you're at the party
 */
export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");
  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  if (action === "create") {
    const title = String(body?.title ?? "").trim().slice(0, 50);
    if (!title) return NextResponse.json({ error: "Give your party a name." }, { status: 400 });
    const theme = getTheme(String(body?.theme ?? "")).id;
    const locationId = getLocationById(String(body?.locationId ?? "")) ? String(body?.locationId) : "wuse-2";

    const { data: existing, error: existingError } = await admin
      .from("parties")
      .select("id")
      .eq("host_id", user.id)
      .gt("ends_at", nowIso)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: missing(existingError.message) ? SETUP : existingError.message }, { status: 503 });
    if (existing) return NextResponse.json({ error: "You already have a party going.", partyId: existing.id }, { status: 400 });

    try {
      const snapshot = await applyPlayerDelta(admin, user.id, { cash: -PARTY_COST });
      const { data: party, error } = await admin
        .from("parties")
        .insert({
          host_id: user.id,
          title,
          theme,
          location_id: locationId,
          ends_at: new Date(Date.now() + PARTY_HOURS * 3_600_000).toISOString(),
        })
        .select("id")
        .single();
      if (error || !party) {
        await applyPlayerDelta(admin, user.id, { cash: PARTY_COST });
        return NextResponse.json({ error: "Couldn't start the party." }, { status: 500 });
      }
      await admin.from("party_guests").insert({ party_id: party.id, user_id: user.id });
      return NextResponse.json({ success: true, partyId: party.id, player: snapshot });
    } catch (err) {
      return NextResponse.json({ error: friendlyEconomyError(err instanceof Error ? err.message : "") }, { status: 400 });
    }
  }

  const partyId = String(body?.partyId ?? "");
  const { data: party, error: partyError } = await admin
    .from("parties")
    .select("id, host_id, ends_at")
    .eq("id", partyId)
    .maybeSingle();
  if (partyError) return NextResponse.json({ error: missing(partyError.message) ? SETUP : partyError.message }, { status: 503 });
  if (!party) return NextResponse.json({ error: "Party not found." }, { status: 404 });
  if (new Date(party.ends_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This party has ended." }, { status: 400 });
  }

  if (action === "join") {
    await admin
      .from("party_guests")
      .upsert({ party_id: partyId, user_id: user.id, last_seen_at: nowIso }, { onConflict: "party_id,user_id" });
    return NextResponse.json({ success: true });
  }

  if (action === "vip") {
    const grant = async () => {
      const { error } = await admin
        .from("party_guests")
        .upsert({ party_id: partyId, user_id: user.id, vip: true, last_seen_at: nowIso }, { onConflict: "party_id,user_id" });
      if (error) {
        return NextResponse.json(
          { error: missing(error.message) ? "VIP isn't switched on yet. The admin needs to run 20261125_party_vip.sql." : error.message },
          { status: 503 }
        );
      }
      return NextResponse.json({ success: true, vip: true });
    };

    // Admins test everything for free. The host gets VIP at their own party.
    if (party.host_id === user.id || (await getAdminUser())) return grant();

    const price = await getPrice(admin, "partyvip:section");
    if (!price || !price.active) return NextResponse.json({ error: "VIP is closed at the moment." }, { status: 400 });
    if (price.method === "free") return grant();
    if (price.method === "naira") return NextResponse.json({ checkout: true, productId: `partyvip:${partyId}` });
    try {
      const snapshot = await applyPlayerDelta(admin, user.id, { cash: -price.amount });
      const res = await grant();
      if (res.status !== 200) await applyPlayerDelta(admin, user.id, { cash: price.amount }).catch(() => null);
      return res.status === 200 ? NextResponse.json({ success: true, vip: true, player: snapshot }) : res;
    } catch (err) {
      return NextResponse.json({ error: friendlyEconomyError(err instanceof Error ? err.message : "") }, { status: 400 });
    }
  }

  if (action === "vibe") {
    const { data: guest } = await admin
      .from("party_guests")
      .select("last_vibe_at")
      .eq("party_id", partyId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!guest) return NextResponse.json({ error: "Join the party first." }, { status: 400 });
    await admin.from("party_guests").update({ last_seen_at: nowIso }).eq("party_id", partyId).eq("user_id", user.id);
    if (guest.last_vibe_at && Date.now() - new Date(guest.last_vibe_at).getTime() < 55_000) {
      return NextResponse.json({ success: true, boosted: false });
    }
    await admin.from("party_guests").update({ last_vibe_at: nowIso }).eq("party_id", partyId).eq("user_id", user.id);
    const needs = await changeNeeds(admin, user.id, { fun: 8, social: 8, hunger: -1 });
    return NextResponse.json({ success: true, boosted: true, needs });
  }

  if (action === "spray") {
    const toId = String(body?.toId ?? "");
    const amount = Math.floor(Number(body?.amount));
    if (!Number.isFinite(amount) || amount < 100 || amount > MAX_SPRAY_PER_REQUEST) {
      return NextResponse.json({ error: "Spray between ₦100 and ₦100,000 at a time." }, { status: 400 });
    }
    if (toId === user.id) return NextResponse.json({ error: "You can't spray yourself 😅" }, { status: 400 });

    const { data: target } = await admin
      .from("party_guests")
      .select("user_id")
      .eq("party_id", partyId)
      .eq("user_id", toId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "They're not at this party." }, { status: 400 });

    const { count } = await admin
      .from("party_sprays")
      .select("id", { count: "exact", head: true })
      .eq("from_id", user.id)
      .gt("created_at", new Date(Date.now() - 60_000).toISOString());
    if ((count ?? 0) >= SPRAYS_PER_MINUTE) {
      return NextResponse.json({ error: "Slow down! Let the money land first." }, { status: 429 });
    }

    // Make sure the sprayer is on the guest list (totals are kept there).
    await admin
      .from("party_guests")
      .upsert({ party_id: partyId, user_id: user.id, last_seen_at: nowIso }, { onConflict: "party_id,user_id" });

    const { data: cash, error } = await admin.rpc("abuja_party_spray", {
      p_party_id: partyId,
      p_from: user.id,
      p_to: toId,
      p_amount: amount,
    });
    if (error) {
      if (missing(error.message)) return NextResponse.json({ error: SETUP }, { status: 503 });
      return NextResponse.json({ error: friendlyEconomyError(error.message) }, { status: 400 });
    }
    // Spraying is fun.
    await changeNeeds(admin, user.id, { fun: 2, social: 2 });
    return NextResponse.json({ success: true, cash: Number(cash) });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
