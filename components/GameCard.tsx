import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/types";

function statusBadge(game: Game) {
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
      {shortDetail}
    </span>
  );
}

export default function GameCard({ game }: { game: Game }) {
  const away = game.competitors.find((c) => c.homeAway === "away");
  const home = game.competitors.find((c) => c.homeAway === "home");

  if (!away || !home) return null;

  const isLive = game.status.type.state === "in";
  const isFinal = game.status.type.state === "post";
  const awayWon = isFinal && away.winner;
  const homeWon = isFinal && home.winner;

  return (
    <Link
      href={`/games/${game.id}`}
      aria-label={`View game details: ${away.team.displayName} at ${home.team.displayName}`}
      className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#17408B] focus-visible:ring-offset-2"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5">
        {/* Status */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          {game.venue && (
            <span>{game.venue.fullName}, {game.venue.address.city}</span>
          )}
          <span className="ml-auto">{statusBadge(game)}</span>
        </div>

        {/* Teams & Score */}
        <div className="flex flex-col gap-2">
          {[
            { competitor: away, won: awayWon },
            { competitor: home, won: homeWon },
          ].map(({ competitor, won }) => (
            <div key={competitor.id} className={`flex items-center gap-3 ${won ? "font-semibold" : ""}`}>
              {competitor.team.logo ? (
                <Image
                  src={competitor.team.logo}
                  alt={competitor.team.abbreviation}
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                  {competitor.team.abbreviation.slice(0, 2)}
                </div>
              )}
              <span className="flex-1 text-sm">
                {competitor.team.displayName}
                {competitor.records?.[0] && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({competitor.records[0].summary})
                  </span>
                )}
              </span>
              {(isLive || isFinal) && (
                <span className={`text-xl font-bold tabular-nums ${won ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                  {competitor.score}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Period info for live games */}
        {isLive && game.status.period && (
          <p className="text-xs text-gray-400 text-center">
            {game.status.displayClock} - Q{game.status.period}
          </p>
        )}
      </div>
    </Link>
  );
}
