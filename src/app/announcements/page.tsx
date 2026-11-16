"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  created_at: string;
};

type Reply = {
  id: string;
  announcement_id: string;
  message: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
};

const PRIORITY_STYLE = {
  normal: "border-blue-400/20 bg-blue-400/[0.06]",
  important: "border-orange-400/25 bg-orange-400/[0.07]",
  urgent: "border-red-400/30 bg-red-400/[0.08]",
};

const PRIORITY_ICON = { normal: "ℹ️", important: "📢", urgent: "🚨" };

function timeAgo(value: string) {
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loggedIn, setLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [a, r] = await Promise.all([
      fetch("/api/announcements", { cache: "no-store" }).then((res) => res.json()).catch(() => null),
      fetch("/api/announcements/replies", { cache: "no-store" }).then((res) => res.json()).catch(() => null),
    ]);
    setAnnouncements(a?.announcements ?? []);
    setReplies(r?.replies ?? []);
    setLoggedIn(r?.loggedIn !== false);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(announcementId: string) {
    const message = (drafts[announcementId] ?? "").trim();
    if (!message) return;

    setSending(announcementId);
    setErrors({ ...errors, [announcementId]: "" });

    try {
      const response = await fetch("/api/announcements/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, message }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors({ ...errors, [announcementId]: data?.error || "Could not send." });
        return;
      }

      setReplies((current) => [...current, data.reply]);
      setDrafts({ ...drafts, [announcementId]: "" });
    } finally {
      setSending(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#07110f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/game" className="text-xs font-black text-white/60 hover:text-white">← BACK TO GAME</Link>
          <div className="text-sm font-black">📢 Announcements</div>
          <div className="w-16" />
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-black">News from Abuja Life</h1>
        <p className="mt-2 text-sm text-white/50">
          Messages from the Abuja Life team. Reply to any announcement — only the admin
          can see your reply, and you&apos;ll get a notification when they answer.
        </p>

        {loading ? (
          <div className="mt-8 h-40 animate-pulse rounded-3xl bg-white/5" />
        ) : announcements.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
            No announcements right now.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {announcements.map((a) => {
              const thread = replies.filter((r) => r.announcement_id === a.id);
              return (
                <article key={a.id} className={`rounded-3xl border p-6 ${PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE.normal}`}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{PRIORITY_ICON[a.priority] ?? "ℹ️"}</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-black">{a.title}</h2>
                      <div className="text-[11px] text-white/40">{timeAgo(a.created_at)}</div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/80">{a.message}</p>
                    </div>
                  </div>

                  {thread.length > 0 && (
                    <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                      {thread.map((r) => (
                        <div key={r.id} className="space-y-2">
                          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-400/15 px-4 py-3 text-sm">
                            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">You</div>
                            <div className="mt-1 whitespace-pre-line">{r.message}</div>
                          </div>
                          {r.admin_reply ? (
                            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-3 text-sm">
                              <div className="text-[10px] font-black uppercase tracking-wider text-orange-300">Abuja Life Admin</div>
                              <div className="mt-1 whitespace-pre-line">{r.admin_reply}</div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-white/35">Sent · waiting for admin</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5">
                    {loggedIn ? (
                      <>
                        <div className="flex gap-2">
                          <input
                            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-emerald-400/40"
                            placeholder="Reply to the admin…"
                            maxLength={500}
                            value={drafts[a.id] ?? ""}
                            onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void send(a.id);
                            }}
                          />
                          <button
                            type="button"
                            disabled={sending !== null || !(drafts[a.id] ?? "").trim()}
                            onClick={() => send(a.id)}
                            className="rounded-2xl bg-emerald-400 px-5 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-40"
                          >
                            {sending === a.id ? "…" : "Send"}
                          </button>
                        </div>
                        {errors[a.id] && <div className="mt-2 text-xs font-bold text-red-300">{errors[a.id]}</div>}
                        <div className="mt-1 text-[10px] text-white/30">🔒 Private — only the admin sees this.</div>
                      </>
                    ) : (
                      <Link href="/login" className="text-sm font-black text-emerald-300">Log in to reply →</Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
