import { fetchGameDetails } from "@/lib/api";
import type { GameBoxScoreTeam, GameDetail, GameInjury, GameTeamStatistic } from "@/lib/types";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

const STAT_PRIORITY = [
  "fieldGoalsMade-fieldGoalsAttempted",
  "fieldGoalPct",
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
  "threePointFieldGoalPct",
  "freeThrowsMade-freeThrowsAttempted",
  "freeThrowPct",
  "totalRebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "pointsInPaint",
  "fastBreakPoints",
  "largestLead",
  "leadChanges",
];

function formatTipoff(date: string): string {
  if (!date) return "Date TBD";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Date TBD";

  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function periodLabel(index: number): string {
  if (index < 4) return `Q${index + 1}`;
  if (index === 4) return "OT";
  return `${index - 3}OT`;
}

function statusBadge(game: GameDetail) {
  const { state, shortDetail, description } = game.status.type;
  if (state === "in") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
        {shortDetail || "LIVE"}
      </span>
    );
  }
  if (state === "post") {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        {description || "Final"}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      {shortDetail || "Upcoming"}
    </span>
  );
}

function createStatMap(stats: GameTeamStatistic[]): Map<string, GameTeamStatistic> {
  const map = new Map<string, GameTeamStatistic>();
  for (const stat of stats) {
    map.set(stat.name, stat);
  }
  return map;
}

function groupInjuries(injuries: GameInjury[]) {
  const grouped = new Map<string, { team: GameInjury["team"]; entries: GameInjury[] }>();

  for (const injury of injuries) {
    const existing = grouped.get(injury.team.id);
    if (existing) {
      existing.entries.push(injury);
      continue;
    }
    grouped.set(injury.team.id, { team: injury.team, entries: [injury] });
  }

  return Array.from(grouped.values());
}

function splitPlayersByRole(team: GameBoxScoreTeam) {
  return {
    starters: team.players.filter((player) => player.starter && !player.didNotPlay),
    bench: team.players.filter((player) => !player.starter && !player.didNotPlay),
    dnp: team.players.filter((player) => player.didNotPlay),
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;
  let game: GameDetail | null = null;
  let error: string | null = null;

  try {
    game = await fetchGameDetails(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load game details.";
  }

  const away = game?.competitors.find((c) => c.homeAway === "away");
  const home = game?.competitors.find((c) => c.homeAway === "home");

  const periods = game && away && home
    ? Math.max(away.linescores.length, home.linescores.length)
    : 0;

  const awayStats = game && away
    ? game.teamStats.find((t) => t.team.id === away.team.id) ?? game.teamStats[0]
    : undefined;
  const homeStats = game && home
    ? game.teamStats.find((t) => t.team.id === home.team.id) ?? game.teamStats[1]
    : undefined;

  const statRows = (() => {
    if (!awayStats || !homeStats) return [];

    const awayMap = createStatMap(awayStats.statistics);
    const homeMap = createStatMap(homeStats.statistics);
    const statKeys = Array.from(new Set([...awayMap.keys(), ...homeMap.keys()]));
    const orderedKeys = [
      ...STAT_PRIORITY.filter((key) => statKeys.includes(key)),
      ...statKeys.filter((key) => !STAT_PRIORITY.includes(key)),
    ];

    return orderedKeys.slice(0, 14).map((key) => {
      const awayStat = awayMap.get(key);
      const homeStat = homeMap.get(key);
      return {
        label: awayStat?.label ?? homeStat?.label ?? key,
        awayValue: awayStat?.displayValue ?? "-",
        homeValue: homeStat?.displayValue ?? "-",
      };
    });
  })();

  const injuriesByTeam = game ? groupInjuries(game.injuries) : [];

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
      >
        Back to Scores
      </Link>

      {error && <ErrorMessage message={error} />}

      {game && (!away || !home) && (
        <ErrorMessage message="Game data is missing team information." />
      )}

      {game && away && home && (
        <>
          <section
            className="rounded-2xl p-6"
            style={{
              backgroundColor: `#${home.team.color || "17408B"}20`,
              borderLeft: `4px solid #${home.team.color || "17408B"}`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {formatTipoff(game.date)}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {away.team.shortDisplayName} at {home.team.shortDisplayName}
                </h1>
                {game.venue && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {game.venue.fullName}
                    {(game.venue.address.city || game.venue.address.state) && (
                      <>
                        {" · "}
                        {[game.venue.address.city, game.venue.address.state].filter(Boolean).join(", ")}
                      </>
                    )}
                  </p>
                )}
              </div>
              <div>{statusBadge(game)}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[away, home].map((competitor) => (
                <div
                  key={competitor.id}
                  className={`rounded-xl bg-white/80 dark:bg-gray-800/70 border border-white/50 dark:border-gray-700 p-4 ${
                    game.status.type.state === "post" && competitor.winner
                      ? "ring-1 ring-green-500/40"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {competitor.team.logo ? (
                      <Image
                        src={competitor.team.logo}
                        alt={competitor.team.abbreviation}
                        width={42}
                        height={42}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-[42px] h-[42px] rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                        {competitor.team.abbreviation.slice(0, 2)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/teams/${competitor.team.id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                      >
                        {competitor.team.displayName}
                      </Link>
                      {competitor.record && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Record: {competitor.record}
                        </p>
                      )}
                    </div>

                    <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
                      {game.status.type.state === "pre" ? "-" : competitor.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {periods > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Quarter By Quarter
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                        Team
                      </th>
                      {Array.from({ length: periods }, (_, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase"
                        >
                          {periodLabel(i)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[away, home].map((competitor) => (
                      <tr key={competitor.id}>
                        <td className="px-3 py-2 text-left font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {competitor.team.abbreviation}
                        </td>
                        {Array.from({ length: periods }, (_, i) => (
                          <td key={i} className="px-3 py-2 text-gray-700 dark:text-gray-300 tabular-nums">
                            {competitor.linescores[i]?.value ?? "-"}
                          </td>
                        ))}
                        <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white tabular-nums">
                          {competitor.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Team Stat Comparison
              </h2>
              {statRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                          Stat
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                          {away.team.abbreviation}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">
                          {home.team.abbreviation}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statRows.map((row) => (
                        <tr key={row.label}>
                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">
                            {row.awayValue}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300">
                            {row.homeValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Team stats are unavailable for this game.</p>
              )}
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Game Info
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Status</dt>
                  <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.status.type.description}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Tipoff</dt>
                  <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatTipoff(game.date)}</dd>
                </div>
                {game.attendance !== undefined && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Attendance</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {new Intl.NumberFormat("en-US").format(game.attendance)}
                    </dd>
                  </div>
                )}
                {game.broadcasts.length > 0 && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Broadcast</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.broadcasts.join(", ")}</dd>
                  </div>
                )}
                {game.odds?.details && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Odds</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.odds.details}</dd>
                  </div>
                )}
                {game.odds?.overUnder && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Over/Under</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.odds.overUnder}</dd>
                  </div>
                )}
                {game.officials.length > 0 && (
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-gray-500 uppercase">Officials</dt>
                    <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{game.officials.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          {game.boxscore.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Full Player Box Score
              </h2>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {game.boxscore.map((teamBox) => {
                  const { starters, bench, dnp } = splitPlayersByRole(teamBox);
                  const visibleColumns = teamBox.columns
                    .map((column, statIndex) => ({ column, statIndex }))
                    .filter(({ column }) =>
                      !["offensiveRebounds", "defensiveRebounds", "fouls"].includes(column.key)
                    );

                  return (
                    <div
                      key={teamBox.team.id}
                      className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-900/30"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {teamBox.team.logo && (
                          <Image
                            src={teamBox.team.logo}
                            alt={teamBox.team.abbreviation}
                            width={24}
                            height={24}
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {teamBox.team.displayName}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="px-2 py-2 text-left uppercase tracking-wide text-gray-400 dark:text-gray-500 min-w-[140px]">
                                Player
                              </th>
                              {visibleColumns.map(({ column, statIndex }) => (
                                <th
                                  key={`${teamBox.team.id}-${column.key}-${statIndex}`}
                                  className="px-2 py-2 text-center uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap"
                                  title={column.description}
                                >
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td
                                colSpan={visibleColumns.length + 1}
                                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80"
                              >
                                Starters
                              </td>
                            </tr>
                            {starters.map((player) => (
                              <tr key={`${teamBox.team.id}-${player.athleteId}-${player.jersey ?? ""}`}>
                                <td className="px-2 py-2 text-gray-800 dark:text-gray-200">
                                  <div className="min-w-0">
                                    {player.athleteId ? (
                                      <Link
                                        href={`/players/${player.athleteId}`}
                                        className="font-medium hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                                      >
                                        {player.athleteName}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">{player.athleteName}</span>
                                    )}
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {player.position ?? "-"}
                                      {player.jersey ? ` #${player.jersey}` : ""}
                                      {player.ejected ? " · Ejected" : ""}
                                    </p>
                                  </div>
                                </td>
                                {visibleColumns.map(({ column, statIndex }) => {
                                  const statValue = player.stats[statIndex] ?? "-";
                                  return (
                                    <td
                                      key={`${player.athleteId}-${column.key}-${statIndex}`}
                                      className="px-2 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                    >
                                      {statValue || "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {starters.length === 0 && (
                              <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-2 py-2 text-gray-400 dark:text-gray-500">
                                  No starter stats available.
                                </td>
                              </tr>
                            )}

                            <tr>
                              <td
                                colSpan={visibleColumns.length + 1}
                                className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/80"
                              >
                                Bench
                              </td>
                            </tr>
                            {bench.map((player) => (
                              <tr key={`${teamBox.team.id}-bench-${player.athleteId}-${player.jersey ?? ""}`}>
                                <td className="px-2 py-2 text-gray-800 dark:text-gray-200">
                                  <div className="min-w-0">
                                    {player.athleteId ? (
                                      <Link
                                        href={`/players/${player.athleteId}`}
                                        className="font-medium hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                                      >
                                        {player.athleteName}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">{player.athleteName}</span>
                                    )}
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                      {player.position ?? "-"}
                                      {player.jersey ? ` #${player.jersey}` : ""}
                                      {player.ejected ? " · Ejected" : ""}
                                    </p>
                                  </div>
                                </td>
                                {visibleColumns.map(({ column, statIndex }) => {
                                  const statValue = player.stats[statIndex] ?? "-";
                                  return (
                                    <td
                                      key={`${player.athleteId}-bench-${column.key}-${statIndex}`}
                                      className="px-2 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap"
                                    >
                                      {statValue || "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {bench.length === 0 && (
                              <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-2 py-2 text-gray-400 dark:text-gray-500">
                                  No bench stats available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {dnp.length > 0 && (
                        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            Did Not Play
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-5">
                            {dnp
                              .map((player) => `${player.athleteName}${player.reason ? ` (${player.reason})` : ""}`)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {game.leaders.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Team Leaders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {game.leaders.map((teamLeaders) => (
                  <div
                    key={teamLeaders.team.id}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/60 dark:bg-gray-900/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {teamLeaders.team.logo && (
                        <Image
                          src={teamLeaders.team.logo}
                          alt={teamLeaders.team.abbreviation}
                          width={22}
                          height={22}
                          className="object-contain"
                          unoptimized
                        />
                      )}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {teamLeaders.team.displayName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {teamLeaders.categories.map((category) => {
                        const leader = category.leader;
                        return (
                          <div key={`${teamLeaders.team.id}-${category.name}`}>
                            <p className="text-xs uppercase text-gray-400 dark:text-gray-500 mb-1">
                              {category.displayName}
                            </p>
                            {leader ? (
                              <div className="flex items-center gap-2">
                                {leader.headshot ? (
                                  <Image
                                    src={leader.headshot}
                                    alt={leader.athleteName}
                                    width={28}
                                    height={28}
                                    className="rounded-full bg-gray-200 dark:bg-gray-700"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
                                )}
                                <div className="min-w-0 flex-1">
                                  {leader.athleteId ? (
                                    <Link
                                      href={`/players/${leader.athleteId}`}
                                      className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                                    >
                                      {leader.athleteName}
                                    </Link>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {leader.athleteName}
                                    </p>
                                  )}
                                  {leader.summary && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{leader.summary}</p>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                  {leader.displayValue}
                                  {leader.mainStatLabel && (
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                                      {leader.mainStatLabel}
                                    </span>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500">No leader data available.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {injuriesByTeam.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Reported Injuries
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {injuriesByTeam.map((group) => (
                  <div key={group.team.id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {group.team.logo && (
                        <Image
                          src={group.team.logo}
                          alt={group.team.abbreviation}
                          width={20}
                          height={20}
                          className="object-contain"
                          unoptimized
                        />
                      )}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{group.team.displayName}</p>
                    </div>

                    <ul className="space-y-2">
                      {group.entries.map((injury) => (
                        <li key={`${group.team.id}-${injury.athleteName}`} className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-white">{injury.athleteName}</span>
                          {injury.status && <span className="text-gray-500 dark:text-gray-400"> - {injury.status}</span>}
                          {injury.detail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{injury.detail}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
