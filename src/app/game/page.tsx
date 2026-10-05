"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CharacterData {
  name: string;
  gender: string;
  skin: string;
  style: string;
  createdAt?: string;
}

const locations = [
  {
    name: "Wuse",
    icon: "🏙️",
    description: "Busy streets, shops, food and nightlife.",
  },
  {
    name: "Maitama",
    icon: "🏡",
    description: "Luxury homes, quiet streets and high society.",
  },
  {
    name: "Jabi",
    icon: "🌊",
    description: "Lake views, restaurants and entertainment.",
  },
  {
    name: "Garki",
    icon: "🏢",
    description: "Business district with shops and offices.",
  },
  {
    name: "Wuse 2",
    icon: "🍸",
    description: "Restaurants, clubs and Abuja nightlife.",
  },
  {
    name: "CBD",
    icon: "🏛️",
    description: "The heart of Abuja's business district.",
  },
];

const events = [
  {
    title: "Jabi Night Vibes",
    time: "Tonight • 8:00 PM",
    icon: "🌃",
  },
  {
    title: "Mystery Delivery",
    time: "Available now",
    icon: "📦",
  },
  {
    title: "Abuja Street Race",
    time: "Saturday • 7:00 PM",
    icon: "🏎️",
  },
];

const news = [
  "New players have arrived in Abuja.",
  "A luxury apartment is now available in Maitama.",
  "The Jabi Night Vibes event starts tonight.",
];

function getStyleEmoji(style: string) {
  switch (style) {
    case "Smart":
      return "👔";
    case "Casual":
      return "👕";
    case "Luxury":
      return "🕶️";
    case "Street":
    default:
      return "🧢";
  }
}

export default function GamePage() {
  const [activeLocation, setActiveLocation] = useState("Wuse");
  const [menuOpen, setMenuOpen] = useState(false);

  const [character, setCharacter] = useState<CharacterData>({
    name: "New Citizen",
    gender: "Male",
    skin: "🧑🏾",
    style: "Street",
  });

  useEffect(() => {
    try {
      const savedCharacter = localStorage.getItem("abujaLifeCharacter");

      if (savedCharacter) {
        const parsedCharacter = JSON.parse(savedCharacter);

        setCharacter({
          name: parsedCharacter.name || "New Citizen",
          gender: parsedCharacter.gender || "Male",
          skin: parsedCharacter.skin || "🧑🏾",
          style: parsedCharacter.style || "Street",
          createdAt: parsedCharacter.createdAt,
        });
      }
    } catch (error) {
      console.error("Could not load character:", error);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xl font-black tracking-tight">
              ABUJA <span className="text-emerald-400">LIFE</span>
            </div>

            <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Your city. Your story.
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <button className="text-sm text-emerald-300">World</button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Events
            </button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Players
            </button>

            <button className="text-sm text-white/60 transition hover:text-white">
              Businesses
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:hidden"
          >
            ☰
          </button>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
              <div className="text-[10px] text-white/40">BALANCE</div>

              <div className="font-bold text-emerald-300">
                ₦10,000
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              {character.skin}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="grid gap-2">
              <button className="rounded-lg bg-white/5 p-3 text-left">
                🌍 World
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                🎉 Events
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                👥 Players
              </button>

              <button className="rounded-lg bg-white/5 p-3 text-left">
                🏪 Businesses
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* PLAYER HEADER */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* WELCOME CARD */}
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 via-[#10201c] to-cyan-500/10 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                  Welcome to Abuja
                </div>

                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Your Life.
                  <br />
                  <span className="text-emerald-400">
                    Your Abuja.
                  </span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
                  Build your character, find a home, get a job, meet
                  players, explore the city and create your own story.
                </p>
              </div>

              <div className="hidden text-6xl md:block">
                🇳🇬
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  CASH
                </div>

                <div className="mt-1 text-xl font-black text-emerald-300">
                  ₦10,000
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  JOB
                </div>

                <div className="mt-1 font-bold">
                  Unemployed
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/40">
                  HOME
                </div>

                <div className="mt-1 font-bold">
                  Starter Room
                </div>
              </div>
            </div>
          </div>

          {/* CHARACTER CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-white/40">
                  Your Character
                </div>

                <h2 className="mt-1 text-2xl font-black">
                  {character.name}
                </h2>
              </div>

              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                ONLINE
              </span>
            </div>

            {/* CHARACTER PREVIEW */}
            <div className="flex items-center gap-5">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20">
                <div className="text-7xl">
                  {character.skin}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-white/40">
                    Location:
                  </span>{" "}
                  <span className="font-bold">
                    {activeLocation}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Gender:
                  </span>{" "}
                  <span className="font-bold">
                    {character.gender}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Style:
                  </span>{" "}
                  <span className="font-bold">
                    {getStyleEmoji(character.style)}{" "}
                    {character.style}
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Level:
                  </span>{" "}
                  <span className="font-bold">
                    1
                  </span>
                </div>

                <div>
                  <span className="text-white/40">
                    Reputation:
                  </span>{" "}
                  <span className="font-bold">
                    Newcomer
                  </span>
                </div>
              </div>
            </div>

            <a
              href="/create-character"
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black transition hover:bg-emerald-300"
            >
              🧑‍🎨 Customize Character
            </a>
          </div>
        </div>
      </section>

      {/* CITY */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              Explore Abuja
            </div>

            <h2 className="mt-1 text-3xl font-black">
              Where do you want to go?
            </h2>
          </div>

          <div className="hidden text-sm text-white/40 sm:block">
            📍 Currently in {activeLocation}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <button
              key={location.name}
              onClick={() =>
                setActiveLocation(location.name)
              }
              className={`group rounded-3xl border p-5 text-left transition ${
                activeLocation === location.name
                  ? "border-emerald-400/50 bg-emerald-400/10"
                  : "border-white/10 bg-white/[0.04] hover:border-emerald-400/30 hover:bg-white/[0.07]"
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-4xl">
                  {location.icon}
                </div>

                {activeLocation === location.name && (
                  <span className="rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black text-black">
                    HERE
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black">
                {location.name}
              </h3>

              <p className="mt-2 text-sm leading-5 text-white/50">
                {location.description}
              </p>

              <Link
  href={`/location?name=${encodeURIComponent(location.name)}`}
  onClick={(e) => e.stopPropagation()}
  className="mt-4 inline-block text-xs font-bold text-emerald-300 transition hover:text-emerald-200"
>
  ENTER LOCATION →
</Link>
            </button>
          ))}
        </div>
      </section>

      {/* EVENTS + NEWS */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 lg:grid-cols-[1.5fr_1fr]">
        {/* EVENTS */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              City Activity
            </div>

            <h2 className="mt-1 text-3xl font-black">
              What's happening?
            </h2>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.title}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-2xl">
                  {event.icon}
                </div>

                <div className="flex-1">
                  <div className="font-bold">
                    {event.title}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    {event.time}
                  </div>
                </div>

                <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-emerald-400 hover:text-black">
                  VIEW
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* NEWS */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-white/[0.03] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Abuja Daily
            </div>

            <h2 className="mt-1 text-3xl font-black">
              City News
            </h2>
          </div>

          <div className="space-y-3">
            {news.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  STORY 0{index + 1}
                </div>

                <p className="text-sm leading-6 text-white/70">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <button className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold transition hover:bg-white/10">
            Read Abuja Daily →
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5">
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
            Your Life
          </div>

          <h2 className="mt-1 text-3xl font-black">
            Quick Actions
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["💼", "Find a Job", "Start earning virtual ₦"],
            ["🏠", "My Home", "View and upgrade your house"],
            ["🎒", "Inventory", "Check your belongings"],
            ["🚗", "Transport", "Explore Abuja by vehicle"],
          ].map(([icon, title, text]) => (
            <button
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-400/30"
            >
              <div className="text-3xl">
                {icon}
              </div>

              <div className="mt-4 font-black">
                {title}
              </div>

              <div className="mt-1 text-xs text-white/40">
                {text}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/40 sm:flex-row">
          <div>
            ©️ {new Date().getFullYear()} Abuja Life. Your city. Your story.
          </div>

          <div className="flex gap-5">
            <span>Abuja</span>
            <span>Virtual World</span>
            <span>Built for Nigeria 🇳🇬</span>
          </div>
        </div>
      </footer>
    </main>
  );
}