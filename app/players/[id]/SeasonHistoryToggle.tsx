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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
        Season-by-Season Team History
      </h2>

      <div className="flex items-center gap-2 mb-3">
        {mapped.averages && (
          <button
            type="button"
            onClick={() => setMode("averages")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === "averages"
                ? "bg-[#17408B] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Regular Season Averages
          </button>
        )}
        {mapped.totals && (
          <button
            type="button"
            onClick={() => setMode("totals")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === "totals"
                ? "bg-[#17408B] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Regular Season Totals
          </button>
        )}
      </div>

      {activeCategory ? (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            {activeCategory.displayName}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Season</th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Team</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Pos</th>
                  {activeCategory.labels.map((label) => (
                    <th
                      key={`${activeCategory.key}-${label}`}
                      className="px-2 py-2 text-center text-xs font-medium text-gray-400 dark:text-gray-500 uppercase whitespace-nowrap"
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
                        ? "border-t border-gray-200 dark:border-gray-700"
                        : ""
                    }
                  >
                    <td className="px-2 py-2 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {row.seasonLabel}
                    </td>
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
                            className="hover:text-[#17408B] dark:hover:text-blue-400 transition-colors"
                          >
                            {row.team.displayName}
                          </Link>
                        ) : (
                          <span>{row.team.displayName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {row.position ?? "-"}
                    </td>
                    {activeCategory.labels.map((_, statIndex) => (
                      <td
                        key={`${activeCategory.key}-${row.seasonLabel}-${row.team.id}-${statIndex}`}
                        className="px-2 py-2 text-center tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap"
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
