"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllSkills,
  getSkillProgressPercent,
  type PlayerSkill,
} from "@/lib/game/skills";
import {
  loadProgression,
  getProgressionPercent,
  type PlayerProgression,
} from "@/lib/game/progression";
import {
  loadPlayerState,
  type PlayerGameState,
} from "@/lib/game/player";
import { loadOwnedVehicles } from "@/lib/game/garage";


export default function ProfilePage() {
  const [player, setPlayer] =
    useState<PlayerGameState | null>(null);

  const [progression, setProgression] =
    useState<PlayerProgression | null>(null);

  const [skills, setSkills] =
    useState<PlayerSkill[]>([]);

  const [vehicleCount, setVehicleCount] =
    useState(0);

  const [hasHouse, setHasHouse] =
    useState(false);

    useEffect(() => {
    const load = () => {
      setPlayer(loadPlayerState());
      setProgression(loadProgression());
      setSkills(getAllSkills());
      setVehicleCount(loadOwnedVehicles().length);

      setHasHouse(
        Boolean(
          localStorage.getItem("abujaLifeOwnedHouse")
        )
      );
    };

    load();

    window.addEventListener(
      "abujaLifePlayerUpdated",
      load
    );

    window.addEventListener(
      "abujaLifeProgressionUpdated",
      load
    );

    window.addEventListener(
      "abujaLifeSkillsUpdated",
      load
    );

    return () => {
      window.removeEventListener(
        "abujaLifePlayerUpdated",
        load
      );

      window.removeEventListener(
        "abujaLifeProgressionUpdated",
        load
      );

      window.removeEventListener(
        "abujaLifeSkillsUpdated",
        load
      );
    };
  }, []);
  
  if (!player || !progression) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        Loading profile...
      </main>
    );
  }

  const xpPercent =
    getProgressionPercent(progression);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-400">
              ABUJA LIFE
            </p>

            <h1 className="mt-1 text-3xl font-black">
              My Profile
            </h1>

            <p className="mt-1 text-white/45">
              Your life, progress and reputation in Abuja.
            </p>
          </div>

          <Link
            href="/game"
            className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400"
          >
            ← Back to City
          </Link>
        </div>

        {/* Main Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm text-white/45">
              Cash
            </div>

            <div className="mt-2 text-2xl font-black">
              ₦{player.cash.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm text-white/45">
              Reputation
            </div>

            <div className="mt-2 text-2xl font-black">
              {player.reputation}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm text-white/45">
              Energy
            </div>

            <div className="mt-2 text-2xl font-black">
              {player.energy}/{player.maxEnergy}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm text-white/45">
              Total XP
            </div>

            <div className="mt-2 text-2xl font-black">
              {progression.totalExperience.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Level */}
        <section className="mt-6 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/50 to-slate-950 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-red-300">
                PLAYER LEVEL
              </p>

              <div className="mt-1 flex items-end gap-3">
                <span className="text-5xl font-black">
                  {progression.level}
                </span>

                <span className="mb-2 text-white/40">
                  {progression.experience} /{" "}
                  {progression.experienceToNextLevel} XP
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 px-5 py-4 text-center">
              <div className="text-xs text-white/40">
                Skill Points
              </div>

              <div className="mt-1 text-2xl font-black text-yellow-300">
                {progression.skillPoints}
              </div>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{
                width: `${xpPercent}%`,
              }}
            />
          </div>

          <div className="mt-2 text-right text-xs text-white/35">
            {xpPercent}% to next level
          </div>
        </section>

        {/* Skills */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              🎯 Skills
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Your abilities improve as you live and work around Abuja.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => {
              const percent =
                getSkillProgressPercent(skill);

              return (
                <div
                  key={skill.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {skill.icon}
                      </span>

                      <div>
                        <h3 className="font-bold">
                          {skill.name}
                        </h3>

                        <p className="text-xs text-white/35">
                          Level {skill.level}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs text-white/35">
                      {skill.experience}/
                      {skill.experienceToNextLevel}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{
                        width: `${percent}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs leading-5 text-white/40">
                    {skill.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Assets */}
        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">
              🏙️ My Life
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/house"
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
            >
              <div className="text-2xl">🏠</div>

              <h3 className="mt-3 font-bold">
                Property
              </h3>

              <p className="mt-1 text-sm text-white/40">
                {hasHouse
                  ? "You own a home."
                  : "Find a home in Abuja."}
              </p>
            </Link>

            <Link
              href="/garage"
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
            >
              <div className="text-2xl">🚗</div>

              <h3 className="mt-3 font-bold">
                Garage
              </h3>

              <p className="mt-1 text-sm text-white/40">
                {vehicleCount} vehicle
                {vehicleCount === 1 ? "" : "s"} owned.
              </p>
            </Link>

            <Link
              href="/businesses"
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
            >
              <div className="text-2xl">💼</div>

              <h3 className="mt-3 font-bold">
                Businesses
              </h3>

              <p className="mt-1 text-sm text-white/40">
                Build your business empire.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}