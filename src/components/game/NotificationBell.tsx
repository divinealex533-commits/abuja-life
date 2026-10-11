"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type GameNotification,
} from "@/lib/multiplayer/notifications";

function formatNotificationTime(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();

  const seconds = Math.max(0, Math.floor((now - created) / 1000));

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(createdAt).toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return "👥";

    case "friend_accepted":
      return "🤝";

    case "private_message":
      return "💬";

    case "voice_note":
      return "🎙️";

    case "event":
      return "🎉";

    case "reward":
      return "💰";

    case "competition":
      return "🏆";

    case "city_event":
      return "🏙️";

    case "system":
    default:
      return "🔔";
  }
}

export default function NotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<
    GameNotification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setError("");

      const [items, count] = await Promise.all([
        getNotifications(50),
        getUnreadNotificationCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (err) {
      console.error("Notification load error:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();

    const unsubscribe = subscribeToNotifications((notification) => {
      setNotifications((current) => {
        const alreadyExists = current.some(
          (item) => item.id === notification.id
        );

        if (alreadyExists) {
          return current;
        }

        return [notification, ...current].slice(0, 50);
      });

      setUnreadCount((count) => count + 1);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [open]);

  async function handleNotificationClick(
    notification: GameNotification
  ) {
    try {
      setActionLoading(notification.id);

      if (!notification.readAt) {
        await markNotificationRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  readAt: new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      }

      setOpen(false);

      if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } catch (err) {
      console.error("Notification action error:", err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    try {
      setActionLoading("all");

      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((item) =>
          item.readAt
            ? item
            : {
                ...item,
                readAt: new Date().toISOString(),
              }
        )
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      setError("Unable to mark notifications as read.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(
    event: React.MouseEvent,
    notificationId: string
  ) {
    event.stopPropagation();

    try {
      setActionLoading(notificationId);

      const notification = notifications.find(
        (item) => item.id === notificationId
      );

      await deleteNotification(notificationId);

      setNotifications((current) =>
        current.filter((item) => item.id !== notificationId)
      );

      if (notification && !notification.readAt) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      console.error("Delete notification error:", err);
      setError("Unable to delete notification.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl text-white transition hover:bg-white/20"
        aria-label="Notifications"
        aria-expanded={open}
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <h3 className="font-bold text-white">
                Notifications
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={actionLoading === "all"}
                className="text-xs font-semibold text-orange-400 transition hover:text-orange-300 disabled:opacity-50"
              >
                {actionLoading === "all"
                  ? "Updating..."
                  : "Mark all read"}
              </button>
            )}
          </div>

          {error && (
            <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mb-3 text-4xl">🔔</div>

                <p className="font-semibold text-white">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Your Abuja Life updates will appear here.
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  const unread = !notification.readAt;
                  const busy =
                    actionLoading === notification.id;

                  return (
                    <div
                      key={notification.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        void handleNotificationClick(
                          notification
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          void handleNotificationClick(
                            notification
                          );
                        }
                      }}
                      className={`group relative cursor-pointer border-b border-white/5 px-4 py-4 transition hover:bg-white/5 ${
                        unread ? "bg-orange-500/5" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            unread
                              ? "bg-orange-500/15"
                              : "bg-white/5"
                          }`}
                        >
                          <span className="text-lg">
                            {getNotificationIcon(
                              notification.type
                            )}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 pr-5">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                unread
                                  ? "font-bold text-white"
                                  : "font-semibold text-slate-300"
                              }`}
                            >
                              {notification.title}
                            </p>

                            {unread && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-400" />
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {notification.message}
                          </p>

                          <p className="mt-2 text-[10px] text-slate-500">
                            {formatNotificationTime(
                              notification.createdAt
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(event) =>
                            void handleDelete(
                              event,
                              notification.id
                            )
                          }
                          disabled={busy}
                          aria-label="Delete notification"
                          className="absolute right-3 top-4 hidden text-xs text-slate-600 transition hover:text-red-400 group-hover:block disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-white/10 px-4 py-3">
              <p className="text-center text-[10px] text-slate-500">
                Abuja Life notifications update in real time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}