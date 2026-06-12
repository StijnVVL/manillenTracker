import { applyLadderUpdate } from '../logic/ladder';
import { ladderPairings, randomPairings } from '../logic/pairing';
import { buildRoundResults } from '../logic/scoring';
import {
  DEFAULT_ROUND_DURATION_MINUTES,
  type Round,
  type Team,
  type TournamentState,
} from '../types';

export function createInitialState(): TournamentState {
  return {
    teams: [],
    ladder: [],
    rounds: [],
    currentRoundIndex: -1,
    roundDurationMinutes: DEFAULT_ROUND_DURATION_MINUTES,
    status: 'setup',
    timerStatus: 'idle',
    remainingMs: DEFAULT_ROUND_DURATION_MINUTES * 60 * 1000,
    lastLadderSnapshot: null,
  };
}

export function createTeam(name: string): Team {
  return { id: crypto.randomUUID(), name: name.trim() };
}

function createRound(number: number, teamIds: string[], useRandom: boolean): Round {
  const { matchups, byeTeamId } = useRandom
    ? randomPairings(teamIds)
    : ladderPairings(teamIds);

  return {
    number,
    matchups,
    byeTeamId,
    results: [],
    startedAt: null,
    endedAt: null,
    elapsedMs: 0,
  };
}

function getCurrentRound(state: TournamentState): Round | null {
  if (state.currentRoundIndex < 0) return null;
  return state.rounds[state.currentRoundIndex] ?? null;
}

function updateCurrentRound(state: TournamentState, round: Round): TournamentState {
  const rounds = [...state.rounds];
  rounds[state.currentRoundIndex] = round;
  return { ...state, rounds };
}

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

export function tournamentReducer(
  state: TournamentState,
  action: TournamentAction,
): TournamentState {
  switch (action.type) {
    case 'ADD_TEAM': {
      const name = action.name.trim();
      if (!name) return state;
      const team = createTeam(name);
      return { ...state, teams: [...state.teams, team] };
    }

    case 'REMOVE_TEAM':
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.teamId),
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, name: action.name.trim() } : t,
        ),
      };

    case 'SET_ROUND_DURATION': {
      const minutes = Math.max(1, action.minutes);
      const remainingMs = minutes * 60 * 1000;
      return {
        ...state,
        roundDurationMinutes: minutes,
        remainingMs: state.timerStatus === 'idle' ? remainingMs : state.remainingMs,
      };
    }

    case 'START_TOURNAMENT': {
      if (state.teams.length < 2) return state;
      const ladder = state.teams.map((t) => t.id);
      const round = createRound(1, ladder, true);
      const remainingMs = state.roundDurationMinutes * 60 * 1000;
      return {
        ...state,
        ladder,
        rounds: [round],
        currentRoundIndex: 0,
        status: 'round',
        timerStatus: 'idle',
        remainingMs,
        lastLadderSnapshot: null,
      };
    }

    case 'START_ROUND': {
      const round = getCurrentRound(state);
      if (!round) return state;
      const now = Date.now();
      const updatedRound: Round = {
        ...round,
        startedAt: round.startedAt ?? now,
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        timerStatus: 'running',
      };
    }

    case 'PAUSE_ROUND':
      return { ...state, timerStatus: 'paused' };

    case 'RESUME_ROUND':
      return { ...state, timerStatus: 'running' };

    case 'TICK_TIMER': {
      const round = getCurrentRound(state);
      if (!round) return state;
      const updatedRound: Round = {
        ...round,
        elapsedMs: action.elapsedMs,
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        remainingMs: action.remainingMs,
      };
    }

    case 'END_ROUND': {
      const round = getCurrentRound(state);
      if (!round) return state;
      const updatedRound: Round = {
        ...round,
        endedAt: Date.now(),
        elapsedMs: action.elapsedMs,
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        status: 'scoring',
        timerStatus: 'ended',
        remainingMs: 0,
      };
    }

    case 'SUBMIT_SCORES': {
      const round = getCurrentRound(state);
      if (!round) return state;

      const results = buildRoundResults(round.matchups, action.scores);
      const snapshot = [...state.ladder];
      const { ladder } = applyLadderUpdate(state.ladder, results);

      const updatedRound: Round = { ...round, results };
      const rounds = [...state.rounds];
      rounds[state.currentRoundIndex] = updatedRound;

      return {
        ...state,
        rounds,
        ladder,
        lastLadderSnapshot: snapshot,
        status: 'scoring',
      };
    }

    case 'NEXT_ROUND': {
      const nextNumber = state.rounds.length + 1;
      const round = createRound(nextNumber, state.ladder, false);
      const remainingMs = state.roundDurationMinutes * 60 * 1000;
      return {
        ...state,
        rounds: [...state.rounds, round],
        currentRoundIndex: state.rounds.length,
        status: 'round',
        timerStatus: 'idle',
        remainingMs,
        lastLadderSnapshot: null,
      };
    }

    case 'RESET_TOURNAMENT': {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('manillen-tournament');
      }
      return createInitialState();
    }

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}
