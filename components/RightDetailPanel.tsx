"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, ChevronRight, ListOrdered, MapPin, Users2 } from "lucide-react";
import type { Game } from "@/lib/types";

type PanelTab = "details" | "odds" | "lineups";

function statusBadge(game: Game) {
  const { state, shortDetail, description } = game.status.type;

  if (state === "in") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C8102E] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        {shortDetail || "Live"}
      </span>
    );
  }

  if (state === "post") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-100">
        {description || "Final"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-[#1D428A]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1D428A] dark:bg-[#1D428A]/40 dark:text-slate-100">
      {shortDetail || "Scheduled"}
    </span>
  );
}

function teamFromSide(game: Game, side: "home" | "away") {
  return game.competitors.find((c) => c.homeAway === side);
}

export default function RightDetailPanel({ games }: { games: Game[] }) {
  const [activeTab, setActiveTab] = useState<PanelTab>("details");

  const highlighted = useMemo(
    () => games.find((game) => game.status.type.state === "in") ?? games[0],
    [games]
  );

  if (!highlighted) {
    return (
      <aside className="hidden xl:block">
        <div className="sticky top-[4.75rem] rounded-3xl border border-slate-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Detail View</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">No games are currently available.</p>
        </div>
      </aside>
    );
  }

  const away = teamFromSide(highlighted, "away");
  const home = teamFromSide(highlighted, "home");

  if (!away || !home) return null;

  const tabs: Array<{ key: PanelTab; label: string }> = [
    { key: "details", label: "Details" },
    { key: "odds", label: "Odds" },
    { key: "lineups", label: "Lineups" },
  ];

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-[4.75rem] space-y-4">
        <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Detail View</p>
            {statusBadge(highlighted)}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50/85 p-4 dark:bg-[#1D428A]/25">
            <div className="space-y-3">
              {[away, home].map((team) => (
                <div key={team.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {team.team.logo ? (
                      <Image
                        src={team.team.logo}
                        alt={team.team.abbreviation}
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        {team.team.abbreviation.slice(0, 2)}
                      </div>
                    )}
                    <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{team.team.shortDisplayName}</span>
                  </div>
                  <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                    {highlighted.status.type.state === "pre" ? "-" : team.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-b border-slate-200/70 dark:border-[#1D428A]/45">
            <ul className="flex items-end gap-4">
              {tabs.map((tab) => (
                <li key={tab.key}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`border-b-4 pb-2 text-sm font-semibold transition-all duration-200 ${
                      tab.key === activeTab
                        ? "border-[#1D428A] text-[#1D428A] dark:border-white dark:text-white"
                        : "border-transparent text-slate-500 hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            {activeTab === "details" && (
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
                <p className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-[#1D428A] dark:text-white" /> {highlighted.status.type.description}</p>
                {highlighted.venue && (
                  <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#1D428A] dark:text-white" /> {highlighted.venue.fullName}</p>
                )}
                <Link
                  href={`/games/${highlighted.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/50 dark:bg-slate-900/70 dark:text-slate-100"
                >
                  Open Match Center
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {activeTab === "odds" && (
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-200">
                <p className="inline-flex items-center gap-2"><ListOrdered className="h-4 w-4 text-[#1D428A] dark:text-white" /> Spread: {home.team.abbreviation} -3.5</p>
                <p>Total: 228.5</p>
                <p>Moneyline: {away.team.abbreviation} +140 / {home.team.abbreviation} -165</p>
              </div>
            )}

            {activeTab === "lineups" && (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-200">
                <p className="inline-flex items-center gap-2"><Users2 className="h-4 w-4 text-[#1D428A] dark:text-white" /> Probable starters</p>
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-[#1D428A]/50 dark:bg-slate-900/75">
                  <p className="font-semibold text-slate-800 dark:text-white">{away.team.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Backcourt and frontcourt updates available near tip-off.</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-[#1D428A]/50 dark:bg-slate-900/75">
                  <p className="font-semibold text-slate-800 dark:text-white">{home.team.displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Rotation trends sourced from latest game reports.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-[#1D428A]/40 dark:bg-slate-900/70">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Today</h3>
          <ul className="mt-3 space-y-2">
            {games.slice(0, 5).map((game) => {
              const awayTeam = teamFromSide(game, "away");
              const homeTeam = teamFromSide(game, "home");
              if (!awayTeam || !homeTeam) return null;

              return (
                <li key={game.id}>
                  <Link
                    href={`/games/${game.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-600 transition-all duration-200 hover:scale-[1.01] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    <span className="truncate">{awayTeam.team.abbreviation} @ {homeTeam.team.abbreviation}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}
