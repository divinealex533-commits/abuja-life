import { NextResponse } from "next/server";

import { getAdminUser } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/*
 * Admin → Payments & Settlements data.
 *
 * This file previously contained a copy of the admin page
 * (a React component), which is not a valid API route.
 * The page at /admin/payments calls this endpoint.
 */

function sum(
  rows: Array<{ amount: number | string; status: string }>,
  status: string
) {
  return rows
    .filter((row) => row.status === status)
    .reduce((total, row) => total + Number(row.amount || 0), 0);
}

function count(rows: Array<{ status: string }>, status: string) {
  return rows.filter((row) => row.status === status).length;
}

export async function GET() {
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();

    const [transactionsResult, settlementsResult, settingsResult] =
      await Promise.all([
        supabase
          .from("payment_transactions")
          .select(
            "id,user_id,provider,reference,amount,currency,purpose,status,provider_transaction_id,customer_email,paid_at,metadata,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(500),

        supabase
          .from("payment_settlements")
          .select(
            "id,provider,reference,amount,currency,status,settlement_date,notes,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(200),

        supabase
          .from("payment_settings")
          .select(
            "id,provider,is_enabled,currency,business_name,settlement_bank_name,settlement_account_name,settlement_account_last4,updated_at"
          )
          .eq("id", 1)
          .maybeSingle(),
      ]);

    if (transactionsResult.error) {
      throw transactionsResult.error;
    }

    const transactions = transactionsResult.data ?? [];

    // Settlements and settings are optional tables: an empty
    // result is shown if they have not been created yet.
    const settlements = settlementsResult.error
      ? []
      : settlementsResult.data ?? [];

    const storedSettings = settingsResult.error
      ? null
      : settingsResult.data;

    const settings = {
      id: storedSettings?.id ?? 1,
      provider: storedSettings?.provider ?? "paystack",
      is_enabled: storedSettings?.is_enabled ?? true,
      currency: storedSettings?.currency ?? "NGN",
      business_name: storedSettings?.business_name ?? "Abuja Life",
      settlement_bank_name:
        storedSettings?.settlement_bank_name ?? null,
      settlement_account_name:
        storedSettings?.settlement_account_name ?? null,
      settlement_account_last4:
        storedSettings?.settlement_account_last4 ?? null,
      public_key_configured: Boolean(
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim()
      ),
      secret_key_configured: Boolean(
        process.env.PAYSTACK_SECRET_KEY?.trim()
      ),
      updated_at: storedSettings?.updated_at ?? null,
    };

    const summary = {
      totalSuccessful: sum(transactions, "success"),
      totalPending: sum(transactions, "pending"),
      totalFailed: sum(transactions, "failed"),
      totalRefunded: sum(transactions, "refunded"),
      totalSettled: sum(settlements, "completed"),
      transactionCount: transactions.length,
      successfulCount: count(transactions, "success"),
      pendingCount: count(transactions, "pending"),
      failedCount: count(transactions, "failed"),
      refundedCount: count(transactions, "refunded"),
      settlementCount: settlements.length,
      completedSettlementCount: count(settlements, "completed"),
    };

    return NextResponse.json({
      transactions,
      settlements,
      settings,
      summary,
    });
  } catch (error) {
    console.error("Admin payments load error:", error);

    return NextResponse.json(
      { error: "Unable to load payments." },
      { status: 500 }
    );
  }
}
