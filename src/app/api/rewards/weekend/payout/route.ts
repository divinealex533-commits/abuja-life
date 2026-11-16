import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getRequestUser, isWeekendKey } from "@/lib/vip/server";

/**
 * POST /api/rewards/weekend/payout
 * { weekendKey, bankName, accountNumber, accountName }
 * A weekend winner submits where to send their prize money.
 */
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const weekendKey = String(body?.weekendKey ?? "");
  const bankName = String(body?.bankName ?? "").trim().slice(0, 80);
  const accountNumber = String(body?.accountNumber ?? "").replace(/\s+/g, "");
  const accountName = String(body?.accountName ?? "").trim().slice(0, 120);

  if (!isWeekendKey(weekendKey)) {
    return NextResponse.json({ error: "Invalid weekend." }, { status: 400 });
  }

  if (bankName.length < 2 || accountName.length < 3) {
    return NextResponse.json({ error: "Enter your bank and account name." }, { status: 400 });
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ error: "Account number must be 10 digits (NUBAN)." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("weekend_winners")
    .update({
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      details_submitted_at: new Date().toISOString(),
      status: "ready_to_pay",
    })
    .eq("weekend_key", weekendKey)
    .eq("user_id", user.id)
    .in("status", ["awaiting_details", "ready_to_pay"])
    .select("place");

  if (error) {
    return NextResponse.json({ error: "Could not save your details." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "No unpaid prize found for you that weekend." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
