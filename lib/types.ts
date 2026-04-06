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
}
