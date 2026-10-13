"use client";

import { useEffect, useState } from "react";

interface GameSettings {
  game_name: string;
  maintenance_mode: boolean;
  registrations_enabled: boolean;
  multiplayer_enabled: boolean;
  economy_enabled: boolean;
  announcements_enabled: boolean;
  tasks_enabled: boolean;
  payments_enabled: boolean;
}

export default function GameSettingsGuard() {
  const [settings, setSettings] =
    useState<GameSettings | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    try {
      const response = await fetch(
        "/api/game/settings",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error(
        "Game settings error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();

    const interval = window.setInterval(
      loadSettings,
      30 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  if (loading || !settings) {
    return null;
  }

  if (!settings.maintenance_mode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#050b0a]/95 px-5 backdrop-blur-xl">
      <div className="w-full max-w-lg rounded-3xl border border-orange-400/20 bg-[#0b1714] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-400/20 bg-orange-400/10 text-4xl">
          🛠️
        </div>

        <div className="mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-orange-400">
          {settings.game_name || "Abuja Life"}
        </div>

        <h1 className="mt-3 text-3xl font-black">
          We'll be right back
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/50">
          Abuja Life is currently undergoing
          maintenance. Your player account and
          progress are safe.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" />

            <span className="text-xs font-black uppercase tracking-wider text-orange-300">
              Maintenance in progress
            </span>
          </div>
        </div>

        <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-white/20">
          Please check back shortly
        </p>
      </div>
    </div>
  );
}
