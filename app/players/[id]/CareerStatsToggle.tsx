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
    return <p className="text-sm text-slate-400 dark:text-slate-300">Stats unavailable for this player.</p>;
  }
  const active = mode === "averages" ? averages : totals;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {averages && (
          <button
            type="button"
            onClick={() => setMode("averages")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              mode === "averages"
                ? "bg-[#1D428A] text-white"
                : "bg-slate-100 text-slate-600 hover:text-[#1D428A] dark:bg-slate-800 dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            Career Averages
          </button>
        )}
        {totals && (
          <button
            type="button"
            onClick={() => setMode("totals")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              mode === "totals"
                ? "bg-[#1D428A] text-white"
                : "bg-slate-100 text-slate-600 hover:text-[#1D428A] dark:bg-slate-800 dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            Career Totals
          </button>
        )}
      </div>

      {active ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
            {active.displayName}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead>
                <tr>
                  {active.labels.map((label) => (
                    <th
                      key={`career-${mode}-${label}`}
                      className="whitespace-nowrap px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-300"
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
                      className="whitespace-nowrap px-2 py-2 font-semibold text-slate-800 dark:text-slate-100"
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
