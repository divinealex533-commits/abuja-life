"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

type Priority = "normal" | "important" | "urgent";

type Announcement = {
  id: string;
  title: string;
  message: string;
  type?: string;
  priority: Priority;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  expires_at?: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function priorityClass(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "border-red-500/20 bg-red-500/15 text-red-400";

    case "important":
      return "border-orange-500/20 bg-orange-500/15 text-orange-400";

    default:
      return "border-blue-500/20 bg-blue-500/15 text-blue-400";
  }
}

function priorityLabel(priority: Priority) {
  switch (priority) {
    case "urgent":
      return "Urgent";

    case "important":
      return "Important";

    default:
      return "Normal";
  }
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    []
  );

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] =
    useState<Priority>("normal");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editPriority, setEditPriority] =
    useState<Priority>("normal");
  const [editExpiresAt, setEditExpiresAt] = useState("");

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadAnnouncements = useCallback(
    async (showInitialLoading = false) => {
      try {
        if (showInitialLoading) {
          setLoadingList(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const response = await fetch(
          "/api/admin/announcements",
          {
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ??
              "Failed to load announcements."
          );
        }

        setAnnouncements(
          Array.isArray(result.announcements)
            ? result.announcements
            : []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load announcements."
        );
      } finally {
        setLoadingList(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAnnouncements(true);
  }, [loadAnnouncements]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadAnnouncements(false);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadAnnouncements]);

  async function createAnnouncement(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle || !cleanMessage) {
      setFeedback(
        "Title and message are required."
      );
      return;
    }

    if (cleanTitle.length > 120) {
      setFeedback(
        "Title cannot exceed 120 characters."
      );
      return;
    }

    if (cleanMessage.length > 1000) {
      setFeedback(
        "Message cannot exceed 1000 characters."
      );
      return;
    }

    setLoading(true);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(
        "/api/admin/announcements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: cleanTitle,
            message: cleanMessage,
            priority,
            expires_at: expiresAt
              ? new Date(expiresAt).toISOString()
              : null,
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
      setExpiresAt("");

      setFeedback(
        "Announcement published successfully."
      );

      await loadAnnouncements(false);
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

  function startEditing(
    announcement: Announcement
  ) {
    setEditingId(announcement.id);
    setEditTitle(announcement.title);
    setEditMessage(announcement.message);
    setEditPriority(announcement.priority);

    if (announcement.expires_at) {
      const date = new Date(
        announcement.expires_at
      );

      if (!Number.isNaN(date.getTime())) {
        const local = new Date(
          date.getTime() -
            date.getTimezoneOffset() * 60000
        );

        setEditExpiresAt(
          local.toISOString().slice(0, 16)
        );
      } else {
        setEditExpiresAt("");
      }
    } else {
      setEditExpiresAt("");
    }

    setFeedback("");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
    setEditPriority("normal");
    setEditExpiresAt("");
  }

  async function saveEdit(
    announcementId: string
  ) {
    const cleanTitle = editTitle.trim();
    const cleanMessage = editMessage.trim();

    if (!cleanTitle || !cleanMessage) {
      setFeedback(
        "Title and message are required."
      );
      return;
    }

    if (cleanTitle.length > 120) {
      setFeedback(
        "Title cannot exceed 120 characters."
      );
      return;
    }

    if (cleanMessage.length > 1000) {
      setFeedback(
        "Message cannot exceed 1000 characters."
      );
      return;
    }

    setWorkingId(announcementId);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/announcements?id=${encodeURIComponent(
          announcementId
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: cleanTitle,
            message: cleanMessage,
            priority: editPriority,
            expires_at: editExpiresAt
              ? new Date(
                  editExpiresAt
                ).toISOString()
              : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to update announcement."
        );
      }

      cancelEditing();

      setFeedback(
        "Announcement updated successfully."
      );

      await loadAnnouncements(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to update announcement."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function toggleAnnouncement(
    announcement: Announcement
  ) {
    const action = announcement.is_active
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      announcement.is_active
        ? "Deactivate this announcement? Players will no longer see it."
        : "Activate this announcement? Players will be able to see it."
    );

    if (!confirmed) return;

    setWorkingId(announcement.id);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/announcements?id=${encodeURIComponent(
          announcement.id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "toggle",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            `Failed to ${action} announcement.`
        );
      }

      setFeedback(
        announcement.is_active
          ? "Announcement deactivated."
          : "Announcement activated."
      );

      await loadAnnouncements(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : `Failed to ${action} announcement.`
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function expireAnnouncement(
    announcement: Announcement
  ) {
    const confirmed = window.confirm(
      "Expire this announcement now? It will be deactivated immediately."
    );

    if (!confirmed) return;

    setWorkingId(announcement.id);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/announcements?id=${encodeURIComponent(
          announcement.id
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "expire",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to expire announcement."
        );
      }

      setFeedback(
        "Announcement expired successfully."
      );

      await loadAnnouncements(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to expire announcement."
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteAnnouncement(
    announcement: Announcement
  ) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setWorkingId(announcement.id);
    setFeedback("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/announcements?id=${encodeURIComponent(
          announcement.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Failed to delete announcement."
        );
      }

      if (editingId === announcement.id) {
        cancelEditing();
      }

      setFeedback(
        "Announcement deleted permanently."
      );

      await loadAnnouncements(false);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to delete announcement."
      );
    } finally {
      setWorkingId(null);
    }
  }

  const activeCount = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          announcement.is_active
      ).length,
    [announcements]
  );

  const urgentCount = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          announcement.priority === "urgent" &&
          announcement.is_active
      ).length,
    [announcements]
  );

  const scheduledCount = useMemo(
    () =>
      announcements.filter(
        (announcement) =>
          announcement.expires_at &&
          new Date(
            announcement.expires_at
          ).getTime() > Date.now()
      ).length,
    [announcements]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* HEADER */}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin"
          className="text-sm font-semibold text-orange-400 transition hover:text-orange-300"
        >
          ← Admin Dashboard
        </Link>

        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Updating...
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              loadAnnouncements(false)
            }
            disabled={
              refreshing || loadingList
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-white disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* HERO */}

      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-950 p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400">
          📢 ANNOUNCEMENTS
        </div>

        <h1 className="mt-5 text-4xl font-black">
          Player Announcements
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Publish important messages that can
          appear across Abuja Life for your players.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Total
            </p>

            <p className="mt-2 text-2xl font-black">
              {announcements.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Active
            </p>

            <p className="mt-2 text-2xl font-black text-green-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Urgent
            </p>

            <p className="mt-2 text-2xl font-black text-red-400">
              {urgentCount}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              Expiring
            </p>

            <p className="mt-2 text-2xl font-black text-blue-400">
              {scheduledCount}
            </p>
          </div>
        </div>
      </section>

      {/* FEEDBACK */}

      {feedback && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-slate-300">
          {feedback}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              loadAnnouncements(true)
            }
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase text-red-300 hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      {/* CONTENT */}

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
              Publish a message that can be shown
              to players throughout Abuja Life.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">
                  Title
                </label>

                <span className="text-[10px] text-slate-700">
                  {title.length}/120
                </span>
              </div>

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
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">
                  Message
                </label>

                <span className="text-[10px] text-slate-700">
                  {message.length}/1000
                </span>
              </div>

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
                  Normal — General information
                </option>

                <option value="important">
                  Important — Players should notice
                </option>

                <option value="urgent">
                  Urgent — High priority
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-400">
                Expiration
              </label>

              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
              />

              <p className="mt-2 text-[10px] text-slate-600">
                Leave empty to keep the announcement
                active until you deactivate it.
              </p>
            </div>

            {/* PREVIEW */}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                Player Preview
              </p>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black">
                      {title.trim() ||
                        "Announcement title"}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {message.trim() ||
                        "Your announcement message will appear here."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${priorityClass(
                      priority
                    )}`}
                  >
                    {priorityLabel(priority)}
                  </span>
                </div>
              </div>
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
                Manage messages published by the
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
                (announcement) => {
                  const isWorking =
                    workingId ===
                    announcement.id;

                  const isEditing =
                    editingId ===
                    announcement.id;

                  return (
                    <article
                      key={announcement.id}
                      className={`rounded-xl border bg-black/20 p-4 transition ${
                        announcement.is_active
                          ? "border-white/10"
                          : "border-white/5 opacity-70"
                      }`}
                    >
                      {isEditing ? (
                        /* EDIT MODE */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-orange-400">
                                Editing announcement
                              </p>

                              <p className="mt-1 text-[10px] text-slate-600">
                                Changes are applied immediately.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={
                                cancelEditing
                              }
                              disabled={isWorking}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-white disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Title
                            </label>

                            <input
                              value={
                                editTitle
                              }
                              onChange={(
                                event
                              ) =>
                                setEditTitle(
                                  event.target
                                    .value
                                )
                              }
                              maxLength={120}
                              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Message
                            </label>

                            <textarea
                              value={
                                editMessage
                              }
                              onChange={(
                                event
                              ) =>
                                setEditMessage(
                                  event.target
                                    .value
                                )
                              }
                              rows={5}
                              maxLength={1000}
                              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-orange-500/50"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Priority
                              </label>

                              <select
                                value={
                                  editPriority
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditPriority(
                                    event.target
                                      .value as Priority
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

                            <div>
                              <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Expiration
                              </label>

                              <input
                                type="datetime-local"
                                value={
                                  editExpiresAt
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditExpiresAt(
                                    event.target
                                      .value
                                  )
                                }
                                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              saveEdit(
                                announcement.id
                              )
                            }
                            disabled={isWorking}
                            className="w-full rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-white transition hover:bg-orange-400 disabled:opacity-50"
                          >
                            {isWorking
                              ? "Saving..."
                              : "Save Changes"}
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* DISPLAY */}

                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-black">
                                  {
                                    announcement.title
                                  }
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${priorityClass(
                                    announcement.priority
                                  )}`}
                                >
                                  {priorityLabel(
                                    announcement.priority
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {
                                  announcement.message
                                }
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
                                announcement.is_active
                                  ? "border-green-500/20 bg-green-500/10 text-green-400"
                                  : "border-white/10 bg-white/5 text-slate-600"
                              }`}
                            >
                              {announcement.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          {/* METADATA */}

                          <div className="mt-4 grid gap-3 border-t border-white/5 pt-3 sm:grid-cols-3">
                            <div>
                              <p className="text-[10px] text-slate-600">
                                Published
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {formatDate(
                                  announcement.created_at
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-600">
                                Expires
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {formatDate(
                                  announcement.expires_at
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-600">
                                ID
                              </p>

                              <p className="mt-1 truncate font-mono text-[9px] text-slate-700">
                                {
                                  announcement.id
                                }
                              </p>
                            </div>
                          </div>

                          {/* CONTROLS */}

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(
                                  announcement
                                )
                              }
                              disabled={isWorking}
                              className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                            >
                              ✎ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleAnnouncement(
                                  announcement
                                )
                              }
                              disabled={isWorking}
                              className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase transition disabled:opacity-50 ${
                                announcement.is_active
                                  ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                                  : "border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                              }`}
                            >
                              {isWorking
                                ? "Working..."
                                : announcement.is_active
                                ? "⏸ Deactivate"
                                : "▶ Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                expireAnnouncement(
                                  announcement
                                )
                              }
                              disabled={
                                isWorking ||
                                !announcement.is_active
                              }
                              className="rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-[10px] font-black uppercase text-orange-400 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              ⏱ Expire Now
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteAnnouncement(
                                  announcement
                                )
                              }
                              disabled={isWorking}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              {isWorking
                                ? "Working..."
                                : "🗑 Delete"}
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  );
                }
              )
            )}
          </div>
        </section>
      </section>

      {/* INFO */}

      <section className="mt-6 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03] px-5 py-4">
        <p className="text-xs font-black text-blue-400">
          📡 Live announcement delivery
        </p>

        <p className="mt-1 text-[10px] leading-5 text-slate-600">
          Active announcements are available through
          the public announcement endpoint and can be
          displayed inside the game. This admin panel
          refreshes every 30 seconds.
        </p>
      </section>
    </div>
  );
}
