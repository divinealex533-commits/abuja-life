import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type CheckResult = {
  id: string;
  name: string;
  category: string;
  status: "pass" | "warn" | "fail";
  message: string;
  durationMs: number;
};

async function runCheck(
  id: string,
  name: string,
  category: string,
  check: () => Promise<{
    status: "pass" | "warn" | "fail";
    message: string;
  }>
): Promise<CheckResult> {
  const started = Date.now();

  try {
    const result = await check();

    return {
      id,
      name,
      category,
      ...result,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      id,
      name,
      category,
      status: "fail",
      message:
        error instanceof Error
          ? error.message
          : "Unexpected diagnostic error.",
      durationMs: Date.now() - started,
    };
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    const supabase = createAdminSupabaseClient();

    const checks = await Promise.all([
      runCheck(
        "auth",
        "Admin authentication",
        "Security",
        async () => ({
          status: "pass",
          message: `Authenticated as ${
            admin.email ?? "administrator"
          }.`,
        })
      ),

      runCheck(
        "database",
        "Supabase database",
        "Infrastructure",
        async () => {
          const { error } = await supabase
            .from("player_profiles")
            .select("id", {
              count: "exact",
              head: true,
            });

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: "pass",
            message:
              "Database connection is responding.",
          };
        }
      ),

      runCheck(
        "profiles",
        "Player profiles",
        "Game Data",
        async () => {
          const { count, error } = await supabase
            .from("player_profiles")
            .select("id", {
              count: "exact",
              head: true,
            });

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: "pass",
            message: `${count ?? 0} player profile(s) available.`,
          };
        }
      ),

      runCheck(
        "game-state",
        "Persistent player state",
        "Game Data",
        async () => {
          const { count, error } = await supabase
            .from("player_game_states")
            .select("user_id", {
              count: "exact",
              head: true,
            });

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: "pass",
            message: `${count ?? 0} persistent game state(s) available.`,
          };
        }
      ),

      runCheck(
        "announcements",
        "Admin announcements",
        "Admin Systems",
        async () => {
          const { count, error } = await supabase
            .from("admin_announcements")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("is_active", true);

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: "pass",
            message: `${count ?? 0} active announcement(s).`,
          };
        }
      ),

      runCheck(
        "tasks",
        "Admin player tasks",
        "Admin Systems",
        async () => {
          const { count, error } = await supabase
            .from("admin_tasks")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("is_active", true);

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: "pass",
            message: `${count ?? 0} active player task(s).`,
          };
        }
      ),

      runCheck(
        "payments",
        "Payment database",
        "Payments",
        async () => {
          const { error } = await supabase
            .from("payment_transactions")
            .select("id", {
              count: "exact",
              head: true,
            });

          if (error) {
            return {
              status: "fail",
              message: error.message,
            };
          }

          return {
            status: process.env.PAYSTACK_SECRET_KEY
              ? "pass"
              : "warn",
            message: process.env.PAYSTACK_SECRET_KEY
              ? "Payment database and Paystack secret are configured."
              : "Payment database works, but PAYSTACK_SECRET_KEY is missing.",
          };
        }
      ),

      runCheck(
        "service-role",
        "Server payment access",
        "Security",
        async () => ({
          status:
            process.env.SUPABASE_SERVICE_ROLE_KEY
              ? "pass"
              : "fail",
          message:
            process.env.SUPABASE_SERVICE_ROLE_KEY
              ? "Server-side service role key is configured."
              : "SUPABASE_SERVICE_ROLE_KEY is missing.",
        })
      ),

      runCheck(
        "site-url",
        "Public site URL",
        "Configuration",
        async () => ({
          status:
            process.env.NEXT_PUBLIC_SITE_URL
              ? "pass"
              : "warn",
          message:
            process.env.NEXT_PUBLIC_SITE_URL
              ? "NEXT_PUBLIC_SITE_URL is configured."
              : "NEXT_PUBLIC_SITE_URL is not configured; request origin fallback will be used.",
        })
      ),
    ]);

    const pass = checks.filter(
      (item) => item.status === "pass"
    ).length;

    const warn = checks.filter(
      (item) => item.status === "warn"
    ).length;

    const fail = checks.filter(
      (item) => item.status === "fail"
    ).length;

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      summary: {
        total: checks.length,
        pass,
        warn,
        fail,
      },
      checks,
    });
  } catch (error) {
    console.error(
      "Admin testing diagnostics error:",
      error
    );

    const denied =
      error instanceof Error &&
      error.message === "ADMIN_ACCESS_REQUIRED";

    return NextResponse.json(
      {
        error: denied
          ? "Admin access required."
          : "Unable to run admin diagnostics.",
      },
      {
        status: denied ? 403 : 500,
      }
    );
  }
}
