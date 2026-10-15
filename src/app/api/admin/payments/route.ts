import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

const ALLOWED_PROVIDERS = ["paystack"] as const;
const ALLOWED_CURRENCIES = ["NGN"] as const;

type PaymentProvider = (typeof ALLOWED_PROVIDERS)[number];
type PaymentCurrency = (typeof ALLOWED_CURRENCIES)[number];

function isProvider(value: unknown): value is PaymentProvider {
  return (
    typeof value === "string" &&
    ALLOWED_PROVIDERS.includes(value as PaymentProvider)
  );
}

function isCurrency(value: unknown): value is PaymentCurrency {
  return (
    typeof value === "string" &&
    ALLOWED_CURRENCIES.includes(value as PaymentCurrency)
  );
}

function cleanText(
  value: unknown,
  maxLength: number
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function safeNumber(value: unknown): number {
  const number = Number(value ?? 0);

  return Number.isFinite(number) ? number : 0;
}

export async function GET() {
  try {
    await requireAdmin();

    const supabase = createAdminSupabaseClient();

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
      console.error(
        "Admin payment transactions error:",
        transactionsResult.error
      );

      return NextResponse.json(
        {
          error: "Unable to load payment transactions.",
        },
        {
          status: 500,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (settlementsResult.error) {
      console.error(
        "Admin payment settlements error:",
        settlementsResult.error
      );

      return NextResponse.json(
        {
          error: "Unable to load payment settlements.",
        },
        {
          status: 500,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (settingsResult.error) {
      console.error(
        "Admin payment settings error:",
        settingsResult.error
      );

      return NextResponse.json(
        {
          error: "Unable to load payment settings.",
        },
        {
          status: 500,
          headers: NO_STORE_HEADERS,
        }
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
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    const totalPending = pendingTransactions.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    const totalFailed = failedTransactions.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    const totalRefunded = refundedTransactions.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    const completedSettlements = settlements.filter(
      (item) => item.status === "completed"
    );

    const totalSettled = completedSettlements.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    return NextResponse.json(
      {
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
          completedSettlementCount: completedSettlements.length,
        },
      },
      {
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Admin payments GET error:", error);

    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();

    const provider = body?.provider;
    const currency = body?.currency;

    if (!isProvider(provider)) {
      return NextResponse.json(
        {
          error: "Unsupported payment provider.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (!isCurrency(currency)) {
      return NextResponse.json(
        {
          error: "Unsupported payment currency.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (
      typeof body?.is_enabled !== "boolean"
    ) {
      return NextResponse.json(
        {
          error: "is_enabled must be a boolean.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    const businessName = cleanText(
      body?.business_name,
      120
    );

    const settlementBankName = cleanText(
      body?.settlement_bank_name,
      120
    );

    const settlementAccountName = cleanText(
      body?.settlement_account_name,
      120
    );

    const settlementAccountLast4 = cleanText(
      body?.settlement_account_last4,
      4
    );

    if (
      settlementAccountLast4 &&
      !/^\d{4}$/.test(settlementAccountLast4)
    ) {
      return NextResponse.json(
        {
          error:
            "Settlement account last 4 digits must contain exactly 4 numbers.",
        },
        {
          status: 400,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: existingSettings, error: existingError } =
      await supabase
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
          secret_key_configured
          `
        )
        .limit(1)
        .maybeSingle();

    if (existingError) {
      console.error(
        "Payment settings lookup error:",
        existingError
      );

      return NextResponse.json(
        {
          error: "Unable to load current payment settings.",
        },
        {
          status: 500,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    const settingsId = existingSettings?.id ?? 1;

    const updatePayload = {
      provider,
      is_enabled: body.is_enabled,
      currency,
      business_name:
        businessName ??
        existingSettings?.business_name ??
        null,
      settlement_bank_name:
        settlementBankName ??
        existingSettings?.settlement_bank_name ??
        null,
      settlement_account_name:
        settlementAccountName ??
        existingSettings?.settlement_account_name ??
        null,
      settlement_account_last4:
        settlementAccountLast4 ??
        existingSettings?.settlement_account_last4 ??
        null,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    };

    const { data: settings, error: updateError } =
      await supabase
        .from("admin_payment_settings")
        .update(updatePayload)
        .eq("id", settingsId)
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
        .maybeSingle();

    if (updateError) {
      console.error(
        "Payment settings update error:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to update payment settings.",
        },
        {
          status: 500,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (!settings) {
      return NextResponse.json(
        {
          error:
            "Payment settings record was not found.",
        },
        {
          status: 404,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (error) {
    console.error("Admin payments PATCH error:", error);

    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}
