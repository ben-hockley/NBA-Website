import { fetchTeamOverview, fetchTeamRecentResults, fetchTeamTopSeasonContributors } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import type { TeamRecentResult, TeamSeasonContributor } from "@/lib/types";
import TeamPageHeader from "../TeamPageHeader";

interface Props {
  params: Promise<{ id: string }>;
}

function formatGameDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date TBD";
  return parsed.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatContributorValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function ResultsList({ games, teamId, teamName }: { games: TeamRecentResult[]; teamId: string; teamName: string }) {
  return (
    <div className="space-y-3">
      {games.map((game) => {
        const teamContributor = game.topContributors?.find((entry) => entry.teamId === teamId)?.contributor;
        const opponentContributor = game.topContributors?.find((entry) => entry.teamId === game.opponent.id)?.contributor;

        return (
          <Link
            key={game.gameId}
            href={`/games/${game.gameId}`}
            className="block rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] hover:border-[#1D428A] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:hover:bg-[#1D428A]/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">
                  {formatGameDate(game.date)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {game.opponent.logo && (
                    <Image
                      src={game.opponent.logo}
                      alt={game.opponent.abbreviation}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                  )}
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {game.homeAway === "home" ? "vs" : "@"} {game.opponent.displayName}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{game.statusText}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                  {game.teamScore}-{game.opponentScore}
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    game.won
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-[#C8102E]/15 text-[#C8102E] dark:bg-[#C8102E]/30 dark:text-white"
                  }`}
                >
                  {game.won ? "W" : "L"}
                </span>
              </div>
            </div>

            {(teamContributor || opponentContributor) && (
              <div className="mt-3 space-y-2">
                {teamContributor && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 p-2 dark:border-[#1D428A]/40 dark:bg-slate-800/60">
                    {teamContributor.headshot ? (
                      <Image
                        src={teamContributor.headshot}
                        alt={teamContributor.athleteName}
                        width={30}
                        height={30}
                        className="h-[30px] w-[30px] rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        {teamContributor.athleteName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {teamName} · {teamContributor.athleteName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">
                        {formatContributorValue(teamContributor.points)} PTS · {formatContributorValue(teamContributor.rebounds)} REB · {formatContributorValue(teamContributor.assists)} AST
                      </p>
                    </div>
                  </div>
                )}

                {opponentContributor && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 p-2 dark:border-[#1D428A]/40 dark:bg-slate-800/60">
                    {opponentContributor.headshot ? (
                      <Image
                        src={opponentContributor.headshot}
                        alt={opponentContributor.athleteName}
                        width={30}
                        height={30}
                        className="h-[30px] w-[30px] rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        {opponentContributor.athleteName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {game.opponent.abbreviation} · {opponentContributor.athleteName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-300">
                        {formatContributorValue(opponentContributor.points)} PTS · {formatContributorValue(opponentContributor.rebounds)} REB · {formatContributorValue(opponentContributor.assists)} AST
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default async function TeamResultsPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  let results: TeamRecentResult[] | null = null;
  let topContributors: TeamSeasonContributor[] = [];
  let error: string | null = null;

  try {
    const [overview, recentResults, contributors] = await Promise.all([
      fetchTeamOverview(id),
      fetchTeamRecentResults(id, 12),
      fetchTeamTopSeasonContributors(id, 3),
    ]);
    team = overview;
    results = recentResults;
    topContributors = contributors;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load recent results.";
  }

  return (
    <div>
      {error && <ErrorMessage message={error} />}

      {team && results && (
        <>
          <TeamPageHeader
            team={team}
            activeTab="results"
            subtitle={`Last ${results.length} completed games`}
            topContributors={topContributors}
          />

          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-6 text-center text-slate-500 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-300">
              No recent completed games available.
            </div>
          ) : (
            <ResultsList games={results} teamId={team.id} teamName={team.displayName} />
          )}
        </>
      )}
    </div>
  );
}
