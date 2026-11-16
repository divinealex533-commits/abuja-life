"use client";

import { useEffect } from "react";

const sent = new Set<string>();

export function reportClientError(message: string, stack?: string | null) {
  const key = `${message}|${window.location.pathname}`;
  if (sent.has(key) || sent.size > 20) return; // max 20 different errors per visit
  sent.add(key);

  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message.slice(0, 1000), stack: stack?.slice(0, 4000) ?? null, path: window.location.pathname }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Sends crashes players hit to Admin → Test Center. Renders nothing. */
export default function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.message || "Unknown error", event.error instanceof Error ? event.error.stack : null);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportClientError(
        reason instanceof Error ? reason.message : `Unhandled promise rejection: ${String(reason).slice(0, 300)}`,
        reason instanceof Error ? reason.stack : null
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
