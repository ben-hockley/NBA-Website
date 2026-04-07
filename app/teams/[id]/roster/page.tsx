import { fetchRoster, fetchTeamOverview, fetchTeamTopSeasonContributors } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import RosterTable from "../RosterTable";
import TeamPageHeader from "../TeamPageHeader";
import type { TeamSeasonContributor } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamRosterPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  let athletes = null;
  let topContributors: TeamSeasonContributor[] = [];
  let error: string | null = null;

  try {
    const [overview, roster, contributors] = await Promise.all([
      fetchTeamOverview(id),
      fetchRoster(id),
      fetchTeamTopSeasonContributors(id, 3),
    ]);
    team = overview;
    athletes = roster.athletes;
    topContributors = contributors;
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
            topContributors={topContributors}
          />
          <RosterTable athletes={athletes} />
        </>
      )}
    </div>
  );
}
