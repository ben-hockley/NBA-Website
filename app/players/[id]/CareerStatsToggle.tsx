"use client";

import { useState } from "react";
import type { PlayerStatsTable } from "@/lib/types";

interface Props {
  averages?: PlayerStatsTable;
  totals?: PlayerStatsTable;
}

export default function CareerStatsToggle({ averages, totals }: Props) {
  const [mode, setMode] = useState<"averages" | "totals">(averages ? "averages" : "totals");

  if (!averages && !totals) {
    return <p className="text-sm text-gray-400 dark:text-gray-500">Stats unavailable for this player.</p>;
  }
  const active = mode === "averages" ? averages : totals;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {averages && (
          <button
            type="button"
            onClick={() => setMode("averages")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === "averages"
                ? "bg-[#17408B] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Career Averages
          </button>
        )}
        {totals && (
          <button
            type="button"
            onClick={() => setMode("totals")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              mode === "totals"
                ? "bg-[#17408B] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Career Totals
          </button>
        )}
      </div>

      {active ? (
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            {active.displayName}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead>
                <tr>
                  {active.labels.map((label) => (
                    <th
                      key={`career-${mode}-${label}`}
                      className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {active.values.map((value, index) => (
                    <td
                      key={`career-${mode}-${index}`}
                      className="px-2 py-2 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
