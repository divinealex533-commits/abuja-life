"use client";

import { useCallback, useEffect, useState } from "react";

import {
  LIVE_PLATFORMS,
  PLATFORMS,
  cleanHandle,
  type LivePlatformId,
  type Socials,
} from "@/lib/social/platforms";

interface MyLive {
  platform: LivePlatformId;
  title: string;
  startedAt: string;
}

/** Profile section: link social accounts and go live. */
export default function SocialsManager() {
  const [socials, setSocials] = useState<Socials>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [myLive, setMyLive] = useState<MyLive | null>(null);
  const [livePlatform, setLivePlatform] = useState<LivePlatformId>("tiktok");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/socials", { cache: "no-store" });
      const data = await res.json();
      if (data.error) setMessage({ tone: "err", text: data.error });
      setSocials(data.socials ?? {});
      setDraft(data.socials ?? {});
      setMyLive(data.myLive ?? null);
    } catch {
      setMessage({ tone: "err", text: "Couldn't load your socials." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessage({ tone: "ok", text: success });
      await load();
      window.dispatchEvent(new Event("abujaLifeLiveUpdated"));
    } catch (error) {
      setMessage({ tone: "err", text: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const linkedLive = LIVE_PLATFORMS.filter((p) => socials[p.id]);
  const activeLive = LIVE_PLATFORMS.find((p) => p.id === myLive?.platform);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-pink-400/20 bg-gradient-to-br from-[#2a0f2a] via-[#120b22] to-slate-950">
      <div className="border-b border-white/10 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">📱 My Socials &amp; Live</h2>
            <p className="mt-1 text-sm text-white/45">
              Link your accounts so players can follow you. Going live puts you on the city&apos;s Live Now board.
            </p>
          </div>
          {myLive && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black uppercase tracking-wider">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              You&apos;re live
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-white/40">Loading...</div>
      ) : (
        <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
          {/* accounts */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send({ action: "save", socials: draft }, "Socials saved.");
            }}
            className="space-y-3"
          >
            {PLATFORMS.map((p) => {
              const value = draft[p.id] ?? "";
              const invalid = value.trim() !== "" && !cleanHandle(value);
              return (
                <label key={p.id} className="block">
                  <span className="mb-1 flex items-center justify-between text-xs font-bold text-white/60">
                    <span>
                      {p.icon} {p.label}
                    </span>
                    {socials[p.id] && (
                      <a
                        href={p.profileUrl(socials[p.id]!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-300 hover:text-pink-200"
                      >
                        Open ↗
                      </a>
                    )}
                  </span>
                  <span
                    className={`flex items-center rounded-xl border bg-black/30 px-3 ${
                      invalid ? "border-red-400/60" : "border-white/10 focus-within:border-pink-400/60"
                    }`}
                  >
                    <span className="text-white/30">@</span>
                    <input
                      value={value}
                      onChange={(event) => setDraft((d) => ({ ...d, [p.id]: event.target.value }))}
                      placeholder={p.placeholder}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={busy}
                      className="min-w-0 flex-1 bg-transparent px-1.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20"
                    />
                  </span>
                  {invalid && (
                    <span className="mt-1 block text-xs text-red-300">
                      Use your username only (letters, numbers, . _ -), or paste your profile link.
                    </span>
                  )}
                </label>
              );
            })}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-black text-white transition hover:bg-pink-400 disabled:opacity-50"
            >
              {busy ? "Saving..." : "Save socials"}
            </button>
          </form>

          {/* go live */}
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h3 className="text-lg font-black">🔴 Go Live</h3>

            {myLive && activeLive ? (
              <>
                <p className="mt-2 text-sm text-white/60">
                  You&apos;re showing as live on <b>{activeLive.label}</b>
                  {myLive.title ? <> — &ldquo;{myLive.title}&rdquo;</> : null}. Players can tap your badge to watch.
                </p>
                <a
                  href={activeLive.liveUrl(socials[activeLive.id]!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-bold hover:bg-white/10"
                >
                  Open my live ↗
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => send({ action: "end-live" }, "Live ended.")}
                  className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-50"
                >
                  End live
                </button>
              </>
            ) : linkedLive.length === 0 ? (
              <p className="mt-2 text-sm text-white/50">
                Save your TikTok, Instagram or YouTube username first, then you can go live here.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-white/50">
                  1. Start your live in the {linkedLive.map((p) => p.label).join(" / ")} app.
                  <br />
                  2. Press Go Live here so players in Abuja see it.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {linkedLive.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLivePlatform(p.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                        livePlatform === p.id ? p.tone : "border-white/10 text-white/50"
                      }`}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>

                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={80}
                  placeholder="What's your live about? (optional)"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-red-400/60"
                />

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const pick = linkedLive.find((p) => p.id === livePlatform) ?? linkedLive[0];
                    send({ action: "go-live", platform: pick.id, title }, "You're live! Players can now see you.");
                  }}
                  className="mt-3 w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(239,68,68,0.45)] transition hover:bg-red-400 disabled:opacity-50"
                >
                  🔴 Go live
                </button>
                <p className="mt-2 text-[11px] text-white/35">Your live badge turns off by itself after 4 hours.</p>
              </>
            )}
          </div>

          {message && (
            <div
              className={`md:col-span-2 rounded-xl border p-3 text-sm font-semibold ${
                message.tone === "ok"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-400/30 bg-red-500/10 text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
