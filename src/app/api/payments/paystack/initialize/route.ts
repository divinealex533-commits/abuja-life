import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolvePurchase } from "@/lib/payments/purchasables";

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
    const authSupabase =
      await createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } =
      await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be logged in to make a payment.",
        },
        { status: 401 }
      );
    }

    /*
     * Check the global Admin payment switch
     * BEFORE creating a transaction or contacting Paystack.
     *
     * Service-role access is server-side only.
     */
    const adminSupabase =
      createAdminSupabaseClient();

    const { data: gameSettings, error: settingsError } =
      await adminSupabase
        .from("admin_game_settings")
        .select("payments_enabled")
        .eq("id", 1)
        .single();

    if (settingsError) {
      console.error(
        "Payment settings lookup error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Payment settings could not be verified. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (gameSettings?.payments_enabled !== true) {
      return NextResponse.json(
        {
          error:
            "Payments are currently disabled by Abuja Life administration.",
          code: "PAYMENTS_DISABLED",
        },
        { status: 503 }
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY?.trim();

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "Payment service is not configured yet.",
        },
        { status: 503 }
      );
    }

    const body = await request
      .json()
      .catch(() => null);

    /*
     * The browser only sends a product ID.
     * Price, purpose and description come from the server-side
     * catalog, so a player can never choose how much to pay.
     */
    const productId =
      typeof body?.productId === "string"
        ? body.productId.trim()
        : "";

    const resolved = await resolvePurchase(
      adminSupabase,
      user.id,
      productId
    );

    if (!resolved.ok) {
      return NextResponse.json(
        {
          error: resolved.error,
        },
        { status: resolved.status }
      );
    }

    const product = {
      id: resolved.purchase.productId,
      oncePerAccount: resolved.purchase.oncePerAccount,
    };

    const amountNaira = resolved.purchase.priceNaira;
    const purpose = resolved.purchase.purpose;
    const description =
      `${resolved.purchase.name} — ${resolved.purchase.description}`.slice(0, 500);

    if (!ALLOWED_PURPOSES.has(purpose)) {
      return NextResponse.json(
        {
          error: "Invalid payment purpose.",
        },
        { status: 400 }
      );
    }

    if (product.oncePerAccount) {
      const { data: previous } = await adminSupabase
        .from("payment_fulfillments")
        .select("reference")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .eq("status", "completed")
        .limit(1);

      if (previous && previous.length > 0) {
        return NextResponse.json(
          {
            error: "You have already bought this one-time item.",
          },
          { status: 409 }
        );
      }
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
        { status: 400 }
      );
    }

    const amountKobo =
      Math.round(amountNaira * 100);

    const reference =
      generateReference();

    const baseUrl =
      getBaseUrl(request);

    const callbackUrl =
      `${baseUrl}/payment/paystack/callback`;

    /*
     * Service-role client is used ONLY on the server.
     * Never expose this key to the browser.
     */
    const { error: insertError } =
      await adminSupabase
        .from("payment_transactions")
        .insert({
          user_id: user.id,
          provider: "paystack",
          reference,
          amount: amountNaira,
          currency: "NGN",
          purpose,
          status: "pending",
          customer_email: email.trim(),
          metadata: {
            description,
            source: "abuja_life",
            product_id: product.id,
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
        { status: 500 }
      );
    }

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
            product_id: product.id,

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

      await adminSupabase
        .from("payment_transactions")
        .update({
          status: "failed",

          metadata: {
            description,

            source:
              "abuja_life",
            product_id: product.id,

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
        { status: 502 }
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
        { status: 502 }
      );
    }

    await adminSupabase
      .from("payment_transactions")
      .update({
        metadata: {
          description,

          source:
            "abuja_life",
          product_id: product.id,

          paystack_reference:
            paystackReference ||
            reference,

          paystack_access_code:
            typeof accessCode === "string"
              ? accessCode
              : null,
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
      { status: 500 }
    );
  }
}
