import ErrorMessage from "@/components/ErrorMessage";
import { fetchDraftProspects, fetchDraftResults } from "@/lib/api";
import * as CountryFlags from "country-flag-icons/react/3x2";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

interface Props {
  params: Promise<{ year: string }>;
}

const DEFAULT_DRAFT_YEAR = 2026;
const MIN_DRAFT_YEAR = 1947;

function getDraftYear(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_DRAFT_YEAR;
  return Math.min(DEFAULT_DRAFT_YEAR, Math.max(MIN_DRAFT_YEAR, parsed));
}

function getDraftYears(maxYear: number, minYear: number): number[] {
  return Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index);
}

export default async function DraftYearPage({ params }: Props) {
  const { year } = await params;
  const draftYear = getDraftYear(year);
  const isProspectsOnlyYear = draftYear === DEFAULT_DRAFT_YEAR;

  let draft = null;
  let prospects = null;
  let error: string | null = null;

  try {
    if (isProspectsOnlyYear) {
      prospects = await fetchDraftProspects(DEFAULT_DRAFT_YEAR, 100);
    } else {
      draft = await fetchDraftResults(draftYear);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load draft data.";
  }

  const availableYears = getDraftYears(DEFAULT_DRAFT_YEAR, MIN_DRAFT_YEAR);
  const prevYear = draftYear > MIN_DRAFT_YEAR ? draftYear - 1 : null;
  const nextYear = draftYear < DEFAULT_DRAFT_YEAR ? draftYear + 1 : null;

  const totalRounds = draft
    ? Math.max(draft.rounds, ...draft.picks.map((pick) => pick.round), 0)
    : 0;

  const picksByRound = draft
    ? Array.from({ length: totalRounds }, (_, index) => {
      const round = index + 1;
      return {
        round,
        picks: draft.picks.filter((pick) => pick.round === round),
      };
    }).filter((group) => group.picks.length > 0)
    : [];

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
        <div>
          <h1 className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <GraduationCap className="h-6 w-6 text-[#1D428A] dark:text-white" />
            {draftYear} NBA Draft
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {isProspectsOnlyYear
              ? "Top 100 draft prospects for the 2026 class"
              : "Historic draft results by year"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {prevYear ? (
              <Link
                href={`/draft/${prevYear}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
                {prevYear}
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200/70 px-3 py-1.5 text-sm text-slate-300 dark:border-[#1D428A]/45 dark:text-slate-500">
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}

            {nextYear ? (
              <Link
                href={`/draft/${nextYear}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-100"
              >
                {nextYear}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full border border-slate-200/70 px-3 py-1.5 text-sm text-slate-300 dark:border-[#1D428A]/45 dark:text-slate-500">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {availableYears.slice(0, 12).map((optionYear) => (
              <Link
                key={optionYear}
                href={`/draft/${optionYear}`}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                  optionYear === draftYear
                    ? "border-[#1D428A] bg-[#1D428A] text-white"
                    : "border-slate-200/70 bg-white/80 text-slate-600 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/70 dark:text-slate-200"
                }`}
              >
                {optionYear}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {error && <ErrorMessage message={error} />}

      {!error && draft && !isProspectsOnlyYear && (
        <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Draft Results</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              {draft.picks.length > 0
                ? `${draft.picks.length} picks from the ${draft.year} NBA Draft`
                : `No published pick results for ${draft.year} yet.`}
            </p>
          </div>

          {picksByRound.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-[#1D428A]/45 dark:text-slate-300">
              Draft picks are not available for this season yet.
            </div>
          )}

          {picksByRound.map(({ round, picks }) => (
            <div
              key={round}
              className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-[#1D428A]/45"
            >
              <div className="border-b border-slate-200/60 px-4 py-3 dark:border-[#1D428A]/45">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                  Round {round}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/85 text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-[#1D428A]/20 dark:text-slate-300">
                      <th className="px-3 py-3">Pick</th>
                      <th className="px-3 py-3">Overall</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3">Player</th>
                      <th className="px-3 py-3">Pos</th>
                      <th className="px-3 py-3">From</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-[#1D428A]/35">
                    {picks.map((pick) => (
                      <tr key={`${pick.round}-${pick.pick}-${pick.player.id}-${pick.team.id}`} className="transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#1D428A]/20">
                        <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">#{pick.pick}</td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{pick.overall}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {pick.team.logo ? (
                              <Image
                                src={pick.team.logo}
                                alt={pick.team.abbreviation || pick.team.displayName}
                                width={22}
                                height={22}
                                className="object-contain"
                                unoptimized
                              />
                            ) : null}
                            <div>
                              <p className="text-slate-800 dark:text-slate-100">{pick.team.displayName}</p>
                              {(pick.traded || pick.tradeNote || (pick.status && pick.status !== "SELECTION_MADE")) && (
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                                  {pick.traded
                                    ? pick.tradeNote || "Traded pick"
                                    : pick.tradeNote || pick.status}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {pick.player.id ? (
                            <Link
                              href={`/players/${pick.player.id}`}
                              className="font-semibold text-slate-900 transition-colors hover:text-[#1D428A] dark:text-white dark:hover:text-slate-100"
                            >
                              {pick.player.displayName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">{pick.player.displayName}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{pick.player.position ?? "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            {pick.player.sourceTeamLogo ? (
                              <Image
                                src={pick.player.sourceTeamLogo}
                                alt={pick.player.sourceTeam ?? "From"}
                                width={20}
                                height={20}
                                className="object-contain"
                                unoptimized
                              />
                            ) : pick.player.sourceCountryCode ? (
                              (() => {
                                const Flag = CountryFlags[
                                  pick.player.sourceCountryCode as keyof typeof CountryFlags
                                ];
                                return Flag ? (
                                  <Flag
                                    title={pick.player.sourceTeam ?? pick.player.sourceCountryCode}
                                    className="w-5 h-auto rounded-sm"
                                  />
                                ) : null;
                              })()
                            ) : null}
                            <span className="text-sm">{pick.player.sourceTeam ?? "-"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      {!error && isProspectsOnlyYear && (
        <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/75 p-4 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Top 100 Prospects</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Pulled from ESPN core draft prospect rankings for the {DEFAULT_DRAFT_YEAR} class.
            </p>
          </div>

          {prospects && prospects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-[#1D428A]/45 dark:text-slate-300">
              Prospect rankings are not available right now.
            </div>
          )}

          {prospects && prospects.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-[#1D428A]/45">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/85 text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-[#1D428A]/20 dark:text-slate-300">
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Prospect</th>
                      <th className="px-3 py-3">Pos</th>
                      <th className="px-3 py-3">School</th>
                      <th className="px-3 py-3">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-[#1D428A]/35">
                    {prospects.map((prospect) => (
                      <tr key={`${prospect.rank}-${prospect.player.id}-${prospect.player.displayName}`} className="transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#1D428A]/20">
                        <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">#{prospect.rank}</td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/players/${prospect.player.id}`}
                            className="font-semibold text-slate-900 transition-colors hover:text-[#1D428A] dark:text-white dark:hover:text-slate-100"
                          >
                            {prospect.player.displayName}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{prospect.player.position ?? "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            {prospect.school.logo ? (
                              <Image
                                src={prospect.school.logo}
                                alt={prospect.school.abbreviation || prospect.school.displayName}
                                width={20}
                                height={20}
                                className="object-contain"
                                unoptimized
                              />
                            ) : prospect.school.countryCode ? (
                              (() => {
                                const Flag = CountryFlags[
                                  prospect.school.countryCode as keyof typeof CountryFlags
                                ];
                                return Flag ? (
                                  <Flag
                                    title={prospect.school.displayName}
                                    className="w-5 h-auto rounded-sm"
                                  />
                                ) : null;
                              })()
                            ) : null}
                            <span>{prospect.school.displayName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                          {[prospect.height, prospect.weight].filter(Boolean).join(" · ") || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
