"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Priority = "normal" | "important" | "urgent";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  is_active: boolean;
  created_at: string;
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [feedback, setFeedback] = useState("");

  async function loadAnnouncements() {
    try {
      setLoadingList(true);

      const response = await fetch(
        "/api/admin/announcements",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Failed to load announcements."
        );
      }

      setAnnouncements(result.announcements ?? []);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to load announcements."
      );
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function createAnnouncement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      setFeedback(
        "Title and message are required."
      );
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const response = await fetch(
        "/api/admin/announcements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            priority,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to create announcement."
        );
      }

      setTitle("");
      setMessage("");
      setPriority("normal");

      setFeedback(
        "Announcement published successfully."
      );

      await loadAnnouncements();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to create announcement."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
      >
        ← Admin Dashboard
      </Link>

      <section className="mt-6 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
          📢 ANNOUNCEMENTS
        </div>

        <h1 className="mt-5 text-4xl font-black">
          Player Announcements
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Publish important messages that can appear
          across Abuja Life for your players.
        </p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* CREATE */}
        <form
          onSubmit={createAnnouncement}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-black">
              Create Announcement
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              The announcement will be available to
              players after publishing.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Title
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Abuja Life maintenance"
                maxLength={120}
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Message
              </label>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Write the announcement players should see..."
                rows={6}
                maxLength={1000}
                required
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-orange-500/50"
              />

              <p className="mt-1 text-right text-[10px] text-slate-600">
                {message.length}/1000
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as Priority
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
              >
                <option value="normal">
                  Normal
                </option>

                <option value="important">
                  Important
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Publishing..."
                : "Publish Announcement"}
            </button>

            {feedback && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-300">
                {feedback}
              </div>
            )}
          </div>
        </form>

        {/* LIST */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Recent Announcements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest messages published by the
                administration.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-500">
              {announcements.length} total
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {loadingList ? (
              <div className="rounded-xl bg-black/20 p-6 text-center text-sm text-slate-500">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <div className="text-3xl">
                  📢
                </div>

                <p className="mt-3 text-sm font-bold text-slate-400">
                  No announcements yet
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Create your first announcement
                  using the form.
                </p>
              </div>
            ) : (
              announcements.map(
                (announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-black">
                          {announcement.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {announcement.message}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                          announcement.priority ===
                          "urgent"
                            ? "bg-red-500/15 text-red-400"
                            : announcement.priority ===
                                "important"
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-blue-500/15 text-blue-400"
                        }`}
                      >
                        {announcement.priority}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] text-slate-600">
                        {new Date(
                          announcement.created_at
                        ).toLocaleString()}
                      </span>

                      <span
                        className={`text-[10px] font-bold ${
                          announcement.is_active
                            ? "text-green-400"
                            : "text-slate-600"
                        }`}
                      >
                        {announcement.is_active
                          ? "● Active"
                          : "● Inactive"}
                      </span>
                    </div>
                  </article>
                )
              )
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
