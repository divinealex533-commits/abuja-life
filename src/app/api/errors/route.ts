import { NextResponse } from "next/server";

import { logError } from "@/lib/system/errors";
import { getRequestUser } from "@/lib/vip/server";

/**
 * POST /api/errors { message, stack?, path? }
 * Browsers report errors players hit. Grouped in Admin → Test Center.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim();

  if (!message || message.length > 2000) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Ignore noise from browser extensions and cancelled requests.
  if (/extension:\/\/|ResizeObserver loop|AbortError|Load failed|NetworkError/i.test(`${message} ${body?.stack ?? ""}`)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const user = await getRequestUser().catch(() => null);

  await logError({
    source: "client",
    message,
    stack: typeof body?.stack === "string" ? body.stack : null,
    path: typeof body?.path === "string" ? body.path : null,
    userId: user?.id ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
