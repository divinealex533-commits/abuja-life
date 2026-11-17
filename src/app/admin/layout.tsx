import Link from "next/link";
import { redirect } from "next/navigation";

import AdminNav from "@/components/admin/AdminNav";
import { getAdminUser } from "@/lib/admin/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_70%_-10%,rgba(34,211,238,0.12),transparent_45%),#050a12] text-white">
      <header className="sticky top-0 z-50 h-[65px] border-b border-cyan-400/15 bg-[#04080f]/95 backdrop-blur-xl">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-lg shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                A
              </div>

              <div>
                <div className="text-sm font-black tracking-wide">
                  ABUJA LIFE
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Control Room
                </div>
              </div>
            </Link>

            <span className="hidden rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-green-400 sm:inline-flex">
              Admin Access Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white"
            >
              ← Back to Game
            </Link>

            <div className="hidden text-right md:block">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                Signed in as
              </p>

              <p className="max-w-[220px] truncate text-xs font-bold text-slate-300">
                {admin.email ?? "Administrator"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        <AdminNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
