"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = displayName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError(
        "Please enter your display name."
      );
      return;
    }

    if (cleanName.length > 50) {
      setError(
        "Display name cannot exceed 50 characters."
      );
      return;
    }

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            displayName: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        if (
          data?.code ===
          "REGISTRATIONS_DISABLED"
        ) {
          setError(
            "New registrations are currently disabled. Please try again later."
          );
        } else {
          setError(
            data?.error ||
              "Unable to create your account."
          );
        }

        return;
      }

      if (
        data?.requiresEmailConfirmation
      ) {
        setSuccess(
          "Account created successfully. Please check your email to confirm your account."
        );

        setPassword("");
        setConfirmPassword("");
        return;
      }

      setSuccess(
        "Account created successfully. Redirecting..."
      );

      setTimeout(() => {
        router.push("/game");
        router.refresh();
      }, 700);
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050b0a] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-2xl font-black">
              A
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-orange-400">
              ABUJA LIFE
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Become a citizen of Abuja Life.
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm leading-5 text-green-300">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >
            <div>
              <label
                htmlFor="displayName"
                className="mb-2 block text-xs font-bold text-slate-400"
              >
                Display Name
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value
                  )
                }
                placeholder="Your player name"
                maxLength={50}
                autoComplete="name"
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-500/50 focus:bg-orange-500/[0.03]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-slate-400"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-500/50 focus:bg-orange-500/[0.03]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-slate-400"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-500/50 focus:bg-orange-500/[0.03]"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-bold text-slate-400"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-orange-500/50 focus:bg-orange-500/[0.03]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating account..."
                : "Create Abuja Life Account"}
            </button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block text-sm font-black text-orange-400 transition hover:text-orange-300"
            >
              Sign in →
            </Link>
          </div>

          <div className="mt-7 border-t border-white/5 pt-5 text-center">
            <Link
              href="/"
              className="text-[10px] font-bold uppercase tracking-widest text-slate-700 transition hover:text-slate-400"
            >
              ← Back to Abuja Life
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
