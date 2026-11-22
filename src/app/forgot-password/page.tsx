"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import AuthScene, { AuthCard, AuthLogo, GameButton, GameField } from "@/components/auth/AuthScene";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      setError(
        /rate limit|too many/i.test(text)
          ? "Too many reset emails. Wait a few minutes and try again."
          : text || "Couldn't send the reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScene>
      <AuthLogo subtitle="Forgot your password? No wahala." />
      <AuthCard>
        {sent ? (
          <div className="text-center">
            <div className="text-5xl">📬</div>
            <h2 className="mt-3 text-xl font-black">Check your email</h2>
            <p className="mt-2 text-sm text-white/60">
              If <b>{email}</b> has an Abuja Life account, a reset link is on its way. Open it on this phone and choose a
              new password. Check spam too.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wide">Reset password</h2>
            <GameField
              icon="📧"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm font-semibold text-red-200">
                ⚠️ {error}
              </div>
            )}
            <GameButton loading={loading} loadingText="Sending...">
              Send reset link
            </GameButton>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm font-black text-cyan-200">
          ← Back to login
        </Link>
      </AuthCard>
    </AuthScene>
  );
}
