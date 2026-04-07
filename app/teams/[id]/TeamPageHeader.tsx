import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TeamSeasonContributor } from "@/lib/types";

interface TeamHeaderData {
  id: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  standingSummary?: string;
}

interface Props {
  team: TeamHeaderData;
  activeTab: "overview" | "roster" | "results";
  subtitle?: string;
  topContributors?: TeamSeasonContributor[];
}

const TABS: Array<{ key: Props["activeTab"]; label: string; href: (id: string) => string }> = [
  { key: "overview", label: "Overview", href: (id) => `/teams/${id}` },
  { key: "roster", label: "Roster", href: (id) => `/teams/${id}/roster` },
  { key: "results", label: "Recent Results", href: (id) => `/teams/${id}/results` },
];

function formatAverage(value: number): string {
  return value.toFixed(1);
}

export default function TeamPageHeader({ team, activeTab, subtitle, topContributors = [] }: Props) {
  return (
    <>
      <Link
        href="/teams"
        className="mb-4 inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-all duration-200 hover:scale-[1.02] hover:border-[#1D428A] hover:text-[#1D428A] dark:border-[#1D428A]/45 dark:bg-slate-900/75 dark:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Teams
      </Link>

      <div
        className="mb-4 rounded-3xl border border-slate-200/60 bg-white/75 p-6 backdrop-blur-xl dark:border-[#1D428A]/45 dark:bg-slate-900/75"
        style={{
          backgroundImage: `linear-gradient(120deg, #${team.color || "1D428A"}20, transparent 45%)`,
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            {team.logo && (
              <Image
                src={team.logo}
                alt={team.abbreviation}
                width={84}
                height={84}
                className="object-contain"
                unoptimized
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {team.displayName}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {subtitle ?? team.standingSummary ?? "Team Overview"}
              </p>
            </div>
          </div>

          {topContributors.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[420px] xl:max-w-[540px]">
              {topContributors.slice(0, 3).map((contributor) => (
                <div
                  key={contributor.athleteId}
                  className="rounded-xl border border-slate-200/60 bg-slate-50/80 p-2 dark:border-[#1D428A]/40 dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    {contributor.headshot ? (
                      <Image
                        src={contributor.headshot}
                        alt={contributor.athleteName}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        {contributor.athleteName.slice(0, 1)}
                      </div>
                    )}
                    <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {contributor.athleteName}
                    </p>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-300">
                    {contributor.position ?? "N/A"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-200">
                    {formatAverage(contributor.ppg)} PPG · {formatAverage(contributor.rpg)} RPG · {formatAverage(contributor.apg)} APG
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="mb-6 border-b border-slate-200/70 dark:border-[#1D428A]/45">
        <ul className="flex items-center gap-2 sm:gap-3">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href(team.id)}
                  className={`inline-flex items-center border-b-4 -mb-px px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "border-[#1D428A] text-[#1D428A] dark:border-white dark:text-white"
                      : "border-transparent text-slate-500 hover:text-[#1D428A] dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
