"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthScene, { AuthCard, AuthLogo, GameButton, GameField, PasswordToggle } from "@/components/auth/AuthScene";
import { createClient } from "@/lib/supabase/client";

/** Opened from the reset email. Signs the player in with the link, then sets a new password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "ok" | "bad">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    (async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setReady("bad");
          return;
        }
      }
      // Older links put the session in the # part of the URL; the client picks it up itself.
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady("ok");
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      setReady("bad");
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    router.push("/game");
    router.refresh();
  }

  return (
    <AuthScene>
      <AuthLogo subtitle="Choose a new password." />
      <AuthCard>
        {ready === "checking" && <p className="text-center text-white/60">Checking your reset link...</p>}

        {ready === "bad" && (
          <div className="text-center">
            <div className="text-5xl">⌛</div>
            <p className="mt-3 font-black">This reset link has expired or was already used.</p>
            <Link href="/forgot-password" className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-3 font-black text-black">
              Send a new link
            </Link>
          </div>
        )}

        {ready === "ok" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <GameField
              icon="🔑"
              label="New password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              disabled={loading}
              trailing={<PasswordToggle shown={show} onToggle={() => setShow((v) => !v)} />}
            />
            <GameField
              icon="🔁"
              label="Type it again"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm font-semibold text-red-200">
                ⚠️ {error}
              </div>
            )}
            <GameButton loading={loading} loadingText="Saving...">
              Save &amp; enter the city
            </GameButton>
          </form>
        )}
      </AuthCard>
    </AuthScene>
  );
}
