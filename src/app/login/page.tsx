"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthScene, {
  AuthCard,
  AuthLogo,
  GameButton,
  GameField,
  PasswordToggle,
} from "@/components/auth/AuthScene";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/game");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      const text = error instanceof Error ? error.message : "";

      setMessage(
        /invalid login credentials/i.test(text)
          ? "Wrong email or password. Check them, or tap Forgot password to set a new one."
          : /email not confirmed/i.test(text)
            ? "Please confirm your email first. Check your inbox for the link."
            : text || "Unable to log in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScene>
      <AuthLogo subtitle="Welcome back, citizen. The city has been waiting." />

      <AuthCard>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-wide">Continue your story</h2>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Abuja · Live
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <GameField
            icon="📧"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
          />

          <GameField
            icon="🔑"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            disabled={loading}
            trailing={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />

          <div className="-mt-1 text-right">
            <Link href="/forgot-password" className="text-xs font-black text-amber-200/80 hover:text-amber-100">
              Forgot password?
            </Link>
          </div>

          {message && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm font-semibold text-red-200">
              ⚠️ {message}
            </div>
          )}

          <GameButton loading={loading} loadingText="Entering the city...">
            ▶ Enter the city
          </GameButton>
        </form>

        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            ["💼", "Real jobs"],
            ["⚖️", "Courts & EFCC"],
            ["🏆", "Weekend prizes"],
          ].map(([icon, text]) => (
            <div key={text} className="rounded-xl border border-white/5 bg-white/[0.03] px-2 py-2.5">
              <div className="text-lg">{icon}</div>
              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">{text}</div>
            </div>
          ))}
        </div>

        <Link
          href="/register"
          className="mt-5 block rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3.5 text-center text-sm font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/20"
        >
          New here? Create your player →
        </Link>
      </AuthCard>

      <Link
        href="/"
        className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/70"
      >
        ← Back to Abuja Life
      </Link>
    </AuthScene>
  );
}
