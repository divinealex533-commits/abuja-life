"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Reply = {
  id: string;
  announcement_id: string;
  announcement_title: string;
  user_id: string;
  player_name: string;
  player_username: string | null;
  player_avatar: string;
  message: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
  is_read: boolean;
  created_at: string;
};

type Filter = "unread" | "unanswered" | "all";

export default function AdminAnnouncementRepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string }>>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<Filter>("unread");
  const [announcementId, setAnnouncementId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ filter });
    if (announcementId) params.set("announcementId", announcementId);
    const response = await fetch(`/api/admin/announcement-replies?${params}`, { cache: "no-store" });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error || "Could not load replies.");
      return;
    }
    setReplies(data.replies);
    setAnnouncements(data.announcements);
    setUnread(data.unread);
  }, [filter, announcementId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(payload: Record<string, unknown>, id: string | null) {
    setBusy(id ?? "all");
    setError("");
    const response = await fetch("/api/admin/announcement-replies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    setBusy(null);
    if (!response.ok) {
      setError(data?.error || "Update failed.");
      return;
    }
    if (id) setAnswers({ ...answers, [id]: "" });
    void load();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/admin/announcements" className="text-xs font-bold text-orange-400 hover:text-orange-300">
        ← Announcements
      </Link>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Player Replies</h1>
          <p className="mt-2 text-sm text-slate-500">
            Private replies to your announcements. Only you see these. When you answer, the
            player gets a notification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => patch({ markAllRead: true }, null)}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black hover:bg-white/5"
        >
          Mark all read ({unread})
        </button>
      </div>

      {error && <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["unread", "unanswered", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-xs font-black capitalize ${filter === f ? "bg-orange-500 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}
          >
            {f}
          </button>
        ))}
        <select
          className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white"
          value={announcementId}
          onChange={(e) => setAnnouncementId(e.target.value)}
        >
          <option value="">All announcements</option>
          {announcements.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {replies.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
            No replies here.
          </div>
        )}

        {replies.map((r) => (
          <div key={r.id} className={`rounded-2xl border p-5 ${r.is_read ? "border-white/10 bg-white/[0.03]" : "border-orange-500/30 bg-orange-500/[0.06]"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{r.player_avatar}</span>
                <Link href={`/admin/players/${r.user_id}`} className="font-black hover:text-orange-300">
                  {r.player_name}
                </Link>
                {r.player_username && <span className="text-xs text-slate-500">@{r.player_username}</span>}
                {!r.is_read && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black">NEW</span>}
              </div>
              <div className="text-[11px] text-slate-500">{new Date(r.created_at).toLocaleString("en-NG")}</div>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">On: {r.announcement_title}</div>
            <p className="mt-3 whitespace-pre-line text-sm">{r.message}</p>

            {r.admin_reply && (
              <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                <div className="text-[10px] font-black uppercase tracking-wider text-orange-300">Your answer</div>
                <div className="mt-1 whitespace-pre-line">{r.admin_reply}</div>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50"
                placeholder={r.admin_reply ? "Send another answer (replaces the last one)…" : "Answer this player privately…"}
                value={answers[r.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [r.id]: e.target.value })}
              />
              <button
                type="button"
                disabled={busy !== null || !(answers[r.id] ?? "").trim()}
                onClick={() => patch({ id: r.id, adminReply: answers[r.id] }, r.id)}
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-400 disabled:opacity-40"
              >
                {busy === r.id ? "Sending…" : "Answer"}
              </button>
              {!r.is_read && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => patch({ id: r.id, markRead: true }, r.id)}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
