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
import CharacterAvatar from "@/components/character/CharacterAvatar";
import type { Appearance } from "@/lib/character/appearance";

// Three example citizens shown on the sign-up screen.
const SHOWCASE: Appearance[] = [
  { skin: "#8d5524", hair: "waves", hairColor: "#141414", outfit: "agbada", outfitColor: "#f8fafc", eyes: "happy", mouth: "grin", facialHair: "goatee", accessory: "cap" },
  { skin: "#5a3a22", hair: "braids", hairColor: "#2e1a10", outfit: "ankara", outfitColor: "#f59e0b", eyes: "round", mouth: "smile", facialHair: "none", accessory: "gele" },
  { skin: "#a86b3c", hair: "lowcut", hairColor: "#141414", outfit: "suit", outfitColor: "#111827", eyes: "sharp", mouth: "calm", facialHair: "beard", accessory: "shades" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Legacy emoji avatar column; the real look is designed on /character next.
  const avatar = "🧑🏽";

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

      router.push("/character?new=1");
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
    <AuthScene>
      <AuthLogo subtitle="Create your player and enter the city." />

      <AuthCard>
        {/* character showcase */}
        <div className="relative -mt-2 mb-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-indigo-500/20 via-fuchsia-500/10 to-amber-500/20 px-2 pt-3">
          <div className="flex items-end justify-center gap-1">
            {SHOWCASE.map((look, i) => (
              <div key={i} className={i === 1 ? "z-10 -mx-2" : "opacity-80"}>
                <CharacterAvatar appearance={look} size={i === 1 ? 150 : 118} />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0f24] to-transparent px-3 pb-2.5 pt-8 text-center">
            <p className="text-xs font-bold text-white/80">
              Next you&apos;ll design your look: face, hair, agbada, gele, shades...
            </p>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <GameField
            icon="🎮"
            label="Username"
            hint="Letters, numbers and underscores only."
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
            placeholder="e.g. abuja_boy"
            autoComplete="username"
            disabled={loading}
          />

          <GameField
            icon="🪪"
            label="Display name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="What should players call you?"
            autoComplete="nickname"
            disabled={loading}
          />

          <GameField
            icon="📧"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
          />

          <GameField
            icon="🔑"
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            disabled={loading}
            trailing={
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />

          {message && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm font-semibold text-red-200">
              ⚠️ {message}
            </div>
          )}

          <GameButton loading={loading} loadingText="Creating your player...">
            ▶ Start my Abuja life
          </GameButton>
        </form>

        <p className="mt-4 text-center text-xs text-white/40">
          Your story starts in Garki. Hustle your way up.
        </p>

        <Link
          href="/login"
          className="mt-5 block rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3.5 text-center text-sm font-black uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-400/20"
        >
          Already a citizen? Log in →
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
