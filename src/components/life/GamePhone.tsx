"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import NeedsBars from "@/components/life/NeedsBars";
import { useLife } from "@/lib/life/client";
import { abujaClock } from "@/lib/life/needs";

const HIDDEN_ON = ["/", "/login", "/register", "/signup", "/create-character", "/advertise"];

const APPS: { label: string; icon: string; href?: string; action?: "shift"; tone: string }[] = [
  { label: "Work", icon: "💼", action: "shift", tone: "from-emerald-400 to-emerald-600" },
  { label: "Jobs", icon: "📋", href: "/careers", tone: "from-teal-400 to-cyan-600" },
  { label: "Walk", icon: "🚶🏾", href: "/city", tone: "from-sky-400 to-blue-600" },
  { label: "Nigeria", icon: "🗺️", href: "/map", tone: "from-emerald-300 to-teal-600" },
  { label: "Chat", icon: "💬", href: "/friends", tone: "from-green-400 to-green-600" },
  { label: "VIP", icon: "👑", href: "/vip", tone: "from-amber-300 to-orange-500" },
  { label: "Me", icon: "🧑🏾", href: "/profile", tone: "from-fuchsia-400 to-purple-600" },
  { label: "Live", icon: "🔴", href: "/profile", tone: "from-pink-500 to-red-600" },
  { label: "Style", icon: "👔", href: "/character", tone: "from-indigo-400 to-violet-600" },
  { label: "House", icon: "🏠", href: "/house", tone: "from-orange-300 to-rose-500" },
  { label: "Garage", icon: "🚗", href: "/garage", tone: "from-slate-400 to-slate-600" },
  { label: "Shops", icon: "🛍️", href: "/shops", tone: "from-rose-400 to-pink-600" },
  { label: "Business", icon: "🏢", href: "/my-businesses", tone: "from-yellow-300 to-amber-600" },
  { label: "Court", icon: "⚖️", href: "/court", tone: "from-stone-300 to-stone-500" },
  { label: "EFCC", icon: "🚔", href: "/efcc", tone: "from-red-400 to-red-700" },
  { label: "News", icon: "📢", href: "/announcements", tone: "from-blue-300 to-indigo-600" },
  { label: "Tasks", icon: "✅", href: "/tasks", tone: "from-lime-300 to-green-600" },
];

/** Floating in-game phone: needs at a glance and every app one tap away. */
export default function GamePhone() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const hidden = HIDDEN_ON.includes(pathname) || pathname.startsWith("/admin");

  useEffect(() => {
    const update = () => {
      const { hour, minute } = abujaClock();
      setTime(`${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`);
    };
    update();
    const t = window.setInterval(update, 15_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  if (hidden) return null;
  return <PhoneInner open={open} setOpen={setOpen} time={time} onShift={() => {
    setOpen(false);
    if (pathname === "/game") window.dispatchEvent(new Event("abujaLifeStartShift"));
    else router.push("/game?shift=1");
  }} />;
}

function PhoneInner({
  open,
  setOpen,
  time,
  onShift,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  time: string;
  onShift: () => void;
}) {
  const life = useLife();
  if (!life.loggedIn) return null;

  const lowest = Math.min(life.needs.hunger, life.needs.hygiene, life.needs.fun, life.needs.social);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open phone"
        className="fixed bottom-5 right-4 z-[65] flex h-16 w-16 items-center justify-center rounded-[22px] border-2 border-white/20 bg-gradient-to-b from-slate-700 to-slate-900 text-3xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition active:scale-95"
      >
        📱
        {lowest < 25 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-black">
            !
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[64] bg-black/50" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-24 right-3 w-[300px] max-w-[calc(100vw-24px)] animate-[al-phone_.25s_ease-out] rounded-[40px] border-[6px] border-slate-800 bg-gradient-to-b from-[#1b1f3a] via-[#2a1840] to-[#3a1b2f] p-4 pb-5 text-white shadow-2xl"
          >
            <div className="mx-auto mb-3 h-5 w-24 rounded-full bg-black" />
            <div className="flex items-center justify-between px-1 text-xs font-black">
              <span>{time}</span>
              <span className="text-white/70">5G ▮▮▮ 🔋</span>
            </div>

            <div className="mt-3 rounded-2xl bg-black/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black">
                  {life.moodInfo.emoji} {life.moodInfo.label}
                </span>
                <span className="font-black text-amber-200">₦{Math.round(life.cash).toLocaleString()}</span>
              </div>
              <div className="mt-2">
                <NeedsBars compact needs={life.needs} energy={life.energy} maxEnergy={life.maxEnergy} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3">
              {APPS.map((app) => {
                const icon = (
                  <>
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ${app.tone}`}
                    >
                      {app.icon}
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-white/80">{app.label}</span>
                  </>
                );
                return app.action === "shift" ? (
                  <button key={app.label} type="button" onClick={onShift} className="flex flex-col items-center">
                    {icon}
                  </button>
                ) : (
                  <Link key={app.label} href={app.href!} className="flex flex-col items-center">
                    {icon}
                  </Link>
                );
              })}
            </div>

            <Link
              href="/game"
              className="mx-auto mt-4 block h-1.5 w-28 rounded-full bg-white/60"
              aria-label="Home"
            />
          </div>
          <style>{`@keyframes al-phone{from{transform:translateY(40px) scale(.95);opacity:0}to{transform:none;opacity:1}}`}</style>
        </div>
      )}
    </>
  );
}
