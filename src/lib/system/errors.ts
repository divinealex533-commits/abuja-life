// Abuja Life — server-side error log (Admin → Test Center).
// Server only.

import { createHash } from "crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export function errorFingerprint(source: string, message: string, path: string | null): string {
  // Group the same error on the same page, ignoring numbers/ids that change.
  const normalised = `${source}|${message}|${path ?? ""}`
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ":id")
    .replace(/\d+/g, "#")
    .slice(0, 500);
  return createHash("sha1").update(normalised).digest("hex");
}

export async function logError(params: {
  source: "client" | "server";
  message: string;
  stack?: string | null;
  path?: string | null;
  userId?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminSupabaseClient();
    await admin.rpc("abuja_log_error", {
      p_fingerprint: errorFingerprint(params.source, params.message, params.path ?? null),
      p_source: params.source,
      p_message: params.message.slice(0, 1000),
      p_stack: params.stack?.slice(0, 4000) ?? null,
      p_path: params.path?.slice(0, 300) ?? null,
      p_user_id: params.userId ?? null,
      p_user_agent: params.userAgent?.slice(0, 300) ?? null,
    });
  } catch {
    // Never let logging break the request.
  }
}

/** Log a caught server error with where it happened. */
export async function logServerError(where: string, error: unknown, userId?: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack ?? null : null;
  console.error(`[${where}]`, error);
  await logError({ source: "server", message: `${where}: ${message}`, stack, path: where, userId });
}
