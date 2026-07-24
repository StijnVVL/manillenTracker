export interface Team {
  id: string;
  name: string;
}

export interface Matchup {
  teamAId: string;
  teamBId: string;
}

export interface RoundResult {
  teamId: string;
  rawScore: number;
  matchDiff: number;
}

export interface Round {
  number: number;
  matchups: Matchup[];
  byeTeamId: string | null;
  results: RoundResult[];
  ladderSnapshot?: string[];
  startedAt: number | null;
  endedAt: number | null;
  elapsedMs: number;
}

export type TournamentStatus = 'setup' | 'matchup_display' | 'round' | 'scoring' | 'finished';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface TournamentState {
  teams: Team[];
  ladder: string[];
  rounds: Round[];
  currentRoundIndex: number;
  roundDurationMinutes: number;
  status: TournamentStatus;
  timerStatus: TimerStatus;
  remainingMs: number;
  lastLadderSnapshot: string[] | null;
}

export const DEFAULT_ROUND_DURATION_MINUTES = 60;
export const TOTAL_ROUNDS = 5;
export const STORAGE_KEY = 'manillen-tournament';

export type TournamentAction =
  | { type: 'ADD_TEAM'; name: string }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'UPDATE_TEAM'; teamId: string; name: string }
  | { type: 'SET_ROUND_DURATION'; minutes: number }
  | { type: 'START_TOURNAMENT' }
  | { type: 'START_ROUND' }
  | { type: 'PAUSE_ROUND' }
  | { type: 'RESUME_ROUND' }
  | { type: 'TICK_TIMER'; remainingMs: number; elapsedMs: number }
  | { type: 'END_ROUND'; elapsedMs: number }
  | { type: 'SUBMIT_SCORES'; scores: Record<string, number> }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET_TOURNAMENT' }
  | { type: 'RESTORE_STATE'; state: TournamentState };
