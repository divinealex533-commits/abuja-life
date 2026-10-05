"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PlaceData = {
  name: string;
  icon: string;
  district: string;
  description: string;
  vibe: string;
  color: string;
  activities: {
    icon: string;
    title: string;
    description: string;
    reward: string;
  }[];
  businesses: {
    icon: string;
    name: string;
    type: string;
  }[];
  jobs: {
    icon: string;
    title: string;
    pay: string;
  }[];
};

const places: Record<string, PlaceData> = {
  Wuse: {
    name: "Wuse",
    icon: "🏙️",
    district: "Central Abuja",
    description:
      "One of Abuja's busiest districts. Shops, markets, food spots, offices and nightlife keep Wuse moving almost all day.",
    vibe: "Busy • Social • Commercial",
    color: "from-emerald-500/20 to-cyan-500/10",
    activities: [
      {
        icon: "🛍️",
        title: "Visit Wuse Market",
        description: "Browse shops, discover items and meet local players.",
        reward: "Explore",
      },
      {
        icon: "🍔",
        title: "Grab Street Food",
        description: "Find food vendors and enjoy a quick meal.",
        reward: "₦500",
      },
      {
        icon: "📦",
        title: "Mystery Delivery",
        description: "Pick up a delivery and take it somewhere in Abuja.",
        reward: "₦2,500",
      },
      {
        icon: "👥",
        title: "Meet Players",
        description: "Hang around the district and discover other citizens.",
        reward: "Social",
      },
    ],
    businesses: [
      {
        icon: "🛒",
        name: "Wuse Market",
        type: "Shopping",
      },
      {
        icon: "🍗",
        name: "Abuja Food Corner",
        type: "Restaurant",
      },
      {
        icon: "☕",
        name: "City Coffee",
        type: "Cafe",
      },
    ],
    jobs: [
      {
        icon: "📦",
        title: "Delivery Rider",
        pay: "₦2,500",
      },
      {
        icon: "🛒",
        title: "Market Assistant",
        pay: "₦1,800",
      },
      {
        icon: "🍳",
        title: "Food Vendor",
        pay: "₦2,200",
      },
    ],
  },

  Maitama: {
    name: "Maitama",
    icon: "🏡",
    district: "Maitama District",
    description:
      "Luxury homes, embassies, quiet streets and high society. Maitama is where Abuja's wealthy citizens live and socialize.",
    vibe: "Luxury • Quiet • Exclusive",
    color: "from-amber-500/20 to-emerald-500/10",
    activities: [
      {
        icon: "🏠",
        title: "View Luxury Homes",
        description: "Look at premium properties available in Maitama.",
        reward: "Explore",
      },
      {
        icon: "🍽️",
        title: "Fine Dining",
        description: "Visit an upscale restaurant and increase your reputation.",
        reward: "Reputation +",
      },
      {
        icon: "🚘",
        title: "Luxury Car Meet",
        description: "Check out expensive cars and meet wealthy players.",
        reward: "Social",
      },
      {
        icon: "💼",
        title: "Business Networking",
        description: "Meet people who may help grow your future business.",
        reward: "Network",
      },
    ],
    businesses: [
      {
        icon: "🏨",
        name: "Maitama Grand Hotel",
        type: "Hotel",
      },
      {
        icon: "🍽️",
        name: "Capital Fine Dining",
        type: "Restaurant",
      },
      {
        icon: "💎",
        name: "Elite Boutique",
        type: "Luxury Shop",
      },
    ],
    jobs: [
      {
        icon: "🚗",
        title: "Private Driver",
        pay: "₦4,000",
      },
      {
        icon: "🏨",
        title: "Hotel Staff",
        pay: "₦2,800",
      },
      {
        icon: "📸",
        title: "Luxury Photographer",
        pay: "₦3,500",
      },
    ],
  },

  Jabi: {
    name: "Jabi",
    icon: "🌊",
    district: "Jabi District",
    description:
      "A lively entertainment area built around Jabi Lake, restaurants, shopping and outdoor activities.",
    vibe: "Relaxed • Entertainment • Social",
    color: "from-cyan-500/20 to-blue-500/10",
    activities: [
      {
        icon: "🚤",
        title: "Jabi Lake Cruise",
        description: "Take a virtual boat ride around the lake.",
        reward: "₦1,000",
      },
      {
        icon: "🎣",
        title: "Fishing Challenge",
        description: "Try to catch the biggest fish in today's challenge.",
        reward: "Up to ₦3,000",
      },
      {
        icon: "📸",
        title: "Photography Challenge",
        description: "Capture the best Jabi moment of the day.",
        reward: "₦2,000",
      },
      {
        icon: "🎉",
        title: "Jabi Night Vibes",
        description: "Join tonight's social event with other players.",
        reward: "Tonight",
      },
    ],
    businesses: [
      {
        icon: "🌊",
        name: "Jabi Lake",
        type: "Attraction",
      },
      {
        icon: "🍹",
        name: "Lakeside Lounge",
        type: "Entertainment",
      },
      {
        icon: "🍕",
        name: "Jabi Food Court",
        type: "Food",
      },
    ],
    jobs: [
      {
        icon: "📸",
        title: "Event Photographer",
        pay: "₦3,000",
      },
      {
        icon: "🍽️",
        title: "Restaurant Worker",
        pay: "₦2,000",
      },
      {
        icon: "🚤",
        title: "Lake Assistant",
        pay: "₦2,500",
      },
    ],
  },

  Garki: {
    name: "Garki",
    icon: "🏢",
    district: "Garki District",
    description:
      "A major business and commercial district filled with offices, shops, restaurants and everyday city life.",
    vibe: "Business • Commercial • Active",
    color: "from-blue-500/20 to-emerald-500/10",
    activities: [
      {
        icon: "💼",
        title: "Search for Work",
        description: "Check businesses around Garki for available jobs.",
        reward: "Jobs",
      },
      {
        icon: "🏪",
        title: "Visit Local Shops",
        description: "Explore businesses and discover useful items.",
        reward: "Explore",
      },
      {
        icon: "📰",
        title: "Report City News",
        description: "Find a story and submit it to Abuja Daily.",
        reward: "₦2,000",
      },
      {
        icon: "🤝",
        title: "Business Networking",
        description: "Meet entrepreneurs and grow your reputation.",
        reward: "Network",
      },
    ],
    businesses: [
      {
        icon: "🏢",
        name: "Garki Business Hub",
        type: "Offices",
      },
      {
        icon: "🛍️",
        name: "Garki Shopping Centre",
        type: "Shopping",
      },
      {
        icon: "🍛",
        name: "City Kitchen",
        type: "Restaurant",
      },
    ],
    jobs: [
      {
        icon: "💼",
        title: "Office Assistant",
        pay: "₦2,500",
      },
      {
        icon: "📰",
        title: "Junior Reporter",
        pay: "₦3,000",
      },
      {
        icon: "🧾",
        title: "Shop Assistant",
        pay: "₦2,000",
      },
    ],
  },

  "Wuse 2": {
    name: "Wuse 2",
    icon: "🍸",
    district: "Wuse 2",
    description:
      "Restaurants, lounges, clubs and nightlife. Wuse 2 becomes even more active when the sun goes down.",
    vibe: "Nightlife • Social • Entertainment",
    color: "from-purple-500/20 to-pink-500/10",
    activities: [
      {
        icon: "🎵",
        title: "Nightlife",
        description: "Visit a nightlife venue and meet other players.",
        reward: "Social",
      },
      {
        icon: "🎤",
        title: "Open Mic Night",
        description: "Take the stage and compete against other citizens.",
        reward: "Up to ₦5,000",
      },
      {
        icon: "🎮",
        title: "Gaming Tournament",
        description: "Compete in tonight's city gaming event.",
        reward: "Prize Pool",
      },
      {
        icon: "🚗",
        title: "Night Car Meet",
        description: "Show off your ride and meet car enthusiasts.",
        reward: "Reputation +",
      },
    ],
    businesses: [
      {
        icon: "🍸",
        name: "Wuse 2 Lounge",
        type: "Lounge",
      },
      {
        icon: "🎵",
        name: "Abuja Night Club",
        type: "Nightlife",
      },
      {
        icon: "🎮",
        name: "Game Arena",
        type: "Gaming",
      },
    ],
    jobs: [
      {
        icon: "🎤",
        title: "Event Host",
        pay: "₦3,500",
      },
      {
        icon: "🎧",
        title: "DJ Assistant",
        pay: "₦3,000",
      },
      {
        icon: "🍹",
        title: "Lounge Staff",
        pay: "₦2,500",
      },
    ],
  },

  CBD: {
    name: "CBD",
    icon: "🏛️",
    district: "Central Business District",
    description:
      "The heart of Abuja's business district. Tall buildings, government offices, major companies and important city events.",
    vibe: "Corporate • Government • Important",
    color: "from-indigo-500/20 to-cyan-500/10",
    activities: [
      {
        icon: "🏢",
        title: "Business District",
        description: "Explore major companies and discover career opportunities.",
        reward: "Jobs",
      },
      {
        icon: "📰",
        title: "Abuja Daily",
        description: "Investigate the latest stories happening around the city.",
        reward: "₦3,000",
      },
      {
        icon: "🏛️",
        title: "City Event",
        description: "Check today's special CBD activity.",
        reward: "Special",
      },
      {
        icon: "💼",
        title: "Career Hunt",
        description: "Look for high-paying professional jobs.",
        reward: "High Pay",
      },
    ],
    businesses: [
      {
        icon: "🏢",
        name: "Capital Towers",
        type: "Corporate",
      },
      {
        icon: "🏦",
        name: "Abuja Finance Centre",
        type: "Finance",
      },
      {
        icon: "📰",
        name: "Abuja Daily",
        type: "News",
      },
    ],
    jobs: [
      {
        icon: "💻",
        title: "Junior Developer",
        pay: "₦5,000",
      },
      {
        icon: "📰",
        title: "News Reporter",
        pay: "₦4,000",
      },
      {
        icon: "💼",
        title: "Business Assistant",
        pay: "₦4,500",
      },
    ],
  },
};

const fallbackPlace = places.Wuse;

export default function PlacePage() {
  const [locationName, setLocationName] = useState("Wuse");
  const [selectedTab, setSelectedTab] = useState<
    "activities" | "businesses" | "jobs"
  >("activities");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");

    if (name) {
      setLocationName(name);
    }
  }, []);

  const place = useMemo(() => {
    return places[locationName] || fallbackPlace;
  }, [locationName]);

  const handleAction = (title: string) => {
    setMessage(`${title} selected. This activity will become playable soon!`);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-[#06100e] text-white">
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#06100e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/game" className="group">
            <div className="text-xl font-black tracking-tight">
              ABUJA <span className="text-emerald-400">LIFE</span>
            </div>

            <div className="text-[9px] uppercase tracking-[0.3em] text-white/40">
              Your city. Your story.
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/game"
              className="text-sm text-white/60 hover:text-emerald-300"
            >
              World
            </Link>

            <Link
              href="/game"
              className="text-sm text-white/60 hover:text-emerald-300"
            >
              Events
            </Link>

            <Link
              href="/game"
              className="text-sm text-white/60 hover:text-emerald-300"
            >
              Players
            </Link>

            <Link
              href="/game"
              className="text-sm text-white/60 hover:text-emerald-300"
            >
              Businesses
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 sm:block">
              <div className="text-[9px] text-white/40">BALANCE</div>
              <div className="font-bold text-emerald-300">₦10,000</div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg">
              👤
            </div>
          </div>
        </div>
      </nav>

      {/* LOCATION HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div
          className={`overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${place.color} p-6 shadow-2xl md:p-8`}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Link
                href="/game"
                className="mb-5 inline-flex rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                ← Back to Abuja
              </Link>

              <div className="mb-3 flex items-center gap-3">
                <span className="text-5xl">{place.icon}</span>

                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  📍 {place.district}
                </span>
              </div>

              <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                Explore Location
              </div>

              <h1 className="mt-2 text-5xl font-black tracking-tight md:text-7xl">
                {place.name}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                {place.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {place.vibe.split(" • ").map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/60"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:w-[330px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[9px] uppercase tracking-widest text-white/30">
                  Players
                </div>
                <div className="mt-1 text-xl font-black text-emerald-300">
                  24
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[9px] uppercase tracking-widest text-white/30">
                  Places
                </div>
                <div className="mt-1 text-xl font-black">
                  {place.businesses.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[9px] uppercase tracking-widest text-white/30">
                  Jobs
                </div>
                <div className="mt-1 text-xl font-black">
                  {place.jobs.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE NOTICE */}
      {message && (
        <div className="mx-auto max-w-7xl px-4 pt-5">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-300">
            ✅ {message}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* TABS */}
        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          <button
            onClick={() => setSelectedTab("activities")}
            className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition ${
              selectedTab === "activities"
                ? "bg-emerald-400 text-black"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            🎯 Activities
          </button>

          <button
            onClick={() => setSelectedTab("businesses")}
            className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition ${
              selectedTab === "businesses"
                ? "bg-emerald-400 text-black"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            🏪 Businesses
          </button>

          <button
            onClick={() => setSelectedTab("jobs")}
            className={`whitespace-nowrap rounded-xl px-5 py-3 text-sm font-bold transition ${
              selectedTab === "jobs"
                ? "bg-emerald-400 text-black"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            💼 Jobs
          </button>
        </div>

        {/* ACTIVITIES */}
        {selectedTab === "activities" && (
          <div>
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                Things to do
              </div>

              <h2 className="mt-1 text-3xl font-black">
                What do you want to do?
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {place.activities.map((activity) => (
                <button
                  key={activity.title}
                  onClick={() => handleAction(activity.title)}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-emerald-400/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                      {activity.icon}
                    </div>

                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                      {activity.reward}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    {activity.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/45">
                    {activity.description}
                  </p>

                  <div className="mt-5 text-xs font-bold text-emerald-300">
                    START ACTIVITY →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BUSINESSES */}
        {selectedTab === "businesses" && (
          <div>
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                Local Businesses
              </div>

              <h2 className="mt-1 text-3xl font-black">
                What's around here?
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {place.businesses.map((business) => (
                <button
                  key={business.name}
                  onClick={() => handleAction(business.name)}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.07]"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-4xl">
                    {business.icon}
                  </div>

                  <div className="mt-5 text-xs font-bold uppercase tracking-widest text-cyan-300">
                    {business.type}
                  </div>

                  <h3 className="mt-2 text-xl font-black">
                    {business.name}
                  </h3>

                  <div className="mt-4 text-xs font-bold text-white/40">
                    VISIT BUSINESS →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* JOBS */}
        {selectedTab === "jobs" && (
          <div>
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                Work in {place.name}
              </div>

              <h2 className="mt-1 text-3xl font-black">
                Available opportunities
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {place.jobs.map((job) => (
                <button
                  key={job.title}
                  onClick={() => handleAction(job.title)}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:-translate-y-1 hover:border-amber-400/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">
                      {job.icon}
                    </div>

                    <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">
                      {job.pay}
                    </div>
                  </div>

                  <h3 className="mt-5 text-xl font-black">{job.title}</h3>

                  <p className="mt-2 text-sm text-white/40">
                    Work in {place.name} and earn virtual money.
                  </p>

                  <div className="mt-5 text-xs font-bold text-amber-300">
                    VIEW JOB →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* OTHER LOCATIONS */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
              Keep Exploring
            </div>

            <h2 className="mt-1 text-2xl font-black">
              Explore another part of Abuja
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.values(places)
              .filter((item) => item.name !== place.name)
              .map((item) => (
                <Link
                  key={item.name}
                  href={`/place?name=${encodeURIComponent(item.name)}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-emerald-400/30 hover:bg-white/5"
                >
                  <div className="text-3xl">{item.icon}</div>

                  <div className="mt-3 font-black">{item.name}</div>

                  <div className="mt-1 text-xs text-white/40">
                    Explore location →
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/40 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Abuja Life. Your city. Your story.
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