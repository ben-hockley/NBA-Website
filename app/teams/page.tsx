import { fetchTeams } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

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
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Franchises</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          <Shield className="h-6 w-6 text-[#1D428A] dark:text-white" />
          NBA Teams
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Select a team to view overview, roster, and recent results
        </p>
      </section>

      {error && <ErrorMessage message={error} />}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:scale-[1.01] hover:border-[#1D428A] hover:bg-slate-50 dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:hover:bg-[#1D428A]/20"
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
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: `#${team.color}` }}
                >
                  {team.abbreviation.slice(0, 3)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900 transition-colors group-hover:text-[#1D428A] dark:text-white dark:group-hover:text-slate-100">
                  {team.displayName}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-300">{team.abbreviation}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
