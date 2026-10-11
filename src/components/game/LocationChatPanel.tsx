"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getLocationChatMessages,
  sendLocationChatMessage,
  subscribeToLocationChat,
  type LocationChatMessage,
} from "@/lib/multiplayer/locationChat";

interface LocationChatPanelProps {
  locationId: string;
}

export default function LocationChatPanel({
  locationId,
}: LocationChatPanelProps) {
  const [messages, setMessages] = useState<LocationChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCount = useRef(0);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getLocationChatMessages(locationId);

      if (
        previousMessageCount.current > 0 &&
        data.length > previousMessageCount.current
      ) {
        const newest = data[data.length - 1];

        setNewMessageId(newest?.id ?? null);

        window.setTimeout(() => {
          setNewMessageId(null);
        }, 900);
      }

      previousMessageCount.current = data.length;
      setMessages(data);
      setError("");
    } catch (err) {
      console.error("Location chat error:", err);
      setError("Unable to load location chat.");
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    previousMessageCount.current = 0;

    loadMessages();

    const unsubscribe = subscribeToLocationChat(
      locationId,
      loadMessages
    );

    return () => {
      unsubscribe();
    };
  }, [locationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await sendLocationChatMessage(
        locationId,
        cleanMessage
      );

      setMessage("");

      await loadMessages();
    } catch (err) {
      console.error("Send chat error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="chat-shell relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-blue-500/10 p-5 shadow-2xl">

      {/* Ambient animated background */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl chat-orb" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl chat-orb chat-orb-delay" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            <span className="live-dot" />
            💬 Multiplayer
          </div>

          <h2 className="mt-2 text-2xl font-black text-white">
            Location Chat
          </h2>

          <p className="mt-1 text-sm text-white/50">
            Chat with players currently in this location.
          </p>
        </div>

        <div className="chat-count rounded-2xl bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-300">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="relative mt-5 h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/30 p-4 chat-scroll">

        {loading && (
          <div className="flex h-full flex-col items-center justify-center text-sm text-white/40">
            <div className="loading-dots mb-3">
              <span />
              <span />
              <span />
            </div>

            Loading location chat...
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="text-3xl">⚠️</div>

            <div className="mt-3 text-sm font-bold text-red-300">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center empty-chat">
            <div className="empty-chat-icon text-5xl">
              💬
            </div>

            <div className="mt-3 font-black text-white">
              Nobody has said anything yet
            </div>

            <p className="mt-1 text-sm text-white/40">
              Start the conversation.
            </p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((item, index) => {
              const isNewest = item.id === newMessageId;

              return (
                <div
                  key={item.id}
                  className={`chat-message-row flex items-start gap-3 ${
                    isNewest ? "chat-message-new" : ""
                  }`}
                  style={{
                    animationDelay: `${Math.min(index * 35, 250)}ms`,
                  }}
                >
                  {/* Avatar */}
                  <div className="chat-avatar flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                    {item.avatar}
                  </div>

                  <div className="min-w-0 flex-1">

                    {/* Player name */}
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-black text-white">
                        {item.displayName}
                      </span>

                      <span className="truncate text-xs text-white/30">
                        @{item.username}
                      </span>

                      <span className="online-mini-dot" />
                    </div>

                    {/* Message bubble */}
                    <div className="chat-bubble mt-1 rounded-2xl rounded-tl-md bg-white/5 px-3 py-2 text-sm text-white/80">
                      {item.message}
                    </div>

                    {/* Time */}
                    <div className="chat-time mt-1 text-[10px] text-white/25">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing / composing indicator */}
      {message.trim() && (
        <div className="chat-composing mt-2 flex items-center gap-2 px-2 text-[11px] text-cyan-300/70">
          <span className="typing-dot">
            <span />
            <span />
            <span />
          </span>

          You are typing...
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="relative mt-4 flex gap-2"
      >
        <div
          className={`chat-input-wrap min-w-0 flex-1 rounded-2xl border bg-black/30 ${
            focused
              ? "border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.08)]"
              : "border-white/10"
          }`}
        >
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Say something to players here..."
            maxLength={500}
            disabled={sending}
            className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="send-button rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <span className="sending-content">
              <span className="send-spinner" />
              ...
            </span>
          ) : (
            "Send"
          )}
        </button>
      </form>

      <div className="mt-2 flex items-center justify-between text-[10px] text-white/25">
        <span>
          {focused
            ? "Connected to this location"
            : "Messages update live"}
        </span>

        <span>{message.length}/500</span>
      </div>

      <style jsx>{`
        .chat-shell {
          animation: chatPanelIn 0.6s ease-out both;
        }

        .chat-orb {
          animation: orbFloat 5s ease-in-out infinite;
        }

        .chat-orb-delay {
          animation-delay: 1.8s;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #34d399;
          box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
          animation: livePulse 2s infinite;
        }

        .online-mini-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #34d399;
          animation: onlinePulse 2s ease-in-out infinite;
        }

        .chat-count {
          animation: countFloat 3s ease-in-out infinite;
        }

        .chat-message-row {
          opacity: 0;
          animation: messageIn 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .chat-message-new .chat-avatar {
          animation: avatarPop 0.65s cubic-bezier(0.2, 1.5, 0.4, 1);
        }

        .chat-message-new .chat-bubble {
          animation: bubblePop 0.55s ease-out;
        }

        .chat-avatar {
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .chat-message-row:hover .chat-avatar {
          transform: translateY(-2px) scale(1.06);
          background: rgba(255, 255, 255, 0.14);
        }

        .chat-bubble {
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .chat-message-row:hover .chat-bubble {
          transform: translateX(3px);
          background: rgba(255, 255, 255, 0.08);
        }

        .chat-time {
          transition: opacity 0.2s ease;
        }

        .chat-message-row:hover .chat-time {
          opacity: 0.7;
        }

        .empty-chat-icon {
          animation: emptyFloat 2.8s ease-in-out infinite;
        }

        .chat-input-wrap {
          transition:
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            transform 0.25s ease;
        }

        .chat-input-wrap:focus-within {
          transform: translateY(-1px);
        }

        .send-button {
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .send-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 211, 238, 0.18);
        }

        .send-button:not(:disabled):active {
          transform: translateY(0) scale(0.96);
        }

        .loading-dots,
        .typing-dot {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .loading-dots span,
        .typing-dot span {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: currentColor;
          animation: dotBounce 1.1s infinite ease-in-out;
        }

        .loading-dots span:nth-child(2),
        .typing-dot span:nth-child(2) {
          animation-delay: 0.15s;
        }

        .loading-dots span:nth-child(3),
        .typing-dot span:nth-child(3) {
          animation-delay: 0.3s;
        }

        .chat-composing {
          animation: composingIn 0.2s ease-out;
        }

        .sending-content {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .send-spinner {
          width: 11px;
          height: 11px;
          border: 2px solid rgba(0, 0, 0, 0.25);
          border-top-color: rgba(0, 0, 0, 0.8);
          border-radius: 999px;
          animation: spin 0.7s linear infinite;
        }

        @keyframes chatPanelIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(12px) translateX(-8px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
        }

        @keyframes avatarPop {
          0% {
            transform: scale(0.65) rotate(-8deg);
          }

          60% {
            transform: scale(1.12) rotate(3deg);
          }

          100% {
            transform: scale(1) rotate(0);
          }
        }

        @keyframes bubblePop {
          0% {
            transform: scale(0.92);
            opacity: 0.5;
          }

          70% {
            transform: scale(1.02);
          }

          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes livePulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55);
          }

          50% {
            box-shadow: 0 0 0 6px rgba(52, 211, 153, 0);
          }
        }

        @keyframes onlinePulse {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(0.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes countFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes orbFloat {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(10px, -8px) scale(1.08);
          }
        }

        @keyframes emptyFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0);
          }

          50% {
            transform: translateY(-8px) rotate(3deg);
          }
        }

        @keyframes composingIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes dotBounce {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chat-shell,
          .chat-orb,
          .chat-count,
          .chat-message-row,
          .empty-chat-icon,
          .live-dot,
          .online-mini-dot,
          .loading-dots span,
          .typing-dot span {
            animation: none !important;
          }

          .chat-message-row {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}