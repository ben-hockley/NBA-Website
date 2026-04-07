import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import type { Game } from "@/lib/types";

function statusBadge(game: Game) {
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
      {shortDetail}
    </span>
  );
}

function formatTipTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatContributorValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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
      className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D428A] focus-visible:ring-offset-2"
    >
      <article className="rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:hover:bg-[#1D428A]/25">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {formatTipTime(game.date)}
              </span>
              {game.venue && (
                <span className="truncate">
                  {game.venue.address.city ? `${game.venue.address.city} - ` : ""}
                  {game.venue.fullName}
                </span>
              )}
              <span className="ml-auto">{statusBadge(game)}</span>
            </div>

            <div className="space-y-2">
              {[
                { competitor: away, won: awayWon },
                { competitor: home, won: homeWon },
              ].map(({ competitor, won }) => {
                const contributor = (isLive || isFinal)
                  ? game.topContributors?.find((entry) => entry.teamId === competitor.team.id)?.contributor
                  : undefined;

                return (
                  <div key={competitor.id} className="rounded-xl px-2 py-1.5 transition-all duration-200 group-hover:bg-white/60 dark:group-hover:bg-slate-800/60">
                    <div className="flex items-center gap-3">
                      {competitor.team.logo ? (
                        <Image
                          src={competitor.team.logo}
                          alt={competitor.team.abbreviation}
                          width={30}
                          height={30}
                          className="h-[30px] w-[30px] object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                          {competitor.team.abbreviation.slice(0, 2)}
                        </div>
                      )}
                      <span className={`min-w-0 flex-1 truncate text-sm ${won ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
                        {competitor.team.displayName}
                      </span>
                      {(isLive || isFinal) ? (
                        <span className={`text-2xl font-black tabular-nums ${won ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-300"}`}>
                          {competitor.score}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">vs</span>
                      )}
                    </div>

                    {contributor && (
                      <div className="ml-[42px] mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/80 px-2 py-1 dark:border-[#1D428A]/40 dark:bg-slate-800/60">
                        {contributor.headshot ? (
                          <Image
                            src={contributor.headshot}
                            alt={contributor.athleteName}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            {contributor.athleteName.slice(0, 1)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                            {competitor.team.shortDisplayName} Leader
                          </p>
                          <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-100">
                            {contributor.athleteName}
                            {contributor.position ? ` · ${contributor.position}` : ""}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300">
                            {formatContributorValue(contributor.points)} PTS · {formatContributorValue(contributor.rebounds)} REB · {formatContributorValue(contributor.assists)} AST
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isLive && game.status.period && (
              <p className="text-xs font-medium text-[#C8102E]">
                {game.status.displayClock} - Q{game.status.period}
              </p>
            )}
          </div>

          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#1D428A] dark:text-slate-400" />
        </div>
      </article>
    </Link>
  );
}
