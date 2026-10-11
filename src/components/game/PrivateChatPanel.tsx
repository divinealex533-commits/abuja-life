"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getPrivateMessages,
  sendPrivateMessage,
  subscribeToPrivateMessages,
  type PrivateMessage,
} from "@/lib/multiplayer/privateChat";

import {
  getPrivateVoiceNotes,
  getVoiceNoteUrl,
  sendVoiceNote,
  type VoiceNote,
} from "@/lib/multiplayer/voiceNotes";

interface PrivateChatPanelProps {
  otherPlayerId: string;
  otherPlayerName: string;
  otherPlayerUsername: string;
  otherPlayerAvatar?: string;
  onClose?: () => void;
}

interface VoiceMessageItem {
  voice: VoiceNote;
  url: string;
}

export default function PrivateChatPanel({
  otherPlayerId,
  otherPlayerName,
  otherPlayerUsername,
  otherPlayerAvatar = "🧑🏽",
  onClose,
}: PrivateChatPanelProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<
    VoiceMessageItem[]
  >([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [error, setError] = useState("");
  const [newMessageId, setNewMessageId] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const recordingTimerRef =
    useRef<number | null>(null);

  const recordingStartedAtRef =
    useRef<number>(0);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getPrivateMessages(
        otherPlayerId
      );

      setMessages(data);
      setError("");
    } catch (err) {
      console.error("Private chat error:", err);

      setError("Unable to load this conversation.");
    } finally {
      setLoading(false);
    }
  }, [otherPlayerId]);

  const loadVoiceMessages = useCallback(async () => {
    try {
      const data = await getPrivateVoiceNotes(
        otherPlayerId
      );

      const resolved = await Promise.all(
        data.map(async (voice) => {
          try {
            const url = await getVoiceNoteUrl(
              voice.storagePath
            );

            return {
              voice,
              url,
            };
          } catch (err) {
            console.error(
              "Could not load voice note:",
              err
            );

            return null;
          }
        })
      );

      setVoiceMessages(
        resolved.filter(
          (
            item
          ): item is VoiceMessageItem =>
            item !== null
        )
      );
    } catch (err) {
      console.error(
        "Voice note loading error:",
        err
      );
    }
  }, [otherPlayerId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setVoiceMessages([]);
    setError("");

    loadMessages();
    loadVoiceMessages();

    const unsubscribe =
      subscribeToPrivateMessages(
        otherPlayerId,
        (incomingMessage: PrivateMessage) => {
          setMessages((current) => {
            const exists = current.some(
              (item) =>
                item.id === incomingMessage.id
            );

            if (exists) {
              return current;
            }

            setNewMessageId(
              incomingMessage.id
            );

            return [
              ...current,
              incomingMessage,
            ];
          });
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    otherPlayerId,
    loadMessages,
    loadVoiceMessages,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, voiceMessages]);

  useEffect(() => {
    if (!newMessageId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNewMessageId(null);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [newMessageId]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(
          recordingTimerRef.current
        );
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function handleSend(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await sendPrivateMessage(
        otherPlayerId,
        cleanMessage
      );

      setMessage("");

      await loadMessages();
    } catch (err) {
      console.error(
        "Send private message error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }

  function getSupportedMimeType() {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    return (
      types.find((type) =>
        MediaRecorder.isTypeSupported(type)
      ) || ""
    );
  }

  async function startRecording() {
    if (
      recording ||
      sendingVoice
    ) {
      return;
    }

    setError("");

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Voice recording is not supported on this device."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      const mimeType =
        getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
          })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        const chunks =
          audioChunksRef.current;

        audioChunksRef.current = [];

        const duration =
          Math.max(
            1,
            Math.round(
              (Date.now() -
                recordingStartedAtRef.current) /
                1000
            )
          );

        if (!chunks.length) {
          setRecording(false);
          return;
        }

        const blob = new Blob(chunks, {
          type:
            recorder.mimeType ||
            "audio/webm",
        });

        setSendingVoice(true);
        setError("");

        try {
          await sendVoiceNote(
            otherPlayerId,
            blob,
            duration
          );

          await loadVoiceMessages();
        } catch (err) {
          console.error(
            "Send voice note error:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to send voice note."
          );
        } finally {
          setSendingVoice(false);
          setRecording(false);
        }
      };

      mediaRecorderRef.current =
        recorder;

      recordingStartedAtRef.current =
        Date.now();

      recorder.start();

      setRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current =
        window.setInterval(() => {
          setRecordingSeconds(
            Math.floor(
              (Date.now() -
                recordingStartedAtRef.current) /
                1000
            )
          );
        }, 250);
    } catch (err) {
      console.error(
        "Microphone permission error:",
        err
      );

      setError(
        "Microphone permission is required to record a voice note."
      );
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (
      recordingTimerRef.current
    ) {
      window.clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current =
        null;
    }

    if (
      mediaRecorderRef.current.state !==
      "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }

  function formatDuration(
    seconds: number
  ) {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${minutes}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-black/20 to-cyan-500/10 shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-4">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-lg text-white/70 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            ←
          </button>
        )}

        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            {otherPlayerAvatar}
          </div>

          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#111827] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-black text-white">
            {otherPlayerName}
          </div>

          <div className="mt-0.5 truncate text-xs text-white/40">
            @{otherPlayerUsername}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Online
          </div>
        </div>
      </div>

      {/* CHAT */}
      <div className="h-[28rem] overflow-y-auto p-4">
        {loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                style={{
                  animationDelay:
                    "120ms",
                }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"
                style={{
                  animationDelay:
                    "240ms",
                }}
              />
            </div>

            <p className="mt-3 text-sm text-white/40">
              Opening conversation...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          messages.length === 0 &&
          voiceMessages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-400/10 text-3xl">
                👋
              </div>

              <h3 className="mt-4 font-black text-white">
                Start the conversation
              </h3>

              <p className="mt-1 max-w-xs text-sm text-white/40">
                Send {otherPlayerName} a
                message or voice note.
              </p>
            </div>
          )}

        {!loading &&
          (messages.length > 0 ||
            voiceMessages.length > 0) && (
            <div className="space-y-3">
              {messages.map((item) => {
                const isMine =
                  item.senderId !==
                  otherPlayerId;

                return (
                  <div
                    key={`message-${item.id}`}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[82%] items-end gap-2 ${
                        isMine
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      {!isMine && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm">
                          {otherPlayerAvatar}
                        </div>
                      )}

                      <div
                        className={`chat-message-bubble ${
                          newMessageId ===
                          item.id
                            ? "chat-message-new"
                            : ""
                        } ${
                          isMine
                            ? "rounded-2xl rounded-br-md bg-cyan-500 px-4 py-3 text-black"
                            : "rounded-2xl rounded-bl-md bg-white/10 px-4 py-3 text-white"
                        }`}
                      >
                        <div className="text-sm leading-relaxed">
                          {item.message}
                        </div>

                        <div
                          className={`mt-1 text-[9px] ${
                            isMine
                              ? "text-black/50"
                              : "text-white/30"
                          }`}
                        >
                          {new Date(
                            item.createdAt
                          ).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute:
                                "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {voiceMessages.map(
                ({
                  voice,
                  url,
                }) => {
                  const isMine =
                    voice.senderId !==
                    otherPlayerId;

                  return (
                    <div
                      key={`voice-${voice.id}`}
                      className={`flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[85%] items-end gap-2 ${
                          isMine
                            ? "flex-row-reverse"
                            : "flex-row"
                        }`}
                      >
                        {!isMine && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm">
                            {otherPlayerAvatar}
                          </div>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isMine
                              ? "rounded-br-md bg-violet-500 text-white"
                              : "rounded-bl-md bg-white/10 text-white"
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2 text-xs font-black">
                            🎙️ Voice note
                          </div>

                          <audio
                            controls
                            preload="metadata"
                            src={url}
                            className="h-9 max-w-[230px]"
                          />

                          <div className="mt-1 text-[9px] text-white/40">
                            {formatDuration(
                              voice.durationSeconds
                            )}{" "}
                            •{" "}
                            {new Date(
                              voice.createdAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSend}
        className="border-t border-white/10 bg-black/20 p-3"
      >
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder={`Message ${otherPlayerName}...`}
            maxLength={500}
            disabled={
              sending ||
              recording ||
              sendingVoice
            }
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-white/10 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={
              sending ||
              sendingVoice ||
              recording ||
              !message.trim()
            }
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-black text-black transition hover:bg-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {sending ? "…" : "➤"}
          </button>
        </div>

        {/* VOICE RECORDER */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={
              recording
                ? stopRecording
                : startRecording
            }
            disabled={sending || sendingVoice}
            className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
              recording
                ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                : "border border-violet-400/20 bg-violet-400/10 text-violet-200 hover:bg-violet-400/20"
            }`}
          >
            {sendingVoice ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                Sending voice note...
              </>
            ) : recording ? (
              <>
                <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                Recording {formatDuration(
                  recordingSeconds
                )} — Tap to send
              </>
            ) : (
              <>
                🎙️ Record Voice Note
              </>
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-white/20">
          <span>
            Voice notes are private between players.
          </span>

          <span>
            {message.length}/500
          </span>
        </div>
      </form>

      <style jsx>{`
        .chat-message-bubble {
          animation: message-in 220ms ease-out;
          transform-origin: bottom;
        }

        .chat-message-new {
          animation:
            message-in 220ms ease-out,
            message-highlight 700ms ease-out;
        }

        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes message-highlight {
          0% {
            filter: brightness(1.5);
          }

          100% {
            filter: brightness(1);
          }
        }
      `}</style>
    </section>
  );
}