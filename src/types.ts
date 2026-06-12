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
  startedAt: number | null;
  endedAt: number | null;
  elapsedMs: number;
}

export type TournamentStatus = 'setup' | 'round' | 'scoring' | 'finished';
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
export const STORAGE_KEY = 'manillen-tournament';
