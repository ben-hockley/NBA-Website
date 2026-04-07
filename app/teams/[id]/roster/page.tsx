import { fetchRoster, fetchTeamOverview } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import RosterTable from "../RosterTable";
import TeamPageHeader from "../TeamPageHeader";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamRosterPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  let athletes = null;
  let error: string | null = null;

  try {
    const [overview, roster] = await Promise.all([
      fetchTeamOverview(id),
      fetchRoster(id),
    ]);
    team = overview;
    athletes = roster.athletes;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load team roster.";
  }

  return (
    <div>
      {error && <ErrorMessage message={error} />}

      {team && athletes && (
        <>
          <TeamPageHeader
            team={team}
            activeTab="roster"
            subtitle={`${athletes.length} players on roster`}
          />
          <RosterTable athletes={athletes} />
        </>
      )}
    </div>
  );
}
