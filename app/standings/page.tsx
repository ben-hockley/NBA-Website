import React from "react";
import { fetchStandings } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";

export default async function StandingsPage() {
  let groups = null;
  let error: string | null = null;

  try {
    groups = await fetchStandings();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load standings.";
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NBA Standings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current season standings</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {groups && groups.length === 0 && (
        <ErrorMessage message="Standings data is unavailable right now." />
      )}

      {groups && groups.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {groups.map((group) => (
            <div key={group.name}>
              <h2 className="text-lg font-semibold text-[#17408B] dark:text-blue-400 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                {group.name}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
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
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-t border-gray-100 dark:border-gray-700"
                            >
                              <td className="px-4 py-3 text-gray-400 text-xs">{rank}</td>
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
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold">
                                      {team.abbreviation.slice(0, 2)}
                                    </div>
                                  )}
                                  <Link
                                    href={`/teams/${team.id}`}
                                    className="font-medium text-gray-900 dark:text-white hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                                  >
                                    {team.name}
                                  </Link>
                                  <span className="text-gray-400 text-xs hidden sm:inline">
                                    {team.abbreviation}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center font-medium">{team.record.wins}</td>
                              <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">
                                {team.record.losses}
                              </td>
                              <td className="px-3 py-3 text-center">
                                {team.record.winPercent.toFixed(3).replace(/^0/, "")}
                              </td>
                              <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">
                                {team.record.gamesBehind === 0 ? "–" : team.record.gamesBehind.toFixed(1)}
                              </td>
                              <td className="px-3 py-3 text-center hidden sm:table-cell">
                                <span
                                  className={`text-xs font-medium ${
                                    team.record.streak?.startsWith("W")
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-500 dark:text-red-400"
                                  }`}
                                >
                                  {team.record.streak || "–"}
                                </span>
                              </td>
                            </tr>
                            {showPlayoffDivider && (
                              <tr className="bg-blue-50 dark:bg-blue-900/20">
                                <td colSpan={7} className="px-4 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wide">
                                  — Play-In Tournament (7–10) —
                                </td>
                              </tr>
                            )}
                            {showPlayInDivider && (
                              <tr className="bg-gray-50 dark:bg-gray-700/30">
                                <td colSpan={7} className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-wide">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
