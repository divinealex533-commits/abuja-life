"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ABUJA_LOCATIONS } from "@/lib/game/locations";
import { PARTY_COST, PARTY_HOURS, PARTY_THEMES, getTheme } from "@/lib/party/catalog";
import { syncPlayerSnapshot } from "@/lib/vip/client";

interface PartyItem {
  id: string;
  title: string;
  theme: string;
  locationName: string;
  endsAt: string;
  hostName: string;
  mine: boolean;
  guestsNow: number;
  sprayed: number;
}

export default function PartiesPage() {
  const router = useRouter();
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [setupMissing, setSetupMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", theme: "owambe", locationId: "wuse-2" });

  const load = useCallback(async () => {
    const d = await fetch("/api/parties", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    setParties(d?.parties ?? []);
    setSetupMissing(Boolean(d?.setupMissing));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(t);
  }, [load]);

  async function create() {
    setCreating(true);
    setError("");
    const r = await fetch("/api/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...form }),
    });
    const d = await r.json().catch(() => ({}));
    setCreating(false);
    if (r.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (!r.ok) {
      if (d.partyId) router.push(`/party/${d.partyId}`);
      setError(d.error || "Couldn't start the party.");
      return;
    }
    if (d.player) syncPlayerSnapshot(d.player);
    router.push(`/party/${d.partyId}`);
  }

  return (
    <main className="min-h-screen bg-[#0a0614] pb-28 text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-700/50 via-purple-900/40 to-[#0a0614] px-4 pb-8 pt-6">
        <div className="pointer-events-none absolute -right-10 -top-10 text-[140px] opacity-20">🪩</div>
        <div className="mx-auto max-w-4xl">
          <Link href="/game" className="text-xs font-black text-white/60">
            ← BACK TO CITY
          </Link>
          <h1 className="mt-3 text-4xl font-black">🎉 Parties in Abuja</h1>
          <p className="mt-2 max-w-lg text-sm text-white/70">
            Join a party, dance Shaku Shaku and Zanku, and spray money on other players. The money really lands in
            their pocket.
          </p>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="mt-5 rounded-2xl border-b-4 border-fuchsia-900 bg-gradient-to-b from-fuchsia-400 to-pink-600 px-6 py-3.5 font-black uppercase tracking-wider shadow-[0_10px_30px_-8px_rgba(236,72,153,0.8)] active:translate-y-0.5 active:border-b-2"
          >
            🎊 Throw a party · ₦{PARTY_COST.toLocaleString()}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        {setupMissing && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Parties aren&apos;t switched on yet. Admin: run 20261123_parties.sql in Supabase.
          </div>
        )}

        {showForm && (
          <section className="rounded-3xl border border-fuchsia-400/30 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">Your party</h2>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={50}
              placeholder="Name it, e.g. Tunde's 25th Owambe"
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none placeholder:text-white/30 focus:border-fuchsia-400/60"
            />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PARTY_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, theme: t.id })}
                  className={`rounded-2xl border p-3 text-left ${form.theme === t.id ? "border-fuchsia-300 bg-fuchsia-500/20" : "border-white/10 bg-black/20"}`}
                >
                  <div className="text-2xl">{t.icon}</div>
                  <div className="text-sm font-black">{t.label}</div>
                  <div className="text-[10px] text-white/50">{t.blurb}</div>
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs font-bold text-white/60">
              Where
              <select
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white"
              >
                {ABUJA_LOCATIONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.icon} {l.name}
                  </option>
                ))}
              </select>
            </label>
            {error && <div className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-bold text-red-200">{error}</div>}
            <button
              type="button"
              disabled={creating}
              onClick={create}
              className="mt-4 w-full rounded-2xl bg-fuchsia-500 py-3.5 font-black disabled:opacity-50"
            >
              {creating ? "Setting up the speakers..." : `Start party (₦${PARTY_COST.toLocaleString()}, lasts ${PARTY_HOURS}h)`}
            </button>
          </section>
        )}

        {loading ? (
          <p className="text-white/50">Looking for parties...</p>
        ) : parties.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="text-5xl">🔇</div>
            <p className="mt-3 font-black">No parties right now.</p>
            <p className="mt-1 text-sm text-white/50">Throw the first one and invite your friends.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {parties.map((p) => {
              const theme = getTheme(p.theme);
              const mins = Math.max(0, Math.floor((new Date(p.endsAt).getTime() - Date.now()) / 60_000));
              return (
                <Link
                  key={p.id}
                  href={`/party/${p.id}`}
                  className="relative overflow-hidden rounded-3xl border border-white/10 p-5 transition hover:border-fuchsia-300/50"
                  style={{ background: `linear-gradient(135deg, ${theme.colors[0]}33, ${theme.colors[2]}22 60%, transparent)` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-4xl">{theme.icon}</div>
                    <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-black uppercase">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
                    </span>
                  </div>
                  <h3 className="mt-2 text-xl font-black">{p.title}</h3>
                  <p className="text-xs text-white/60">
                    {theme.label} · by {p.hostName}
                    {p.mine ? " (you)" : ""} · 📍 {p.locationName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-black/40 px-2.5 py-1">👥 {p.guestsNow} here</span>
                    <span className="rounded-full bg-black/40 px-2.5 py-1">💸 ₦{p.sprayed.toLocaleString()} sprayed</span>
                    <span className="rounded-full bg-black/40 px-2.5 py-1">
                      ⏳ {Math.floor(mins / 60)}h {mins % 60}m
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-white py-2.5 text-center text-sm font-black text-black">Join the party →</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
