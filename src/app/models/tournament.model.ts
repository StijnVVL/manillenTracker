export interface Team {
  id: string;
  name: string;
  player1: string;
  player2: string;
  /** Presence flag - only applicable in tournament state (not general settings state). */
  present?: boolean;
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
  preRoundLadderSnapshot: LadderSnapshotEntry[];
  startedAt: number | null;
  endedAt: number | null;
  dueAt: number | null;
  pausedAt: number | null;
}

export type TournamentStatus = 'none' | 'setup' | 'round' | 'scoring' | 'round-winner' | 'finished';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'ended';

/**
 * A recorded undoable command: the original action plus a memento holding any
 * non-deterministic artifacts (e.g. generated ids / rounds) and prior-state
 * values captured when the command's up() first ran. Mementos make down()
 * self-contained and redo() deterministic.
 */
export interface CommandRecord {
  type: UndoableActionType;
  action: TournamentAction;
  memento: Record<string, unknown>;
}

export type UndoableActionType =
  | 'ADD_TEAM'
  | 'REMOVE_TEAM'
  | 'UPDATE_TEAM'
  | 'START_ROUND'
  | 'END_ROUND'
  | 'SUBMIT_SCORES'
  | 'NEXT_ROUND';

export interface TournamentState {
  tournamentName: string;
  showSponsors: boolean;
  teams: Team[];
  postRoundLadderSnapshot: LadderSnapshotEntry[];
  rounds: Round[];
  roundDurationSeconds: number;
  totalRounds: number;
  exclusionPickerId: string;
  exclusionScorerId: string;
  status: TournamentStatus;
  timerStatus: TimerStatus;
  sponsorIntervalSeconds: number;
  points60_0: number;
  /** Ordered list of executed undoable commands (oldest first). Persisted at root. */
  undoStack: CommandRecord[];
  /** Commands that were undone and can be redone (most-recently-undone last). Persisted at root. */
  redoStack: CommandRecord[];
}

export const DEFAULT_ROUND_DURATION_SECONDS = 25 * 60;
export const DEFAULT_TOTAL_ROUNDS = 5;
export const DEFAULT_SPONSOR_INTERVAL_SECONDS = 10;
export const POINTS_60_0_OPTIONS = [30, 60] as const;
export const DEFAULT_POINTS_60_0 = 30;

export function sanitizePoints60_0(value: unknown): number {
  const n = Math.round(Number(value));
  return (POINTS_60_0_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_POINTS_60_0;
}
export const STORAGE_KEY = 'manillen-tournament';

export type TournamentAction =
  | { type: 'ADD_TEAM'; name: string; player1: string; player2: string; id?: string }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'UPDATE_TEAM'; teamId: string; name: string; player1: string; player2: string }
  | { type: 'SET_TOURNAMENT_NAME'; name: string }
  | { type: 'SET_SHOW_SPONSORS'; showSponsors: boolean }
  | { type: 'SET_SPONSOR_INTERVAL'; sponsorIntervalSeconds: number }
  | { type: 'SET_TOTAL_ROUNDS'; totalRounds: number }
  | { type: 'SET_POINTS_60_0_TOURNAMENT'; points60_0: number }
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
  | { type: 'RESET_TOURNAMENT'; defaultTotalRounds?: number; teams?: Team[]; roundDurationSeconds?: number; tournamentName?: string; exclusionPickerId?: string; exclusionScorerId?: string; points60_0?: number }
  | { type: 'SET_EXCLUSION_PICKER_TOURNAMENT'; exclusionPickerId: string }
  | { type: 'SET_EXCLUSION_SCORER_TOURNAMENT'; exclusionScorerId: string }
  | { type: 'STOP_TOURNAMENT' }
  | { type: 'RESTORE_STATE'; state: TournamentState };
