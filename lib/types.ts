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
  venue?: {
    fullName: string;
    address: { city: string; state: string };
  };
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

// ─── Roster ───────────────────────────────────────────────────────────────────

export interface AthleteStats {
  gp?: string;
  mpg?: string;
  ppg?: string;
  rpg?: string;
  apg?: string;
  fgPct?: string;
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
  seasonHistory: PlayerSeasonHistoryCategory[];
  news: PlayerNews[];
}
