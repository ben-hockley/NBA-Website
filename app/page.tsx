import { fetchScoreboard } from "@/lib/api";
import GameCard from "@/components/GameCard";
import ErrorMessage from "@/components/ErrorMessage";
import ScoreboardDatePicker from "@/components/ScoreboardDatePicker";
import { CalendarClock, CircleDot, Flag, Timer } from "lucide-react";

interface Props {
  searchParams: Promise<{ date?: string }>;
}

function todayCompactDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function parseQueryDate(value: string | undefined): string {
  return value && /^\d{8}$/.test(value) ? value : todayCompactDate();
}

function formatDisplayDate(compact: string): string {
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ScoreboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedDate = parseQueryDate(params.date);

  let games = null;
  let error: string | null = null;

  try {
    games = await fetchScoreboard(selectedDate);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load scoreboard.";
  }

  const selectedDateDisplay = formatDisplayDate(selectedDate);
  const liveGames = games?.filter((g) => g.status.type.state === "in") ?? [];
  const finalGames = games?.filter((g) => g.status.type.state === "post") ?? [];
  const upcomingGames = games?.filter((g) => g.status.type.state === "pre") ?? [];

  return (
    <div className="space-y-5">
      <section className="relative z-20 rounded-3xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              Match Center
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Live Scores &amp; Results</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300">
              <CalendarClock className="h-4 w-4" />
              {selectedDateDisplay}
            </p>
          </div>
          <ScoreboardDatePicker
            selectedDateCompact={selectedDate}
            selectedDateDisplay={selectedDateDisplay}
          />
        </div>
      </section>

      {error && <ErrorMessage message={error} />}

      {games && games.length === 0 && (
        <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-10 text-center backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1D428A]/10 text-[#1D428A] dark:bg-[#1D428A]/35 dark:text-white">
            <CalendarClock className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">No games scheduled on this date</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Use the date picker to browse a different day.</p>
        </section>
      )}

      {games && games.length > 0 && (
        <div className="space-y-5">
          {liveGames.length > 0 && (
            <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/70">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#C8102E]">
                  <CircleDot className="h-4 w-4" />
                  Live Now
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-300">{liveGames.length} games</span>
              </div>
              <div className="space-y-3">
                {liveGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {finalGames.length > 0 && (
            <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/70">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-200">
                  <Flag className="h-4 w-4" />
                  Final
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-300">{finalGames.length} games</span>
              </div>
              <div className="space-y-3">
                {finalGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {upcomingGames.length > 0 && (
            <section className="rounded-3xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/70">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#1D428A] dark:text-slate-100">
                  <Timer className="h-4 w-4" />
                  Upcoming
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-300">{upcomingGames.length} games</span>
              </div>
              <div className="space-y-3">
                {upcomingGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
