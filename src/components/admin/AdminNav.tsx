"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ADMIN_LINKS: { href: string; icon: string; label: string }[] = [
  { href: "/admin", icon: "📡", label: "Command Center" },
  { href: "/admin/control", icon: "🎛️", label: "World Controls" },
  { href: "/admin/players", icon: "👥", label: "Players" },
  { href: "/admin/player-actions", icon: "🧾", label: "Player Actions" },
  { href: "/admin/testing", icon: "🧪", label: "Test Center" },
  { href: "/admin/courts", icon: "⚖️", label: "Courts & EFCC" },
  { href: "/admin/announcements", icon: "📢", label: "Announcements" },
  { href: "/admin/chat", icon: "💬", label: "Chat" },
  { href: "/admin/tasks", icon: "🎯", label: "Tasks" },
  { href: "/admin/businesses", icon: "🏢", label: "Business Ads" },
  { href: "/admin/payments", icon: "💳", label: "Payments" },
  { href: "/admin/revenue", icon: "💰", label: "Revenue" },
  { href: "/admin/earnings", icon: "📈", label: "Earnings" },
  { href: "/admin/prices", icon: "🏷️", label: "Prices" },
  { href: "/admin/vip", icon: "👑", label: "VIP" },
  { href: "/admin/weekend-prizes", icon: "🏆", label: "Weekend Prizes" },
  { href: "/admin/settings", icon: "⚙️", label: "Settings" },
];

/** Control-room navigation: sidebar on desktop, swipeable tabs on phones. */
export default function AdminNav() {
  const pathname = usePathname() ?? "/admin";
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      {/* phone: horizontal tabs */}
      <nav className="sticky top-[65px] z-40 -mx-px flex gap-1.5 overflow-x-auto border-b border-cyan-400/10 bg-[#04080f]/95 px-3 py-2 backdrop-blur lg:hidden">
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${
              active(l.href) ? "bg-cyan-400 text-black" : "bg-white/5 text-white/70"
            }`}
          >
            {l.icon} {l.label}
          </Link>
        ))}
      </nav>

      {/* desktop: sidebar */}
      <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-60 shrink-0 overflow-y-auto border-r border-cyan-400/10 bg-[#04080f] p-3 lg:block">
        <div className="mb-2 px-3 pt-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300/70">Systems</div>
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              active(l.href)
                ? "bg-gradient-to-r from-cyan-400/20 to-transparent text-white shadow-[inset_3px_0_0_#22d3ee]"
                : "text-white/55 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <div className="mt-4 border-t border-white/5 pt-4">
          <a href="/stats" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/55 hover:bg-white/5">
            <span className="text-lg">🌍</span> Public stats ↗
          </a>
          <Link href="/game" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/55 hover:bg-white/5">
            <span className="text-lg">🎮</span> Back to game
          </Link>
        </div>
      </aside>
    </>
  );
}
