"use client";

import { useMemo, useState } from "react";
import type { PlayerSeasonHistoryCategory } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

interface Props {
  categories: PlayerSeasonHistoryCategory[];
}

function classifyCategory(category: PlayerSeasonHistoryCategory): "averages" | "totals" | null {
  const text = `${category.key} ${category.displayName}`.toLowerCase();
  if (text.includes("misc")) return null;
  if (text.includes("averag")) return "averages";
  if (text.includes("total")) return "totals";
  return null;
}

export default function SeasonHistoryToggle({ categories }: Props) {
  const mapped = useMemo(() => {
    const averages = categories.find((category) => classifyCategory(category) === "averages");
    const totals = categories.find((category) => classifyCategory(category) === "totals");
    return { averages, totals };
  }, [categories]);

  const [mode, setMode] = useState<"averages" | "totals">(mapped.averages ? "averages" : "totals");

  const activeCategory = mode === "averages" ? mapped.averages : mapped.totals;

  if (!mapped.averages && !mapped.totals) return null;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/75 p-5 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
        Season-by-Season Team History
      </h2>

      <div className="flex items-center gap-2 mb-3">
        {mapped.averages && (
          <button
            type="button"
            onClick={() => setMode("averages")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              mode === "averages"
                ? "bg-[#1D428A] text-white"
                : "bg-slate-100 text-slate-600 hover:text-[#1D428A] dark:bg-slate-800 dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            Regular Season Averages
          </button>
        )}
        {mapped.totals && (
          <button
            type="button"
            onClick={() => setMode("totals")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              mode === "totals"
                ? "bg-[#1D428A] text-white"
                : "bg-slate-100 text-slate-600 hover:text-[#1D428A] dark:bg-slate-800 dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            Regular Season Totals
          </button>
        )}
      </div>

      {activeCategory ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
            {activeCategory.displayName}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">Season</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">Team</th>
                  <th className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300">Pos</th>
                  {activeCategory.labels.map((label) => (
                    <th
                      key={`${activeCategory.key}-${label}`}
                      className="whitespace-nowrap px-2 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-300"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeCategory.rows.map((row, rowIndex) => (
                  <tr
                    key={`${activeCategory.key}-${row.seasonLabel}-${row.team.id || row.team.displayName}-${rowIndex}`}
                    className={
                      rowIndex > 0 && activeCategory.rows[rowIndex - 1]?.seasonLabel !== row.seasonLabel
                        ? "border-t border-slate-200/60 dark:border-[#1D428A]/35"
                        : ""
                    }
                  >
                    <td className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800 dark:text-slate-100">
                      {row.seasonLabel}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        {row.team.logo && (
                          <Image
                            src={row.team.logo}
                            alt={row.team.abbreviation}
                            width={18}
                            height={18}
                            className="object-contain"
                            unoptimized
                          />
                        )}
                        {row.team.id ? (
                          <Link
                            href={`/teams/${row.team.id}`}
                            className="transition-colors hover:text-[#1D428A] dark:hover:text-white"
                          >
                            {row.team.displayName}
                          </Link>
                        ) : (
                          <span>{row.team.displayName}</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-center text-slate-700 dark:text-slate-200">
                      {row.position ?? "-"}
                    </td>
                    {activeCategory.labels.map((_, statIndex) => (
                      <td
                        key={`${activeCategory.key}-${row.seasonLabel}-${row.team.id}-${statIndex}`}
                        className="whitespace-nowrap px-2 py-2 text-center tabular-nums text-slate-700 dark:text-slate-200"
                      >
                        {row.stats[statIndex] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
