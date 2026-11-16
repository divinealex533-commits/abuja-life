"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import {
  ACCESSORIES,
  DEFAULT_APPEARANCE,
  EYES,
  FACIAL_HAIR,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTHS,
  OUTFIT_COLORS,
  OUTFITS,
  randomAppearance,
  SKIN_TONES,
  type Appearance,
} from "@/lib/character/appearance";

type Tab = "body" | "hair" | "face" | "outfit" | "extras";

const TABS: { id: Tab; label: string }[] = [
  { id: "body", label: "🧍🏾 Body" },
  { id: "hair", label: "💇🏾 Hair" },
  { id: "face", label: "🙂 Face" },
  { id: "outfit", label: "👔 Outfit" },
  { id: "extras", label: "🕶️ Extras" },
];

function Swatches({ colors, value, onPick }: { colors: readonly string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onPick(c)}
          className={`h-11 w-11 rounded-full border-4 transition ${value === c ? "scale-110 border-emerald-400" : "border-white/10"}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

function Options<T extends string>({ options, value, onPick }: { options: readonly { id: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${value === o.id ? "border-emerald-400 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Creator() {
  const router = useRouter();
  const params = useSearchParams();
  const isNew = params.get("new") === "1";

  const [look, setLook] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [name, setName] = useState("Player");
  const [tab, setTab] = useState<Tab>("body");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    fetch("/api/character", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.loggedIn) return setLoggedIn(false);
        setName(d.name);
        if (d.designed) setLook(d.appearance);
      })
      .catch(() => undefined);
  }, []);

  const set = <K extends keyof Appearance>(key: K, value: Appearance[K]) => setLook((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage(null);
    const r = await fetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearance: look }),
    });
    setSaving(false);
    if (!r.ok) {
      const d = await r.json().catch(() => null);
      setMessage(d?.error || "Couldn't save.");
      return;
    }
    if (isNew) router.push("/game");
    else setMessage("✅ Looking sharp! Your character is saved.");
  }

  if (!loggedIn) {
    return (
      <div className="p-10 text-center">
        <Link href="/login" className="font-black text-emerald-300">Log in to design your character →</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_1.2fr]">
      {/* Preview */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-emerald-500/15 via-[#0b1410] to-[#070b09] p-6">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.25),transparent_70%)]" />
        <div className="text-center text-xs font-black uppercase tracking-[0.3em] text-emerald-300/70">{isNew ? "Step 2 of 2" : "Your character"}</div>
        <h1 className="mt-1 text-center text-2xl font-black">{name}</h1>
        <div className="relative mt-4 flex justify-center">
          <CharacterAvatar appearance={look} size={340} />
        </div>
        <div className="relative mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => setLook(randomAppearance())} className="rounded-2xl border border-white/15 px-4 py-3 text-xs font-black">
            🎲 SURPRISE ME
          </button>
          <button type="button" onClick={() => setLook(DEFAULT_APPEARANCE)} className="rounded-2xl border border-white/15 px-4 py-3 text-xs font-black text-white/60">
            Reset
          </button>
        </div>
      </section>

      {/* Controls */}
      <section>
        <h2 className="text-3xl font-black">{isNew ? "Create your character" : "Change your look"}</h2>
        <p className="mt-1 text-sm text-white/50">This is how other players will see you around Abuja.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-xs font-black ${tab === t.id ? "bg-emerald-400 text-black" : "bg-white/5 text-white/70"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          {tab === "body" && (
            <div>
              <div className="mb-3 text-sm font-black">Skin tone</div>
              <Swatches colors={SKIN_TONES} value={look.skin} onPick={(c) => set("skin", c)} />
            </div>
          )}
          {tab === "hair" && (
            <>
              <div>
                <div className="mb-3 text-sm font-black">Hairstyle</div>
                <Options options={HAIR_STYLES} value={look.hair} onPick={(v) => set("hair", v)} />
              </div>
              <div>
                <div className="mb-3 text-sm font-black">Hair colour</div>
                <Swatches colors={HAIR_COLORS} value={look.hairColor} onPick={(c) => set("hairColor", c)} />
              </div>
            </>
          )}
          {tab === "face" && (
            <>
              <div>
                <div className="mb-3 text-sm font-black">Eyes</div>
                <Options options={EYES} value={look.eyes} onPick={(v) => set("eyes", v)} />
              </div>
              <div>
                <div className="mb-3 text-sm font-black">Mouth</div>
                <Options options={MOUTHS} value={look.mouth} onPick={(v) => set("mouth", v)} />
              </div>
              <div>
                <div className="mb-3 text-sm font-black">Facial hair</div>
                <Options options={FACIAL_HAIR} value={look.facialHair} onPick={(v) => set("facialHair", v)} />
              </div>
            </>
          )}
          {tab === "outfit" && (
            <>
              <div>
                <div className="mb-3 text-sm font-black">Outfit</div>
                <Options options={OUTFITS} value={look.outfit} onPick={(v) => set("outfit", v)} />
              </div>
              <div>
                <div className="mb-3 text-sm font-black">Colour</div>
                <Swatches colors={OUTFIT_COLORS} value={look.outfitColor} onPick={(c) => set("outfitColor", c)} />
              </div>
            </>
          )}
          {tab === "extras" && (
            <div>
              <div className="mb-3 text-sm font-black">Accessory</div>
              <Options options={ACCESSORIES} value={look.accessory} onPick={(v) => set("accessory", v)} />
            </div>
          )}
        </div>

        {message && <div className="mt-4 rounded-2xl bg-white/5 p-4 text-sm font-bold">{message}</div>}

        <div className="mt-6 flex gap-3">
          <button type="button" disabled={saving} onClick={save} className="flex-1 rounded-2xl bg-emerald-400 py-4 text-sm font-black text-black disabled:opacity-50">
            {saving ? "SAVING…" : isNew ? "START PLAYING →" : "SAVE MY LOOK"}
          </button>
          {isNew && (
            <Link href="/game" className="rounded-2xl border border-white/15 px-5 py-4 text-sm font-black text-white/60">Skip</Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CharacterPage() {
  return (
    <main className="min-h-screen bg-[#070b09] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070b09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">🧍🏾 Character</div>
          <Link href="/style" className="text-xs font-black text-fuchsia-300">Style shop →</Link>
        </div>
      </nav>
      <Suspense fallback={<div className="p-10 text-center text-white/50">Loading…</div>}>
        <Creator />
      </Suspense>
    </main>
  );
}
