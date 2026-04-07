import { unstable_noStore } from "next/cache";
import type {
  Game,
  GameDetail,
  GameStatus,
  StandingsGroup,
  NBATeam,
  TeamOverview,
  TeamRecentResult,
  Athlete,
  PlayerDetail,
  PlayerStats,
  StatCategory,
  StatLeaderEntry,
  Team,
} from "./types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_V2_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba";
const ESPN_COMMON_V3 = "https://site.api.espn.com/apis/common/v3/sports/basketball/nba";

// ─── Scoreboard ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGameStatus(status: any): GameStatus {
  const rawState = status?.type?.state;
  const state: GameStatus["type"]["state"] =
    rawState === "in" || rawState === "post" ? rawState : "pre";

  return {
    type: {
      id: status?.type?.id ?? "",
      name: status?.type?.name ?? "",
      state,
      completed: status?.type?.completed ?? false,
      description: status?.type?.description ?? "",
      detail: status?.type?.detail ?? "",
      shortDetail: status?.type?.shortDetail ?? "",
    },
    displayClock: status?.displayClock,
    period: status?.period,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSummaryTeam(team: any): Team {
  return {
    id: team?.id ?? "",
    abbreviation: team?.abbreviation ?? "",
    displayName: team?.displayName ?? team?.name ?? "",
    shortDisplayName: team?.shortDisplayName ?? team?.abbreviation ?? "",
    logo: team?.logo ?? team?.logos?.[0]?.href ?? "",
    color: team?.color ?? "000000",
    alternateColor: team?.alternateColor ?? "ffffff",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function coerceText(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value !== "object") return undefined;

  return value.displayValue ?? value.displayName ?? value.description ?? value.detail ?? value.name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInjuryDetail(details: any): string | undefined {
  const primitive = coerceText(details);
  if (primitive) return primitive;
  if (!details || typeof details !== "object") return undefined;

  const descriptor = [details.side, details.location, details.type, details.detail]
    .map((part) => coerceText(part))
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .trim();

  const fantasy =
    coerceText(details.fantasyStatus?.displayDescription) ??
    coerceText(details.fantasyStatus?.description) ??
    coerceText(details.fantasyStatus?.abbreviation);

  const base = descriptor || fantasy;
  if (!base) return undefined;

  const returnDate = coerceText(details.returnDate);
  return returnDate ? `${base} (Return: ${returnDate})` : base;
}

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
        logo: c.team.logo ?? c.team.logos?.[0]?.href ?? "",
        color: c.team.color ?? "000000",
        alternateColor: c.team.alternateColor ?? "ffffff",
      },
    })
  );

  return {
    id: event.id,
    date: event.date,
    name: event.name,
    status: parseGameStatus(competition?.status),
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

export async function fetchGameDetails(gameId: string): Promise<GameDetail> {
  unstable_noStore();

  const res = await fetch(`${ESPN_BASE}/summary?event=${gameId}`);
  if (!res.ok) throw new Error(`Game summary fetch failed: ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competition: any = data.header?.competitions?.[0];
  if (!competition) throw new Error("Game summary response missing competition data.");

  const competitors: GameDetail["competitors"] = (competition.competitors ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => ({
      id: c.id ?? "",
      homeAway: c.homeAway === "home" ? "home" : "away",
      winner: c.winner,
      score: c.score ?? "0",
      team: parseSummaryTeam(c.team),
      record: c.records?.[0]?.summary,
      linescores: (c.linescores ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (line: any) => ({
          value: line.displayValue ?? String(line.value ?? "0"),
        })
      ),
    })
  );

  const teamStats: GameDetail["teamStats"] = (data.boxscore?.teams ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (entry: any) => ({
      team: parseSummaryTeam(entry.team),
      statistics: (entry.statistics ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stat: any) => ({
          name: stat.name ?? "",
          label: stat.label ?? stat.displayName ?? stat.name ?? "",
          abbreviation: stat.abbreviation,
          displayValue: stat.displayValue ?? "–",
        })
      ),
    })
  );

  const boxscore: GameDetail["boxscore"] = (data.boxscore?.players ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (entry: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statGroup: any = entry.statistics?.[0] ?? {};
      const keys: string[] = statGroup.keys ?? [];
      const labels: string[] = statGroup.labels ?? [];
      const descriptions: string[] = statGroup.descriptions ?? [];

      return {
        team: parseSummaryTeam(entry.team),
        columns: keys.map((key, i) => ({
          key,
          label: labels[i] ?? key,
          description: descriptions[i] ?? labels[i] ?? key,
        })),
        players: (statGroup.athletes ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (player: any) => ({
            athleteId: player.athlete?.id ?? "",
            athleteName: player.athlete?.displayName ?? "Unknown",
            headshot: player.athlete?.headshot?.href,
            jersey: player.athlete?.jersey,
            position: player.athlete?.position?.abbreviation,
            starter: Boolean(player.starter),
            didNotPlay: Boolean(player.didNotPlay),
            reason: player.reason,
            ejected: Boolean(player.ejected),
            stats: (player.stats ?? []).map((value: unknown) => String(value ?? "")),
          })
        ),
      };
    }
  );

  const leaders: GameDetail["leaders"] = (data.leaders ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (teamLeader: any) => ({
      team: parseSummaryTeam(teamLeader.team),
      categories: (teamLeader.leaders ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (category: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const topLeader: any = category.leaders?.[0];
          return {
            name: category.name ?? "",
            displayName: category.displayName ?? category.name ?? "",
            leader: topLeader
              ? {
                  athleteId: topLeader.athlete?.id ?? "",
                  athleteName: topLeader.athlete?.displayName ?? "Unknown",
                  headshot: topLeader.athlete?.headshot?.href,
                  position: topLeader.athlete?.position?.abbreviation,
                  displayValue: topLeader.displayValue ?? topLeader.mainStat?.value ?? "–",
                  summary: topLeader.summary,
                  mainStatLabel: topLeader.mainStat?.label,
                }
              : undefined,
          };
        }
      ),
    })
  );

  const injuries: GameDetail["injuries"] = (data.injuries ?? []).flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (injuryGroup: any) => {
      const team = parseSummaryTeam(injuryGroup.team);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamInjuries: any[] = injuryGroup.injuries ?? [];
      return teamInjuries.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (injury: any) => ({
          team,
          athleteName: injury.athlete?.displayName ?? "Unknown",
          status: coerceText(injury.status) ?? coerceText(injury.type?.description) ?? coerceText(injury.type?.abbreviation),
          detail: parseInjuryDetail(injury.details),
        })
      );
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const officials: string[] = (data.gameInfo?.officials ?? []).map((official: any) =>
    official.displayName ?? official.fullName ?? ""
  ).filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broadcasts: string[] = (data.broadcasts ?? []).map((broadcast: any) =>
    broadcast.names?.[0] ?? broadcast.media?.shortName ?? ""
  ).filter(Boolean);

  return {
    id: competition.id ?? gameId,
    date: competition.date ?? data.header?.season?.year?.toString() ?? "",
    name: competition.name ?? data.header?.shortName ?? "Game Summary",
    status: parseGameStatus(competition.status),
    competitors,
    venue: competition.venue
      ? {
          fullName: competition.venue.fullName ?? "",
          address: {
            city: competition.venue.address?.city ?? "",
            state: competition.venue.address?.state ?? "",
          },
        }
      : undefined,
    attendance: typeof data.gameInfo?.attendance === "number" ? data.gameInfo.attendance : undefined,
    officials,
    broadcasts,
    odds: data.odds?.[0]
      ? {
          details: data.odds[0].details ?? data.odds[0].displayValue,
          overUnder: data.odds[0].overUnder?.toString(),
        }
      : undefined,
    teamStats,
    boxscore,
    leaders,
    injuries,
  };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSiteTeam(teamData: any): NBATeam {
  return {
    id: teamData?.id ?? "",
    displayName: teamData?.displayName ?? "",
    abbreviation: teamData?.abbreviation ?? "",
    logo: teamData?.logo ?? teamData?.logos?.[0]?.href ?? "",
    color: teamData?.color ?? "000000",
    alternateColor: teamData?.alternateColor ?? "ffffff",
    location: teamData?.location ?? "",
    name: teamData?.name ?? "",
  };
}

function formatStreak(streakValue: number | undefined): string | undefined {
  if (typeof streakValue !== "number" || streakValue === 0) return undefined;
  return `${streakValue > 0 ? "W" : "L"}${Math.abs(streakValue)}`;
}

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
    (t: any): NBATeam => parseSiteTeam(t.team)
  );
}

export async function fetchTeamOverview(teamId: string): Promise<TeamOverview> {
  unstable_noStore();

  const res = await fetch(`${ESPN_BASE}/teams/${teamId}`);
  if (!res.ok) throw new Error(`Team overview fetch failed: ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamData: any = data.team;
  if (!teamData) throw new Error("Team overview response missing team data.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordItems: any[] = teamData.record?.items ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overallRecord: any = recordItems.find((item: any) => item.type === "total") ?? recordItems[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeRecord: any = recordItems.find((item: any) => item.type === "home");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayRecord: any = recordItems.find((item: any) => item.type === "road");

  const overallStats = new Map<string, number>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (overallRecord?.stats ?? []).map((stat: any) => [stat.name, Number(stat.value)])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextEvent: any = teamData.nextEvent?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextCompetition: any = nextEvent?.competitions?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextTeamCompetitor: any = nextCompetition?.competitors?.find((c: any) => c.team?.id === teamId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextOpponent: any = nextCompetition?.competitors?.find((c: any) => c.team?.id !== teamId);

  const venue = teamData.franchise?.venue;

  return {
    ...parseSiteTeam(teamData),
    shortDisplayName: teamData.shortDisplayName ?? teamData.displayName ?? "",
    standingSummary: teamData.standingSummary,
    record: {
      overall: overallRecord?.summary,
      home: homeRecord?.summary,
      away: awayRecord?.summary,
      wins: overallStats.get("wins"),
      losses: overallStats.get("losses"),
      winPercent: overallStats.get("winPercent"),
      gamesBehind: overallStats.get("gamesBehind"),
      pointDifferential: overallStats.get("pointDifferential") ?? overallStats.get("differential"),
      streak: formatStreak(overallStats.get("streak")),
    },
    venue: venue
      ? {
          fullName: venue.fullName ?? "",
          city: venue.address?.city,
          state: venue.address?.state,
          image: venue.images?.[0]?.href,
        }
      : undefined,
    nextGame: nextCompetition && nextOpponent
      ? {
          gameId: nextEvent.id ?? nextCompetition.id ?? "",
          date: nextEvent.date ?? nextCompetition.date ?? "",
          homeAway: nextTeamCompetitor?.homeAway === "home" ? "home" : "away",
          opponent: {
            id: nextOpponent.team?.id ?? "",
            displayName: nextOpponent.team?.displayName ?? "",
            abbreviation: nextOpponent.team?.abbreviation ?? "",
            logo: nextOpponent.team?.logo ?? nextOpponent.team?.logos?.[0]?.href ?? "",
          },
          venue: nextCompetition.venue
            ? {
                fullName: nextCompetition.venue.fullName ?? "",
                city: nextCompetition.venue.address?.city,
                state: nextCompetition.venue.address?.state,
              }
            : undefined,
        }
      : undefined,
  };
}

export async function fetchTeamRecentResults(teamId: string, limit = 10): Promise<TeamRecentResult[]> {
  unstable_noStore();

  const res = await fetch(`${ESPN_BASE}/teams/${teamId}/schedule`);
  if (!res.ok) throw new Error(`Team schedule fetch failed: ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = data.events ?? [];
  return events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((event: any): TeamRecentResult | null => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const competition: any = event.competitions?.[0];
      if (!competition) return null;

      const state = competition.status?.type?.state;
      if (state !== "post") return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamCompetitor: any = competition.competitors?.find((c: any) => c.team?.id === teamId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opponentCompetitor: any = competition.competitors?.find((c: any) => c.team?.id !== teamId);
      if (!teamCompetitor || !opponentCompetitor) return null;

      return {
        gameId: event.id ?? competition.id ?? "",
        date: event.date ?? competition.date ?? "",
        statusText: coerceText(competition.status?.type?.shortDetail) ?? coerceText(competition.status?.type?.description) ?? "Final",
        homeAway: teamCompetitor.homeAway === "home" ? "home" : "away",
        won: Boolean(teamCompetitor.winner),
        teamScore: coerceText(teamCompetitor.score) ?? "0",
        opponentScore: coerceText(opponentCompetitor.score) ?? "0",
        opponent: {
          id: opponentCompetitor.team?.id ?? "",
          displayName: opponentCompetitor.team?.displayName ?? "",
          abbreviation: opponentCompetitor.team?.abbreviation ?? "",
          logo: opponentCompetitor.team?.logo ?? opponentCompetitor.team?.logos?.[0]?.href ?? "",
        },
        venue: competition.venue
          ? {
              fullName: competition.venue.fullName ?? "",
              city: competition.venue.address?.city,
              state: competition.venue.address?.state,
            }
          : undefined,
      };
    })
    .filter((game): game is TeamRecentResult => game !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// ─── Roster ───────────────────────────────────────────────────────────────────

export async function fetchRoster(teamId: string): Promise<{ team: NBATeam; athletes: Athlete[] }> {
  unstable_noStore();

  const res = await fetch(`${ESPN_BASE}/teams/${teamId}/roster`);
  if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
  const data = await res.json();

  if (!data.team) throw new Error("Roster response missing team data");

  const teamData = data.team;
  const team: NBATeam = {
    id: teamData.id,
    displayName: teamData.displayName,
    abbreviation: teamData.abbreviation,
    // roster endpoint returns logo as a direct string, not an array
    logo: teamData.logo ?? teamData.logos?.[0]?.href ?? "",
    color: teamData.color ?? "000000",
    alternateColor: teamData.alternateColor ?? "ffffff",
    location: teamData.location ?? "",
    name: teamData.name ?? "",
  };

  // roster endpoint returns athletes as a flat array (not grouped with items)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allAthletes: any[] = data.athletes ?? [];

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
      birthDate: a.dateOfBirth ?? undefined,
      birthPlace: a.birthPlace
        ? { city: a.birthPlace.city, state: a.birthPlace.state, country: a.birthPlace.country }
        : undefined,
      hand: a.hand?.type ?? undefined,
    })
  );

  // Batch-fetch per-player overview stats (cached 24h); failures silently skip.
  // The overview endpoint includes GP/MPG plus per-game averages in one split.
  const statsResults = await Promise.allSettled(
    athletes.map((athlete) =>
      fetch(`${ESPN_COMMON_V3}/athletes/${athlete.id}/overview`, { next: { revalidate: 86400 } })
        .then((r) => (r.ok ? r.json() : null))
    )
  );

  statsResults.forEach((result, i) => {
    if (result.status !== "fulfilled" || !result.value) return;
    const statistics: { names?: string[]; splits?: { displayName?: string; stats?: string[] }[] } | undefined = result.value.statistics;
    const statNames = statistics?.names ?? [];
    const regularSplit = (statistics?.splits ?? []).find((s) => /regular/i.test(s.displayName ?? ""));
    if (!regularSplit || !statNames.length) return;

    const splitStats = extractStatsFromSplit(statNames, regularSplit.stats ?? []);
    athletes[i].stats = {
      gp: splitStats.gamesPlayed,
      mpg: splitStats.avgMinutes,
      ppg: splitStats.avgPoints,
      rpg: splitStats.avgRebounds,
      apg: splitStats.avgAssists,
      fgPct: splitStats.fieldGoalPct,
    };
  });

  return { team, athletes };
}

// ─── Stat Leaders ─────────────────────────────────────────────────────────────

// Endpoint: site.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete
// Sort keys and category/index positions verified against 2025-26 season data.
// catIdx: 0=general, 1=offensive, 2=defensive within the athlete's `categories` array.
// Totals indexes verified: off[12]=PTS, gen[9]=REB, off[19]=AST, off[15]=3PM,
//   dfs[2]=STL, dfs[3]=BLK, off[13/14]=FGM/FGA, off[17/18]=FTM/FTA
interface StatSlot {
  sortKey: string;
  catIdx: number;
  valIdx: number;
  fmt: (v: string) => string;
  madeIdx?: number;
  attIdx?: number;
}
interface StatCfg {
  key: string;
  displayName: string;
  shortName: string;
  totalShortName: string;
  pg: StatSlot;
  tot: StatSlot;
}

const STAT_CONFIG: StatCfg[] = [
  {
    key: "pts",  displayName: "Points",     shortName: "PTS", totalShortName: "PTS",
    pg:  { sortKey: "offensive.avgPoints",                   catIdx: 1, valIdx: 0,  fmt: (v) => v },
    tot: { sortKey: "offensive.points",                      catIdx: 1, valIdx: 12, fmt: (v) => v },
  },
  {
    key: "reb",  displayName: "Rebounds",   shortName: "REB", totalShortName: "REB",
    pg:  { sortKey: "general.avgRebounds",                   catIdx: 0, valIdx: 11, fmt: (v) => v },
    tot: { sortKey: "general.rebounds",                      catIdx: 0, valIdx: 9,  fmt: (v) => v },
  },
  {
    key: "ast",  displayName: "Assists",    shortName: "AST", totalShortName: "AST",
    pg:  { sortKey: "offensive.avgAssists",                  catIdx: 1, valIdx: 10, fmt: (v) => v },
    tot: { sortKey: "offensive.assists",                     catIdx: 1, valIdx: 19, fmt: (v) => v },
  },
  {
    key: "3pm",  displayName: "3-Pointers", shortName: "3PM", totalShortName: "3PM",
    pg:  { sortKey: "offensive.avgThreePointFieldGoalsMade", catIdx: 1, valIdx: 4,  fmt: (v) => v },
    tot: { sortKey: "offensive.threePointFieldGoalsMade",    catIdx: 1, valIdx: 15, fmt: (v) => v },
  },
  {
    key: "stl",  displayName: "Steals",     shortName: "STL", totalShortName: "STL",
    pg:  { sortKey: "defensive.avgSteals",                   catIdx: 2, valIdx: 0,  fmt: (v) => v },
    tot: { sortKey: "defensive.steals",                      catIdx: 2, valIdx: 2,  fmt: (v) => v },
  },
  {
    key: "blk",  displayName: "Blocks",     shortName: "BLK", totalShortName: "BLK",
    pg:  { sortKey: "defensive.avgBlocks",                   catIdx: 2, valIdx: 1,  fmt: (v) => v },
    tot: { sortKey: "defensive.blocks",                      catIdx: 2, valIdx: 3,  fmt: (v) => v },
  },
  {
    key: "fgp",  displayName: "FG%",        shortName: "FG%", totalShortName: "FGM/FGA",
    pg:  { sortKey: "offensive.fieldGoalPct",  catIdx: 1, valIdx: 3, fmt: (v) => `${v}%` },
    tot: { sortKey: "offensive.fieldGoalPct",  catIdx: 1, valIdx: 3, fmt: (v) => `${v}%`, madeIdx: 13, attIdx: 14 },
  },
  {
    key: "ftp",  displayName: "FT%",        shortName: "FT%", totalShortName: "FTM/FTA",
    pg:  { sortKey: "offensive.freeThrowPct",  catIdx: 1, valIdx: 9, fmt: (v) => `${v}%` },
    tot: { sortKey: "offensive.freeThrowPct",  catIdx: 1, valIdx: 9, fmt: (v) => `${v}%`, madeIdx: 17, attIdx: 18 },
  },
];

const BY_ATHLETE_BASE = "https://site.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLeaders(athletes: any[], slot: StatSlot, isTotals: boolean): StatLeaderEntry[] {
  return athletes.map((entry, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a: any = entry.athlete ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cats: any[] = entry.categories ?? [];
    const catTotals: string[] = cats[slot.catIdx]?.totals ?? [];

    let value: string;
    if (isTotals && slot.madeIdx !== undefined && slot.attIdx !== undefined) {
      const made = catTotals[slot.madeIdx] ?? "–";
      const att  = catTotals[slot.attIdx]  ?? "–";
      value = `${made}/${att}`;
    } else {
      value = slot.fmt(catTotals[slot.valIdx] ?? "–");
    }

    const teamLogos: { href: string }[] = a.teamLogos ?? [];

    return {
      rank: idx + 1,
      playerId: a.id ?? "",
      playerName: a.displayName ?? "Unknown",
      headshot: a.headshot?.href,
      teamAbbreviation: a.teamShortName ?? "",
      teamLogo: teamLogos[0]?.href ?? "",
      teamColor: "17408B",
      value,
    };
  });
}

export async function fetchStatLeaders(): Promise<StatCategory[]> {
  // Fetch per-game and totals leaders in parallel (16 requests, all cached 1hr)
  const [pgResults, totResults] = await Promise.all([
    Promise.allSettled(
      STAT_CONFIG.map((cfg) =>
        fetch(`${BY_ATHLETE_BASE}?season=2026&seasontype=2&limit=10&sort=${cfg.pg.sortKey}:desc`, { next: { revalidate: 3600 } })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
      )
    ),
    Promise.allSettled(
      STAT_CONFIG.map((cfg) =>
        fetch(`${BY_ATHLETE_BASE}?season=2026&seasontype=2&limit=10&sort=${cfg.tot.sortKey}:desc`, { next: { revalidate: 3600 } })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
      )
    ),
  ]);

  return STAT_CONFIG.map((cfg, i) => {
    const pgResult  = pgResults[i];
    const totResult = totResults[i];

    const leaders      = pgResult.status  === "fulfilled" ? parseLeaders(pgResult.value.athletes  ?? [], cfg.pg,  false) : [];
    const totalLeaders = totResult.status === "fulfilled" ? parseLeaders(totResult.value.athletes ?? [], cfg.tot,  true) : [];

    return {
      key: cfg.key,
      displayName: cfg.displayName,
      shortName: cfg.shortName,
      totalShortName: cfg.totalShortName,
      leaders,
      totalLeaders,
    };
  });
}

// ─── Player Detail ─────────────────────────────────────────────────────────────

// Build a PlayerStats map from the overview endpoint's statistics block.
// statistics.names is a string[] of stat keys; statistics.splits is an array of
// { displayName: string, stats: string[] } where stats align positionally with names.
function extractStatsFromSplit(names: string[], values: string[]): PlayerStats {
  const m: Record<string, string> = {};
  names.forEach((name, i) => { m[name] = values[i] ?? "–"; });
  return {
    gamesPlayed:   m.gamesPlayed   ?? "–",
    avgMinutes:    m.avgMinutes    ?? "–",
    avgPoints:     m.avgPoints     ?? "–",
    avgRebounds:   m.avgRebounds   ?? "–",
    avgAssists:    m.avgAssists    ?? "–",
    avgBlocks:     m.avgBlocks     ?? "–",
    avgSteals:     m.avgSteals     ?? "–",
    avgTurnovers:  m.avgTurnovers  ?? "–",
    avgFouls:      m.avgFouls      ?? "–",
    fieldGoalPct:  m.fieldGoalPct  ?? "–",
    threePointPct: m.threePointPct ?? "–",
    freeThrowPct:  m.freeThrowPct  ?? "–",
  };
}

function formatTeamSlug(slug: string): string {
  if (!slug) return "Unknown Team";
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export async function fetchPlayerDetails(playerId: string): Promise<PlayerDetail> {
  unstable_noStore();

  // Fetch bio, overview stats, and season-by-season splits.
  const [bioRes, overviewRes, statsRes] = await Promise.all([
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}`),
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}/overview`),
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}/stats`),
  ]);
  if (!bioRes.ok) throw new Error(`Player bio fetch failed: ${bioRes.status}`);
  const bioData = await bioRes.json();
  const overviewData = overviewRes.ok ? await overviewRes.json() : {};
  const statsData = statsRes.ok ? await statsRes.json() : {};

  const a = bioData.athlete;
  if (!a) throw new Error("Player data not found");

  // Full stats: statistics.names (string[]) + statistics.splits ([{displayName, stats: string[]}])
  const statNames: string[] = overviewData.statistics?.names ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const splits: any[] = overviewData.statistics?.splits ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regularSplit = splits.find((s: any) => /regular/i.test(s.displayName ?? ""));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const careerSplit  = splits.find((s: any) => /career/i.test(s.displayName ?? ""));

  // /stats endpoint gives season-by-season rows per category with team references.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamsBySlug: Record<string, any> = statsData.teams ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamValues: any[] = Object.values(teamsBySlug);

  const seasonHistory: PlayerDetail["seasonHistory"] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (statsData.categories ?? []).map((category: any) => {
      const labels: string[] = category.labels ?? [];

      const rows =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (category.statistics ?? []).map((row: any) => {
          const teamSlug: string = row.teamSlug ?? "";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const teamMeta: any = teamSlug
            ? teamsBySlug[teamSlug]
            : teamValues.find((team) => team.id === row.teamId);

          return {
            seasonYear: Number(row.season?.year ?? 0),
            seasonLabel: row.season?.displayName ?? String(row.season?.year ?? "Unknown"),
            playerName: a.fullName ?? a.displayName ?? "Unknown",
            team: {
              id: teamMeta?.id ?? row.teamId ?? "",
              abbreviation: teamMeta?.abbreviation ?? "N/A",
              displayName: teamMeta?.displayName ?? formatTeamSlug(teamSlug),
              logo: teamMeta?.logos?.[0]?.href ?? teamMeta?.logo ?? "",
            },
            position: row.position,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stats: (row.stats ?? []).map((value: any) => String(value ?? "–")),
          };
        })
        .sort((left, right) => {
          if (right.seasonYear !== left.seasonYear) return right.seasonYear - left.seasonYear;
          return left.team.displayName.localeCompare(right.team.displayName);
        });

      return {
        key: category.name ?? category.displayName ?? "history",
        displayName: category.displayName ?? category.name ?? "Season Stats",
        labels,
        rows,
      };
    }).filter((category: { labels: string[]; rows: unknown[] }) => category.labels.length > 0 && category.rows.length > 0);

  return {
    id: a.id,
    fullName: a.fullName,
    displayName: a.displayName,
    headshot: a.headshot?.href,
    jersey: a.jersey,
    position: a.position
      ? { abbreviation: a.position.abbreviation, displayName: a.position.displayName }
      : undefined,
    height: a.displayHeight,
    weight: a.displayWeight,
    age: a.age,
    experience: a.displayExperience ? { display: a.displayExperience } : undefined,
    college: a.college ? { name: a.college.name } : undefined,
    birthDate: a.displayDOB ?? undefined,
    birthPlace: a.displayBirthPlace ? { display: a.displayBirthPlace } : undefined,
    draft: a.displayDraft ?? undefined,
    hand: a.hand?.type,
    team: a.team
      ? {
          id: a.team.id,
          displayName: a.team.displayName,
          abbreviation: a.team.abbreviation,
          logo: a.team.logos?.[0]?.href ?? "",
          color: a.team.color ?? "000000",
        }
      : undefined,
    regularSeasonStats: regularSplit && statNames.length
      ? extractStatsFromSplit(statNames, regularSplit.stats ?? [])
      : undefined,
    careerStats: careerSplit && statNames.length
      ? extractStatsFromSplit(statNames, careerSplit.stats ?? [])
      : undefined,
    seasonHistory,
    news: (overviewData.news ?? []).slice(0, 3).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (n: any) => ({
        headline: n.headline ?? "",
        description: n.description ?? "",
        url: n.links?.web?.href ?? "",
        imageUrl: n.images?.[0]?.url,
      })
    ),
  };
}
