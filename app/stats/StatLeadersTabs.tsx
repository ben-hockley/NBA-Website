"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { StatCategory } from "@/lib/types";
import { BarChart3 } from "lucide-react";

export default function StatLeadersTabs({ categories }: { categories: StatCategory[] }) {
  const [activeKey, setActiveKey] = useState(categories[0]?.key ?? "");
  const [mode, setMode] = useState<"pg" | "tot">("pg");

  const active = categories.find((c) => c.key === activeKey) ?? categories[0];
  const leaders = mode === "pg" ? active?.leaders : active?.totalLeaders;
  const colHeader = mode === "pg" ? active?.shortName : active?.totalShortName;

  if (!active || !leaders) return null;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveKey(cat.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  cat.key === activeKey
                    ? "border-[#1D428A] bg-[#1D428A] text-white"
                    : "border-slate-200/70 bg-white/80 text-slate-600 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-200"
                }`}
              >
                {cat.shortName}
              </button>
            ))}
          </div>

          <div className="flex rounded-full border border-slate-200/70 bg-white/80 p-1 dark:border-[#1D428A]/45 dark:bg-slate-900/75">
            <button
              onClick={() => setMode("pg")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                mode === "pg"
                  ? "bg-[#1D428A] text-white"
                  : "text-slate-500 hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              Per Game
            </button>
            <button
              onClick={() => setMode("tot")}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
                mode === "tot"
                  ? "bg-[#1D428A] text-white"
                  : "text-slate-500 hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              Totals
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-[#1D428A] dark:text-white" />
            {active.displayName} Leaders
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            {mode === "pg" ? "Per Game" : "Season Totals"}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 bg-slate-50/85 text-xs uppercase tracking-[0.16em] text-slate-500 dark:border-[#1D428A]/45 dark:bg-[#1D428A]/25 dark:text-slate-300">
                <th className="w-10 px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="hidden px-4 py-3 text-left sm:table-cell">Team</th>
                <th className="px-4 py-3 text-right">{colHeader}</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((entry) => (
                <tr
                  key={entry.playerId}
                  className="border-b border-slate-200/50 transition-all duration-200 last:border-0 hover:bg-slate-50 dark:border-[#1D428A]/35 dark:hover:bg-[#1D428A]/20"
                >
                  <td className="w-10 px-4 py-3 text-xs font-semibold text-slate-400">
                    {entry.rank === 1 ? (
                      <span className="text-sm font-black text-[#C8102E]">1</span>
                    ) : (
                      entry.rank
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      href={`/players/${entry.playerId}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 transition-all duration-200 group-hover:border-[#C8102E] dark:border-[#1D428A]/45 dark:bg-slate-800/80">
                        {entry.headshot ? (
                          <Image
                            src={entry.headshot}
                            alt={entry.playerName}
                            fill
                            className="object-cover object-top"
                            sizes="36px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                            {entry.playerName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 transition-colors group-hover:text-[#C8102E] dark:text-white">
                        {entry.playerName}
                      </span>
                    </Link>
                  </td>

                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      {entry.teamLogo && (
                        <Image
                          src={entry.teamLogo}
                          alt={entry.teamAbbreviation}
                          width={22}
                          height={22}
                          className="object-contain"
                        />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {entry.teamAbbreviation}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-base font-black ${
                        entry.rank === 1
                          ? "text-[#C8102E]"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {entry.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
