import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();

    const [
      transactionsResult,
      settlementsResult,
      settingsResult,
    ] = await Promise.all([
      supabase
        .from("payment_transactions")
        .select(
          `
          id,
          user_id,
          provider,
          reference,
          amount,
          currency,
          purpose,
          status,
          provider_transaction_id,
          customer_email,
          paid_at,
          metadata,
          created_at
          `
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(200),

      supabase
        .from("revenue_settlements")
        .select(
          `
          id,
          provider,
          reference,
          amount,
          currency,
          status,
          settlement_date,
          notes,
          created_at
          `
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(100),

      supabase
        .from("admin_payment_settings")
        .select(
          `
          id,
          provider,
          is_enabled,
          currency,
          business_name,
          settlement_bank_name,
          settlement_account_name,
          settlement_account_last4,
          public_key_configured,
          secret_key_configured,
          updated_at
          `
        )
        .limit(1)
        .maybeSingle(),
    ]);

    if (transactionsResult.error) {
      return NextResponse.json(
        { error: transactionsResult.error.message },
        { status: 500 }
      );
    }

    if (settlementsResult.error) {
      return NextResponse.json(
        { error: settlementsResult.error.message },
        { status: 500 }
      );
    }

    if (settingsResult.error) {
      return NextResponse.json(
        { error: settingsResult.error.message },
        { status: 500 }
      );
    }

    const transactions = transactionsResult.data ?? [];
    const settlements = settlementsResult.data ?? [];

    const successfulTransactions = transactions.filter(
      (item) => item.status === "success"
    );

    const pendingTransactions = transactions.filter(
      (item) => item.status === "pending"
    );

    const failedTransactions = transactions.filter(
      (item) => item.status === "failed"
    );

    const refundedTransactions = transactions.filter(
      (item) => item.status === "refunded"
    );

    const totalSuccessful = successfulTransactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const totalPending = pendingTransactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const totalFailed = failedTransactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const totalRefunded = refundedTransactions.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    const completedSettlements = settlements.filter(
      (item) => item.status === "completed"
    );

    const totalSettled = completedSettlements.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0
    );

    return NextResponse.json({
      transactions,
      settlements,
      settings: settingsResult.data ?? null,

      summary: {
        totalSuccessful,
        totalPending,
        totalFailed,
        totalRefunded,
        totalSettled,
        transactionCount: transactions.length,
        successfulCount: successfulTransactions.length,
        pendingCount: pendingTransactions.length,
        failedCount: failedTransactions.length,
        refundedCount: refundedTransactions.length,
        settlementCount: settlements.length,
      },
    });
  } catch (error) {
    console.error("Admin payments error:", error);

    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }
}
