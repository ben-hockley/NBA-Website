// ESPN API TypeScript interfaces

// ─── Scoreboard ───────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  alternateColor: string;
}

export interface Competitor {
  id: string;
  team: Team;
  score: string;
  homeAway: "home" | "away";
  winner?: boolean;
  records?: { name: string; summary: string }[];
}

export interface GameStatus {
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
  displayClock?: string;
  period?: number;
}

export interface Game {
  id: string;
  date: string;
  name: string;
  status: GameStatus;
  competitors: Competitor[];
  topContributors?: TeamGameTopContributor[];
  venue?: {
    fullName: string;
    address: { city: string; state: string };
  };
}

export interface GameTopContributor {
  athleteId: string;
  athleteName: string;
  headshot?: string;
  position?: string;
  points: number;
  rebounds: number;
  assists: number;
  impact: number;
}

export interface TeamGameTopContributor {
  teamId: string;
  contributor?: GameTopContributor;
}

export interface GameLineScore {
  value: string;
}

export interface GameDetailCompetitor {
  id: string;
  team: Team;
  score: string;
  homeAway: "home" | "away";
  winner?: boolean;
  record?: string;
  linescores: GameLineScore[];
}

export interface GameTeamStatistic {
  name: string;
  label: string;
  abbreviation?: string;
  displayValue: string;
}

export interface GameBoxScoreColumn {
  key: string;
  label: string;
  description?: string;
}

export interface GameBoxScorePlayer {
  athleteId: string;
  athleteName: string;
  headshot?: string;
  jersey?: string;
  position?: string;
  starter: boolean;
  didNotPlay: boolean;
  reason?: string;
  ejected: boolean;
  stats: string[];
}

export interface GameBoxScoreTeam {
  team: Team;
  columns: GameBoxScoreColumn[];
  players: GameBoxScorePlayer[];
}

export interface GameDetailLeaderEntry {
  athleteId: string;
  athleteName: string;
  headshot?: string;
  position?: string;
  displayValue: string;
  summary?: string;
  mainStatLabel?: string;
}

export interface GameDetailLeaderCategory {
  name: string;
  displayName: string;
  leader?: GameDetailLeaderEntry;
}

export interface GameDetailTeamLeaders {
  team: Team;
  categories: GameDetailLeaderCategory[];
}

export interface GameInjury {
  team: Team;
  athleteName: string;
  status?: string;
  detail?: string;
}

export interface GameOdds {
  details?: string;
  overUnder?: string;
}

export interface GameDetail {
  id: string;
  date: string;
  name: string;
  status: GameStatus;
  competitors: GameDetailCompetitor[];
  venue?: {
    fullName: string;
    address: { city: string; state: string };
  };
  attendance?: number;
  officials: string[];
  broadcasts: string[];
  odds?: GameOdds;
  teamStats: {
    team: Team;
    statistics: GameTeamStatistic[];
  }[];
  boxscore: GameBoxScoreTeam[];
  leaders: GameDetailTeamLeaders[];
  injuries: GameInjury[];
}

// ─── Standings ────────────────────────────────────────────────────────────────

export interface StandingsTeamRecord {
  wins: number;
  losses: number;
  winPercent: number;
  gamesBehind: number;
  streak?: string;
}

export interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  record: StandingsTeamRecord;
}

export interface StandingsGroup {
  name: string;
  teams: StandingsTeam[];
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export interface NBATeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  location: string;
  name: string;
}

export interface TeamOverview {
  id: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
  location: string;
  name: string;
  standingSummary?: string;
  record: {
    overall?: string;
    home?: string;
    away?: string;
    wins?: number;
    losses?: number;
    winPercent?: number;
    gamesBehind?: number;
    pointDifferential?: number;
    streak?: string;
  };
  venue?: {
    fullName: string;
    city?: string;
    state?: string;
    image?: string;
  };
  nextGame?: {
    gameId: string;
    date: string;
    homeAway: "home" | "away";
    opponent: {
      id: string;
      displayName: string;
      abbreviation: string;
      logo: string;
    };
    venue?: {
      fullName: string;
      city?: string;
      state?: string;
    };
  };
}

export interface TeamRecentResult {
  gameId: string;
  date: string;
  statusText: string;
  homeAway: "home" | "away";
  won: boolean;
  teamScore: string;
  opponentScore: string;
  topContributors?: TeamGameTopContributor[];
  opponent: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
  };
  venue?: {
    fullName: string;
    city?: string;
    state?: string;
  };
}

export interface TeamSeasonContributor {
  athleteId: string;
  athleteName: string;
  headshot?: string;
  position?: string;
  ppg: number;
  rpg: number;
  apg: number;
  impact: number;
}

// ─── Roster ───────────────────────────────────────────────────────────────────

export interface AthleteStats {
  gp?: string;
  mpg?: string;
  ppg?: string;
  rpg?: string;
  apg?: string;
  fgPct?: string;
}

export interface AthleteAvailability {
  kind: "injured" | "suspended";
  label: string;
  detail?: string;
}

export interface Athlete {
  id: string;
  fullName: string;
  displayName: string;
  jersey?: string;
  position?: { abbreviation: string; displayName: string };
  headshot?: string;
  height?: string;
  weight?: number;
  age?: number;
  experience?: { years: number };
  college?: { name: string };
  birthDate?: string;
  birthPlace?: { city?: string; state?: string; country?: string };
  hand?: string;
  injuries?: { status?: string; detail?: string; date?: string }[];
  status?: { id?: string; name?: string; type?: string; abbreviation?: string };
  availability?: AthleteAvailability;
  stats?: AthleteStats;
}

// ─── Player Detail ─────────────────────────────────────────────────────────────

export interface PlayerStats {
  gamesPlayed: string;
  avgMinutes: string;
  avgPoints: string;
  avgRebounds: string;
  avgAssists: string;
  avgBlocks: string;
  avgSteals: string;
  avgTurnovers: string;
  avgFouls: string;
  fieldGoalPct: string;
  threePointPct: string;
  freeThrowPct: string;
}

export interface PlayerNews {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export interface PlayerStatsTable {
  displayName: string;
  labels: string[];
  values: string[];
}

export interface PlayerSeasonHistoryRow {
  seasonYear: number;
  seasonLabel: string;
  playerName: string;
  team: {
    id: string;
    abbreviation: string;
    displayName: string;
    logo: string;
  };
  position?: string;
  stats: string[];
}

export interface PlayerSeasonHistoryCategory {
  key: string;
  displayName: string;
  labels: string[];
  rows: PlayerSeasonHistoryRow[];
}

// ─── Stat Leaders ─────────────────────────────────────────────────────────────

export interface StatLeaderEntry {
  rank: number;
  playerId: string;
  playerName: string;
  headshot?: string;
  teamAbbreviation: string;
  teamLogo: string;
  teamColor: string;
  value: string;
}

export interface StatCategory {
  key: string;
  displayName: string;
  shortName: string;
  totalShortName: string;
  leaders: StatLeaderEntry[];
  totalLeaders: StatLeaderEntry[];
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export interface DraftTeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
}

export interface DraftPlayer {
  id: string;
  displayName: string;
  headshot?: string;
  position?: string;
  sourceTeam?: string;
  sourceTeamLogo?: string;
  sourceCountryCode?: string;
}

export interface DraftPick {
  status: string;
  pick: number;
  overall: number;
  round: number;
  traded: boolean;
  tradeNote?: string;
  team: DraftTeam;
  player: DraftPlayer;
}

export interface DraftResult {
  year: number;
  rounds: number;
  picks: DraftPick[];
}

export interface DraftProspect {
  rank: number;
  player: DraftPlayer;
  school: {
    displayName: string;
    abbreviation?: string;
    logo?: string;
    countryCode?: string;
  };
  height?: string;
  weight?: string;
}

export interface PlayerDetail {
  id: string;
  fullName: string;
  displayName: string;
  headshot?: string;
  jersey?: string;
  position?: { abbreviation: string; displayName: string };
  height?: string;
  weight?: string;
  age?: number;
  experience?: { display: string };
  college?: { name: string };
  birthDate?: string;
  birthPlace?: { display: string };
  draft?: string;
  hand?: string;
  team?: { id: string; displayName: string; abbreviation: string; logo: string; color: string };
  regularSeasonStats?: PlayerStats;
  careerStats?: PlayerStats;
  careerRegularSeasonAverages?: PlayerStatsTable;
  careerRegularSeasonTotals?: PlayerStatsTable;
  seasonHistory: PlayerSeasonHistoryCategory[];
  news: PlayerNews[];
}
