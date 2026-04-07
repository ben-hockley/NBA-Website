import { fetchPlayerDetails } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import CareerStatsToggle from "./CareerStatsToggle";
import SeasonHistoryToggle from "./SeasonHistoryToggle";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  let player = null;
  let error: string | null = null;

  try {
    player = await fetchPlayerDetails(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load player.";
  }

  const backHref = player?.team ? `/teams/${player.team.id}/roster` : "/teams";
  const teamColor = player?.team?.color ?? "17408B";
  const draftYear = player?.draft?.match(/\b(19|20)\d{2}\b/)?.[0];
  const seasonHistoryForToggle = player
    ? player.seasonHistory.filter((category) => {
      const text = `${category.key} ${category.displayName}`.toLowerCase();
      if (text.includes("misc")) return false;
      return text.includes("averag") || text.includes("total");
    })
    : [];

  return (
    <div>
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Roster
      </Link>

      {error && <ErrorMessage message={error} />}

      {player && (
        <div className="space-y-6">
          {/* Hero */}
          <div
            className="flex flex-wrap items-center gap-5 rounded-3xl border border-slate-200/60 bg-white/75 p-6 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75"
            style={{
              backgroundImage: `linear-gradient(120deg, #${teamColor}20, transparent 45%)`,
            }}
          >
            {player.headshot ? (
              <Image
                src={player.headshot}
                alt={player.displayName}
                width={120}
                height={120}
                className="shrink-0 rounded-full border border-slate-200/70 bg-slate-100 object-cover dark:border-[#1D428A]/40 dark:bg-slate-700"
                unoptimized
              />
            ) : (
              <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-500 dark:bg-slate-600 dark:text-slate-100">
                {player.displayName.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {player.jersey && (
                  <span className="text-lg font-mono text-slate-400 dark:text-slate-300">
                    #{player.jersey}
                  </span>
                )}
                {player.position && (
                  <span className="inline-block rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-[#1D428A]/35 dark:text-white">
                    {player.position.displayName}
                  </span>
                )}
              </div>
              <h1 className="truncate text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {player.fullName}
              </h1>
              {player.team && (
                <Link
                  href={`/teams/${player.team.id}`}
                  className="mt-2 flex items-center gap-2 transition-all duration-200 hover:scale-[1.01]"
                >
                  {player.team.logo && (
                    <Image
                      src={player.team.logo}
                      alt={player.team.abbreviation}
                      width={24}
                      height={24}
                      className="object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-sm text-slate-600 transition-colors hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white">
                    {player.team.displayName}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Bio + Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bio */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Bio
              </h2>
              <dl className="space-y-3">
                {player.height && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Height</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.height}</dd>
                  </div>
                )}
                {player.weight && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Weight</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.weight}</dd>
                  </div>
                )}
                {player.age && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Age</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.age}</dd>
                  </div>
                )}
                {player.birthDate && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Born</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.birthDate}</dd>
                  </div>
                )}
                {player.birthPlace && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Birthplace</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.birthPlace.display}</dd>
                  </div>
                )}
                {player.experience && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Experience</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.experience.display}</dd>
                  </div>
                )}
                {player.draft && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Draft</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {draftYear ? (
                        <Link
                          href={`/draft/${draftYear}`}
                          className="transition-colors hover:text-[#1D428A] dark:hover:text-white"
                        >
                          {player.draft}
                        </Link>
                      ) : (
                        player.draft
                      )}
                    </dd>
                  </div>
                )}
                {player.college && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">College</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.college.name}</dd>
                  </div>
                )}
                {player.hand && (
                  <div>
                    <dt className="text-xs uppercase text-slate-400">Shoots</dt>
                    <dd className="text-sm font-medium text-slate-800 dark:text-slate-100">{player.hand}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Stats */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75 lg:col-span-2">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                Stats
              </h2>
              <CareerStatsToggle
                averages={player.careerRegularSeasonAverages}
                totals={player.careerRegularSeasonTotals}
              />
            </div>
          </div>

          <SeasonHistoryToggle categories={seasonHistoryForToggle} />
        </div>
      )}
    </div>
  );
}
