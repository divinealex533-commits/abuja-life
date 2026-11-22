"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import CharacterAvatar from "@/components/character/CharacterAvatar";
import { refreshLife, useLife } from "@/lib/life/client";
import { DANCES, NOTES, getTheme, type DanceId } from "@/lib/party/catalog";
import { PartyBeat } from "@/lib/party/music";
import { createClient } from "@/lib/supabase/client";
import { loadPlayerState, savePlayerState } from "@/lib/game/player";

interface Guest {
  id: string;
  name: string;
  appearance: unknown;
  sprayed: number;
  received: number;
}

interface Present {
  id: string;
  name: string;
  appearance: unknown;
  dance: DanceId;
}

interface FlyingNote {
  key: number;
  to: string;
  value: number;
  x: number;
  rot: number;
  delay: number;
}

interface Bubble {
  key: number;
  to: string;
  text: string;
}

const EMOTES = ["🔥", "🙌", "😂", "💯", "👏", "🍾"];

let noteKey = 0;

export default function PartyRoomPage() {
  const params = useParams<{ id: string }>();
  const partyId = String(params?.id ?? "");
  const life = useLife();

  const [party, setParty] = useState<{
    title: string;
    theme: string;
    locationName: string;
    endsAt: string;
    ended: boolean;
    hostId: string;
    hostName: string;
  } | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [recent, setRecent] = useState<{ from: string; to: string; amount: number }[]>([]);
  const [present, setPresent] = useState<Present[]>([]);
  const [myDance, setMyDance] = useState<DanceId>("chill");
  const [note, setNote] = useState<number>(NOTES[0].value);
  const [notes, setNotes] = useState<FlyingNote[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [liveReceived, setLiveReceived] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [error, setError] = useState("");
  const [musicOn, setMusicOn] = useState(false);
  const [myAppearance, setMyAppearance] = useState<unknown>(null);
  const [myName, setMyName] = useState("Me");
  const [, tick] = useState(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pending = useRef<Record<string, number>>({});
  const flushTimer = useRef<number | null>(null);
  const beat = useRef<PartyBeat | null>(null);

  const theme = getTheme(party?.theme ?? "owambe");

  const load = useCallback(async () => {
    const d = await fetch(`/api/parties?id=${partyId}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (!d || d.error) {
      setError(d?.error || "Couldn't load the party.");
      return;
    }
    setParty(d.party);
    setMe(d.me);
    setGuests(d.guests ?? []);
    setRecent(d.recent ?? []);
  }, [partyId]);

  // Load, join, and keep vibing.
  useEffect(() => {
    void load();
    fetch("/api/character", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setMyAppearance(d?.appearance ?? null);
        if (d?.name) setMyName(d.name);
      })
      .catch(() => null);
    const join = () =>
      fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", partyId }),
      });
    void join().then(() => load());

    const vibe = window.setInterval(async () => {
      const r = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vibe", partyId }),
      })
        .then((x) => x.json())
        .catch(() => null);
      if (r?.boosted) {
        setToast({ tone: "ok", text: "🎉 Vibes! Fun and Social went up" });
        void refreshLife();
      }
    }, 60_000);
    const refresh = window.setInterval(() => void load(), 30_000);
    const clock = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => {
      window.clearInterval(vibe);
      window.clearInterval(refresh);
      window.clearInterval(clock);
      beat.current?.stop();
    };
  }, [load, partyId]);

  // Realtime: who's here, sprays and emotes.
  useEffect(() => {
    if (!me) return;
    const supabase = createClient();
    const channel = supabase.channel(`party-${partyId}`, {
      config: { presence: { key: me }, broadcast: { self: false } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Present>();
        const list: Present[] = [];
        for (const metas of Object.values(state)) {
          const m = metas[metas.length - 1];
          if (m) list.push({ id: m.id, name: m.name, appearance: m.appearance, dance: m.dance });
        }
        setPresent(list);
      })
      .on("broadcast", { event: "spray" }, ({ payload }) => {
        showNotes(payload.to, payload.value, payload.count);
        setLiveReceived((r) => ({ ...r, [payload.to]: (r[payload.to] ?? 0) + payload.value * payload.count }));
      })
      .on("broadcast", { event: "emote" }, ({ payload }) => showBubble(payload.from, payload.emoji))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ id: me, name: myName, appearance: myAppearance, dance: myDance });
        }
      });
    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // Re-tracking on dance change is handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, partyId]);

  // Update my presence when my dance or look changes.
  useEffect(() => {
    if (!me || !channelRef.current) return;
    void channelRef.current.track({ id: me, name: myName, appearance: myAppearance, dance: myDance });
  }, [myDance, myAppearance, myName, me]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showNotes(to: string, value: number, count = 1) {
    const fresh: FlyingNote[] = Array.from({ length: Math.min(8, count) }, (_, i) => ({
      key: ++noteKey,
      to,
      value,
      x: 10 + Math.random() * 70,
      rot: -40 + Math.random() * 80,
      delay: i * 0.08,
    }));
    setNotes((n) => [...n.slice(-60), ...fresh]);
    window.setTimeout(() => setNotes((n) => n.filter((x) => !fresh.some((f) => f.key === x.key))), 2600);
  }

  function showBubble(to: string, text: string) {
    const b = { key: ++noteKey, to, text };
    setBubbles((list) => [...list.slice(-20), b]);
    window.setTimeout(() => setBubbles((list) => list.filter((x) => x.key !== b.key)), 1800);
  }

  async function flush() {
    flushTimer.current = null;
    const batch = pending.current;
    pending.current = {};
    for (const [to, amount] of Object.entries(batch)) {
      const r = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "spray", partyId, toId: to, amount }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setToast({ tone: "err", text: d.error || "Spray failed." });
        setLiveReceived((x) => ({ ...x, [to]: Math.max(0, (x[to] ?? 0) - amount) }));
      } else if (typeof d.cash === "number") {
        savePlayerState({ ...loadPlayerState(), cash: d.cash });
        window.dispatchEvent(new Event("abujaLifePlayerUpdated"));
      }
    }
    void load();
    void refreshLife();
  }

  function spray(to: string) {
    if (to === me) {
      setToast({ tone: "err", text: "Spray other people, not yourself 😅" });
      return;
    }
    const queued = Object.values(pending.current).reduce((a, b) => a + b, 0);
    if (life.cash - queued < note) {
      setToast({ tone: "err", text: "You don't have enough cash to spray." });
      return;
    }
    pending.current[to] = (pending.current[to] ?? 0) + note;
    showNotes(to, note, 1);
    setLiveReceived((r) => ({ ...r, [to]: (r[to] ?? 0) + note }));
    void channelRef.current?.send({ type: "broadcast", event: "spray", payload: { to, value: note, count: 1 } });
    if (flushTimer.current) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(() => void flush(), 1200);
  }

  function emote(emoji: string) {
    if (!me) return;
    showBubble(me, emoji);
    void channelRef.current?.send({ type: "broadcast", event: "emote", payload: { from: me, emoji } });
  }

  function toggleMusic() {
    beat.current ??= new PartyBeat();
    if (beat.current.playing) {
      beat.current.stop();
      setMusicOn(false);
    } else {
      beat.current.start();
      setMusicOn(true);
    }
  }

  // Dance floor: people here right now (me first), falling back to the guest list.
  const floor = useMemo(() => {
    const list = [...present];
    if (me && !list.some((p) => p.id === me)) {
      list.unshift({ id: me, name: myName, appearance: myAppearance, dance: myDance });
    }
    return list.sort((a, b) => (a.id === me ? -1 : b.id === me ? 1 : 0));
  }, [present, me, myName, myAppearance, myDance]);

  const received = (id: string) => (guests.find((g) => g.id === id)?.received ?? 0) + (liveReceived[id] ?? 0);
  const bigSpenders = [...guests].sort((a, b) => b.sprayed - a.sprayed).filter((g) => g.sprayed > 0).slice(0, 3);
  const mins = party ? Math.max(0, Math.floor((new Date(party.endsAt).getTime() - Date.now()) / 60_000)) : 0;

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0614] p-6 text-center text-white">
        <div className="text-5xl">🥲</div>
        <p className="mt-3 font-bold">{error}</p>
        <Link href="/parties" className="mt-4 rounded-xl bg-white/10 px-5 py-3 font-black">
          See other parties
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] pb-40 text-white">
      <style>{`
        @keyframes pt-beam{0%{transform:rotate(-35deg)}100%{transform:rotate(35deg)}}
        @keyframes pt-ball{to{transform:rotate(360deg)}}
        @keyframes pt-note{0%{transform:translateY(-80px) rotate(0deg);opacity:0}10%{opacity:1}100%{transform:translateY(120px) rotate(var(--r));opacity:0}}
        @keyframes pt-bubble{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:1;transform:translateY(-10px) scale(1.1)}100%{transform:translateY(-60px) scale(1);opacity:0}}
        @keyframes d-shaku{0%,100%{transform:translateX(0) skewX(0)}25%{transform:translateX(-6px) skewX(-8deg) translateY(-3px)}75%{transform:translateX(6px) skewX(8deg) translateY(-3px)}}
        @keyframes d-zanku{0%,100%{transform:scaleY(1) translateX(0)}30%{transform:scaleY(.9) translateX(-8px)}60%{transform:scaleY(1.03) translateX(8px) translateY(-6px)}}
        @keyframes d-gwara{0%,100%{transform:rotate(0)}25%{transform:rotate(-14deg) translateY(-4px)}75%{transform:rotate(14deg) translateY(-4px)}}
        @keyframes d-azonto{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-10px) rotate(-6deg)}40%{transform:translateX(10px) rotate(6deg)}60%{transform:translateY(-8px)}80%{transform:translateX(-4px) rotate(-3deg)}}
        @keyframes d-buga{0%,100%{transform:translateY(0) rotate(0)}15%{transform:translateY(-6px) rotate(5deg)}30%{transform:translateY(0) rotate(-5deg)}45%{transform:translateY(-6px) rotate(5deg)}}
        @keyframes d-chill{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg) translateY(-2px)}}
        .d-shaku{animation:d-shaku .58s ease-in-out infinite}
        .d-zanku{animation:d-zanku .5s ease-in-out infinite}
        .d-gwara{animation:d-gwara .62s ease-in-out infinite}
        .d-azonto{animation:d-azonto .9s ease-in-out infinite}
        .d-buga{animation:d-buga .7s ease-in-out infinite}
        .d-chill{animation:d-chill 1.6s ease-in-out infinite}
      `}</style>

      {/* lights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${theme.colors[1]}55, transparent 60%)` }} />
        {theme.colors.map((c, i) => (
          <div
            key={c}
            className="absolute left-1/2 top-0 h-[120vh] w-24 origin-top opacity-30 blur-md"
            style={{
              background: `linear-gradient(${c}, transparent)`,
              animation: `pt-beam ${3 + i}s ease-in-out ${i * 0.7}s infinite alternate`,
              marginLeft: (i - 1) * 80,
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-16 h-16 w-16 -translate-x-1/2 rounded-full border-2 border-white/40"
          style={{
            background: "repeating-conic-gradient(#e5e7eb 0 10deg, #64748b 10deg 20deg)",
            animation: "pt-ball 4s linear infinite",
            boxShadow: `0 0 40px ${theme.colors[0]}`,
          }}
        />
      </div>

      {/* header */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-4">
        <div>
          <Link href="/parties" className="text-xs font-black text-white/60">
            ← PARTIES
          </Link>
          <h1 className="mt-1 text-2xl font-black">
            {theme.icon} {party?.title ?? "Party"}
          </h1>
          <p className="text-xs text-white/60">
            {theme.label} by {party?.hostName} · 📍 {party?.locationName} ·{" "}
            {party?.ended ? "Ended" : `${Math.floor(mins / 60)}h ${mins % 60}m left`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button type="button" onClick={toggleMusic} className={`rounded-full px-3 py-2 text-xs font-black ${musicOn ? "bg-emerald-400 text-black" : "bg-white/10"}`}>
            {musicOn ? "🔊 Music on" : "🔈 Play music"}
          </button>
          <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-black text-amber-200">₦{Math.round(life.cash).toLocaleString()}</div>
        </div>
      </div>

      {/* DJ */}
      <div className="relative z-10 mx-auto mt-10 w-56 rounded-t-3xl border-x-4 border-t-4 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950 p-3 text-center">
        <div className="text-3xl">🎧</div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">DJ Abuja on the decks</div>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full"
              style={{
                height: 6 + ((i * 7 + Math.floor(Date.now() / 300)) % 5) * 5,
                background: theme.colors[i % 3],
                transition: "height .25s",
              }}
            />
          ))}
        </div>
      </div>

      {/* dance floor */}
      <section
        className="relative z-10 mx-3 rounded-3xl border border-white/10 p-3"
        style={{
          background:
            "repeating-conic-gradient(from 45deg, rgba(255,255,255,0.06) 0 25%, rgba(0,0,0,0.25) 0 50%) 0 0 / 56px 56px",
        }}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {floor.map((p) => {
            const isMe = p.id === me;
            const pile = received(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => spray(p.id)}
                className={`relative overflow-hidden rounded-2xl border bg-black/30 px-2 pb-2 pt-6 text-center transition active:scale-[0.97] ${
                  isMe ? "border-amber-300/60" : "border-white/10 hover:border-emerald-300/60"
                }`}
              >
                <div className={`mx-auto w-fit d-${p.dance}`} style={{ transformOrigin: "50% 100%" }}>
                  <CharacterAvatar appearance={p.appearance as never} size={120} />
                </div>
                {pile > 0 && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black text-black shadow">
                    💸 ₦{pile.toLocaleString()}
                  </div>
                )}
                <div className="mt-1 truncate text-sm font-black">{isMe ? "You" : p.name}</div>
                <div className="text-[10px] text-white/50">
                  {DANCES.find((d) => d.id === p.dance)?.label ?? "Vibing"}
                  {!isMe && " · tap to spray"}
                </div>

                {/* falling notes */}
                {notes
                  .filter((n) => n.to === p.id)
                  .map((n) => {
                    const meta = NOTES.find((x) => x.value === n.value) ?? NOTES[0];
                    return (
                      <span
                        key={n.key}
                        className="pointer-events-none absolute top-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-black shadow"
                        style={
                          {
                            left: `${n.x}%`,
                            background: meta.color,
                            color: meta.ink,
                            borderColor: meta.ink,
                            "--r": `${n.rot}deg`,
                            animation: `pt-note 2.4s ease-in ${n.delay}s forwards`,
                          } as CSSProperties
                        }
                      >
                        ₦{n.value}
                      </span>
                    );
                  })}

                {/* emote bubbles */}
                {bubbles
                  .filter((b) => b.to === p.id)
                  .map((b) => (
                    <span
                      key={b.key}
                      className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-3xl"
                      style={{ animation: "pt-bubble 1.8s ease-out forwards" }}
                    >
                      {b.text}
                    </span>
                  ))}
              </button>
            );
          })}
        </div>
        {floor.length < 2 && (
          <p className="mt-3 text-center text-xs text-white/50">
            Invite friends! Share this page so they can join, dance and spray.
          </p>
        )}
      </section>

      {/* big spenders + feed */}
      <section className="relative z-10 mx-3 mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-300/20 bg-black/40 p-3">
          <div className="text-xs font-black uppercase tracking-wider text-amber-200">👑 Big spenders</div>
          {bigSpenders.length === 0 && <p className="mt-1 text-xs text-white/40">No one has sprayed yet. Be the first!</p>}
          {bigSpenders.map((g, i) => (
            <div key={g.id} className="mt-1 flex justify-between text-sm">
              <span>
                {["🥇", "🥈", "🥉"][i]} {g.name}
              </span>
              <span className="font-black">₦{g.sprayed.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="text-xs font-black uppercase tracking-wider text-white/60">💸 Money falling</div>
          {recent.length === 0 && <p className="mt-1 text-xs text-white/40">Nothing yet.</p>}
          {recent.slice(0, 5).map((r, i) => (
            <div key={i} className="mt-1 truncate text-xs text-white/70">
              <b>{r.from}</b> sprayed <b>{r.to}</b> ₦{r.amount.toLocaleString()}
            </div>
          ))}
        </div>
      </section>

      {/* controls */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0a0614]/95 p-3 pr-24 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {DANCES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setMyDance(d.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${myDance === d.id ? "bg-fuchsia-500" : "bg-white/10"}`}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase text-white/50">Spray</span>
          {NOTES.map((n) => (
            <button
              key={n.value}
              type="button"
              onClick={() => setNote(n.value)}
              className={`rounded-md border-2 px-2.5 py-1 text-xs font-black ${note === n.value ? "scale-110" : "opacity-60"}`}
              style={{ background: n.color, color: n.ink, borderColor: note === n.value ? "#fff" : n.ink }}
            >
              ₦{n.value}
            </button>
          ))}
          <div className="flex gap-1">
            {EMOTES.map((e) => (
              <button key={e} type="button" onClick={() => emote(e)} className="rounded-full bg-white/10 px-2 py-1 text-lg">
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-2xl px-4 py-2.5 text-sm font-black shadow-2xl ${
            toast.tone === "ok" ? "bg-emerald-400 text-black" : "bg-red-500"
          }`}
        >
          {toast.text}
        </div>
      )}
    </main>
  );
}
