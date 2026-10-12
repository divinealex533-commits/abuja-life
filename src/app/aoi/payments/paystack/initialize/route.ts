import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const PAYSTACK_URL =
  "https://api.paystack.co/transaction/initialize";

const ALLOWED_PURPOSES = new Set([
  "vip",
  "marketplace",
  "business_promotion",
  "sponsored_event",
  "wallet",
  "other",
]);

function generateReference() {
  return `ABJ-${Date.now()}-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 12)}`;
}

function getBaseUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const host =
    forwardedHost ||
    request.headers.get("host");

  const protocol =
    request.headers.get("x-forwarded-proto") ||
    "https";

  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const supabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to make a payment.",
        },
        {
          status: 401,
        }
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY?.trim();

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured."
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured yet.",
        },
        {
          status: 503,
        }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    const amountNaira = Number(
      body?.amount
    );

    const purpose =
      typeof body?.purpose === "string"
        ? body.purpose.trim()
        : "other";

    const description =
      typeof body?.description === "string"
        ? body.description.trim().slice(0, 500)
        : "";

    if (
      !Number.isFinite(amountNaira) ||
      amountNaira <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Payment amount must be greater than zero.",
        },
        {
          status: 400,
        }
      );
    }

    if (amountNaira > 10_000_000) {
      return NextResponse.json(
        {
          error:
            "Payment amount exceeds the allowed limit.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_PURPOSES.has(purpose)) {
      return NextResponse.json(
        {
          error: "Invalid payment purpose.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Paystack expects NGN amounts in kobo.
     *
     * Example:
     * ₦5,000 = 500000 kobo
     */
    const amountKobo = Math.round(
      amountNaira * 100
    );

    if (amountKobo <= 0) {
      return NextResponse.json(
        {
          error:
            "Payment amount is too small.",
        },
        {
          status: 400,
        }
      );
    }

    const email =
      user.email ||
      user.user_metadata?.email;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Your account does not have a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    const reference =
      generateReference();

    const baseUrl =
      getBaseUrl(request);

    const callbackUrl =
      `${baseUrl}/payment/paystack/callback`;

    /*
     * Create our internal transaction first.
     */
    const { error: insertError } =
      await supabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          provider: "paystack",
          reference,
          amount: amountNaira,
          currency: "NGN",
          purpose,
          status: "pending",
          customer_email: email,
          metadata: {
            description,
            source: "abuja_life",
          },
        });

    if (insertError) {
      console.error(
        "Payment transaction insert error:",
        insertError
      );

      return NextResponse.json(
        {
          error:
            "Unable to create payment transaction.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Initialize transaction with Paystack.
     *
     * The secret key stays server-side.
     */
    const paystackResponse =
      await fetch(PAYSTACK_URL, {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${secretKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),

          amount:
            String(amountKobo),

          currency: "NGN",

          reference,

          callback_url:
            callbackUrl,

          metadata: {
            user_id: user.id,

            purpose,

            description,

            internal_reference:
              reference,

            source:
              "abuja_life",
          },
        }),
      });

    const paystackData =
      await paystackResponse
        .json()
        .catch(() => null);

    if (
      !paystackResponse.ok ||
      !paystackData?.status ||
      !paystackData?.data
    ) {
      console.error(
        "Paystack initialization failed:",
        paystackData
      );

      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",

          metadata: {
            description,

            source:
              "abuja_life",

            paystack_error:
              paystackData?.message ||
              "Paystack initialization failed.",
          },
        })
        .eq(
          "reference",
          reference
        );

      return NextResponse.json(
        {
          error:
            paystackData?.message ||
            "Unable to initialize payment.",
        },
        {
          status: 502,
        }
      );
    }

    const authorizationUrl =
      paystackData.data.authorization_url;

    const accessCode =
      paystackData.data.access_code;

    const paystackReference =
      paystackData.data.reference;

    if (
      typeof authorizationUrl !== "string" ||
      !authorizationUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Paystack did not return a checkout URL.",
        },
        {
          status: 502,
        }
      );
    }

    /*
     * Store the Paystack reference/access code
     * without exposing the secret key.
     */
    await supabase
      .from("payment_transactions")
      .update({
        provider_transaction_id:
          typeof accessCode === "string"
            ? accessCode
            : null,

        metadata: {
          description,

          source:
            "abuja_life",

          paystack_reference:
            paystackReference ||
            reference,
        },
      })
      .eq(
        "reference",
        reference
      );

    return NextResponse.json({
      success: true,

      reference,

      authorizationUrl,

      accessCode:
        typeof accessCode === "string"
          ? accessCode
          : null,
    });
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to initialize payment.",
      },
      {
        status: 500,
      }
    );
  }
}
