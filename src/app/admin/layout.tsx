import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-[#050b0a] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b0a]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 font-black text-lg">
                A
              </div>

              <div>
                <div className="text-sm font-black tracking-wide">
                  ABUJA LIFE
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">
                  Admin Control Center
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

      <main>{children}</main>
    </div>
  );
}
