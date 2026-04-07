import { fetchTeams } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Link from "next/link";
import Image from "next/image";

export default async function TeamsPage() {
  let teams = null;
  let error: string | null = null;

  try {
    teams = await fetchTeams();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load teams.";
  }

  // Sort teams alphabetically
  const sorted = teams ? [...teams].sort((a, b) => a.displayName.localeCompare(b.displayName)) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NBA Teams</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a team to view overview, roster, and recent results
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sorted.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-[#17408B] dark:hover:border-blue-500 transition-all p-4 flex items-center gap-3"
            >
              {team.logo ? (
                <Image
                  src={team.logo}
                  alt={team.abbreviation}
                  width={48}
                  height={48}
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: `#${team.color}` }}
                >
                  {team.abbreviation.slice(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-[#17408B] dark:group-hover:text-blue-400 transition-colors">
                  {team.displayName}
                </p>
                <p className="text-xs text-gray-400">{team.abbreviation}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
