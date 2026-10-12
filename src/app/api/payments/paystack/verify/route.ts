import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const PAYSTACK_VERIFY_BASE =
  "https://api.paystack.co/transaction/verify";

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

export async function POST(request: Request) {
  try {
    const authSupabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const reference =
      typeof body?.reference === "string"
        ? body.reference.trim()
        : "";

    if (!reference) {
      return NextResponse.json(
        {
          error: "Payment reference is required.",
        },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY?.trim();

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "Payment service is not configured.",
        },
        { status: 503 }
      );
    }

    const adminSupabase =
      createAdminSupabaseClient();

    /*
     * Find the transaction we created before
     * sending the customer to Paystack.
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
          customer_email,
          metadata
          `
        )
        .eq("reference", reference)
        .maybeSingle();

    if (transactionError) {
      console.error(
        "Payment lookup error:",
        transactionError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find payment transaction.",
        },
        { status: 500 }
      );
    }

    if (!transaction) {
      return NextResponse.json(
        {
          error: "Payment transaction not found.",
        },
        { status: 404 }
      );
    }

    /*
     * A logged-in player can only verify
     * their own transaction.
     */
    if (transaction.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to verify this payment.",
        },
        { status: 403 }
      );
    }

    /*
     * If already successful, return the existing
     * result instead of processing revenue again.
     */
    if (transaction.status === "success") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        reference,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        purpose: transaction.purpose,
      });
    }

    /*
     * Ask Paystack directly for the authoritative
     * transaction status.
     */
    const paystackResponse =
      await fetch(
        `${PAYSTACK_VERIFY_BASE}/${encodeURIComponent(
          reference
        )}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${secretKey}`,
          },
          cache: "no-store",
        }
      );

    const paystackData =
      await paystackResponse
        .json()
        .catch(() => null);

    if (
      !paystackResponse.ok ||
      !paystackData?.status ||
      !paystackData?.data
    ) {
      return NextResponse.json(
        {
          error:
            paystackData?.message ||
            "Unable to verify payment.",
        },
        { status: 502 }
      );
    }

    const payment =
      paystackData.data;

    const paystackStatus =
      payment.status;

    const paystackAmount =
      Number(payment.amount);

    const expectedAmount =
      Math.round(
        Number(transaction.amount) * 100
      );

    const paystackCurrency =
      String(
        payment.currency || ""
      ).toUpperCase();

    const expectedCurrency =
      String(
        transaction.currency || "NGN"
      ).toUpperCase();

    /*
     * Never trust the browser's amount.
     * Compare our stored amount against
     * Paystack's verified amount.
     */
    if (
      paystackAmount !== expectedAmount ||
      paystackCurrency !== expectedCurrency
    ) {
      await adminSupabase
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            ...(transaction.metadata ?? {}),
            verification_error:
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
            "Payment verification failed because the amount or currency does not match.",
        },
        { status: 400 }
      );
    }

    /*
     * Paystack successful transaction.
     */
    if (paystackStatus === "success") {
      const paidAt =
        payment.paid_at ||
        payment.paidAt ||
        new Date().toISOString();

      const providerTransactionId =
        payment.id != null
          ? String(payment.id)
          : null;

      const updatedMetadata = {
        ...(transaction.metadata ?? {}),
        paystack_status:
          paystackStatus,
        paystack_channel:
          payment.channel ?? null,
        paystack_gateway_response:
          payment.gateway_response ?? null,
        paystack_verified_at:
          new Date().toISOString(),
      };

      /*
       * Mark the payment successful.
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
            metadata:
              updatedMetadata,
          })
          .eq(
            "reference",
            reference
          )
          .eq(
            "status",
            "pending"
          );

      if (updateError) {
        console.error(
          "Payment success update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Payment was verified but could not be recorded.",
          },
          { status: 500 }
        );
      }

      /*
       * Record the money as Abuja Life revenue.
       *
       * The unique reference index prevents the
       * same Paystack payment from becoming
       * duplicate revenue.
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
          "Revenue recording error:",
          revenueError
        );

        return NextResponse.json(
          {
            error:
              "Payment succeeded, but revenue recording failed.",
            paymentVerified: true,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        alreadyProcessed: false,
        paymentVerified: true,
        revenueRecorded: true,
        reference,
        amount:
          Number(transaction.amount),
        currency:
          transaction.currency,
        purpose:
          transaction.purpose,
      });
    }

    /*
     * Payment has not succeeded.
     */
    let status:
      | "pending"
      | "failed"
      | "cancelled"
      | "refunded" =
      "pending";

    if (
      paystackStatus ===
      "abandoned"
    ) {
      status = "cancelled";
    } else if (
      paystackStatus ===
      "failed"
    ) {
      status = "failed";
    }

    await adminSupabase
      .from("payment_transactions")
      .update({
        status,
        metadata: {
          ...(transaction.metadata ?? {}),
          paystack_status:
            paystackStatus,
          last_verified_at:
            new Date().toISOString(),
        },
      })
      .eq(
        "reference",
        reference
      );

    return NextResponse.json({
      success: false,
      paymentVerified: false,
      reference,
      status,
      paystackStatus,
      message:
        "Payment has not been completed.",
    });
  } catch (error) {
    console.error(
      "Paystack verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}
