import { fetchScoreboard } from "@/lib/api";
import GameCard from "@/components/GameCard";
import ErrorMessage from "@/components/ErrorMessage";
import ScoreboardDatePicker from "@/components/ScoreboardDatePicker";

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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Scores &amp; Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedDateDisplay}</p>
        </div>
        <ScoreboardDatePicker
          selectedDateCompact={selectedDate}
          selectedDateDisplay={selectedDateDisplay}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      {games && games.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <p className="text-5xl mb-4">��</p>
          <p className="text-lg font-medium">No games scheduled on this date</p>
          <p className="text-sm mt-1">Use the calendar to browse another day.</p>
        </div>
      )}

      {games && games.length > 0 && (
        <>
          {games.some((g) => g.status.type.state === "in") && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-3">
                🔴 Live Now
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games
                  .filter((g) => g.status.type.state === "in")
                  .map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
              </div>
            </section>
          )}

          {games.some((g) => g.status.type.state === "post") && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Final
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games
                  .filter((g) => g.status.type.state === "post")
                  .map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
              </div>
            </section>
          )}

          {games.some((g) => g.status.type.state === "pre") && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-500 mb-3">
                Upcoming
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {games
                  .filter((g) => g.status.type.state === "pre")
                  .map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
