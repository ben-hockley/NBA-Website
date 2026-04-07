"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowDownUp, ArrowUp, Ban, Cross, Users } from "lucide-react";
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
  if (!active) {
    return <ArrowDownUp className="ml-1 inline h-3.5 w-3.5 text-slate-300 dark:text-slate-500" />;
  }
  return dir === "asc"
    ? <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 inline h-3.5 w-3.5" />;
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
      className={`cursor-pointer select-none whitespace-nowrap px-3 py-3 transition-colors hover:text-[#1D428A] dark:hover:text-white ${className}`}
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon active={sort.col === col} dir={sort.dir} />
    </th>
  );
}

function AvailabilityBadge({ athlete }: { athlete: Athlete }) {
  if (!athlete.availability) return null;

  const tooltip = athlete.availability.detail
    ? `${athlete.availability.label}: ${athlete.availability.detail}`
    : athlete.availability.label;

  if (athlete.availability.kind === "suspended") {
    return (
      <span title={tooltip} aria-label={tooltip} className="inline-flex items-center" role="img">
        <Ban className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
      </span>
    );
  }

  return (
    <span title={tooltip} aria-label={tooltip} className="inline-flex items-center" role="img">
      <Cross className="h-3.5 w-3.5 text-[#C8102E] dark:text-rose-300" />
    </span>
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

  const thBase = "text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75">
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2 dark:border-[#1D428A]/45">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          <Users className="h-4 w-4 text-[#1D428A] dark:text-white" />
          Team Roster
        </p>

        <div className="flex items-center gap-1">
          {(["info", "stats"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => handleView(v)}
              className={`border-b-4 px-5 py-3 text-sm font-semibold transition-all duration-200 ${
                view === v
                  ? "border-[#1D428A] text-[#1D428A] dark:border-white dark:text-white"
                  : "border-transparent text-slate-500 hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {v === "info" ? "Player Info" : "Player Stats"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {view === "info" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/85 dark:bg-[#1D428A]/20">
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
            <tbody className="divide-y divide-slate-200/60 dark:divide-[#1D428A]/35">
              {rows.map((athlete) => (
                <tr key={athlete.id} className="transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#1D428A]/20">
                  <td className="pl-4 px-3 py-3 font-mono text-xs text-slate-500">{athlete.jersey ?? "–"}</td>
                  <td className="px-3 py-3">
                    <Link href={`/players/${athlete.id}`} className="flex items-center gap-3 group">
                      {athlete.headshot ? (
                        <Image
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          width={36} height={36}
                          className="shrink-0 rounded-full border border-slate-200/70 bg-slate-100 object-cover dark:border-[#1D428A]/40 dark:bg-slate-700"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500 dark:bg-slate-600 dark:text-slate-100">
                          {athlete.displayName.slice(0, 1)}
                        </div>
                      )}
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-semibold text-slate-900 transition-colors group-hover:text-[#1D428A] dark:text-white dark:group-hover:text-slate-100">
                          {athlete.fullName}
                        </span>
                        <AvailabilityBadge athlete={athlete} />
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-[#1D428A]/30 dark:text-white">
                      {athlete.position?.abbreviation ?? "–"}
                    </span>
                  </td>
                  <td className="hidden px-3 py-3 text-center text-slate-600 dark:text-slate-300 md:table-cell">{athlete.height ?? "–"}</td>
                  <td className="hidden px-3 py-3 text-center text-slate-600 dark:text-slate-300 md:table-cell">
                    {athlete.weight ? `${athlete.weight} lbs` : "–"}
                  </td>
                  <td className="hidden px-3 py-3 text-center text-slate-600 dark:text-slate-300 lg:table-cell">{athlete.age ?? "–"}</td>
                  <td className="hidden px-3 py-3 text-center text-slate-600 dark:text-slate-300 lg:table-cell">
                    {athlete.experience !== undefined
                      ? athlete.experience.years === 0 ? "Rookie" : `${athlete.experience.years}yr`
                      : "–"}
                  </td>
                  <td className="hidden px-3 py-3 text-xs text-slate-500 dark:text-slate-300 xl:table-cell">{athlete.college?.name ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/85 dark:bg-[#1D428A]/20">
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
            <tbody className="divide-y divide-slate-200/60 dark:divide-[#1D428A]/35">
              {rows.map((athlete) => (
                <tr key={athlete.id} className="transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#1D428A]/20">
                  <td className="pl-4 px-3 py-3 font-mono text-xs text-slate-500">{athlete.jersey ?? "–"}</td>
                  <td className="px-3 py-3">
                    <Link href={`/players/${athlete.id}`} className="flex items-center gap-3 group">
                      {athlete.headshot ? (
                        <Image
                          src={athlete.headshot}
                          alt={athlete.displayName}
                          width={36} height={36}
                          className="shrink-0 rounded-full border border-slate-200/70 bg-slate-100 object-cover dark:border-[#1D428A]/40 dark:bg-slate-700"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500 dark:bg-slate-600 dark:text-slate-100">
                          {athlete.displayName.slice(0, 1)}
                        </div>
                      )}
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-semibold text-slate-900 transition-colors group-hover:text-[#1D428A] dark:text-white dark:group-hover:text-slate-100">
                          {athlete.fullName}
                        </span>
                        <AvailabilityBadge athlete={athlete} />
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-[#1D428A]/30 dark:text-white">
                      {athlete.position?.abbreviation ?? "–"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.gp ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.mpg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.ppg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.rpg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.apg ?? "–"}</td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-800 dark:text-slate-100">{athlete.stats?.fgPct ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
