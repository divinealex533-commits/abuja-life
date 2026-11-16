"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FramedAvatar, StyledName } from "@/components/cosmetics/StyledName";
import {
  COSMETIC_KIND_TITLES,
  COSMETICS,
  type Cosmetic,
  type CosmeticKind,
} from "@/lib/cosmetics/catalog";
import { usePrices } from "@/lib/pricing/client";
import { formatPrice } from "@/lib/pricing/items";
import { startCheckout, syncPlayerSnapshot } from "@/lib/vip/client";

type Equipped = Record<CosmeticKind, string | null>;

const KINDS: CosmeticKind[] = ["name_style", "avatar_frame", "title"];

export default function StyleShopPage() {
  const { prices } = usePrices();
  const [loggedIn, setLoggedIn] = useState(true);
  const [owned, setOwned] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Equipped>({ name_style: null, avatar_frame: null, title: null });
  const [profile, setProfile] = useState<{ display_name: string; avatar: string } | null>(null);
  const [preview, setPreview] = useState<Equipped | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/cosmetics", { cache: "no-store" });
    const d = await r.json().catch(() => null);
    setLoggedIn(d?.loggedIn !== false);
    setOwned(d?.owned ?? []);
    setEquipped(d?.equipped ?? { name_style: null, avatar_frame: null, title: null });
    setProfile(d?.profile ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = preview ?? equipped;

  async function post(payload: Record<string, unknown>) {
    const r = await fetch("/api/cosmetics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: r.ok, data: await r.json().catch(() => null) };
  }

  async function buy(item: Cosmetic) {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    setBusy(item.id);
    setMessage(null);
    const { ok, data } = await post({ action: "buy", cosmeticId: item.id });
    if (ok && data?.checkout) {
      const problem = await startCheckout(data.productId);
      if (problem) setMessage({ text: problem, ok: false });
      setBusy(null);
      return;
    }
    if (!ok) {
      setMessage({ text: data?.error || "Could not buy.", ok: false });
    } else {
      if (data?.player) syncPlayerSnapshot(data.player);
      setMessage({ text: `${item.name} is yours! Tap "Wear" to use it.`, ok: true });
      await load();
    }
    setBusy(null);
  }

  async function equip(kind: CosmeticKind, cosmeticId: string | null) {
    setBusy(`${kind}:${cosmeticId}`);
    setMessage(null);
    const { ok, data } = await post({ action: "equip", kind, cosmeticId });
    if (!ok) setMessage({ text: data?.error || "Could not update.", ok: false });
    setPreview(null);
    await load();
    setBusy(null);
  }

  return (
    <main className="min-h-screen bg-[#0d0712] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0712]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">✨ STYLE SHOP</div>
          <Link href="/vip" className="text-xs font-black text-amber-300">👑 VIP</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* PREVIEW */}
        <section className="rounded-[2rem] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/15 via-[#140a1c] to-cyan-500/10 p-8 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-300">How others see you in chat</div>
          <div className="mt-5 flex flex-col items-center gap-3">
            <FramedAvatar avatar={profile?.avatar ?? "🧑🏽"} frame={shown.avatar_frame} size="lg" />
            <StyledName
              name={profile?.display_name ?? "Your Name"}
              nameStyle={shown.name_style}
              title={shown.title}
              className="text-2xl"
            />
          </div>
          {preview && <div className="mt-3 text-xs font-bold text-white/50">Preview. Buy it to wear it.</div>}
          {!loggedIn && <Link href="/login" className="mt-4 inline-block text-sm font-black text-fuchsia-300">Log in to shop →</Link>}
        </section>

        {message && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${message.ok ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>
            {message.text}
          </div>
        )}

        {KINDS.map((kind) => (
          <section key={kind} className="mt-10">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-black">{COSMETIC_KIND_TITLES[kind]}</h2>
              {equipped[kind] && (
                <button type="button" onClick={() => equip(kind, null)} className="text-xs font-black text-white/50 hover:text-white">
                  Take off
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COSMETICS.filter((c) => c.kind === kind).map((item) => {
                const isOwned = owned.includes(item.id);
                const isWorn = equipped[kind] === item.id;
                const price = prices[`cosmetic:${item.id}`];
                if (price && !price.active && !isOwned) return null;

                return (
                  <article
                    key={item.id}
                    onMouseEnter={() => setPreview({ ...equipped, [kind]: item.id })}
                    onMouseLeave={() => setPreview(null)}
                    className={`rounded-3xl border p-5 transition ${isWorn ? "border-fuchsia-400/60 bg-fuchsia-400/10" : "border-white/10 bg-white/[0.03]"}`}
                  >
                    <div className="flex h-16 items-center justify-center">
                      {kind === "avatar_frame" ? (
                        <FramedAvatar avatar={profile?.avatar ?? "🧑🏽"} frame={item.id} />
                      ) : (
                        <StyledName
                          name={profile?.display_name ?? "Your Name"}
                          nameStyle={kind === "name_style" ? item.id : null}
                          title={kind === "title" ? item.id : null}
                          className="text-lg"
                        />
                      )}
                    </div>
                    <div className="mt-3 font-black">{item.name}</div>
                    <div className="text-xs text-white/45">
                      {isOwned ? "Owned" : formatPrice(price ?? { method: "naira", amount: item.defaultPriceNaira, active: true })}
                    </div>

                    {isOwned ? (
                      <button
                        type="button"
                        disabled={busy !== null || isWorn}
                        onClick={() => equip(kind, item.id)}
                        className="mt-4 w-full rounded-2xl bg-fuchsia-400 py-3 text-xs font-black text-black disabled:bg-white/10 disabled:text-white/40"
                      >
                        {isWorn ? "WEARING" : "WEAR"}
                      </button>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPreview({ ...equipped, [kind]: item.id })}
                          className="rounded-2xl border border-white/15 px-3 py-3 text-xs font-black sm:hidden"
                        >
                          Try
                        </button>
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => buy(item)}
                          className="flex-1 rounded-2xl bg-white py-3 text-xs font-black text-black hover:bg-white/90 disabled:opacity-50"
                        >
                          {busy === item.id ? "…" : "BUY"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <p className="mt-10 text-center text-xs text-white/35">
          Style items are looks only. They don&apos;t change gameplay. One-time purchase, yours forever.
        </p>
      </div>
    </main>
  );
}
