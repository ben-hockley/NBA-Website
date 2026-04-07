import { fetchRoster } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import RosterTable from "./RosterTable";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamRosterPage({ params }: Props) {
  const { id } = await params;
  let data = null;
  let error: string | null = null;

  try {
    data = await fetchRoster(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load roster.";
  }

  return (
    <div>
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-[#17408B] dark:hover:text-blue-400 mb-6 transition-colors"
      >
        ← Back to Teams
      </Link>

      {error && <ErrorMessage message={error} />}

      {data && (
        <>
          {/* Team Header */}
          <div
            className="rounded-2xl p-6 mb-8 flex items-center gap-5"
            style={{ backgroundColor: `#${data.team.color}20`, borderLeft: `4px solid #${data.team.color}` }}
          >
            {data.team.logo && (
              <Image
                src={data.team.logo}
                alt={data.team.abbreviation}
                width={80}
                height={80}
                className="object-contain"
                unoptimized
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.team.displayName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {data.athletes.length} players on roster
              </p>
            </div>
          </div>

          <RosterTable athletes={data.athletes} />
        </>
      )}
    </div>
  );
}
