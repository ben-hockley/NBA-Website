import { fetchTeamOverview } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import TeamPageHeader from "./TeamPageHeader";

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
  let error: string | null = null;

  try {
    team = await fetchTeamOverview(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load team overview.";
  }

  return (
    <div>
      {error && <ErrorMessage message={error} />}

      {team && (
        <>
          <TeamPageHeader team={team} activeTab="overview" subtitle={team.standingSummary ?? "Team overview"} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Record
              </h2>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="text-gray-400">Overall:</span> {team.record.overall ?? "–"}</p>
                <p><span className="text-gray-400">Home:</span> {team.record.home ?? "–"}</p>
                <p><span className="text-gray-400">Away:</span> {team.record.away ?? "–"}</p>
                {team.record.winPercent !== undefined && (
                  <p><span className="text-gray-400">Win %:</span> {team.record.winPercent.toFixed(3).replace(/^0/, "")}</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
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
                      className="w-full h-28 rounded-lg object-cover"
                      unoptimized
                    />
                  )}
                  <p className="font-medium text-gray-800 dark:text-gray-200">{team.venue.fullName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {[team.venue.city, team.venue.state].filter(Boolean).join(", ") || "Location unavailable"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">Arena information unavailable.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Team Snapshot
              </h2>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="text-gray-400">Standing:</span> {team.standingSummary ?? "–"}</p>
                <p><span className="text-gray-400">Games Behind:</span> {team.record.gamesBehind !== undefined ? team.record.gamesBehind.toFixed(1) : "–"}</p>
                <p><span className="text-gray-400">Point Diff:</span> {team.record.pointDifferential !== undefined ? team.record.pointDifferential.toFixed(1) : "–"}</p>
                <p><span className="text-gray-400">Streak:</span> {team.record.streak ?? "–"}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Next Game
              </h2>
              {team.nextGame ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {team.nextGame.homeAway === "home" ? "vs" : "@"} {team.nextGame.opponent.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(team.nextGame.date)}</p>
                  {team.nextGame.venue && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {team.nextGame.venue.fullName}
                    </p>
                  )}
                  {team.nextGame.gameId && (
                    <Link
                      href={`/games/${team.nextGame.gameId}`}
                      className="inline-flex items-center text-sm font-medium text-[#17408B] dark:text-blue-400 hover:underline"
                    >
                      View Matchup
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">No upcoming game available.</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href={`/teams/${team.id}/roster`}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">View Full Roster</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Depth chart, bios, and sortable player stats.</p>
            </Link>
            <Link
              href={`/teams/${team.id}/results`}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">View Recent Results</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest completed games and scorelines.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
