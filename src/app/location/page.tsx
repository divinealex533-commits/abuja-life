"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const locationData = {
  Wuse: {
    emoji: "🏙️",
    subtitle: "The busy heart of everyday Abuja",
    description:
      "A lively district filled with shopping, food, businesses, transport and people chasing their next opportunity.",
    color: "from-emerald-500/25 to-cyan-500/10",
    places: [
      ["🛍️", "Wuse Market", "Shop for clothes, food, electronics and everyday items."],
      ["🍔", "Food Street", "Grab food, meet people and discover popular spots."],
      ["💈", "Style Corner", "Get a haircut, change your look and upgrade your character."],
      ["🏪", "Local Shops", "Browse businesses and discover player-owned stores."],
      ["🚕", "Transport Hub", "Find taxis, buses and other ways around Abuja."],
      ["🎤", "Night Spot", "Music, comedy and social events after dark."],
    ],
    jobs: [
      ["📦", "Delivery Runner", "Deliver packages around Wuse.", "₦1,500"],
      ["🍳", "Food Assistant", "Help a busy restaurant during rush hour.", "₦2,000"],
      ["📸", "Street Photographer", "Find interesting moments around Wuse.", "₦2,500"],
      ["🛍️", "Market Assistant", "Help a shopkeeper with customers.", "₦1,800"],
    ],
    activities: [
      ["🎯", "Mystery Delivery", "A secret package needs to reach someone before time runs out."],
      ["🏎️", "Street Car Meet", "Players gather to show off their vehicles."],
      ["🎤", "Open Mic Night", "Watch performances and meet other players."],
      ["🔎", "Lost Item Hunt", "Search the area for a missing item and claim the reward."],
    ],
  },

  Maitama: {
    emoji: "🏡",
    subtitle: "Luxury, wealth and high society",
    description:
      "Quiet streets, expensive homes, luxury businesses and some of the city's most exclusive opportunities.",
    color: "from-yellow-500/20 to-emerald-500/10",
    places: [
      ["🏠", "Luxury Estates", "View premium homes and properties."],
      ["🍽️", "Fine Dining", "Experience Abuja's expensive restaurants."],
      ["🏨", "Luxury Hotel", "A premium destination for players and events."],
      ["🚘", "Luxury Motors", "Discover premium vehicles."],
      ["💎", "Elite Boutique", "Shop for rare and expensive items."],
      ["🥂", "Private Lounge", "Exclusive social events and VIP gatherings."],
    ],
    jobs: [
      ["👔", "Executive Assistant", "Work for a high-profile character.", "₦4,000"],
      ["🚘", "Private Driver", "Drive VIP characters around Abuja.", "₦4,500"],
      ["🏨", "Hotel Manager", "Manage guests and hotel operations.", "₦5,000"],
      ["📸", "Luxury Photographer", "Photograph premium events.", "₦4,000"],
    ],
    activities: [
      ["🥂", "VIP Party", "A private event is happening tonight."],
      ["🚘", "Luxury Car Showcase", "See rare vehicles owned by players."],
      ["💎", "Exclusive Auction", "Rare items appear for a limited time."],
      ["🏆", "Elite Challenge", "Compete for reputation and a large reward."],
    ],
  },

  Jabi: {
    emoji: "🌊",
    subtitle: "Lake views, entertainment and social life",
    description:
      "A social part of Abuja where players can relax, eat, compete and enjoy events around the lake.",
    color: "from-cyan-500/20 to-blue-500/10",
    places: [
      ["🌊", "Jabi Lake", "Relax, explore and take part in lake activities."],
      ["🍽️", "Lake Restaurants", "Eat with friends and meet other players."],
      ["🎮", "Game Zone", "Compete in fun mini-games."],
      ["🏃", "Fitness Park", "Train your character and improve your stats."],
      ["🎵", "Entertainment Spot", "Music and live entertainment."],
      ["🚤", "Lake Activities", "Explore special activities around the waterfront."],
    ],
    jobs: [
      ["📸", "Lake Photographer", "Take photos at popular locations.", "₦2,500"],
      ["🍔", "Restaurant Worker", "Help serve customers.", "₦2,000"],
      ["🎮", "Game Host", "Run activities at the game zone.", "₦2,200"],
      ["🚤", "Activity Assistant", "Help visitors with lake activities.", "₦2,800"],
    ],
    activities: [
      ["🌅", "Jabi Sunset", "A special evening gathering begins at sunset."],
      ["🚗", "Jabi Car Meet", "Players bring their best cars to the lake."],
      ["🎣", "Fishing Challenge", "Compete to find the biggest catch."],
      ["🎉", "Lake Festival", "Food, music and activities across Jabi."],
    ],
  },

  Garki: {
    emoji: "🏢",
    subtitle: "Business, offices and opportunity",
    description:
      "A busy commercial district where players can work, build businesses and chase bigger opportunities.",
    color: "from-orange-500/20 to-emerald-500/10",
    places: [
      ["🏢", "Business Centre", "Find offices and professional opportunities."],
      ["🏦", "Financial District", "Banks and financial businesses."],
      ["🛒", "Shopping Area", "Everyday shopping and services."],
      ["🍴", "Restaurant Row", "Restaurants for workers and visitors."],
      ["🚕", "Taxi Point", "Quick transport around the city."],
      ["📰", "News Office", "Abuja Daily gathers city stories here."],
    ],
    jobs: [
      ["💼", "Office Worker", "Complete office tasks for a salary.", "₦2,500"],
      ["📰", "Reporter", "Find stories and report city events.", "₦3,000"],
      ["📊", "Business Analyst", "Complete business challenges.", "₦3,500"],
      ["🚕", "Taxi Driver", "Take passengers around Abuja.", "₦2,800"],
    ],
    activities: [
      ["📰", "Breaking Story", "A major story has just appeared in Abuja."],
      ["💼", "Business Rush", "Companies need temporary workers."],
      ["📦", "Express Delivery", "A valuable package needs a fast delivery."],
      ["🏆", "Business Challenge", "Compete with other players for rewards."],
    ],
  },

  "Wuse 2": {
    emoji: "🍸",
    subtitle: "Nightlife, restaurants and entertainment",
    description:
      "When Abuja gets dark, Wuse 2 comes alive with music, food, games and social events.",
    color: "from-purple-500/20 to-pink-500/10",
    places: [
      ["🍸", "Night Club", "Dance, socialize and meet players."],
      ["🍽️", "Restaurant District", "Popular restaurants and late-night food."],
      ["😂", "Comedy Lounge", "Comedy shows and special events."],
      ["🎮", "Gaming Lounge", "Competitive gaming activities."],
      ["🎵", "Live Music", "Artists and performers take the stage."],
      ["🚗", "Night Car Meet", "Show off your vehicle after dark."],
    ],
    jobs: [
      ["🎧", "DJ Assistant", "Help run nightlife events.", "₦3,000"],
      ["🍹", "Event Worker", "Work at busy evening events.", "₦2,500"],
      ["📸", "Event Photographer", "Capture nightlife moments.", "₦3,500"],
      ["🎤", "Event Host", "Host entertainment activities.", "₦3,200"],
    ],
    activities: [
      ["🎤", "Comedy Night", "A major comedy event is starting tonight."],
      ["🎵", "Live Music", "Players gather for a live performance."],
      ["🎮", "Gaming Tournament", "Compete for the weekly leaderboard."],
      ["🚗", "Midnight Car Meet", "A secret car meet has appeared."],
    ],
  },

  CBD: {
    emoji: "🏛️",
    subtitle: "The centre of Abuja's power and business",
    description:
      "The city's central district, filled with major businesses, offices, hotels and important events.",
    color: "from-blue-500/20 to-emerald-500/10",
    places: [
      ["🏢", "Corporate Towers", "High-level jobs and businesses."],
      ["🏦", "Central Bank District", "Major financial activity."],
      ["🏨", "Grand Hotel", "Luxury accommodation and events."],
      ["🛍️", "City Mall", "Premium shopping and entertainment."],
      ["📰", "Abuja Daily HQ", "The centre of city news."],
      ["📢", "Advertising District", "Major advertising opportunities."],
    ],
    jobs: [
      ["👔", "Corporate Employee", "Work for a major company.", "₦4,000"],
      ["📰", "Senior Journalist", "Investigate important city stories.", "₦4,500"],
      ["💼", "Business Consultant", "Solve business challenges.", "₦5,000"],
      ["📢", "Advertising Agent", "Help businesses reach players.", "₦4,500"],
    ],
    activities: [
      ["📢", "Major Announcement", "Something big is happening in Abuja."],
      ["🏆", "City Championship", "Players compete for a major prize."],
      ["📰", "Breaking News", "A major story needs investigation."],
      ["💼", "Business Summit", "Meet businesses and discover opportunities."],
    ],
  },
};

type LocationKey = keyof typeof locationData;

export default function LocationPage() {
  const searchParams = useSearchParams();
  const requestedName = searchParams.get("name") || "Wuse";

  const locationName = (
    Object.keys(locationData).includes(requestedName)
      ? requestedName
      : "Wuse"
  ) as LocationKey;

  const location = useMemo(() => locationData[locationName], [locationName]);

  return (
    <main className="min-h-screen bg-[#07110f] text-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#07110f]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/game" className="font-black tracking-tight">
            ABUJA <span className="text-emerald-400">LIFE</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2">
              <div className="text-[9px] uppercase text-white/40">
                Balance
              </div>
              <div className="font-black text-emerald-300">₦10,000</div>
            </div>

            <Link
              href="/game"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10"
            >
              ← City
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 pt-8">
        <div
          className={`rounded-[2rem] border border-white/10 bg-gradient-to-br ${location.color} p-6 md:p-10`}
        >
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div>
              <div className="text-7xl">{location.emoji}</div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                Abuja Life • District
              </p>

              <h1 className="mt-2 text-5xl font-black md:text-7xl">
                {locationName}
              </h1>

              <p className="mt-3 text-xl font-bold text-white/70">
                {location.subtitle}
              </p>

              <p className="mt-4 max-w-2xl leading-7 text-white/50">
                {location.description}
              </p>
            </div>

            <div className="flex items-end">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs uppercase tracking-widest text-white/40">
                  You are here
                </div>
                <div className="mt-2 text-2xl font-black">
                  📍 {locationName}
                </div>
                <div className="mt-1 text-sm text-emerald-300">
                  Population active
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLACES */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
            Explore
          </p>
          <h2 className="mt-1 text-3xl font-black">
            Things to do in {locationName}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {location.places.map(([icon, title, description]) => (
            <button
              key={title}
              className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{icon}</span>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black text-emerald-300">
                  EXPLORE
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">{title}</h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {description}
              </p>

              <div className="mt-4 text-xs font-black text-emerald-300">
                ENTER →
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* JOBS */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">
            Make Money
          </p>
          <h2 className="mt-1 text-3xl font-black">Jobs available here</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {location.jobs.map(([icon, title, description, pay]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-3xl">
                  {icon}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">{title}</h3>
                      <p className="mt-1 text-sm text-white/45">
                        {description}
                      </p>
                    </div>

                    <div className="whitespace-nowrap text-sm font-black text-yellow-300">
                      {pay}
                    </div>
                  </div>

                  <button className="mt-4 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-black hover:bg-emerald-300">
                    VIEW JOB →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-300">
            Live Activity
          </p>
          <h2 className="mt-1 text-3xl font-black">
            What's happening here?
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {location.activities.map(([icon, title, description]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5"
            >
              <div className="text-4xl">{icon}</div>

              <h3 className="mt-5 font-black">{title}</h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {description}
              </p>

              <button className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-black hover:bg-emerald-400 hover:text-black">
                VIEW EVENT
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-white/35 sm:flex-row">
          <span>Abuja Life • {locationName}</span>
          <Link href="/game" className="hover:text-white">
            Return to Abuja →
          </Link>
        </div>
      </footer>
    </main>
  );
}