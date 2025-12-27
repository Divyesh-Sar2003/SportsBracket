export type TournamentStatus = "draft" | "active" | "completed";

export type GameType = "SINGLE" | "PAIR" | "TEAM";

export type ParticipantType = "USER" | "TEAM";

export type RegistrationStatus = "pending" | "approved" | "rejected";

export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Timestamped {
  created_at?: string;
  updated_at?: string;
}

export interface Tournament extends Timestamped {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: TournamentStatus;
  is_active: boolean;
}

export interface Game extends Timestamped {
  id: string;
  tournament_id: string;
  name: string;
  game_type: GameType;
  players_per_team: number;
  is_active: boolean;
}

export interface Registration extends Timestamped {
  id: string;
  tournament_id: string;
  game_id: string;
  user_id: string;
  status: RegistrationStatus;
  notes?: string;
}

export interface Team extends Timestamped {
  id: string;
  tournament_id: string;
  game_id: string;
  name: string;
  is_pair: boolean;
  player_ids: string[];
  status: "pending" | "confirmed";
}

export interface Participant extends Timestamped {
  id: string;
  tournament_id: string;
  game_id: string;
  type: ParticipantType;
  user_id?: string;
  team_id?: string;
  seed?: number;
  approved_by?: string;
}

export interface Match extends Timestamped {
  id: string;
  tournament_id: string;
  game_id: string;
  round_index: number;
  round_name: string;
  match_order: number;
  participant_a_id?: string;
  participant_b_id?: string;
  match_time?: any; // Changed from string to any to support Timestamp inputs
  venue?: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "scheduled" | "completed" | "cancelled"; // Support both cases
  next_match_id?: string;
  winner_slot_in_next?: "A" | "B";
  winner_participant_id?: string;
}

export interface MatchResult extends Timestamped {
  id: string;
  match_id: string;
  tournament_id: string;
  game_id: string;
  winner_participant_id: string;
  score_details?: string;
  points_awarded: Record<string, number>;
  submitted_by: string;
}

export interface LeaderboardEntry extends Timestamped {
  id: string;
  tournament_id: string;
  game_id?: string;
  entity_type: "USER" | "TEAM" | "DEPARTMENT";
  entity_id: string;
  name: string;
  points: number;
  wins: number;
  losses: number;
  rank?: number;
}

