export type GroupName = 'A' | 'B' | 'C' | 'D';

export interface Team {
  id: string;
  name: string;
  code: string; // A1, A2, B1, etc.
  group_name: GroupName;
  logo_url?: string;
  players?: string[]; // team roster
  created_at?: string;
}

export type MatchStage = 'LEAGUE' | 'QF' | 'SF' | 'FINAL';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export interface Match {
  id: string;
  group_name?: GroupName | null; // null for knockout
  team_a_id: string;
  team_b_id: string;
  team_a_score: number;
  team_b_score: number;
  winner_id?: string | null;
  is_completed: boolean;
  stage: MatchStage;
  status: MatchStatus;
  match_date: string;
  round_number?: number;
  // When true, a knockout match's teams were set manually by an admin and are
  // not overwritten by automatic bracket resolution.
  locked?: boolean;
  created_at?: string;
}

export interface StandingRow {
  position: number;
  team_id: string;
  team_name: string;
  team_code: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  board_difference: number;
  form: ('W' | 'L' | 'D')[];
  qualified: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export interface TournamentSettings {
  draw_points_enabled: boolean;
  // Only ever present server-side; stripped from the public API payload so it
  // is never shipped to clients. Admin auth happens via the login endpoint.
  passcode?: string;
  tournament_stage: 'LEAGUE' | 'KNOCKOUT';
}

export interface TournamentStats {
  totalMatches: number;
  matchesPlayed: number;
  totalTeams: number;
  mostWinsTeam: { name: string; count: number } | null;
  longestWinStreak: { name: string; count: number } | null;
  highestBoardDifference: { name: string; value: number } | null;
  bestGroup: { name: string; avgPoints: number } | null;
  qualificationProbability: { [teamId: string]: number };
}
