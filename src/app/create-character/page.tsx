"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const skinTones = [
  { name: "Deep", color: "#5C351F" },
  { name: "Dark", color: "#75452A" },
  { name: "Brown", color: "#925B38" },
  { name: "Light Brown", color: "#B87952" },
  { name: "Light", color: "#D9A078" },
];

const styles = [
  { name: "Street", emoji: "🧢" },
  { name: "Smart", emoji: "👔" },
  { name: "Casual", emoji: "👕" },
  { name: "Luxury", emoji: "🕶️" },
];

function CharacterAvatar({
  gender,
  skin,
  style,
}: {
  gender: string;
  skin: string;
  style: string;
}) {
  const selectedSkin =
    skinTones.find((item) => item.name === skin)?.color || "#925B38";

  const isFemale = gender === "Female";

  const shirtColors: Record<string, string> = {
    Street: "#2563eb",
    Smart: "#f3f4f6",
    Casual: "#ef4444",
    Luxury: "#111827",
  };

  const pantsColors: Record<string, string> = {
    Street: "#172554",
    Smart: "#1f2937",
    Casual: "#374151",
    Luxury: "#171717",
  };

  const shirtColor = shirtColors[style] || "#2563eb";
  const pantsColor = pantsColors[style] || "#172554";

  return (
    <div className="relative flex h-[250px] w-[180px] items-end justify-center">
      {/* Shadow */}
      <div className="absolute bottom-1 h-4 w-28 rounded-full bg-black/30 blur-md" />

      {/* Full body */}
      <div className="relative z-10 flex h-[235px] flex-col items-center">
        {/* Hair */}
        <div
          className={`absolute top-0 z-20 h-[54px] w-[58px] rounded-t-[28px] ${
            isFemale ? "rounded-b-[20px]" : "rounded-b-[12px]"
          }`}
          style={{
            backgroundColor: isFemale ? "#171717" : "#242424",
          }}
        >
          {/* Hair highlight */}
          <div className="absolute left-3 top-2 h-3 w-8 rounded-full bg-white/10" />
        </div>

        {/* Head */}
        <div
          className="relative z-10 mt-5 h-[62px] w-[54px] rounded-[45%]"
          style={{ backgroundColor: selectedSkin }}
        >
          {/* Ears */}
          <div
            className="absolute -left-2 top-6 h-5 w-4 rounded-full"
            style={{ backgroundColor: selectedSkin }}
          />
          <div
            className="absolute -right-2 top-6 h-5 w-4 rounded-full"
            style={{ backgroundColor: selectedSkin }}
          />

          {/* Eyes */}
          <div className="absolute left-3 top-7 h-2 w-2 rounded-full bg-[#24150f]" />
          <div className="absolute right-3 top-7 h-2 w-2 rounded-full bg-[#24150f]" />

          {/* Nose */}
          <div className="absolute left-1/2 top-8 h-3 w-1 -translate-x-1/2 rounded-full bg-black/10" />

          {/* Smile */}
          <div className="absolute left-1/2 top-11 h-1.5 w-5 -translate-x-1/2 rounded-b-full border-b-2 border-black/30" />
        </div>

        {/* Neck */}
        <div
          className="relative z-0 -mt-1 h-6 w-7"
          style={{ backgroundColor: selectedSkin }}
        />

        {/* Torso / shirt */}
        <div
          className="relative z-10 -mt-1 h-[70px] w-[76px] rounded-t-[22px] rounded-b-lg"
          style={{ backgroundColor: shirtColor }}
        >
          {/* Shirt details */}
          {style === "Smart" && (
            <>
              <div className="absolute left-1/2 top-0 h-12 w-1 -translate-x-1/2 bg-black/10" />
              <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-black/30" />
              <div className="absolute left-1/2 top-7 h-2 w-2 -translate-x-1/2 rounded-full bg-black/30" />
            </>
          )}

          {style === "Luxury" && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2 text-sm">
              ✦
            </div>
          )}

          {style === "Street" && (
            <div className="absolute left-1/2 top-5 -translate-x-1/2 text-xs font-black text-white/80">
              ABUJA
            </div>
          )}

          {style === "Casual" && (
            <div className="absolute left-1/2 top-5 -translate-x-1/2 text-lg">
              ✦
            </div>
          )}
        </div>

        {/* Left arm */}
        <div
          className="absolute left-[18px] top-[103px] h-[60px] w-[18px] rotate-[8deg] rounded-full"
          style={{ backgroundColor: selectedSkin }}
        />

        {/* Right arm */}
        <div
          className="absolute right-[18px] top-[103px] h-[60px] w-[18px] -rotate-[8deg] rounded-full"
          style={{ backgroundColor: selectedSkin }}
        />

        {/* Pants / skirt */}
        <div className="relative z-10 flex -mt-1 h-[58px] w-[68px] justify-center gap-1">
          {isFemale ? (
            <div
              className="h-[55px] w-[70px] rounded-b-[30px]"
              style={{ backgroundColor: pantsColor }}
            />
          ) : (
            <>
              <div
                className="h-[58px] w-[32px] rounded-b-lg"
                style={{ backgroundColor: pantsColor }}
              />
              <div
                className="h-[58px] w-[32px] rounded-b-lg"
                style={{ backgroundColor: pantsColor }}
              />
            </>
          )}
        </div>

        {/* Shoes */}
        <div className="relative z-10 -mt-1 flex gap-3">
          <div className="h-4 w-9 rounded-full rounded-br-xl bg-black" />
          <div className="h-4 w-9 rounded-full rounded-bl-xl bg-black" />
        </div>
      </div>

      {/* Style accessory */}
      <div className="absolute right-3 top-5 z-30 text-2xl">
        {styles.find((item) => item.name === style)?.emoji}
      </div>
    </div>
  );
}

export default function CreateCharacter() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [skin, setSkin] = useState("Brown");
  const [style, setStyle] = useState("Street");

  const canContinue = name.trim().length >= 3;

  function createCharacter() {
    if (!canContinue) return;

    localStorage.setItem(
      "abujaLifeCharacter",
      JSON.stringify({
        name: name.trim(),
        gender,
        skin,
        style,
        createdAt: new Date().toISOString(),
      })
    );

    router.push("/game");
  }

  return (
    <main className="min-h-screen bg-[#06110f] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            Abuja Life
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            CREATE YOUR
            <span className="block text-emerald-400">LIFE</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-white/50">
            Create your character, choose your style and start your new life
            in Abuja.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Character preview */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Character preview
            </p>

            <div className="mt-6 flex min-h-[360px] flex-col items-center justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-blue-500/10">
              <CharacterAvatar
                gender={gender}
                skin={skin}
                style={style}
              />

              <div className="mb-5 text-center">
                <p className="text-xl font-black">
                  {name || "Your Character"}
                </p>

                <p className="mt-1 text-sm text-white/40">
                  {style} • {gender}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            {/* Name */}
            <div>
              <label className="text-sm font-bold text-white/70">
                Character name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your character name"
                maxLength={20}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60"
              />

              <p className="mt-2 text-xs text-white/30">
                Choose a name with at least 3 characters.
              </p>
            </div>

            {/* Gender */}
            <div className="mt-7">
              <label className="text-sm font-bold text-white/70">
                Character
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                {["Male", "Female"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setGender(item)}
                    className={`rounded-2xl border px-4 py-3 font-bold transition ${
                      gender === item
                        ? "border-emerald-400 bg-emerald-400 text-[#06110f]"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {item === "Male" ? "🧑🏾" : "👩🏾"} {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin */}
            <div className="mt-7">
              <label className="text-sm font-bold text-white/70">
                Appearance
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {skinTones.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSkin(item.name)}
                    className={`grid h-14 w-14 place-items-center rounded-2xl border transition ${
                      skin === item.name
                        ? "border-emerald-400 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span
                      className="h-8 w-8 rounded-full border-2 border-black/20"
                      style={{ backgroundColor: item.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="mt-7">
              <label className="text-sm font-bold text-white/70">
                Style
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {styles.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setStyle(item.name)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      style === item.name
                        ? "border-emerald-400 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>

                    <span className="mt-1 block text-sm font-bold">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Continue */}
            <button
              type="button"
              onClick={createCharacter}
              disabled={!canContinue}
              className={`mt-8 w-full rounded-2xl px-5 py-4 font-black transition ${
                canContinue
                  ? "bg-emerald-400 text-[#06110f] hover:bg-emerald-300"
                  : "cursor-not-allowed bg-white/10 text-white/25"
              }`}
            >
              START MY LIFE →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}