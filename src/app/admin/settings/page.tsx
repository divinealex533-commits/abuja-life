"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GameSettings = {
  id: number;
  game_name: string;
  maintenance_mode: boolean;
  registrations_enabled: boolean;
  multiplayer_enabled: boolean;
  economy_enabled: boolean;
  announcements_enabled: boolean;
  tasks_enabled: boolean;
  payments_enabled: boolean;
  default_player_cash: number;
  max_player_energy: number;
  updated_by: string | null;
  updated_at: string;
};

const switches: {
  key: keyof GameSettings;
  label: string;
  description: string;
  danger?: boolean;
}[] = [
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    description: "Temporarily place Abuja Life into maintenance mode.",
    danger: true,
  },
  {
    key: "registrations_enabled",
    label: "Player Registrations",
    description: "Allow new players to create accounts.",
  },
  {
    key: "multiplayer_enabled",
    label: "Multiplayer",
    description: "Enable multiplayer and player-to-player features.",
  },
  {
    key: "economy_enabled",
    label: "Game Economy",
    description: "Enable the virtual money and economy systems.",
  },
  {
    key: "announcements_enabled",
    label: "Announcements",
    description: "Allow admin announcements to appear to players.",
  },
  {
    key: "tasks_enabled",
    label: "Player Tasks",
    description: "Enable admin-created tasks and missions.",
  },
  {
    key: "payments_enabled",
    label: "Payments",
    description: "Enable payment and monetization features.",
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load settings.");
      }

      setSettings(data.settings);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings(updates: Partial<GameSettings>) {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSettings(data.settings);
      setMessage("Settings saved successfully.");

      window.setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSetting(key: keyof GameSettings) {
    if (!settings) return;

    const value = settings[key];

    if (typeof value !== "boolean") return;

    if (
      key === "maintenance_mode" &&
      value === false
    ) {
      const confirmed = window.confirm(
        "Enable Maintenance Mode? Players may be unable to access normal gameplay."
      );

      if (!confirmed) return;
    }

    await saveSettings({
      [key]: !value,
    });
  }

  async function saveGeneralSettings() {
    if (!settings) return;

    await saveSettings({
      game_name: settings.game_name,
      default_player_cash: Number(
        settings.default_player_cash
      ),
      max_player_energy: Number(
        settings.max_player_energy
      ),
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-72 rounded bg-white/10" />
            <div className="mt-3 h-4 w-96 rounded bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-[#050b0a] px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <h1 className="font-black text-red-400">
              Unable to load settings
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {error || "No settings were returned."}
            </p>

            <button
              onClick={loadSettings}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b0a] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/admin"
              className="text-xs font-bold text-orange-400 hover:text-orange-300"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Admin Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Control Abuja Life's global game systems,
              registrations, economy, payments and
              player defaults from one place.
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs font-black uppercase tracking-wider text-green-400">
                Admin Control Active
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              Changes apply to the game configuration.
            </p>
          </div>
        </div>

        {/* FEEDBACK */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-400">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
            {error}
          </div>
        )}

        {/* GENERAL SETTINGS */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-black">
              Game Configuration
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Core Abuja Life configuration and player
              starting values.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Game Name
              </label>

              <input
                value={settings.game_name}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    game_name: event.target.value,
                  })
                }
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-500/50"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Default Player Cash
              </label>

              <div className="mt-3 flex items-center rounded-xl border border-white/10 bg-black/20">
                <span className="px-4 text-sm font-black text-orange-400">
                  ₦
                </span>

                <input
                  type="number"
                  min="0"
                  value={settings.default_player_cash}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      default_player_cash:
                        Number(event.target.value),
                    })
                  }
                  className="w-full bg-transparent px-2 py-3 text-sm font-bold outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Maximum Player Energy
              </label>

              <input
                type="number"
                min="1"
                max="10000"
                value={settings.max_player_energy}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    max_player_energy:
                      Number(event.target.value),
                  })
                }
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-500/50"
              />
            </div>
          </div>

          <button
            onClick={saveGeneralSettings}
            disabled={saving}
            className="mt-4 rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Game Configuration"}
          </button>
        </section>

        {/* SYSTEM SWITCHES */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-black">
              System Controls
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Turn major Abuja Life systems on or off.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {switches.map((item, index) => {
              const enabled =
                Boolean(settings[item.key]);

              return (
                <div
                  key={item.key}
                  className={`flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between ${
                    index !== switches.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black">
                        {item.label}
                      </h3>

                      {item.danger && (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-red-400">
                          High Impact
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      toggleSetting(item.key)
                    }
                    disabled={saving}
                    className={`relative h-8 w-14 shrink-0 rounded-full border transition ${
                      enabled
                        ? "border-green-400/30 bg-green-500/20"
                        : "border-white/10 bg-white/5"
                    }`}
                    aria-label={`Toggle ${item.label}`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full transition ${
                        enabled
                          ? "left-7 bg-green-400"
                          : "left-1 bg-slate-600"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* PAYMENT CONTROL */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-black">
                Payments & Revenue
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Payment configuration and settlement
                management.
              </p>
            </div>

            <Link
              href="/admin/payments"
              className="w-fit rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-black text-green-400 transition hover:bg-green-500/20"
            >
              Open Payments Center →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
              <div className="text-2xl">💳</div>
              <h3 className="mt-3 font-black">
                Payment Gateway
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Paystack payment infrastructure.
              </p>

              <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-green-400">
                {settings.payments_enabled
                  ? "Enabled"
                  : "Disabled"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl">🏦</div>
              <h3 className="mt-3 font-black">
                Settlements
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Business settlement and payout records.
              </p>

              <Link
                href="/admin/payments"
                className="mt-4 inline-block text-[10px] font-black uppercase tracking-widest text-orange-400"
              >
                Manage →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-2xl">📈</div>
              <h3 className="mt-3 font-black">
                Revenue
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Monitor money generated by Abuja Life.
              </p>

              <Link
                href="/admin/revenue"
                className="mt-4 inline-block text-[10px] font-black uppercase tracking-widest text-orange-400"
              >
                Open Revenue →
              </Link>
            </div>
          </div>
        </section>

        {/* ADMIN SHORTCUTS */}
        <section className="mt-10 pb-12">
          <div className="mb-4">
            <h2 className="text-lg font-black">
              Control Shortcuts
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/announcements"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <div className="text-2xl">📢</div>
              <h3 className="mt-3 font-black">
                Announcements
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Communicate with every player.
              </p>
            </Link>

            <Link
              href="/admin/tasks"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <div className="text-2xl">🎯</div>
              <h3 className="mt-3 font-black">
                Player Tasks
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Create tasks and rewards.
              </p>
            </Link>

            <Link
              href="/admin/chat"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <div className="text-2xl">💬</div>
              <h3 className="mt-3 font-black">
                Admin Chat
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Chat directly with players.
              </p>
            </Link>

            <Link
              href="/admin/players"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <div className="text-2xl">👥</div>
              <h3 className="mt-3 font-black">
                Players
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Manage player accounts.
              </p>
            </Link>
          </div>
        </section>

        <div className="border-t border-white/10 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-700">
          Abuja Life Admin Control Center
        </div>
      </div>
    </main>
  );
}
