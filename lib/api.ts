import { unstable_noStore } from "next/cache";
import type {
  Game,
  GameTopContributor,
  GameDetail,
  GameStatus,
  StandingsGroup,
  NBATeam,
  TeamOverview,
  TeamGameTopContributor,
  TeamRecentResult,
  TeamSeasonContributor,
  Athlete,
  PlayerDetail,
  PlayerStats,
  StatCategory,
  StatLeaderEntry,
  DraftProspect,
  DraftResult,
  DraftTeam,
  Team,
} from "./types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const ESPN_V2_BASE = "https://site.api.espn.com/apis/v2/sports/basketball/nba";
const ESPN_COMMON_V3 = "https://site.api.espn.com/apis/common/v3/sports/basketball/nba";
const ESPN_CORE_BASE = "https://sports.core.api.espn.com/v2";

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

function extractIdFromRef(ref?: string): string {
  if (!ref) return "";
  const match = ref.match(/\/(\d+)(?:\?|$)/);
  return match?.[1] ?? "";
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  argentina: "AR",
  australia: "AU",
  austria: "AT",
  bahamas: "BS",
  belgium: "BE",
  bosnia: "BA",
  "bosnia and herzegovina": "BA",
  brazil: "BR",
  cameroon: "CM",
  canada: "CA",
  china: "CN",
  congo: "CG",
  croatia: "HR",
  czechia: "CZ",
  "czech republic": "CZ",
  denmark: "DK",
  egypt: "EG",
  estonia: "EE",
  finland: "FI",
  france: "FR",
  georgia: "GE",
  germany: "DE",
  greece: "GR",
  hungary: "HU",
  iceland: "IS",
  iran: "IR",
  ireland: "IE",
  israel: "IL",
  italy: "IT",
  japan: "JP",
  latvia: "LV",
  lithuania: "LT",
  mali: "ML",
  mexico: "MX",
  montenegro: "ME",
  netherlands: "NL",
  "new zealand": "NZ",
  nigeria: "NG",
  norway: "NO",
  philippines: "PH",
  poland: "PL",
  portugal: "PT",
  russia: "RU",
  senegal: "SN",
  serbia: "RS",
  slovenia: "SI",
  "south korea": "KR",
  "south sudan": "SS",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  taiwan: "TW",
  tunisia: "TN",
  turkey: "TR",
  ukraine: "UA",
  "united kingdom": "GB",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  uruguay: "UY",
  venezuela: "VE",
};

const CITY_TO_COUNTRY: Record<string, string> = {
  melbourne: "Australia",
};

function normalizeCountryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCountryCode(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeCountryName(value);
  return COUNTRY_NAME_TO_CODE[normalized];
}

function inferCountryFromTeamMeta(location?: string, displayName?: string): string | undefined {
  if (location && getCountryCode(location)) return location;

  if (location) {
    const cityCountry = CITY_TO_COUNTRY[normalizeCountryName(location)];
    if (cityCountry) return cityCountry;
  }

  if (displayName) {
    const normalizedDisplayName = normalizeCountryName(displayName);
    const countryName = Object.keys(COUNTRY_NAME_TO_CODE).find((country) =>
      normalizedDisplayName.includes(country)
    );
    if (countryName) {
      return countryName
        .split(" ")
        .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
        .join(" ");
    }
  }

  return undefined;
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

function parseStatNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatToken(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function findBoxScoreStatIndex(
  columns: Array<{ key?: string; label?: string }>,
  aliases: string[]
): number {
  const aliasSet = new Set(aliases.map((alias) => normalizeStatToken(alias)));
  return columns.findIndex((column) => {
    const key = normalizeStatToken(column.key);
    const label = normalizeStatToken(column.label);
    return aliasSet.has(key) || aliasSet.has(label);
  });
}

function isBetterContributor(candidate: GameTopContributor, current: GameTopContributor | undefined): boolean {
  if (!current) return true;
  if (candidate.impact !== current.impact) return candidate.impact > current.impact;
  if (candidate.points !== current.points) return candidate.points > current.points;
  if (candidate.rebounds !== current.rebounds) return candidate.rebounds > current.rebounds;
  if (candidate.assists !== current.assists) return candidate.assists > current.assists;
  return candidate.athleteName.localeCompare(current.athleteName) < 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTeamTopContributorFromSummary(entry: any): { teamId: string; contributor?: GameTopContributor } | null {
  const teamId = String(entry?.team?.id ?? "");
  if (!teamId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statGroup: any = entry?.statistics?.[0] ?? {};
  const keys: string[] = statGroup.keys ?? [];
  const labels: string[] = statGroup.labels ?? [];
  const columns = keys.map((key, index) => ({ key, label: labels[index] ?? key }));

  const pointsIndex = findBoxScoreStatIndex(columns, ["pts", "points"]);
  const reboundsIndex = findBoxScoreStatIndex(columns, ["reb", "rebs", "rebounds"]);
  const assistsIndex = findBoxScoreStatIndex(columns, ["ast", "assists"]);

  let bestContributor: GameTopContributor | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const athletes: any[] = statGroup.athletes ?? [];
  athletes.forEach((player) => {
    if (player?.didNotPlay) return;

    const stats: unknown[] = Array.isArray(player?.stats) ? player.stats : [];
    const points = pointsIndex >= 0 ? parseStatNumber(stats[pointsIndex]) : 0;
    const rebounds = reboundsIndex >= 0 ? parseStatNumber(stats[reboundsIndex]) : 0;
    const assists = assistsIndex >= 0 ? parseStatNumber(stats[assistsIndex]) : 0;
    const impact = points + rebounds + assists;

    const athleteName = player?.athlete?.displayName ?? "Unknown";
    const candidate: GameTopContributor = {
      athleteId: String(player?.athlete?.id ?? ""),
      athleteName,
      headshot: player?.athlete?.headshot?.href,
      position: player?.athlete?.position?.abbreviation,
      points,
      rebounds,
      assists,
      impact,
    };

    if (isBetterContributor(candidate, bestContributor)) {
      bestContributor = candidate;
    }
  });

  return {
    teamId,
    contributor: bestContributor,
  };
}

async function fetchGameTopContributors(gameId: string): Promise<Record<string, GameTopContributor>> {
  const res = await fetch(`${ESPN_BASE}/summary?event=${gameId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Game summary fetch failed: ${res.status}`);

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams: any[] = data.boxscore?.players ?? [];

  const contributorsByTeam: Record<string, GameTopContributor> = {};
  teams.forEach((entry) => {
    const parsed = extractTeamTopContributorFromSummary(entry);
    if (!parsed?.contributor) return;
    contributorsByTeam[parsed.teamId] = parsed.contributor;
  });

  return contributorsByTeam;
}

function mapTopContributorsToCompetitors(
  competitors: Game["competitors"],
  contributorsByTeam: Record<string, GameTopContributor>
): TeamGameTopContributor[] | undefined {
  const topContributors = competitors
    .map((competitor) => ({
      teamId: competitor.team.id,
      contributor: contributorsByTeam[competitor.team.id],
    }))
    .filter((entry) => Boolean(entry.contributor));

  return topContributors.length ? topContributors : undefined;
}

export async function fetchScoreboard(date?: string): Promise<Game[]> {
  const url = date
    ? `${ESPN_BASE}/scoreboard?dates=${date}`
    : `${ESPN_BASE}/scoreboard`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Scoreboard fetch failed: ${res.status}`);
  const data = await res.json();

  const games: Game[] = (data.events ?? []).map(parseGame);
  const playedGames = games.filter((game) => {
    const state = game.status.type.state;
    return state === "in" || state === "post";
  });

  const contributorResults = await Promise.allSettled(
    playedGames.map((game) => fetchGameTopContributors(game.id))
  );

  const contributorsByGameId = new Map<string, Record<string, GameTopContributor>>();
  contributorResults.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    contributorsByGameId.set(playedGames[index].id, result.value);
  });

  return games.map((game) => {
    const contributorsByTeam = contributorsByGameId.get(game.id);
    if (!contributorsByTeam) return game;

    const topContributors = mapTopContributorsToCompetitors(game.competitors, contributorsByTeam);
    return topContributors ? { ...game, topContributors } : game;
  });
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
  const completedGames = events
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

  const contributorResults = await Promise.allSettled(
    completedGames.map((game) => fetchGameTopContributors(game.gameId))
  );

  return completedGames.map((game, index) => {
    const contributorResult = contributorResults[index];
    if (contributorResult.status !== "fulfilled") return game;

    const topContributors: TeamGameTopContributor[] = [
      { teamId, contributor: contributorResult.value[teamId] },
      { teamId: game.opponent.id, contributor: contributorResult.value[game.opponent.id] },
    ].filter((entry) => Boolean(entry.contributor));

    return topContributors.length ? { ...game, topContributors } : game;
  });
}

export async function fetchTeamSeasonContributorLeaders(limitPerTeam = 3): Promise<Record<string, TeamSeasonContributor[]>> {
  const pageLimit = 100;
  const baseUrl = `${BY_ATHLETE_BASE}?season=2026&seasontype=2&limit=${pageLimit}&sort=offensive.avgPoints:desc`;

  const res = await fetch(baseUrl, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Team contributor fetch failed: ${res.status}`);

  const data = await res.json();
  const totalPages = Number(data.pagination?.pages ?? 1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allAthletes: any[] = [...(data.athletes ?? [])];

  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    const pageResults = await Promise.allSettled(
      remainingPages.map((page) =>
        fetch(`${baseUrl}&page=${page}`, { next: { revalidate: 3600 } }).then((response) => {
          if (!response.ok) {
            throw new Error(`Team contributor page fetch failed: ${response.status}`);
          }
          return response.json();
        })
      )
    );

    pageResults.forEach((pageResult) => {
      if (pageResult.status !== "fulfilled") return;
      allAthletes.push(...(pageResult.value.athletes ?? []));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const athletes: any[] = allAthletes;

  const byTeam = new Map<string, TeamSeasonContributor[]>();

  athletes.forEach((entry) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const athlete: any = entry?.athlete ?? {};
    const teamId = String(athlete.teamId ?? "");
    if (!teamId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories: any[] = entry?.categories ?? [];
    const generalTotals: unknown[] = categories[0]?.totals ?? [];
    const offensiveTotals: unknown[] = categories[1]?.totals ?? [];

    const gamesPlayed = parseStatNumber(generalTotals[0]);
    if (gamesPlayed <= 10) return;

    const ppg = parseStatNumber(offensiveTotals[0]);
    const rpg = parseStatNumber(generalTotals[11]);
    const apg = parseStatNumber(offensiveTotals[10]);
    const impact = ppg + rpg + apg;

    const contributor: TeamSeasonContributor = {
      athleteId: String(athlete.id ?? ""),
      athleteName: athlete.displayName ?? "Unknown",
      headshot: athlete.headshot?.href,
      position: athlete.position?.abbreviation,
      ppg,
      rpg,
      apg,
      impact,
    };

    const teamContributors = byTeam.get(teamId) ?? [];
    teamContributors.push(contributor);
    byTeam.set(teamId, teamContributors);
  });

  const safeLimit = Math.max(1, limitPerTeam);
  const result: Record<string, TeamSeasonContributor[]> = {};

  byTeam.forEach((contributors, teamId) => {
    result[teamId] = [...contributors]
      .sort((a, b) => {
        if (b.impact !== a.impact) return b.impact - a.impact;
        if (b.ppg !== a.ppg) return b.ppg - a.ppg;
        if (b.rpg !== a.rpg) return b.rpg - a.rpg;
        if (b.apg !== a.apg) return b.apg - a.apg;
        return a.athleteName.localeCompare(b.athleteName);
      })
      .slice(0, safeLimit);
  });

  return result;
}

export async function fetchTeamTopSeasonContributors(teamId: string, limit = 3): Promise<TeamSeasonContributor[]> {
  const safeLimit = Math.max(1, limit);

  // Prefer team roster/overview stats since this feed is the most complete for team pages.
  const { athletes } = await fetchRoster(teamId);
  const rosterContributors = athletes
    .map((athlete) => {
      const gamesPlayed = parseStatNumber(athlete.stats?.gp);
      const ppg = parseStatNumber(athlete.stats?.ppg);
      const rpg = parseStatNumber(athlete.stats?.rpg);
      const apg = parseStatNumber(athlete.stats?.apg);

      return {
        gamesPlayed,
        contributor: {
          athleteId: athlete.id,
          athleteName: athlete.displayName,
          headshot: athlete.headshot,
          position: athlete.position?.abbreviation,
          ppg,
          rpg,
          apg,
          impact: ppg + rpg + apg,
        } as TeamSeasonContributor,
      };
    })
    .filter((entry) => entry.gamesPlayed > 10)
    .sort((a, b) => {
      if (b.contributor.impact !== a.contributor.impact) return b.contributor.impact - a.contributor.impact;
      if (b.contributor.ppg !== a.contributor.ppg) return b.contributor.ppg - a.contributor.ppg;
      if (b.contributor.rpg !== a.contributor.rpg) return b.contributor.rpg - a.contributor.rpg;
      if (b.contributor.apg !== a.contributor.apg) return b.contributor.apg - a.contributor.apg;
      return a.contributor.athleteName.localeCompare(b.contributor.athleteName);
    })
    .slice(0, safeLimit)
    .map((entry) => entry.contributor);

  if (rosterContributors.length > 0) {
    return rosterContributors;
  }

  // Fallback for cases where roster stats are unavailable.
  const leadersByTeam = await fetchTeamSeasonContributorLeaders(safeLimit);
  return leadersByTeam[teamId] ?? [];
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseAthleteAvailability(athlete: any): Athlete["availability"] {
    const statusType = coerceText(athlete?.status?.type)?.toLowerCase() ?? "";
    const statusName = coerceText(athlete?.status?.name)?.toLowerCase() ?? "";
    const statusAbbreviation = coerceText(athlete?.status?.abbreviation)?.toLowerCase() ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const injuries: any[] = Array.isArray(athlete?.injuries) ? athlete.injuries : [];
    const firstInjury = injuries[0];

    const injuryStatus = coerceText(firstInjury?.status) ?? undefined;
    const injuryDetail = coerceText(firstInjury?.detail) ?? undefined;
    const injuryText = [injuryStatus, injuryDetail, statusType, statusName, statusAbbreviation]
      .filter((part): part is string => Boolean(part))
      .join(" ")
      .toLowerCase();

    const suspended = /suspend|suspension|disciplin/.test(injuryText);
    if (suspended) {
      return {
        kind: "suspended",
        label: injuryStatus ?? "Suspended",
        detail: injuryDetail,
      };
    }

    const hasInjuryEntry = injuries.length > 0;
    const inactiveStatus = Boolean(statusType) && statusType !== "active";
    if (hasInjuryEntry || inactiveStatus) {
      return {
        kind: "injured",
        label: injuryStatus ?? coerceText(athlete?.status?.name) ?? "Unavailable",
        detail: injuryDetail,
      };
    }

    return undefined;
  }

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
      injuries: Array.isArray(a.injuries)
        ? a.injuries.map((injury: { status?: string; detail?: string; date?: string }) => ({
            status: coerceText(injury.status),
            detail: coerceText(injury.detail),
            date: coerceText(injury.date),
          }))
        : undefined,
      status: a.status
        ? {
            id: coerceText(a.status.id),
            name: coerceText(a.status.name),
            type: coerceText(a.status.type),
            abbreviation: coerceText(a.status.abbreviation),
          }
        : undefined,
      availability: parseAthleteAvailability(a),
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

// ─── Draft ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDraftTeam(teamData: any): DraftTeam {
  const displayName =
    teamData?.displayName ??
    [teamData?.location, teamData?.name].filter((part: unknown): part is string => Boolean(part)).join(" ");

  return {
    id: String(teamData?.id ?? ""),
    displayName: displayName || "Unknown Team",
    abbreviation: teamData?.abbreviation ?? teamData?.shortDisplayName ?? "",
    logo: teamData?.logo ?? teamData?.logos?.[0]?.href,
  };
}

export async function fetchDraftResults(season: number): Promise<DraftResult> {
  const res = await fetch(`${ESPN_BASE}/draft?season=${season}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Draft results fetch failed: ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamsById = new Map<string, DraftTeam>((data.teams ?? []).map((team: any) => {
    const parsed = parseDraftTeam(team);
    return [parsed.id, parsed] as const;
  }));

  const positionsById = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data.positions ?? []).map((position: any) => [
      String(position?.id ?? ""),
      position?.abbreviation ?? position?.displayName ?? "",
    ])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPicks: any[] = data.picks ?? [];

  const draftAthleteIds = Array.from(
    new Set(
      rawPicks
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((pick: any) => String(pick?.athlete?.id ?? ""))
        .filter(Boolean)
    )
  );

  const draftAthleteDetailsResults = await Promise.allSettled(
    draftAthleteIds.map((draftAthleteId) =>
      fetch(
        `${ESPN_CORE_BASE}/sports/basketball/leagues/nba/seasons/${season}/draft/athletes/${draftAthleteId}?lang=en&region=us`,
        { next: { revalidate: 86400 } }
      ).then((response) => {
        if (!response.ok) throw new Error(`Draft athlete detail fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const draftAthletesById = new Map<string, any>();
  draftAthleteDetailsResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    draftAthletesById.set(draftAthleteIds[i], result.value);
  });

  const sourceTeamRefs = Array.from(
    new Set(
      draftAthleteIds
        .map((draftAthleteId) => draftAthletesById.get(draftAthleteId)?.team?.$ref)
        .filter((ref: unknown): ref is string => typeof ref === "string")
    )
  );

  const sourceTeamResults = await Promise.allSettled(
    sourceTeamRefs.map((ref) =>
      fetch(ref, { next: { revalidate: 86400 } }).then((response) => {
        if (!response.ok) throw new Error(`Draft source team fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  const sourceTeamsByRef = new Map<string, DraftTeam>();
  sourceTeamResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    sourceTeamsByRef.set(sourceTeamRefs[i], parseDraftTeam(result.value));
  });

  const picks = rawPicks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((pick: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const athlete: any = pick.athlete ?? {};
      const teamId = String(pick.teamId ?? "");
      const draftAthleteId = String(athlete.id ?? "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const draftAthleteDetail: any = draftAthletesById.get(draftAthleteId);
      const sourceTeamRef: string | undefined = draftAthleteDetail?.team?.$ref;
      const sourceTeam = sourceTeamRef ? sourceTeamsByRef.get(sourceTeamRef) : undefined;

      const fallbackSourceName =
        athlete.team?.shortDisplayName ??
        athlete.team?.displayName ??
        athlete.team?.abbreviation ??
        athlete.leagueAffiliation;

      const sourceCountryCandidate = athlete.leagueAffiliation ?? fallbackSourceName;

      return {
        status: pick.status ?? "",
        pick: Number(pick.pick ?? 0),
        overall: Number(pick.overall ?? pick.pick ?? 0),
        round: Number(pick.round ?? 1),
        traded: Boolean(pick.traded),
        tradeNote: coerceText(pick.tradeNote),
        team: teamsById.get(teamId) ?? {
          id: teamId,
          displayName: "Unknown Team",
          abbreviation: "",
        },
        player: {
          id: String(athlete.alternativeId ?? athlete.id ?? ""),
          displayName: athlete.displayName ?? "Unknown",
          headshot: athlete.headshot?.href,
          position: positionsById.get(String(athlete.position?.id ?? "")) ?? undefined,
          sourceTeam: sourceTeam?.displayName ?? fallbackSourceName,
          sourceTeamLogo: sourceTeam?.logo,
          sourceCountryCode: sourceTeam ? undefined : getCountryCode(sourceCountryCandidate),
        },
      };
    })
    .sort((left: { overall: number }, right: { overall: number }) => left.overall - right.overall);

  const rounds = Number(data.rounds ?? 0) || Math.max(0, ...picks.map((pick: { round: number }) => pick.round));

  return {
    year: Number(data.year ?? season),
    rounds,
    picks,
  };
}

export async function fetchDraftProspects(season: number, limit = 100): Promise<DraftProspect[]> {
  const res = await fetch(
    `${ESPN_CORE_BASE}/sports/basketball/leagues/nba/seasons/${season}/draft/athletes?limit=${limit}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Draft prospects fetch failed: ${res.status}`);

  const data = await res.json();
  const refs: string[] = (data.items ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item?.$ref)
    .filter((ref: unknown): ref is string => typeof ref === "string")
    .slice(0, limit);

  const detailResults = await Promise.allSettled(
    refs.map((ref) =>
      fetch(ref, { next: { revalidate: 3600 } }).then((response) => {
        if (!response.ok) throw new Error(`Draft prospect detail fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details: any[] = detailResults
    .filter((result): result is PromiseFulfilledResult<unknown> => result.status === "fulfilled")
    .map((result) => result.value);

  // Resolve school metadata once per unique reference.
  const schoolRefs = Array.from(
    new Set(
      details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((detail: any) => detail.team?.$ref)
        .filter((ref: unknown): ref is string => typeof ref === "string")
    )
  );

  const schoolResults = await Promise.allSettled(
    schoolRefs.map((ref) =>
      fetch(ref, { next: { revalidate: 86400 } }).then((response) => {
        if (!response.ok) throw new Error(`Draft school fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  const schoolsByRef = new Map<string, DraftTeam>();
  schoolResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    schoolsByRef.set(schoolRefs[i], parseDraftTeam(result.value));
  });

  const noSchoolAthleteRefs = Array.from(
    new Set(
      details
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((detail: any) => !detail.team?.$ref)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((detail: any) => detail.athlete?.$ref)
        .filter((ref: unknown): ref is string => typeof ref === "string")
    )
  );

  const noSchoolAthleteResults = await Promise.allSettled(
    noSchoolAthleteRefs.map((ref) =>
      fetch(ref, { next: { revalidate: 86400 } }).then((response) => {
        if (!response.ok) throw new Error(`Draft no-school athlete fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noSchoolAthletesByRef = new Map<string, any>();
  noSchoolAthleteResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    noSchoolAthletesByRef.set(noSchoolAthleteRefs[i], result.value);
  });

  const noSchoolTeamRefs = Array.from(
    new Set(
      noSchoolAthleteRefs
        .map((athleteRef) => noSchoolAthletesByRef.get(athleteRef)?.team?.$ref)
        .filter((ref: unknown): ref is string => typeof ref === "string")
    )
  );

  const noSchoolTeamResults = await Promise.allSettled(
    noSchoolTeamRefs.map((ref) =>
      fetch(ref, { next: { revalidate: 86400 } }).then((response) => {
        if (!response.ok) throw new Error(`Draft no-school team fetch failed: ${response.status}`);
        return response.json();
      })
    )
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const noSchoolTeamsByRef = new Map<string, any>();
  noSchoolTeamResults.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    noSchoolTeamsByRef.set(noSchoolTeamRefs[i], result.value);
  });

  return details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((detail: any, index: number): DraftProspect => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attrs: any[] = detail.attributes ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overallAttr: any = attrs.find((attr: any) => attr?.name === "overall");
      const schoolRef: string | undefined = detail.team?.$ref;
      const school = schoolRef ? schoolsByRef.get(schoolRef) : undefined;

      const athleteRef: string | undefined = detail.athlete?.$ref;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackAthlete: any = athleteRef ? noSchoolAthletesByRef.get(athleteRef) : undefined;
      const fallbackTeamRef: string | undefined = fallbackAthlete?.team?.$ref;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackTeam: any = fallbackTeamRef ? noSchoolTeamsByRef.get(fallbackTeamRef) : undefined;

      const fallbackCountry =
        detail.leagueAffiliation ??
        fallbackAthlete?.birthPlace?.country ??
        inferCountryFromTeamMeta(fallbackTeam?.location, fallbackTeam?.displayName);

      const fallbackCountryCode = getCountryCode(fallbackCountry);
      const fromDisplayName = school?.displayName ?? fallbackCountry ?? fallbackTeam?.displayName ?? "Unknown";

      return {
        rank: Number(overallAttr?.displayValue ?? overallAttr?.value ?? index + 1),
        player: {
          id: extractIdFromRef(detail.athlete?.$ref) || String(detail.id ?? ""),
          displayName: detail.displayName ?? detail.fullName ?? "Unknown",
          position: detail.position?.abbreviation ?? detail.position?.displayName,
          headshot: detail.logo?.href,
          sourceTeam: school?.abbreviation,
        },
        school: {
          displayName: fromDisplayName,
          abbreviation: school?.abbreviation,
          logo: school?.logo,
          countryCode: school ? undefined : fallbackCountryCode,
        },
        height: detail.displayHeight,
        weight: detail.displayWeight,
      };
    })
    .sort((left, right) => left.rank - right.rank);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCareerCategoryTables(categories: any[]): {
  averages?: PlayerDetail["careerRegularSeasonAverages"];
  totals?: PlayerDetail["careerRegularSeasonTotals"];
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findCategory = (matcher: (category: any) => boolean) => categories.find(matcher);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const averagesCategory: any = findCategory((category: any) => {
    const text = `${category.name ?? ""} ${category.displayName ?? ""}`.toLowerCase();
    return text.includes("averag") && !text.includes("misc");
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalsCategory: any = findCategory((category: any) => {
    const text = `${category.name ?? ""} ${category.displayName ?? ""}`.toLowerCase();
    return text.includes("total") && !text.includes("misc");
  });

  const toTable =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (category: any): PlayerDetail["careerRegularSeasonAverages"] | undefined => {
      if (!category) return undefined;
      const labels: string[] = category.labels ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const values: string[] = (category.totals ?? []).map((value: any) => String(value ?? "–"));
      if (!labels.length || !values.length) return undefined;
      return {
        displayName: category.displayName ?? category.name ?? "Career",
        labels,
        values,
      };
    };

  return {
    averages: toTable(averagesCategory),
    totals: toTable(totalsCategory),
  };
}

async function fetchCollegeAthleteDetails(playerId: string): Promise<PlayerDetail> {
  const res = await fetch(
    `${ESPN_CORE_BASE}/sports/basketball/leagues/mens-college-basketball/athletes/${playerId}?lang=en&region=us`
  );
  if (!res.ok) throw new Error(`Player bio fetch failed: ${res.status}`);

  const athleteData = await res.json();
  if (!athleteData?.id) throw new Error("Player data not found");

  let schoolName: string | undefined;
  const schoolRef = athleteData.team?.$ref;
  if (typeof schoolRef === "string") {
    const schoolRes = await fetch(schoolRef, { next: { revalidate: 86400 } });
    if (schoolRes.ok) {
      const schoolData = await schoolRes.json();
      schoolName = schoolData?.displayName;
    }
  }

  const displayExperience =
    coerceText(athleteData.displayExperience) ??
    (typeof athleteData.experience?.years === "number"
      ? `${athleteData.experience.years} yr`
      : undefined);

  return {
    id: String(athleteData.id ?? playerId),
    fullName: athleteData.fullName ?? athleteData.displayName ?? "Unknown",
    displayName: athleteData.displayName ?? athleteData.fullName ?? "Unknown",
    headshot: athleteData.headshot?.href,
    jersey: athleteData.jersey,
    position: athleteData.position
      ? {
          abbreviation: athleteData.position.abbreviation ?? "",
          displayName: athleteData.position.displayName ?? athleteData.position.name ?? "",
        }
      : undefined,
    height: athleteData.displayHeight,
    weight: athleteData.displayWeight,
    age: athleteData.age,
    experience: displayExperience ? { display: displayExperience } : undefined,
    college: schoolName ? { name: schoolName } : undefined,
    birthDate: athleteData.displayDOB ?? undefined,
    birthPlace: athleteData.displayBirthPlace ? { display: athleteData.displayBirthPlace } : undefined,
    draft: undefined,
    hand: athleteData.hand?.type,
    team: undefined,
    regularSeasonStats: undefined,
    careerStats: undefined,
    careerRegularSeasonAverages: undefined,
    careerRegularSeasonTotals: undefined,
    seasonHistory: [],
    news: [],
  };
}

export async function fetchPlayerDetails(playerId: string): Promise<PlayerDetail> {
  unstable_noStore();

  // Fetch bio, overview stats, and season-by-season splits.
  const [bioRes, overviewRes, statsRes] = await Promise.all([
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}`),
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}/overview`),
    fetch(`${ESPN_COMMON_V3}/athletes/${playerId}/stats`),
  ]);
  if (!bioRes.ok) {
    if (bioRes.status === 404) {
      return fetchCollegeAthleteDetails(playerId);
    }
    throw new Error(`Player bio fetch failed: ${bioRes.status}`);
  }
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
          const isCombinedSeasonRow = (!row.teamId || row.teamId === "0") && /totals?/i.test(teamSlug);
          if (isCombinedSeasonRow) return null;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const teamMeta: any = teamSlug
            ? teamsBySlug[teamSlug]
            : teamValues.find((team) => team.id === row.teamId);

          const resolvedTeamId = teamMeta?.id ?? row.teamId ?? "";
          if (!resolvedTeamId) return null;

          return {
            seasonYear: Number(row.season?.year ?? 0),
            seasonLabel: row.season?.displayName ?? String(row.season?.year ?? "Unknown"),
            playerName: a.fullName ?? a.displayName ?? "Unknown",
            team: {
              id: resolvedTeamId,
              abbreviation: teamMeta?.abbreviation ?? "N/A",
              displayName: teamMeta?.displayName ?? formatTeamSlug(teamSlug),
              logo: teamMeta?.logos?.[0]?.href ?? teamMeta?.logo ?? "",
            },
            position: row.position,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stats: (row.stats ?? []).map((value: any) => String(value ?? "–")),
          };
        })
        .filter(
          (
            row: PlayerDetail["seasonHistory"][number]["rows"][number] | null
          ): row is PlayerDetail["seasonHistory"][number]["rows"][number] => row !== null
        )
        .sort(
          (
            left: PlayerDetail["seasonHistory"][number]["rows"][number],
            right: PlayerDetail["seasonHistory"][number]["rows"][number]
          ) => {
          if (right.seasonYear !== left.seasonYear) return right.seasonYear - left.seasonYear;
          return left.team.displayName.localeCompare(right.team.displayName);
          }
        );

      return {
        key: category.name ?? category.displayName ?? "history",
        displayName: category.displayName ?? category.name ?? "Season Stats",
        labels,
        rows,
      };
    }).filter((category: { labels: string[]; rows: unknown[] }) => category.labels.length > 0 && category.rows.length > 0);

  const careerCategoryTables = getCareerCategoryTables(statsData.categories ?? []);

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
    careerRegularSeasonAverages: careerCategoryTables.averages,
    careerRegularSeasonTotals: careerCategoryTables.totals,
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
