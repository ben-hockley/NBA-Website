"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { StatCategory } from "@/lib/types";

export default function StatLeadersTabs({ categories }: { categories: StatCategory[] }) {
  const [activeKey, setActiveKey] = useState(categories[0]?.key ?? "");
  const [mode, setMode] = useState<"pg" | "tot">("pg");

  const active = categories.find((c) => c.key === activeKey) ?? categories[0];
  const leaders = mode === "pg" ? active?.leaders : active?.totalLeaders;
  const colHeader = mode === "pg" ? active?.shortName : active?.totalShortName;

  return (
    <div>
      {/* Stat category tabs + mode toggle in same row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Stat tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveKey(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                cat.key === activeKey
                  ? "bg-[#C9082A] text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>

        {/* Per game / Totals toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => setMode("pg")}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
              mode === "pg"
                ? "bg-[#17408B] text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Per Game
          </button>
          <button
            onClick={() => setMode("tot")}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 dark:border-gray-700 ${
              mode === "tot"
                ? "bg-[#17408B] text-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Totals
          </button>
        </div>
      </div>

      {/* Category heading */}
      {active && leaders && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {active.displayName} Leaders
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
              {mode === "pg" ? "Per Game" : "Season Totals"}
            </span>
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 text-left w-10">#</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Team</th>
                  <th className="px-4 py-3 text-right">{colHeader}</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((entry) => (
                  <tr
                    key={entry.playerId}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs w-10">
                      {entry.rank === 1 ? (
                        <span className="text-yellow-500 font-bold text-sm">1</span>
                      ) : (
                        entry.rank
                      )}
                    </td>

                    {/* Player */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/players/${entry.playerId}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border-2 border-transparent group-hover:border-[#C9082A] transition-colors">
                          {entry.headshot ? (
                            <Image
                              src={entry.headshot}
                              alt={entry.playerName}
                              fill
                              className="object-cover object-top"
                              sizes="36px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                              {entry.playerName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white group-hover:text-[#C9082A] transition-colors">
                          {entry.playerName}
                        </span>
                      </Link>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3 hidden sm:table-cell">
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
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                          {entry.teamAbbreviation}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-base font-bold ${
                          entry.rank === 1
                            ? "text-[#C9082A]"
                            : "text-gray-900 dark:text-white"
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
        </div>
      )}
    </div>
  );
}
