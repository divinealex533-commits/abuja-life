import { NextResponse } from "next/server";

import { getCosmetic, type CosmeticKind } from "@/lib/cosmetics/catalog";
import { getPrice } from "@/lib/pricing/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { applyPlayerDelta, friendlyEconomyError, getRequestUser } from "@/lib/vip/server";

export const dynamic = "force-dynamic";

const KIND_COLUMN: Record<CosmeticKind, "name_style" | "avatar_frame" | "title"> = {
  name_style: "name_style",
  avatar_frame: "avatar_frame",
  title: "title",
};

/**
 * GET   /api/cosmetics → items I own + what I'm wearing
 * POST  /api/cosmetics { action: "buy", cosmeticId }    → buy (cash) or start Paystack (naira)
 * POST  /api/cosmetics { action: "equip", kind, cosmeticId | null } → wear / take off
 */
export async function GET() {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ loggedIn: false, owned: [], equipped: {} });

  const admin = createAdminSupabaseClient();
  const [{ data: owned }, { data: profile }] = await Promise.all([
    admin.from("player_cosmetics").select("cosmetic_id").eq("user_id", user.id),
    admin
      .from("player_profiles")
      .select("display_name, avatar, name_style, avatar_frame, title")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    loggedIn: true,
    owned: (owned ?? []).map((o) => o.cosmetic_id),
    profile: profile ?? null,
    equipped: {
      name_style: profile?.name_style ?? null,
      avatar_frame: profile?.avatar_frame ?? null,
      title: profile?.title ?? null,
    },
  });
}

export async function POST(request: Request) {
  const user = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const admin = createAdminSupabaseClient();

  if (body?.action === "buy") {
    const cosmetic = getCosmetic(String(body?.cosmeticId ?? ""));
    if (!cosmetic) return NextResponse.json({ error: "Unknown item." }, { status: 400 });

    const { data: already } = await admin
      .from("player_cosmetics")
      .select("cosmetic_id")
      .eq("user_id", user.id)
      .eq("cosmetic_id", cosmetic.id)
      .maybeSingle();

    if (already) return NextResponse.json({ error: "You already own this." }, { status: 409 });

    const price = await getPrice(admin, `cosmetic:${cosmetic.id}`);
    if (!price || !price.active) {
      return NextResponse.json({ error: "This item isn't for sale right now." }, { status: 400 });
    }

    if (price.method === "naira") {
      return NextResponse.json({ checkout: true, productId: `cosmetic:${cosmetic.id}` });
    }

    // Claim first so double-clicks can't charge twice.
    const { error: insertError } = await admin
      .from("player_cosmetics")
      .insert({ user_id: user.id, cosmetic_id: cosmetic.id });

    if (insertError) return NextResponse.json({ error: "You already own this." }, { status: 409 });

    if (price.method === "cash" && price.amount > 0) {
      try {
        const player = await applyPlayerDelta(admin, user.id, { cash: -price.amount });
        return NextResponse.json({ success: true, player });
      } catch (error) {
        await admin.from("player_cosmetics").delete().eq("user_id", user.id).eq("cosmetic_id", cosmetic.id);
        const message = error instanceof Error ? error.message : "";
        return NextResponse.json({ error: friendlyEconomyError(message) }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (body?.action === "equip") {
    const kind = String(body?.kind ?? "") as CosmeticKind;
    const column = KIND_COLUMN[kind];
    if (!column) return NextResponse.json({ error: "Unknown slot." }, { status: 400 });

    const cosmeticId = body?.cosmeticId ? String(body.cosmeticId) : null;

    if (cosmeticId) {
      const cosmetic = getCosmetic(cosmeticId);
      if (!cosmetic || cosmetic.kind !== kind) {
        return NextResponse.json({ error: "That item doesn't go there." }, { status: 400 });
      }
      const { data: owns } = await admin
        .from("player_cosmetics")
        .select("cosmetic_id")
        .eq("user_id", user.id)
        .eq("cosmetic_id", cosmeticId)
        .maybeSingle();
      if (!owns) return NextResponse.json({ error: "Buy it first." }, { status: 403 });
    }

    const { error } = await admin
      .from("player_profiles")
      .update({ [column]: cosmeticId, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return NextResponse.json({ error: "Could not update your style." }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
