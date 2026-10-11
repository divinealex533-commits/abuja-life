"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("🧑🏽");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const avatars = ["🧑🏽", "👨🏽", "👩🏽", "🧑🏾", "👨🏾", "👩🏾"];

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (!cleanUsername || !cleanDisplayName || !email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (cleanUsername.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setMessage(
        "Username can only contain lowercase letters, numbers and underscores."
      );
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("Account could not be created.");
      }

      const { error: profileError } = await supabase
        .from("player_profiles")
        .insert({
          id: data.user.id,
          username: cleanUsername,
          display_name: cleanDisplayName,
          avatar,
          current_location_id: "garki",
        });

      if (profileError) {
        if (profileError.code === "23505") {
          await supabase.auth.signOut();
          throw new Error(
            "That username is already taken. Please choose another one."
          );
        }

        throw profileError;
      }

      router.push("/game");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07111f] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <div className="text-5xl">🏙️</div>

            <h1 className="mt-4 text-3xl font-black">
              Create Your Abuja Life
            </h1>

            <p className="mt-2 text-sm text-white/50">
              Create your player and enter the city.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value.toLowerCase())
                }
                placeholder="e.g. abuja_boy"
                autoComplete="username"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
                disabled={loading}
              />

              <p className="mt-1 text-xs text-white/35">
                Letters, numbers and underscores only.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="What should players call you?"
                autoComplete="nickname"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-white/80">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-white/80">
                Choose Your Avatar
              </label>

              <div className="grid grid-cols-6 gap-2">
                {avatars.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    disabled={loading}
                    className={`rounded-2xl border p-3 text-2xl transition ${
                      avatar === item
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {message && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating Your Player..." : "Enter Abuja Life"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-cyan-300 hover:text-cyan-200"
            >
              Login
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-white/35 hover:text-white/60"
            >
              ← Back to Abuja Life
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}