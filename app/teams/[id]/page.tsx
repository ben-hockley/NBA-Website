import { fetchRoster } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamRosterPage({ params }: Props) {
  const { id } = await params;
  let data = null;
  let error: string | null = null;

  try {
    data = await fetchRoster(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load roster.";
  }

  return (
    <div>
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 mb-6 transition-colors"
      >
        ← Back to Teams
      </Link>

      {error && <ErrorMessage message={error} />}

      {data && (
        <>
          {/* Team Header */}
          <div
            className="rounded-2xl p-6 mb-8 flex items-center gap-5"
            style={{ backgroundColor: `#${data.team.color}20`, borderLeft: `4px solid #${data.team.color}` }}
          >
            {data.team.logo && (
              <Image
                src={data.team.logo}
                alt={data.team.abbreviation}
                width={80}
                height={80}
                className="object-contain"
                unoptimized
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.team.displayName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {data.athletes.length} players on roster
              </p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 w-14">#</th>
                  <th className="text-left px-4 py-3">Player</th>
                  <th className="text-center px-3 py-3 hidden sm:table-cell">POS</th>
                  <th className="text-center px-3 py-3 hidden md:table-cell">HT</th>
                  <th className="text-center px-3 py-3 hidden md:table-cell">WT</th>
                  <th className="text-center px-3 py-3 hidden lg:table-cell">AGE</th>
                  <th className="text-center px-3 py-3 hidden lg:table-cell">EXP</th>
                  <th className="text-left px-3 py-3 hidden xl:table-cell">COLLEGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.athletes.map((athlete) => (
                  <tr
                    key={athlete.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                      {athlete.jersey ?? "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {athlete.headshot ? (
                          <Image
                            src={athlete.headshot}
                            alt={athlete.displayName}
                            width={36}
                            height={36}
                            className="rounded-full object-cover bg-gray-100 dark:bg-gray-700"
                            unoptimized
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500">
                            {athlete.displayName.slice(0, 1)}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {athlete.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {athlete.position?.abbreviation ?? "–"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell text-gray-600 dark:text-gray-400">
                      {athlete.height ?? "–"}
                    </td>
                    <td className="px-3 py-3 text-center hidden md:table-cell text-gray-600 dark:text-gray-400">
                      {athlete.weight ? `${athlete.weight} lbs` : "–"}
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell text-gray-600 dark:text-gray-400">
                      {athlete.age ?? "–"}
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell text-gray-600 dark:text-gray-400">
                      {athlete.experience !== undefined
                        ? athlete.experience.years === 0
                          ? "Rookie"
                          : `${athlete.experience.years}yr`
                        : "–"}
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell text-gray-500 dark:text-gray-400 text-xs">
                      {athlete.college?.name ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
