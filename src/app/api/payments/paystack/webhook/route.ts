import { NextResponse } from "next/server";
import crypto from "crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PAYSTACK_SECRET_ENV =
  "PAYSTACK_SECRET_KEY";

function getRevenueSource(purpose: string) {
  switch (purpose) {
    case "vip":
      return "vip";

    case "marketplace":
      return "marketplace";

    case "business_promotion":
      return "business_promotion";

    case "sponsored_event":
      return "sponsored_event";

    default:
      return "other";
  }
}

function verifySignature(
  body: string,
  signature: string,
  secret: string
) {
  const expected =
    crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(
  request: Request
) {
  try {
    const secretKey =
      process.env[
        PAYSTACK_SECRET_ENV
      ]?.trim();

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Webhook is not configured.",
        },
        { status: 503 }
      );
    }

    /*
     * IMPORTANT:
     * Read the raw body before parsing JSON.
     * Paystack signs the exact raw payload.
     */
    const rawBody =
      await request.text();

    const signature =
      request.headers.get(
        "x-paystack-signature"
      );

    if (!signature) {
      return NextResponse.json(
        {
          error:
            "Missing Paystack signature.",
        },
        { status: 401 }
      );
    }

    let validSignature = false;

    try {
      validSignature =
        verifySignature(
          rawBody,
          signature,
          secretKey
        );
    } catch {
      validSignature = false;
    }

    if (!validSignature) {
      return NextResponse.json(
        {
          error:
            "Invalid Paystack signature.",
        },
        { status: 401 }
      );
    }

    const event =
      JSON.parse(rawBody);

    /*
     * We only process successful charges.
     */
    if (
      event?.event !==
      "charge.success"
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    const payment =
      event?.data;

    const reference =
      typeof payment?.reference ===
      "string"
        ? payment.reference.trim()
        : "";

    if (!reference) {
      return NextResponse.json(
        {
          error:
            "Payment reference missing.",
        },
        { status: 400 }
      );
    }

    const adminSupabase =
      createAdminSupabaseClient();

    /*
     * Find our original transaction.
     */
    const {
      data: transaction,
      error: transactionError,
    } =
      await adminSupabase
        .from("payment_transactions")
        .select(
          `
          id,
          user_id,
          reference,
          amount,
          currency,
          purpose,
          status,
          metadata
          `
        )
        .eq(
          "reference",
          reference
        )
        .maybeSingle();

    if (transactionError) {
      console.error(
        "Webhook transaction lookup error:",
        transactionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to locate transaction.",
        },
        { status: 500 }
      );
    }

    /*
     * Unknown references are rejected rather than
     * creating arbitrary revenue records.
     */
    if (!transaction) {
      return NextResponse.json(
        {
          error:
            "Unknown payment reference.",
        },
        { status: 404 }
      );
    }

    const paystackAmount =
      Number(payment?.amount);

    const expectedAmount =
      Math.round(
        Number(transaction.amount) * 100
      );

    const paystackCurrency =
      String(
        payment?.currency || ""
      ).toUpperCase();

    const expectedCurrency =
      String(
        transaction.currency || "NGN"
      ).toUpperCase();

    /*
     * Never record money unless Paystack's
     * amount and currency match our transaction.
     */
    if (
      paystackAmount !==
        expectedAmount ||
      paystackCurrency !==
        expectedCurrency
    ) {
      console.error(
        "Webhook amount/currency mismatch:",
        {
          reference,
          paystackAmount,
          expectedAmount,
          paystackCurrency,
          expectedCurrency,
        }
      );

      await adminSupabase
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            ...(transaction.metadata ??
              {}),
            webhook_error:
              "AMOUNT_OR_CURRENCY_MISMATCH",
            paystack_amount:
              paystackAmount,
            expected_amount:
              expectedAmount,
            paystack_currency:
              paystackCurrency,
            expected_currency:
              expectedCurrency,
          },
        })
        .eq(
          "reference",
          reference
        );

      return NextResponse.json(
        {
          error:
            "Payment amount or currency mismatch.",
        },
        { status: 400 }
      );
    }

    const paidAt =
      payment?.paid_at ||
      new Date().toISOString();

    const providerTransactionId =
      payment?.id != null
        ? String(payment.id)
        : null;

    const metadata = {
      ...(transaction.metadata ??
        {}),

      paystack_event:
        event.event,

      paystack_status:
        payment?.status ?? null,

      paystack_channel:
        payment?.channel ?? null,

      paystack_gateway_response:
        payment?.gateway_response ??
        null,

      paystack_verified_at:
        new Date().toISOString(),
    };

    /*
     * Mark the payment successful.
     *
     * This is intentionally safe to run repeatedly.
     */
    const {
      error: updateError,
    } =
      await adminSupabase
        .from("payment_transactions")
        .update({
          status: "success",

          provider_transaction_id:
            providerTransactionId,

          paid_at: paidAt,

          metadata,
        })
        .eq(
          "reference",
          reference
        );

    if (updateError) {
      console.error(
        "Webhook payment update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to record successful payment.",
        },
        { status: 500 }
      );
    }

    /*
     * Record revenue.
     *
     * The unique reference index makes this
     * idempotent if Paystack sends the webhook
     * more than once.
     */
    const {
      error: revenueError,
    } =
      await adminSupabase
        .from("admin_revenue_events")
        .upsert(
          {
            user_id:
              transaction.user_id,

            source:
              getRevenueSource(
                transaction.purpose
              ),

            description:
              `Paystack payment — ${transaction.purpose}`,

            amount:
              Number(transaction.amount),

            currency:
              transaction.currency,

            reference,

            status:
              "completed",

            metadata: {
              payment_transaction_id:
                transaction.id,

              provider:
                "paystack",

              provider_transaction_id:
                providerTransactionId,

              purpose:
                transaction.purpose,

              source:
                "paystack_webhook",
            },
          },
          {
            onConflict:
              "reference",

            ignoreDuplicates:
              true,
          }
        );

    if (revenueError) {
      console.error(
        "Webhook revenue error:",
        revenueError
      );

      return NextResponse.json(
        {
          error:
            "Payment recorded but revenue recording failed.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      processed: true,
      paymentVerified: true,
      revenueRecorded: true,
      reference,
    });
  } catch (error) {
    console.error(
      "Paystack webhook error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}
