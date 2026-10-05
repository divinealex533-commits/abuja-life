"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Activity = {
  title: string;
  icon: string;
  description: string;
  category: string;
  reward: number;
  cost?: number;
  action: string;
};

const locationData: Record<
  string,
  {
    subtitle: string;
    description: string;
    icon: string;
    activities: Activity[];
  }
> = {
  Wuse: {
    subtitle: "The busy heart of everyday Abuja",
    description:
      "Shopping, food, transport, street life and opportunities are everywhere in Wuse.",
    icon: "🏙️",
    activities: [
      {
        title: "Wuse Market",
        icon: "🛍️",
        description: "Shop for clothes, food, electronics and everyday items.",
        category: "SHOPPING",
        reward: 0,
        cost: 2500,
        action: "Go Shopping",
      },
      {
        title: "Food Street",
        icon: "🍔",
        description: "Grab a meal and meet people around the busy food spots.",
        category: "FOOD",
        reward: 0,
        cost: 1500,
        action: "Grab Food",
      },
      {
        title: "Street Hustle",
        icon: "💼",
        description: "Find a quick opportunity and earn some virtual cash.",
        category: "JOB",
        reward: 1800,
        action: "Start Hustle",
      },
      {
        title: "Taxi Stand",
        icon: "🚕",
        description: "Take passengers around Abuja and earn money.",
        category: "TRANSPORT",
        reward: 2200,
        action: "Drive Taxi",
      },
      {
        title: "Style Studio",
        icon: "💈",
        description: "Change your look and improve your style reputation.",
        category: "STYLE",
        reward: 0,
        cost: 3000,
        action: "Visit Studio",
      },
      {
        title: "Night Hangout",
        icon: "🌃",
        description: "Meet other players and discover what is happening tonight.",
        category: "SOCIAL",
        reward: 500,
        cost: 1000,
        action: "Go Out",
      },
    ],
  },

  Maitama: {
    subtitle: "Luxury, wealth and high society",
    description:
      "Quiet streets, expensive homes, luxury businesses and exclusive opportunities.",
    icon: "🏡",
    activities: [
      {
        title: "Luxury Estates",
        icon: "🏠",
        description: "View premium homes and properties. Wealthy citizens live here.",
        category: "PROPERTY",
        reward: 0,
        cost: 5000,
        action: "View Estates",
      },
      {
        title: "Fine Dining",
        icon: "🍽️",
        description: "Experience Abuja's expensive restaurants and meet VIPs.",
        category: "SOCIAL",
        reward: 500,
        cost: 3500,
        action: "Dine",
      },
      {
        title: "Luxury Mall",
        icon: "💎",
        description: "Shop for premium clothing, accessories and rare items.",
        category: "SHOPPING",
        reward: 0,
        cost: 7500,
        action: "Enter Mall",
      },
      {
        title: "Business Meeting",
        icon: "🤝",
        description: "Attend a private meeting and look for a valuable contract.",
        category: "BUSINESS",
        reward: 5000,
        action: "Attend Meeting",
      },
      {
        title: "Private Club",
        icon: "🥂",
        description: "Enter an exclusive social club for Abuja's elite.",
        category: "VIP",
        reward: 1000,
        cost: 4000,
        action: "Enter Club",
      },
      {
        title: "Estate Security Job",
        icon: "🛡️",
        description: "Protect a luxury property and earn respectable money.",
        category: "JOB",
        reward: 3500,
        action: "Take Shift",
      },
    ],
  },

  Jabi: {
    subtitle: "Lake views, restaurants and entertainment",
    description:
      "Relax by the lake, meet players, eat good food and enjoy Abuja nightlife.",
    icon: "🌊",
    activities: [
      {
        title: "Jabi Lake",
        icon: "🌊",
        description: "Relax around the lake and discover activities nearby.",
        category: "LEISURE",
        reward: 300,
        action: "Visit Lake",
      },
      {
        title: "Boat Ride",
        icon: "🚤",
        description: "Take a virtual boat ride around Jabi Lake.",
        category: "FUN",
        reward: 200,
        cost: 2000,
        action: "Take Boat Ride",
      },
      {
        title: "Jabi Mall",
        icon: "🛒",
        description: "Shop, eat and explore one of Abuja's busiest entertainment areas.",
        category: "SHOPPING",
        reward: 0,
        cost: 2500,
        action: "Enter Mall",
      },
      {
        title: "Lake Restaurant",
        icon: "🍝",
        description: "Have dinner with a view of the lake.",
        category: "FOOD",
        reward: 500,
        cost: 3000,
        action: "Have Dinner",
      },
      {
        title: "Night Vibes",
        icon: "🎶",
        description: "Join the evening crowd and meet other players.",
        category: "SOCIAL",
        reward: 700,
        cost: 1500,
        action: "Join Vibes",
      },
      {
        title: "Mystery Delivery",
        icon: "📦",
        description: "A mysterious customer needs something delivered around Jabi.",
        category: "MISSION",
        reward: 4000,
        action: "Accept Mission",
      },
    ],
  },

  Garki: {
    subtitle: "Business, offices and everyday opportunities",
    description:
      "A busy district where careers, contracts and businesses come together.",
    icon: "🏢",
    activities: [
      {
        title: "Office Work",
        icon: "💻",
        description: "Complete a short office shift and earn virtual money.",
        category: "JOB",
        reward: 3000,
        action: "Start Shift",
      },
      {
        title: "Business District",
        icon: "📊",
        description: "Look for contracts and business opportunities.",
        category: "BUSINESS",
        reward: 2500,
        action: "Find Contract",
      },
      {
        title: "Shopping Plaza",
        icon: "🛍️",
        description: "Buy everyday items for your character.",
        category: "SHOPPING",
        reward: 0,
        cost: 2000,
        action: "Go Shopping",
      },
      {
        title: "Restaurant",
        icon: "🍛",
        description: "Eat a proper meal and restore your energy.",
        category: "FOOD",
        reward: 300,
        cost: 1200,
        action: "Eat Meal",
      },
      {
        title: "Courier Job",
        icon: "🏍️",
        description: "Deliver packages around Garki.",
        category: "JOB",
        reward: 2800,
        action: "Deliver Package",
      },
      {
        title: "Business Networking",
        icon: "🤝",
        description: "Meet business-minded players and improve your reputation.",
        category: "SOCIAL",
        reward: 800,
        cost: 500,
        action: "Network",
      },
    ],
  },

  "Wuse 2": {
    subtitle: "Restaurants, clubs and Abuja nightlife",
    description:
      "The place to be when Abuja comes alive after dark.",
    icon: "🍸",
    activities: [
      {
        title: "Night Club",
        icon: "🪩",
        description: "Dance, socialize and meet other players.",
        category: "NIGHTLIFE",
        reward: 800,
        cost: 2500,
        action: "Enter Club",
      },
      {
        title: "Live Music",
        icon: "🎤",
        description: "Catch a live performance and enjoy the night.",
        category: "ENTERTAINMENT",
        reward: 500,
        cost: 1500,
        action: "Watch Show",
      },
      {
        title: "Fine Restaurant",
        icon: "🍷",
        description: "Have dinner at one of the city's stylish restaurants.",
        category: "FOOD",
        reward: 400,
        cost: 3000,
        action: "Book Table",
      },
      {
        title: "Car Meet",
        icon: "🚘",
        description: "Show off your ride and meet car enthusiasts.",
        category: "EVENT",
        reward: 1500,
        action: "Join Car Meet",
      },
      {
        title: "Comedy Night",
        icon: "😂",
        description: "Attend a comedy event and meet the Abuja crowd.",
        category: "EVENT",
        reward: 600,
        cost: 1000,
        action: "Attend Event",
      },
      {
        title: "DJ Challenge",
        icon: "🎧",
        description: "Take part in a nightlife challenge.",
        category: "CHALLENGE",
        reward: 3500,
        action: "Enter Challenge",
      },
    ],
  },

  CBD: {
    subtitle: "The heart of Abuja's business district",
    description:
      "Corporate offices, major opportunities and some of the biggest businesses in the city.",
    icon: "🏛️",
    activities: [
      {
        title: "Corporate Job",
        icon: "💼",
        description: "Take a professional shift in the CBD.",
        category: "JOB",
        reward: 4500,
        action: "Start Work",
      },
      {
        title: "Banking District",
        icon: "🏦",
        description: "Handle financial errands and business tasks.",
        category: "BUSINESS",
        reward: 2500,
        action: "Handle Task",
      },
      {
        title: "Government Contract",
        icon: "📑",
        description: "Apply for a high-value city contract.",
        category: "CONTRACT",
        reward: 7500,
        action: "Apply",
      },
      {
        title: "Business Tower",
        icon: "🏢",
        description: "Look for companies hiring talented citizens.",
        category: "CAREER",
        reward: 3000,
        action: "Search Jobs",
      },
      {
        title: "CBD Restaurant",
        icon: "🍽️",
        description: "Take a break and meet professionals.",
        category: "FOOD",
        reward: 500,
        cost: 2000,
        action: "Have Lunch",
      },
      {
        title: "Investor Meetup",
        icon: "💰",
        description: "Pitch your business idea to potential investors.",
        category: "BUSINESS",
        reward: 10000,
        cost: 1500,
        action: "Pitch Idea",
      },
    ],
  },
};

export default function LocationPage() {
  const searchParams = useSearchParams();

  const rawName = searchParams.get("name") || "Wuse";

  const locationName = Object.keys(locationData).find(
    (name) => name.toLowerCase() === rawName.toLowerCase()
  ) || "Wuse";

  const location = locationData[locationName];

  const [balance, setBalance] = useState(10000);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = useMemo(() => {
    return [
      "ALL",
      ...Array.from(
        new Set(location.activities.map((activity) => activity.category))
      ),
    ];
  }, [location.activities]);

  const visibleActivities =
    activeCategory === "ALL"
      ? location.activities
      : location.activities.filter(
          (activity) => activity.category === activeCategory
        );

  function handleActivity(activity: Activity) {
    const cost = activity.cost || 0;

    if (balance < cost) {
      setMessage(
        `❌ You need ₦${cost.toLocaleString()} to do "${activity.title}".`
      );
      return;
    }

    setBalance((current) => current - cost + activity.reward);

    if (cost > 0 && activity.reward > 0) {
      setMessage(
        `🔥 ${activity.action} complete! You spent ₦${cost.toLocaleString()} and earned ₦${activity.reward.toLocaleString()}.`
      );
    } else if (cost > 0) {
      setMessage(
        `✅ You completed "${activity.title}" and spent ₦${cost.toLocaleString()}.`
      );
    } else {
      setMessage(
        `🎉 "${activity.title}" complete! You earned ₦${activity.reward.toLocaleString()}.`
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#06100e] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06100e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/game"
            className="text-lg font-black tracking-tight hover:text-emerald-300"
          >
            ABUJA <span className="text-emerald-400">LIFE</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                Wallet
              </div>
              <div className="font-black text-emerald-300">
                ₦{balance.toLocaleString()}
              </div>
            </div>

            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10"
            >
              ← Abuja
            </Link>
          </div>
        </div>
      </header>

      {/* LOCATION HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/20 via-[#10211c] to-cyan-500/10 p-7 shadow-2xl md:p-10">
          <div className="text-6xl">{location.icon}</div>

          <div className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
            Abuja Life • District
          </div>

          <h1 className="mt-2 text-5xl font-black tracking-tight md:text-7xl">
            {locationName}
          </h1>

          <h2 className="mt-3 text-xl font-bold text-white/80 md:text-2xl">
            {location.subtitle}
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            {location.description}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
              📍 You are here
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60">
              👥 Players nearby
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/60">
              🎯 {location.activities.length} activities
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVITY SECTION */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
            Explore
          </div>

          <h2 className="mt-1 text-3xl font-black md:text-4xl">
            Things to do in {locationName}
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Every activity can affect your life in Abuja.
          </p>
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-black transition ${
                activeCategory === category
                  ? "bg-emerald-400 text-black"
                  : "border border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
            {message}
          </div>
        )}

        {/* ACTIVITIES */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleActivities.map((activity) => (
            <div
              key={activity.title}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                  {activity.icon}
                </div>

                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[9px] font-black text-emerald-300">
                  {activity.category}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">
                {activity.title}
              </h3>

              <p className="mt-2 min-h-[50px] text-sm leading-6 text-white/45">
                {activity.description}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  {activity.cost ? (
                    <>
                      <div className="text-[9px] uppercase tracking-widest text-white/30">
                        Cost
                      </div>
                      <div className="font-black text-red-300">
                        -₦{activity.cost.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] uppercase tracking-widest text-white/30">
                        Reward
                      </div>
                      <div className="font-black text-emerald-300">
                        +₦{activity.reward.toLocaleString()}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleActivity(activity)}
                  className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-black transition hover:bg-emerald-300"
                >
                  {activity.action} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLAYER STATUS */}
      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/30">
                Current Location
              </div>
              <div className="mt-1 font-black">{locationName}</div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-white/30">
                Wallet
              </div>
              <div className="mt-1 font-black text-emerald-300">
                ₦{balance.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-white/30">
                Status
              </div>
              <div className="mt-1 font-black text-cyan-300">
                🟢 Active Citizen
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/30 sm:flex-row">
          <div>© {new Date().getFullYear()} Abuja Life</div>
          <div>Your city. Your story. 🇳🇬</div>
        </div>
      </footer>
    </main>
  );
}