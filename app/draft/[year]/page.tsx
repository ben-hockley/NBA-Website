import ErrorMessage from "@/components/ErrorMessage";
import { fetchDraftProspects, fetchDraftResults } from "@/lib/api";
import * as CountryFlags from "country-flag-icons/react/3x2";
import Image from "next/image";
import Link from "next/link";

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
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{draftYear} NBA Draft</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-[#17408B] dark:hover:border-blue-500 hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
              >
                ← {prevYear}
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600">
                ←
              </span>
            )}

            {nextYear ? (
              <Link
                href={`/draft/${nextYear}`}
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-[#17408B] dark:hover:border-blue-500 hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
              >
                {nextYear} →
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600">
                →
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {availableYears.slice(0, 12).map((optionYear) => (
              <Link
                key={optionYear}
                href={`/draft/${optionYear}`}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  optionYear === draftYear
                    ? "bg-[#17408B] text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-[#17408B] dark:hover:text-blue-400"
                }`}
              >
                {optionYear}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {!error && draft && !isProspectsOnlyYear && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Draft Results</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {draft.picks.length > 0
                ? `${draft.picks.length} picks from the ${draft.year} NBA Draft`
                : `No published pick results for ${draft.year} yet.`}
            </p>
          </div>

          {picksByRound.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Draft picks are not available for this season yet.
            </div>
          )}

          {picksByRound.map(({ round, picks }) => (
            <div
              key={round}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  Round {round}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-3">Pick</th>
                      <th className="px-3 py-3">Overall</th>
                      <th className="px-3 py-3">Team</th>
                      <th className="px-3 py-3">Player</th>
                      <th className="px-3 py-3">Pos</th>
                      <th className="px-3 py-3">From</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {picks.map((pick) => (
                      <tr key={`${pick.round}-${pick.pick}-${pick.player.id}-${pick.team.id}`}>
                        <td className="px-3 py-3 font-semibold text-gray-800 dark:text-gray-200">#{pick.pick}</td>
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{pick.overall}</td>
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
                              <p className="text-gray-800 dark:text-gray-200">{pick.team.displayName}</p>
                              {(pick.traded || pick.tradeNote || (pick.status && pick.status !== "SELECTION_MADE")) && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                              className="font-medium text-gray-900 dark:text-white hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                            >
                              {pick.player.displayName}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-white">{pick.player.displayName}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{pick.player.position ?? "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top 100 Prospects</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pulled from ESPN core draft prospect rankings for the {DEFAULT_DRAFT_YEAR} class.
            </p>
          </div>

          {prospects && prospects.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Prospect rankings are not available right now.
            </div>
          )}

          {prospects && prospects.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Prospect</th>
                      <th className="px-3 py-3">Pos</th>
                      <th className="px-3 py-3">School</th>
                      <th className="px-3 py-3">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {prospects.map((prospect) => (
                      <tr key={`${prospect.rank}-${prospect.player.id}-${prospect.player.displayName}`}>
                        <td className="px-3 py-3 font-semibold text-gray-800 dark:text-gray-200">#{prospect.rank}</td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/players/${prospect.player.id}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                          >
                            {prospect.player.displayName}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{prospect.player.position ?? "-"}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
                        <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
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
