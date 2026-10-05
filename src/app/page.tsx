"use client";

import { useState } from "react";

const locations = [
  { name: "Wuse", icon: "🏙️", description: "Busy streets, shops and city life." },
  { name: "Maitama", icon: "🏡", description: "Luxury homes and quiet streets." },
  { name: "Jabi", icon: "🌊", description: "Lake views, restaurants and nightlife." },
  { name: "Garki", icon: "🏢", description: "Business, shopping and everyday Abuja." },
  { name: "Wuse 2", icon: "🌃", description: "Restaurants, lounges and nightlife." },
  { name: "CBD", icon: "🏛️", description: "The heart of Abuja's business district." },
];

const features = [
  {
    icon: "👤",
    title: "Create Your Life",
    text: "Build your own character, choose your style and decide what your Abuja story becomes.",
  },
  {
    icon: "💼",
    title: "Get a Job",
    text: "Work different jobs, complete activities and build your virtual wealth.",
  },
  {
    icon: "🏠",
    title: "Own a Home",
    text: "Start small and work your way toward apartments, luxury homes and dream properties.",
  },
  {
    icon: "🚗",
    title: "Explore Abuja",
    text: "Move around the city, discover locations and experience a living virtual Abuja.",
  },
  {
    icon: "👥",
    title: "Meet Players",
    text: "Make friends, chat, attend events and build your reputation around the city.",
  },
  {
    icon: "🏪",
    title: "Build a Business",
    text: "Eventually own shops, restaurants, salons, clubs and other player businesses.",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#07110f]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-[#07110f] shadow-lg shadow-emerald-500/20">
              A
            </div>

            <div>
              <div className="text-lg font-black tracking-tight">
                Abuja Life
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                Your city. Your story.
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#world" className="text-sm text-white/70 hover:text-white">
              World
            </a>
            <a href="#features" className="text-sm text-white/70 hover:text-white">
              Features
            </a>
            <a href="#locations" className="text-sm text-white/70 hover:text-white">
              Abuja
            </a>
            <a href="#events" className="text-sm text-white/70 hover:text-white">
              Events
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/5">
              Login
            </button>

            <button className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#07110f] shadow-lg shadow-emerald-500/20 hover:bg-emerald-300">
              Create Character
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg border border-white/10 px-3 py-2 md:hidden"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#07110f] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#world">World</a>
              <a href="#features">Features</a>
              <a href="#locations">Abuja</a>
              <a href="#events">Events</a>

              <button className="mt-2 rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#07110f]">
                Create Character
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.22),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.12),transparent_30%)]" />

        <div className="absolute right-[-10%] top-[15%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Abuja is waiting for you
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-8xl">
              LIVE YOUR
              <span className="block text-emerald-400">ABUJA LIFE.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">
              Create your character. Get a job. Own a home. Make friends.
              Build businesses. Explore Abuja and create a life that is
              completely yours.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-[#07110f] shadow-xl shadow-emerald-500/20 transition hover:-translate-y-1 hover:bg-emerald-300">
                START YOUR LIFE →
              </button>

              <button className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-bold backdrop-blur transition hover:bg-white/10">
                EXPLORE ABUJA
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-white/45">
              <div>
                <div className="text-2xl font-black text-white">24/7</div>
                <div>Living city</div>
              </div>

              <div>
                <div className="text-2xl font-black text-white">∞</div>
                <div>Possibilities</div>
              </div>

              <div>
                <div className="text-2xl font-black text-white">NG₦</div>
                <div>Virtual economy</div>
              </div>
            </div>
          </div>

          {/* CITY CARD */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-xl">
              <div className="relative min-h-[520px] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-900 via-[#102c27] to-[#172016]">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:50px_50px]" />

                <div className="absolute left-[15%] top-[18%] h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
                <div className="absolute right-[15%] top-[28%] h-36 w-36 rounded-full bg-yellow-400/10 blur-2xl" />

                <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute left-6 top-6 rounded-xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-md">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                    Current Location
                  </div>
                  <div className="mt-1 font-bold">📍 Central Abuja</div>
                </div>

                <div className="absolute right-6 top-6 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 backdrop-blur-md">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/60">
                    City Status
                  </div>
                  <div className="mt-1 font-bold text-emerald-300">
                    ● Alive
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                    Welcome to
                  </div>

                  <div className="text-4xl font-black sm:text-5xl">
                    ABUJA
                  </div>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
                    A virtual city filled with players, businesses,
                    opportunities and unexpected events.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-[#10201c]/90 px-5 py-4 shadow-xl backdrop-blur">
              <div className="text-xs text-white/40">CITY TIME</div>
              <div className="mt-1 font-bold">☀️ Daytime</div>
            </div>

            <div className="absolute -right-4 top-1/2 rounded-2xl border border-white/10 bg-[#10201c]/90 px-5 py-4 shadow-xl backdrop-blur">
              <div className="text-xs text-white/40">PLAYERS ONLINE</div>
              <div className="mt-1 font-bold text-emerald-300">● Coming soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* WORLD */}
      <section id="world" className="border-y border-white/5 bg-[#0a1714] py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="max-w-2xl">
            <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              A living world
            </div>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Abuja doesn't just sit there.
              <span className="text-white/40"> It lives.</span>
            </h2>

            <p className="mt-5 leading-8 text-white/50">
              The goal is to create a world that keeps changing around you.
              Different players, different jobs, different businesses and
              unexpected events can make every session feel different.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-black">{feature.title}</h3>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section id="locations" className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
                Explore the city
              </div>

              <h2 className="mt-4 text-4xl font-black sm:text-5xl">
                Your Abuja is bigger than one street.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/45">
              More districts and locations will continue to be added as the
              world grows.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <div
                key={location.name}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-7"
              >
                <div className="absolute right-[-20px] top-[-20px] text-8xl opacity-10">
                  {location.icon}
                </div>

                <div className="text-4xl">{location.icon}</div>

                <h3 className="mt-6 text-2xl font-black">{location.name}</h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-white/45">
                  {location.description}
                </p>

                <div className="mt-6 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Coming to life →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="relative overflow-hidden border-y border-white/5 bg-[#0a1714] py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.10),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Something can always happen
            </div>

            <h2 className="mt-4 text-4xl font-black sm:text-6xl">
              The city has plans.
              <span className="block text-white/40">You don't always know them.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-white/50">
              From car meets and food festivals to competitions, concerts,
              mystery deliveries and surprise city events — Abuja Life is
              designed to keep the world moving.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["🏎️", "Car Meets"],
              ["🎤", "Live Concerts"],
              ["🍲", "Food Festivals"],
              ["🎮", "Gaming Tournaments"],
              ["🎯", "City Challenges"],
              ["🕵️", "Mystery Events"],
              ["🏆", "Weekly Competitions"],
              ["🎉", "Seasonal Events"],
            ].map(([icon, title]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center"
              >
                <div className="text-3xl">{icon}</div>
                <div className="mt-3 text-sm font-bold">{title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/15 to-white/[0.03] p-8 text-center sm:p-14">
          <div className="text-5xl">🇳🇬</div>

          <h2 className="mt-6 text-4xl font-black sm:text-6xl">
            Your story starts in Abuja.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/50">
            This is only the beginning. Create your character and eventually
            step into a city built to grow.
          </p>

          <button className="mt-8 rounded-2xl bg-emerald-400 px-8 py-4 font-black text-[#07110f] shadow-xl shadow-emerald-500/20 hover:bg-emerald-300">
            CREATE YOUR CHARACTER →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-8 text-sm text-white/40 md:flex-row">
          <div>
            © {new Date().getFullYear()} Abuja Life. Your city. Your story.
          </div>

          <div className="flex gap-6">
            <span>Abuja</span>
            <span>Virtual World</span>
            <span>Built for Nigeria 🇳🇬</span>
          </div>
        </div>
      </footer>
    </main>
  );
}