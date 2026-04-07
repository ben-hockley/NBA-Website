import { fetchTeamOverview, fetchTeamTopSeasonContributors } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import TeamPageHeader from "./TeamPageHeader";
import type { TeamSeasonContributor } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function TeamOverviewPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  let topContributors: TeamSeasonContributor[] = [];
  let error: string | null = null;

  try {
    const [overview, contributors] = await Promise.all([
      fetchTeamOverview(id),
      fetchTeamTopSeasonContributors(id, 3),
    ]);
    team = overview;
    topContributors = contributors;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load team overview.";
  }

  return (
    <div>
      {error && <ErrorMessage message={error} />}

      {team && (
        <>
          <TeamPageHeader
            team={team}
            activeTab="overview"
            subtitle={team.standingSummary ?? "Team overview"}
            topContributors={topContributors}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Record
              </h2>
              <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <p><span className="text-slate-400">Overall:</span> {team.record.overall ?? "–"}</p>
                <p><span className="text-slate-400">Home:</span> {team.record.home ?? "–"}</p>
                <p><span className="text-slate-400">Away:</span> {team.record.away ?? "–"}</p>
                {team.record.winPercent !== undefined && (
                  <p><span className="text-slate-400">Win %:</span> {team.record.winPercent.toFixed(3).replace(/^0/, "")}</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Arena
              </h2>
              {team.venue ? (
                <div className="space-y-2">
                  {team.venue.image && (
                    <Image
                      src={team.venue.image}
                      alt={team.venue.fullName}
                      width={420}
                      height={236}
                      className="h-28 w-full rounded-xl object-cover"
                      unoptimized
                    />
                  )}
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{team.venue.fullName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    {[team.venue.city, team.venue.state].filter(Boolean).join(", ") || "Location unavailable"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-400">Arena information unavailable.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Team Snapshot
              </h2>
              <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                <p><span className="text-slate-400">Standing:</span> {team.standingSummary ?? "–"}</p>
                <p><span className="text-slate-400">Games Behind:</span> {team.record.gamesBehind !== undefined ? team.record.gamesBehind.toFixed(1) : "–"}</p>
                <p><span className="text-slate-400">Point Diff:</span> {team.record.pointDifferential !== undefined ? team.record.pointDifferential.toFixed(1) : "–"}</p>
                <p><span className="text-slate-400">Streak:</span> {team.record.streak ?? "–"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Next Game
              </h2>
              {team.nextGame ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {team.nextGame.opponent.logo && (
                      <Image
                        src={team.nextGame.opponent.logo}
                        alt={team.nextGame.opponent.abbreviation}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                        unoptimized
                      />
                    )}
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {team.nextGame.homeAway === "home" ? "vs" : "@"} {team.nextGame.opponent.displayName}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{formatDateTime(team.nextGame.date)}</p>
                  {team.nextGame.venue && (
                    <p className="text-xs text-slate-400 dark:text-slate-400">
                      {team.nextGame.venue.fullName}
                    </p>
                  )}
                  {team.nextGame.gameId && (
                    <Link
                      href={`/games/${team.nextGame.gameId}`}
                      className="inline-flex items-center rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-800/70 dark:text-slate-100"
                    >
                      View Matchup
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-400">No upcoming game available.</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href={`/teams/${team.id}/roster`}
              className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] hover:border-[#1D428A] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:hover:bg-[#1D428A]/20"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">View Full Roster</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Depth chart, bios, and sortable player stats.</p>
            </Link>
            <Link
              href={`/teams/${team.id}/results`}
              className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] hover:border-[#1D428A] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:hover:bg-[#1D428A]/20"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">View Recent Results</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Latest completed games and scorelines.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
