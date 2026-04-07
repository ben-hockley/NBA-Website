import Image from "next/image";
import Link from "next/link";

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
}

const TABS: Array<{ key: Props["activeTab"]; label: string; href: (id: string) => string }> = [
  { key: "overview", label: "Overview", href: (id) => `/teams/${id}` },
  { key: "roster", label: "Roster", href: (id) => `/teams/${id}/roster` },
  { key: "results", label: "Recent Results", href: (id) => `/teams/${id}/results` },
];

export default function TeamPageHeader({ team, activeTab, subtitle }: Props) {
  return (
    <>
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 mb-5 transition-colors"
      >
        ← Back to Teams
      </Link>

      <div
        className="rounded-2xl p-6 mb-5 flex items-center gap-5"
        style={{ backgroundColor: `#${team.color || "17408B"}20`, borderLeft: `4px solid #${team.color || "17408B"}` }}
      >
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">
            {team.displayName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {subtitle ?? team.standingSummary ?? "Team Overview"}
          </p>
        </div>
      </div>

      <nav className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex items-center gap-2 sm:gap-3">
          {TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href(team.id)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? "border-[#17408B] text-[#17408B] dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
