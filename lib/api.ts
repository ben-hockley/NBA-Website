import type { Game, StandingsGroup, NBATeam, Athlete } from "./types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_V2_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba";

// ─── Scoreboard ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGame(event: any): Game {
  const competition = event.competitions?.[0];
  const competitors = (competition?.competitors ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any): import("./types").Competitor => ({
      id: c.id,
      homeAway: c.homeAway,
      score: c.score ?? "0",
      winner: c.winner,
      records: (c.records ?? []).map((r: { name: string; summary: string }) => ({
        name: r.name,
        summary: r.summary,
      })),
      team: {
        id: c.team.id,
        abbreviation: c.team.abbreviation,
        displayName: c.team.displayName,
        shortDisplayName: c.team.shortDisplayName,
        logo: c.team.logo ?? "",
        color: c.team.color ?? "000000",
        alternateColor: c.team.alternateColor ?? "ffffff",
      },
    })
  );

  return {
    id: event.id,
    date: event.date,
    name: event.name,
    status: {
      type: {
        id: competition?.status?.type?.id ?? "",
        name: competition?.status?.type?.name ?? "",
        state: competition?.status?.type?.state ?? "pre",
        completed: competition?.status?.type?.completed ?? false,
        description: competition?.status?.type?.description ?? "",
        detail: competition?.status?.type?.detail ?? "",
        shortDetail: competition?.status?.type?.shortDetail ?? "",
      },
      displayClock: competition?.status?.displayClock,
      period: competition?.status?.period,
    },
    competitors,
    venue: competition?.venue
      ? {
          fullName: competition.venue.fullName,
          address: {
            city: competition.venue.address?.city ?? "",
            state: competition.venue.address?.state ?? "",
          },
        }
      : undefined,
  };
}

export async function fetchScoreboard(date?: string): Promise<Game[]> {
  const url = date
    ? `${ESPN_BASE}/scoreboard?dates=${date}`
    : `${ESPN_BASE}/scoreboard`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Scoreboard fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.events ?? []).map(parseGame);
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function fetchStandings(): Promise<StandingsGroup[]> {
  const res = await fetch(`${ESPN_V2_BASE}/standings`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Standings fetch failed: ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = data.children ?? [];
  return children.map((conference) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries: any[] = conference.standings?.entries ?? [];
    const teams: StandingsGroup["teams"] = entries.map((entry) => {
      const stats: Record<string, string | number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry.stats ?? []).forEach((s: any) => {
        stats[s.name] = s.value;
      });

      return {
        id: entry.team?.id ?? "",
        name: entry.team?.displayName ?? "",
        abbreviation: entry.team?.abbreviation ?? "",
        logo: entry.team?.logos?.[0]?.href ?? "",
        record: {
          wins: Number(stats.wins ?? 0),
          losses: Number(stats.losses ?? 0),
          winPercent: Number(stats.winPercent ?? 0),
          gamesBehind: Number(stats.gamesBehind ?? 0),
          streak: String(stats.streak ?? ""),
        },
      };
    });

    return {
      name: conference.name ?? "Conference",
      teams,
    };
  });
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export async function fetchTeams(): Promise<NBATeam[]> {
  // Use the site API teams endpoint which has richer data including logos
  const siteRes = await fetch(`${ESPN_BASE}/teams?limit=50`, {
    next: { revalidate: 86400 },
  });
  if (!siteRes.ok) throw new Error(`Teams fetch failed: ${siteRes.status}`);
  const siteData = await siteRes.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sports: any[] = siteData.sports ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leagues: any[] = sports.flatMap((s: any) => s.leagues ?? []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams: any[] = leagues.flatMap((l: any) => l.teams ?? []);

  return teams.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any): NBATeam => ({
      id: t.team.id,
      displayName: t.team.displayName,
      abbreviation: t.team.abbreviation,
      logo: t.team.logos?.[0]?.href ?? "",
      color: t.team.color ?? "000000",
      alternateColor: t.team.alternateColor ?? "ffffff",
      location: t.team.location ?? "",
      name: t.team.name ?? "",
    })
  );
}

// ─── Roster ───────────────────────────────────────────────────────────────────

export async function fetchRoster(teamId: string): Promise<{ team: NBATeam; athletes: Athlete[] }> {
  const res = await fetch(`${ESPN_BASE}/teams/${teamId}/roster`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
  const data = await res.json();

  const teamData = data.team;
  const team: NBATeam = {
    id: teamData.id,
    displayName: teamData.displayName,
    abbreviation: teamData.abbreviation,
    logo: teamData.logos?.[0]?.href ?? "",
    color: teamData.color ?? "000000",
    alternateColor: teamData.alternateColor ?? "ffffff",
    location: teamData.location ?? "",
    name: teamData.name ?? "",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allAthletes: any[] = (data.athletes ?? []).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group: any) => group.items ?? []
  );

  const athletes: Athlete[] = allAthletes.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any): Athlete => ({
      id: a.id,
      fullName: a.fullName,
      displayName: a.displayName,
      jersey: a.jersey,
      position: a.position
        ? { abbreviation: a.position.abbreviation, displayName: a.position.displayName }
        : undefined,
      headshot: a.headshot?.href,
      height: a.displayHeight,
      weight: a.weight,
      age: a.age,
      experience: a.experience ? { years: a.experience.years } : undefined,
      college: a.college ? { name: a.college.name } : undefined,
    })
  );

  return { team, athletes };
}
