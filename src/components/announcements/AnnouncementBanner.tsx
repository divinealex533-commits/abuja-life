"use client";

import { useEffect, useState } from "react";

type Priority = "normal" | "important" | "urgent";

type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  created_at: string;
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const response = await fetch(
          "/api/announcements",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) return;

        const result = await response.json();

        const announcements =
          result.announcements ?? [];

        if (announcements.length > 0) {
          setAnnouncement(announcements[0]);
        }
      } catch {
        // Announcement loading should never
        // break the game.
      }
    }

    loadAnnouncement();
  }, []);

  if (!announcement || !visible) {
    return null;
  }

  const priorityStyles = {
    normal:
      "border-blue-400/20 bg-blue-400/10 text-blue-200",

    important:
      "border-orange-400/20 bg-orange-400/10 text-orange-200",

    urgent:
      "border-red-400/20 bg-red-400/10 text-red-200",
  };

  return (
    <div className="relative z-40 px-4 pt-3">
      <div
        className={`mx-auto flex max-w-7xl items-start gap-4 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
          priorityStyles[announcement.priority]
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
          {announcement.priority === "urgent"
            ? "🚨"
            : announcement.priority === "important"
              ? "📢"
              : "ℹ️"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black">
              {announcement.title}
            </h3>

            <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider">
              {announcement.priority}
            </span>
          </div>

          <p className="mt-1 text-sm leading-6 opacity-80">
            {announcement.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-lg px-2 py-1 text-lg opacity-50 transition hover:bg-white/10 hover:opacity-100"
          aria-label="Close announcement"
        >
          ×
        </button>
      </div>
    </div>
  );
}
