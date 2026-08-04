export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
}

export interface Matchup {
  teamAId: string;
  teamBId: string;
  teamAScore?: number;
  teamBScore?: number;
}

export interface RoundResult {
  teamId: string;
  rawScore: number;
  matchDiff: number;
}

export interface LadderSnapshotEntry {
  teamId: string;
  wins: number;
  exclusions: number;
  cumulativeScore: number;
  roundScores: number[];
}

export interface Round {
  number: number;
  matchups: Matchup[];
  excludedTeamId: string | null;
  excludedTeamScore: number | null;
  ladderSnapshot: LadderSnapshotEntry[];
  startedAt: number | null;
  endedAt: number | null;
  dueAt: number | null;
  pausedAt: number | null;
}

export type TournamentStatus = 'none' | 'setup' | 'round' | 'scoring' | 'round-winner' | 'finished';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface TournamentState {
  tournamentName: string;
  teams: Team[];
  ladder: string[];
  rounds: Round[];
  roundDurationSeconds: number;
  totalRounds: number;
  matchupAlgorithmId: string;
  status: TournamentStatus;
  timerStatus: TimerStatus;
  lastLadderSnapshot: string[] | null;
  teamPresence: Record<string, boolean>;
}

export const DEFAULT_ROUND_DURATION_SECONDS = 25 * 60;
export const DEFAULT_TOTAL_ROUNDS = 5;
export const STORAGE_KEY = 'manillen-tournament';

export type TournamentAction =
  | { type: 'ADD_TEAM'; name: string; player1: string; player2: string; id?: string }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'UPDATE_TEAM'; teamId: string; name: string; player1: string; player2: string }
  | { type: 'SET_TOURNAMENT_NAME'; name: string }
  | { type: 'SET_TOTAL_ROUNDS'; totalRounds: number }
  | { type: 'SET_SETUP_ROUND_DURATION'; roundDurationSeconds: number }
  | { type: 'SET_TEAM_PRESENT'; teamId: string }
  | { type: 'SET_TEAM_ABSENT'; teamId: string }
  | { type: 'START_TOURNAMENT'; roundDurationSeconds?: number }
  | { type: 'INIT_ROUND' }
  | { type: 'START_ROUND', dueTime: number }
  | { type: 'PAUSE_ROUND', pauseTime: number }
  | { type: 'RESUME_ROUND', resumeTime: number }
  | { type: 'TICK_TIMER', currentTime: number }
  | { type: 'END_ROUND', endTime: number }
  | { type: 'UPDATE_SCORES'; scores: Record<string, number> }
  | { type: 'SUBMIT_SCORES'; scores: Record<string, number> }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET_TOURNAMENT'; defaultTotalRounds?: number; teams?: Team[]; roundDurationSeconds?: number; tournamentName?: string; matchupAlgorithmId?: string }
  | { type: 'SET_MATCHUP_ALGORITHM_TOURNAMENT'; algorithmId: string }
  | { type: 'STOP_TOURNAMENT' }
  | { type: 'RESTORE_STATE'; state: TournamentState };
