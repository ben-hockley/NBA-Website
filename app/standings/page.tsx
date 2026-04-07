import React from "react";
import { fetchStandings } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default async function StandingsPage() {
  let groups = null;
  let error: string | null = null;

  try {
    groups = await fetchStandings();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load standings.";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">League Table</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          <BarChart3 className="h-6 w-6 text-[#1D428A] dark:text-white" />
          NBA Standings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Current season standings with playoff and play-in separators</p>
      </section>

      {error && <ErrorMessage message={error} />}

      {groups && groups.length === 0 && (
        <ErrorMessage message="Standings data is unavailable right now." />
      )}

      {groups && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
          {groups.map((group) => (
            <section key={group.name} className="rounded-3xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 border-b border-slate-200/70 pb-2 text-lg font-bold text-[#1D428A] dark:border-[#1D428A]/45 dark:text-white">
                {group.name}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-[#1D428A]/45">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/90 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-[#1D428A]/25 dark:text-slate-300">
                      <th className="text-left px-4 py-3 w-8">#</th>
                      <th className="text-left px-4 py-3">Team</th>
                      <th className="text-center px-3 py-3">W</th>
                      <th className="text-center px-3 py-3">L</th>
                      <th className="text-center px-3 py-3">PCT</th>
                      <th className="text-center px-3 py-3">GB</th>
                      <th className="text-center px-3 py-3 hidden sm:table-cell">STRK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...group.teams]
                      .sort((a, b) => b.record.winPercent - a.record.winPercent)
                      .map((team, index) => {
                        const rank = index + 1;
                        const showPlayoffDivider = rank === 6;
                        const showPlayInDivider = rank === 10;
                        return (
                          <React.Fragment key={team.id}>
                            <tr
                              className="border-t border-slate-200/60 transition-all duration-200 hover:bg-slate-50 dark:border-[#1D428A]/45 dark:hover:bg-[#1D428A]/20"
                            >
                              <td className="px-4 py-3 text-xs text-slate-400">{rank}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {team.logo ? (
                                    <Image
                                      src={team.logo}
                                      alt={team.abbreviation}
                                      width={24}
                                      height={24}
                                      className="object-contain"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                                      {team.abbreviation.slice(0, 2)}
                                    </div>
                                  )}
                                  <Link
                                    href={`/teams/${team.id}`}
                                    className="font-semibold text-slate-900 transition-colors hover:text-[#1D428A] dark:text-white dark:hover:text-slate-100"
                                  >
                                    {team.name}
                                  </Link>
                                  <span className="hidden text-xs text-slate-400 sm:inline">
                                    {team.abbreviation}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{team.record.wins}</td>
                              <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-300">
                                {team.record.losses}
                              </td>
                              <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-200">
                                {team.record.winPercent.toFixed(3).replace(/^0/, "")}
                              </td>
                              <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-300">
                                {team.record.gamesBehind === 0 ? "–" : team.record.gamesBehind.toFixed(1)}
                              </td>
                              <td className="px-3 py-3 text-center hidden sm:table-cell">
                                <span
                                  className={`text-xs font-medium ${
                                    team.record.streak?.startsWith("W")
                                      ? "text-emerald-600 dark:text-emerald-300"
                                      : "text-[#C8102E]"
                                  }`}
                                >
                                  {team.record.streak || "–"}
                                </span>
                              </td>
                            </tr>
                            {showPlayoffDivider && (
                              <tr className="bg-[#1D428A]/8 dark:bg-[#1D428A]/30">
                                <td colSpan={7} className="px-4 py-1 text-xs font-semibold tracking-wide text-[#1D428A] dark:text-slate-100">
                                  — Play-In Tournament (7–10) —
                                </td>
                              </tr>
                            )}
                            {showPlayInDivider && (
                              <tr className="bg-slate-50 dark:bg-slate-900/60">
                                <td colSpan={7} className="px-4 py-1 text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-400">
                                  — Eliminated from Playoffs —
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
