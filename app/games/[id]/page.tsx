import { fetchGameDetails } from "@/lib/api";
import type { GameBoxScoreTeam, GameDetail, GameInjury, GameTeamStatistic } from "@/lib/types";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <span className="inline-flex items-center gap-1 rounded-full bg-[#C8102E] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        {shortDetail || "LIVE"}
      </span>
    );
  }
  if (state === "post") {
    return (
      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-700 dark:text-slate-100">
        {description || "Final"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#1D428A]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1D428A] dark:bg-[#1D428A]/45 dark:text-white">
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
        className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Scores
      </Link>

      {error && <ErrorMessage message={error} />}

      {game && (!away || !home) && (
        <ErrorMessage message="Game data is missing team information." />
      )}

      {game && away && home && (
        <>
          <section
            className="rounded-3xl border border-slate-200/60 bg-white/75 p-6 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75"
            style={{
              backgroundImage: `linear-gradient(120deg, #${home.team.color || "1D428A"}20, transparent 45%)`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  {formatTipoff(game.date)}
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {away.team.shortDisplayName} at {home.team.shortDisplayName}
                </h1>
                {game.venue && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
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
                  className={`rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-[#1D428A]/45 dark:bg-slate-900/80 ${
                    game.status.type.state === "post" && competitor.winner
                      ? "ring-1 ring-emerald-500/40"
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
                        className="h-[42px] w-[42px] object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        {competitor.team.abbreviation.slice(0, 2)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/teams/${competitor.team.id}`}
                        className="font-semibold text-slate-900 transition-colors hover:text-[#1D428A] dark:text-white dark:hover:text-slate-100"
                      >
                        {competitor.team.displayName}
                      </Link>
                      {competitor.record && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                          Record: {competitor.record}
                        </p>
                      )}
                    </div>

                    <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                      {game.status.type.state === "pre" ? "-" : competitor.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {periods > 0 && (
            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Quarter By Quarter
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                        Team
                      </th>
                      {Array.from({ length: periods }, (_, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300"
                        >
                          {periodLabel(i)}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[away, home].map((competitor) => (
                      <tr key={competitor.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-800 dark:text-slate-100">
                          {competitor.team.abbreviation}
                        </td>
                        {Array.from({ length: periods }, (_, i) => (
                          <td key={i} className="px-3 py-2 tabular-nums text-slate-700 dark:text-slate-200">
                            {competitor.linescores[i]?.value ?? "-"}
                          </td>
                        ))}
                        <td className="px-3 py-2 font-black tabular-nums text-slate-900 dark:text-white">
                          {competitor.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75 xl:col-span-2">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Team Stat Comparison
              </h2>
              {statRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                          Stat
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                          {away.team.abbreviation}
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                          {home.team.abbreviation}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {statRows.map((row) => (
                        <tr key={row.label}>
                          <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-100">
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-slate-700 dark:text-slate-200">
                            {row.awayValue}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-slate-700 dark:text-slate-200">
                            {row.homeValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-300">Team stats are unavailable for this game.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Game Info
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Status</dt>
                  <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{game.status.type.description}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Tipoff</dt>
                  <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{formatTipoff(game.date)}</dd>
                </div>
                {game.attendance !== undefined && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Attendance</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {new Intl.NumberFormat("en-US").format(game.attendance)}
                    </dd>
                  </div>
                )}
                {game.broadcasts.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Broadcast</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{game.broadcasts.join(", ")}</dd>
                  </div>
                )}
                {game.odds?.details && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Odds</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{game.odds.details}</dd>
                  </div>
                )}
                {game.odds?.overUnder && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Over/Under</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{game.odds.overUnder}</dd>
                  </div>
                )}
                {game.officials.length > 0 && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Officials</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{game.officials.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          {game.boxscore.length > 0 && (
            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
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
                      className="rounded-2xl border border-slate-200/60 bg-slate-50/85 p-4 dark:border-[#1D428A]/35 dark:bg-[#1D428A]/20"
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {teamBox.team.displayName}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="min-w-[140px] px-2 py-2 text-left uppercase tracking-wide text-slate-400 dark:text-slate-300">
                                Player
                              </th>
                              {visibleColumns.map(({ column, statIndex }) => (
                                <th
                                  key={`${teamBox.team.id}-${column.key}-${statIndex}`}
                                  className="whitespace-nowrap px-2 py-2 text-center uppercase tracking-wide text-slate-400 dark:text-slate-300"
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
                                className="bg-slate-100/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-[#1D428A]/30 dark:text-slate-300"
                              >
                                Starters
                              </td>
                            </tr>
                            {starters.map((player) => (
                              <tr key={`${teamBox.team.id}-${player.athleteId}-${player.jersey ?? ""}`}>
                                <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                                  <div className="min-w-0">
                                    {player.athleteId ? (
                                      <Link
                                        href={`/players/${player.athleteId}`}
                                        className="font-medium transition-colors hover:text-[#1D428A] dark:hover:text-white"
                                      >
                                        {player.athleteName}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">{player.athleteName}</span>
                                    )}
                                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
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
                                      className="whitespace-nowrap px-2 py-2 text-center tabular-nums text-slate-700 dark:text-slate-200"
                                    >
                                      {statValue || "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {starters.length === 0 && (
                              <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-2 py-2 text-slate-400 dark:text-slate-300">
                                  No starter stats available.
                                </td>
                              </tr>
                            )}

                            <tr>
                              <td
                                colSpan={visibleColumns.length + 1}
                                className="bg-slate-100/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-[#1D428A]/30 dark:text-slate-300"
                              >
                                Bench
                              </td>
                            </tr>
                            {bench.map((player) => (
                              <tr key={`${teamBox.team.id}-bench-${player.athleteId}-${player.jersey ?? ""}`}>
                                <td className="px-2 py-2 text-slate-800 dark:text-slate-100">
                                  <div className="min-w-0">
                                    {player.athleteId ? (
                                      <Link
                                        href={`/players/${player.athleteId}`}
                                        className="font-medium transition-colors hover:text-[#1D428A] dark:hover:text-white"
                                      >
                                        {player.athleteName}
                                      </Link>
                                    ) : (
                                      <span className="font-medium">{player.athleteName}</span>
                                    )}
                                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
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
                                      className="whitespace-nowrap px-2 py-2 text-center tabular-nums text-slate-700 dark:text-slate-200"
                                    >
                                      {statValue || "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            {bench.length === 0 && (
                              <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-2 py-2 text-slate-400 dark:text-slate-300">
                                  No bench stats available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {dnp.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/70 pt-3 dark:border-[#1D428A]/35">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Did Not Play
                          </p>
                          <p className="text-xs leading-5 text-slate-600 dark:text-slate-200">
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
            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Team Leaders
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {game.leaders.map((teamLeaders) => (
                  <div
                    key={teamLeaders.team.id}
                    className="rounded-2xl border border-slate-200/60 bg-slate-50/85 p-4 dark:border-[#1D428A]/35 dark:bg-[#1D428A]/20"
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
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {teamLeaders.team.displayName}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {teamLeaders.categories.map((category) => {
                        const leader = category.leader;
                        return (
                          <div key={`${teamLeaders.team.id}-${category.name}`}>
                            <p className="mb-1 text-xs uppercase text-slate-400 dark:text-slate-300">
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
                                    className="rounded-full border border-slate-200/70 bg-slate-200 dark:border-[#1D428A]/40 dark:bg-slate-700"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                                )}
                                <div className="min-w-0 flex-1">
                                  {leader.athleteId ? (
                                    <Link
                                      href={`/players/${leader.athleteId}`}
                                      className="text-sm font-medium text-slate-800 transition-colors hover:text-[#1D428A] dark:text-slate-100 dark:hover:text-white"
                                    >
                                      {leader.athleteName}
                                    </Link>
                                  ) : (
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                      {leader.athleteName}
                                    </p>
                                  )}
                                  {leader.summary && (
                                    <p className="text-xs text-slate-500 dark:text-slate-300">{leader.summary}</p>
                                  )}
                                </div>
                                <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                                  {leader.displayValue}
                                  {leader.mainStatLabel && (
                                    <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                                      {leader.mainStatLabel}
                                    </span>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400 dark:text-slate-300">No leader data available.</p>
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
            <section className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Reported Injuries
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {injuriesByTeam.map((group) => (
                  <div key={group.team.id} className="rounded-2xl border border-slate-200/60 bg-slate-50/85 p-4 dark:border-[#1D428A]/35 dark:bg-[#1D428A]/20">
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
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{group.team.displayName}</p>
                    </div>

                    <ul className="space-y-2">
                      {group.entries.map((injury) => (
                        <li key={`${group.team.id}-${injury.athleteName}`} className="text-sm text-slate-700 dark:text-slate-200">
                          <span className="font-medium text-slate-900 dark:text-white">{injury.athleteName}</span>
                          {injury.status && <span className="text-slate-500 dark:text-slate-300"> - {injury.status}</span>}
                          {injury.detail && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">{injury.detail}</p>
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
