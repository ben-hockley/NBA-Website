import { fetchTeamOverview, fetchTeamRecentResults } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";
import type { TeamRecentResult } from "@/lib/types";
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

function ResultsList({ games }: { games: TeamRecentResult[] }) {
  return (
    <div className="space-y-3">
      {games.map((game) => (
        <Link
          key={game.gameId}
          href={`/games/${game.gameId}`}
          className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-[#17408B] dark:hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
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
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {game.homeAway === "home" ? "vs" : "@"} {game.opponent.displayName}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{game.statusText}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                {game.teamScore}-{game.opponentScore}
              </p>
              <span
                className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  game.won
                    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                }`}
              >
                {game.won ? "W" : "L"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function TeamResultsPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  let results: TeamRecentResult[] | null = null;
  let error: string | null = null;

  try {
    const [overview, recentResults] = await Promise.all([
      fetchTeamOverview(id),
      fetchTeamRecentResults(id, 12),
    ]);
    team = overview;
    results = recentResults;
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
          />

          {results.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center text-gray-500 dark:text-gray-400">
              No recent completed games available.
            </div>
          ) : (
            <ResultsList games={results} />
          )}
        </>
      )}
    </div>
  );
}
