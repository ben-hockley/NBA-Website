"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Athlete } from "@/lib/types";

type View = "info" | "stats";
type SortDir = "asc" | "desc";
interface SortState { col: string; dir: SortDir }

// G < F < C ordering for position sort
const POS_ORDER: Record<string, number> = {
  PG: 0, G: 1, SG: 2, SF: 3, F: 4, PF: 5, C: 6,
};

function parseHeightInches(h?: string): number {
  const m = h?.match(/(\d+)'\s*(\d+)/);
  return m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 0;
}

function parseStat(s?: string): number {
  const n = parseFloat(s ?? "");
  return isNaN(n) ? -1 : n; // -1 sorts "–" to the end when descending
}

function sorted(athletes: Athlete[], { col, dir }: SortState): Athlete[] {
  return [...athletes].sort((a, b) => {
    let cmp = 0;
    switch (col) {
      case "jersey":
        cmp = (parseInt(a.jersey ?? "999") || 999) - (parseInt(b.jersey ?? "999") || 999);
        break;
      case "name":
        cmp = a.fullName.localeCompare(b.fullName);
        break;
      case "position":
        cmp = (POS_ORDER[a.position?.abbreviation ?? ""] ?? 99)
            - (POS_ORDER[b.position?.abbreviation ?? ""] ?? 99);
        break;
      case "height":
        cmp = parseHeightInches(a.height) - parseHeightInches(b.height);
        break;
      case "weight":
        cmp = (a.weight ?? 0) - (b.weight ?? 0);
        break;
      case "age":
        cmp = (a.age ?? 0) - (b.age ?? 0);
        break;
      case "experience":
        cmp = (a.experience?.years ?? 0) - (b.experience?.years ?? 0);
        break;
      case "college":
        cmp = (a.college?.name ?? "zzz").localeCompare(b.college?.name ?? "zzz");
        break;
      case "gp":
        cmp = parseStat(a.stats?.gp) - parseStat(b.stats?.gp);
        break;
      case "mpg":
        cmp = parseStat(a.stats?.mpg) - parseStat(b.stats?.mpg);
        break;
      case "ppg":
        cmp = parseStat(a.stats?.ppg) - parseStat(b.stats?.ppg);
        break;
      case "rpg":
        cmp = parseStat(a.stats?.rpg) - parseStat(b.stats?.rpg);
        break;
      case "apg":
        cmp = parseStat(a.stats?.apg) - parseStat(b.stats?.apg);
        break;
      case "fgPct":
        cmp = parseStat(a.stats?.fgPct) - parseStat(b.stats?.fgPct);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
  return <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

interface HeadProps {
  col: string;
  sort: SortState;
  onSort: (col: string) => void;
  className?: string;
  children: React.ReactNode;
}
function Th({ col, sort, onSort, className = "", children }: HeadProps) {
  return (
    <th
      className={`px-3 py-3 cursor-pointer select-none whitespace-nowrap hover:text-gray-800 dark:hover:text-gray-200 transition-colors ${className}`}
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon active={sort.col === col} dir={sort.dir} />
    </th>
  );
}

export default function RosterTable({ athletes }: { athletes: Athlete[] }) {
  const [view, setView] = useState<View>("info");
  const [sort, setSort] = useState<SortState>({ col: "jersey", dir: "asc" });

  function handleSort(col: string) {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { col, dir: col === "gp" || col === "mpg" || col === "ppg" || col === "rpg" || col === "apg" || col === "fgPct" ? "desc" : "asc" }
    );
  }

  // Reset sort to a sensible default when switching views
  function handleView(v: View) {
    setView(v);
    setSort(v === "stats" ? { col: "ppg", dir: "desc" } : { col: "jersey", dir: "asc" });
  }

  const rows = sorted(athletes, sort);

  const thBase = "text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Toggle tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {(["info", "stats"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => handleView(v)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              view === v
                ? "border-b-2 border-[#17408B] text-[#17408B] dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            {v === "info" ? "Player Info" : "Player Stats"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        {view === "info" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <Th col="jersey" sort={sort} onSort={handleSort} className={`${thBase} pl-4 w-14`}>#</Th>
                <Th col="name"   sort={sort} onSort={handleSort} className={thBase}>Player</Th>
                <Th col="position" sort={sort} onSort={handleSort} className={`${thBase} text-center hidden sm:table-cell`}>POS</Th>
                <Th col="height"   sort={sort} onSort={handleSort} className={`${thBase} text-center hidden md:table-cell`}>HT</Th>
                <Th col="weight"   sort={sort} onSort={handleSort} className={`${thBase} text-center hidden md:table-cell`}>WT</Th>
                <Th col="age"      sort={sort} onSort={handleSort} className={`${thBase} text-center hidden lg:table-cell`}>AGE</Th>
                <Th col="experience" sort={sort} onSort={handleSort} className={`${thBase} text-center hidden lg:table-cell`}>EXP</Th>
                <Th col="college"  sort={sort} onSort={handleSort} className={`${thBase} hidden xl:table-cell`}>COLLEGE</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="pl-4 px-3 py-3 font-mono text-gray-500 text-xs">{athlete.jersey ?? "–"}</td>
                  <td className="px-3 py-3">
                    <Link href={`/players/${athlete.id}`} className="flex items-center gap-3 group">
                      {athlete.headshot ? (
                        <Image
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          width={36} height={36}
                          className="rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {athlete.displayName.slice(0, 1)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-[#17408B] dark:group-hover:text-blue-400 transition-colors">
                        {athlete.fullName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      {athlete.position?.abbreviation ?? "–"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell text-gray-600 dark:text-gray-400">{athlete.height ?? "–"}</td>
                  <td className="px-3 py-3 text-center hidden md:table-cell text-gray-600 dark:text-gray-400">
                    {athlete.weight ? `${athlete.weight} lbs` : "–"}
                  </td>
                  <td className="px-3 py-3 text-center hidden lg:table-cell text-gray-600 dark:text-gray-400">{athlete.age ?? "–"}</td>
                  <td className="px-3 py-3 text-center hidden lg:table-cell text-gray-600 dark:text-gray-400">
                    {athlete.experience !== undefined
                      ? athlete.experience.years === 0 ? "Rookie" : `${athlete.experience.years}yr`
                      : "–"}
                  </td>
                  <td className="px-3 py-3 hidden xl:table-cell text-gray-500 dark:text-gray-400 text-xs">{athlete.college?.name ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <Th col="jersey"   sort={sort} onSort={handleSort} className={`${thBase} pl-4 w-14`}>#</Th>
                <Th col="name"     sort={sort} onSort={handleSort} className={thBase}>Player</Th>
                <Th col="position" sort={sort} onSort={handleSort} className={`${thBase} text-center hidden sm:table-cell`}>POS</Th>
                <Th col="gp"       sort={sort} onSort={handleSort} className={`${thBase} text-center`}>GP</Th>
                <Th col="mpg"      sort={sort} onSort={handleSort} className={`${thBase} text-center`}>MPG</Th>
                <Th col="ppg"      sort={sort} onSort={handleSort} className={`${thBase} text-center`}>PPG</Th>
                <Th col="rpg"      sort={sort} onSort={handleSort} className={`${thBase} text-center`}>RPG</Th>
                <Th col="apg"      sort={sort} onSort={handleSort} className={`${thBase} text-center`}>APG</Th>
                <Th col="fgPct"    sort={sort} onSort={handleSort} className={`${thBase} text-center`}>FG%</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rows.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="pl-4 px-3 py-3 font-mono text-gray-500 text-xs">{athlete.jersey ?? "–"}</td>
                  <td className="px-3 py-3">
                    <Link href={`/players/${athlete.id}`} className="flex items-center gap-3 group">
                      {athlete.headshot ? (
                        <Image
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          width={36} height={36}
                          className="rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {athlete.displayName.slice(0, 1)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white group-hover:text-[#17408B] dark:group-hover:text-blue-400 transition-colors">
                        {athlete.fullName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      {athlete.position?.abbreviation ?? "–"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.gp ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.mpg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.ppg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.rpg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.apg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-800 dark:text-gray-200">{athlete.stats?.fgPct ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
