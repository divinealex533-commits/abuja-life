"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatNaira } from "@/lib/vip/catalog";

type InviteData = {
  loggedIn: boolean;
  code?: string | null;
  rewardPerFriend?: number;
  welcomeBonus?: number;
  invited?: number;
  active?: number;
  earned?: number;
  friends?: Array<{ name: string; avatar: string; status: string; reward: number; joinedAt: string }>;
};

export default function InvitePage() {
  const [data, setData] = useState<InviteData | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/referrals", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ loggedIn: false }));
  }, []);

  const link = data?.code ? `${origin}/register?ref=${data.code}` : "";
  const shareText = `Join me on Abuja Life 🇳🇬🎮 Work real Abuja jobs, buy houses and cars, chat with players and win weekend cash prizes. Sign up with my link and get ${formatNaira(data?.welcomeBonus ?? 2000)} free: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#07110f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60">← BACK TO GAME</Link>
          <div className="text-sm font-black">🤝 Invite friends</div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-[2rem] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-[#0a1712] to-amber-500/10 p-8 text-center">
          <div className="text-5xl">🎁</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Earn {formatNaira(data?.rewardPerFriend ?? 5000)} for every friend
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/60">
            Share your link. When your friend joins and works their first career shift, you get{" "}
            {formatNaira(data?.rewardPerFriend ?? 5000)} and they get {formatNaira(data?.welcomeBonus ?? 2000)} welcome cash.
          </p>
        </section>

        {data && !data.loggedIn ? (
          <div className="mt-6 rounded-2xl border border-white/10 p-6 text-center">
            <Link href="/login" className="font-black text-emerald-300">Log in to get your invite link →</Link>
          </div>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs font-bold uppercase tracking-wider text-white/40">Your invite link</div>
              <div className="mt-2 break-all rounded-2xl bg-black/30 p-4 font-mono text-sm">{link || "Loading…"}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-[#25D366] py-4 text-center text-sm font-black text-black"
                >
                  SHARE ON WHATSAPP
                </a>
                <button type="button" onClick={copy} disabled={!link} className="rounded-2xl border border-white/15 py-4 text-sm font-black hover:bg-white/5">
                  {copied ? "COPIED ✓" : "COPY LINK"}
                </button>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Invited", data?.invited ?? 0],
                ["Active", data?.active ?? 0],
                ["Earned", formatNaira(data?.earned ?? 0)],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-white/[0.04] p-4 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
                  <div className="mt-1 text-xl font-black">{value}</div>
                </div>
              ))}
            </section>

            {(data?.friends?.length ?? 0) > 0 && (
              <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="font-black">Your friends</h2>
                <ul className="mt-4 space-y-2">
                  {data?.friends?.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-black/25 px-4 py-3 text-sm">
                      <span>{f.avatar} {f.name}</span>
                      <span className={f.status === "rewarded" ? "font-black text-emerald-300" : "text-white/45"}>
                        {f.status === "rewarded" ? `+${formatNaira(f.reward)}` : "Waiting for first shift"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
