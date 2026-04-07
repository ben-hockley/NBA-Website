import { fetchPlayerDetails } from "@/lib/api";
import type { PlayerStats } from "@/lib/types";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const STAT_LABELS: { key: keyof PlayerStats; label: string }[] = [
  { key: "gamesPlayed", label: "GP" },
  { key: "avgMinutes", label: "MIN" },
  { key: "avgPoints", label: "PTS" },
  { key: "avgRebounds", label: "REB" },
  { key: "avgAssists", label: "AST" },
  { key: "avgBlocks", label: "BLK" },
  { key: "avgSteals", label: "STL" },
  { key: "avgTurnovers", label: "TOV" },
  { key: "avgFouls", label: "PF" },
  { key: "fieldGoalPct", label: "FG%" },
  { key: "threePointPct", label: "3P%" },
  { key: "freeThrowPct", label: "FT%" },
];


export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  let player = null;
  let error: string | null = null;

  try {
    player = await fetchPlayerDetails(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load player.";
  }

  const backHref = player?.team ? `/teams/${player.team.id}/roster` : "/teams";
  const teamColor = player?.team?.color ?? "17408B";

  return (
    <div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 mb-6 transition-colors"
      >
        ← Back to Roster
      </Link>

      {error && <ErrorMessage message={error} />}

      {player && (
        <div className="space-y-6">
          {/* Hero */}
          <div
            className="rounded-2xl p-6 flex flex-wrap items-center gap-5"
            style={{
              backgroundColor: `#${teamColor}20`,
              borderLeft: `4px solid #${teamColor}`,
            }}
          >
            {player.headshot ? (
              <Image
                src={player.headshot}
                alt={player.displayName}
                width={120}
                height={120}
                className="rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-3xl font-bold text-gray-500 shrink-0">
                {player.displayName.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {player.jersey && (
                  <span className="text-lg font-mono text-gray-400 dark:text-gray-500">
                    #{player.jersey}
                  </span>
                )}
                {player.position && (
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200">
                    {player.position.displayName}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
                {player.fullName}
              </h1>
              {player.team && (
                <Link
                  href={`/teams/${player.team.id}`}
                  className="flex items-center gap-2 mt-2 hover:opacity-80 transition-opacity"
                >
                  {player.team.logo && (
                    <Image
                      src={player.team.logo}
                      alt={player.team.abbreviation}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 transition-colors">
                    {player.team.displayName}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Bio + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bio */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Bio
              </h2>
              <dl className="space-y-3">
                {player.height && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Height</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.height}</dd>
                  </div>
                )}
                {player.weight && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Weight</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.weight}</dd>
                  </div>
                )}
                {player.age && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Age</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.age}</dd>
                  </div>
                )}
                {player.birthDate && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Born</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.birthDate}</dd>
                  </div>
                )}
                {player.birthPlace && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Birthplace</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.birthPlace.display}</dd>
                  </div>
                )}
                {player.experience && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Experience</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.experience.display}</dd>
                  </div>
                )}
                {player.draft && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Draft</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.draft}</dd>
                  </div>
                )}
                {player.college && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">College</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.college.name}</dd>
                  </div>
                )}
                {player.hand && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Shoots</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{player.hand}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Stats
              </h2>
              {player.regularSeasonStats || player.careerStats ? (
                <div className="space-y-5">
                  {player.regularSeasonStats && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Regular Season
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center">
                          <thead>
                            <tr>
                              {STAT_LABELS.map((s) => (
                                <th
                                  key={s.key}
                                  className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 font-medium"
                                >
                                  {s.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {STAT_LABELS.map((s) => (
                                <td
                                  key={s.key}
                                  className="px-2 py-2 font-medium text-gray-800 dark:text-gray-200"
                                >
                                  {player.regularSeasonStats![s.key]}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {player.careerStats && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Career
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-center">
                          <thead>
                            <tr>
                              {STAT_LABELS.map((s) => (
                                <th
                                  key={s.key}
                                  className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 font-medium"
                                >
                                  {s.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {STAT_LABELS.map((s) => (
                                <td
                                  key={s.key}
                                  className="px-2 py-2 font-medium text-gray-800 dark:text-gray-200"
                                >
                                  {player.careerStats![s.key]}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Stats unavailable for this player.</p>
              )}
            </div>
          </div>

          {/* Season History */}
          {player.seasonHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Season-by-Season Team History
              </h2>

              <div className="space-y-5">
                {player.seasonHistory.map((category) => (
                  <div key={category.key}>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                      {category.displayName}
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Season</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Player</th>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Team</th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Pos</th>
                            {category.labels.map((label) => (
                              <th
                                key={`${category.key}-${label}`}
                                className="px-2 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap"
                              >
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {category.rows.map((row, rowIndex) => (
                            <tr key={`${category.key}-${row.seasonLabel}-${row.team.id || row.team.displayName}-${rowIndex}`}>
                              <td className="px-2 py-2 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                {row.seasonLabel}
                              </td>
                              <td className="px-2 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {row.playerName}
                              </td>
                              <td className="px-2 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  {row.team.logo && (
                                    <Image
                                      src={row.team.logo}
                                      alt={row.team.abbreviation}
                                      width={18}
                                      height={18}
                                      className="object-contain"
                                      unoptimized
                                    />
                                  )}
                                  {row.team.id ? (
                                    <Link
                                      href={`/teams/${row.team.id}`}
                                      className="hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                                    >
                                      {row.team.displayName}
                                    </Link>
                                  ) : (
                                    <span>{row.team.displayName}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {row.position ?? "-"}
                              </td>
                              {category.labels.map((_, statIndex) => (
                                <td
                                  key={`${category.key}-${row.seasonLabel}-${row.team.id}-${statIndex}`}
                                  className="px-2 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                >
                                  {row.stats[statIndex] ?? "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News */}
          {player.news.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Recent News
              </h2>
              <div className="space-y-3">
                {player.news.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg p-3 -mx-3 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{item.headline}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
