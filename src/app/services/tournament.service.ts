import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged, debounceTime } from 'rxjs';
import { applyLadderUpdate } from '../logic/ladder';
import { ladderPairings, randomPairings } from '../logic/pairing';
import { buildRoundResults } from '../logic/scoring';
import {
  DEFAULT_ROUND_DURATION_MINUTES,
  STORAGE_KEY,
  TOTAL_ROUNDS,
  type Round,
  type Team,
  type TournamentState,
  type TournamentAction,
} from '../models/tournament.model';
import { DUMMY_TEAMS, USE_DUMMY_DATA } from '../data/dummy-teams';

function createTeam(name: string): Team {
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
    dueAt: null,
    currentAt: null
  };
}

function getCurrentRound(state: TournamentState): Round | null {
  if (state.currentRoundIndex < 0){
    return null;
  } 

  return state.rounds[state.currentRoundIndex] ?? null;
}

function updateCurrentRound(state: TournamentState, round: Round): TournamentState {
  const rounds = [...state.rounds];
  rounds[state.currentRoundIndex] = round;
  return { ...state, rounds };
}

function createInitialState(): TournamentState {
  return {
    teams: USE_DUMMY_DATA ? [...DUMMY_TEAMS] : [],
    ladder: [],
    rounds: [],
    currentRoundIndex: -1,
    roundDurationMinutes: DEFAULT_ROUND_DURATION_MINUTES,
    status: 'setup',
    timerStatus: 'idle',
    lastLadderSnapshot: null,
  };
}

function loadPersistedState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TournamentState;
    if (!parsed.teams || !Array.isArray(parsed.ladder)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getInitialTournamentState(): TournamentState {
  return loadPersistedState() ?? createInitialState();
}

function tournamentReducer(
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
        roundDurationMinutes: minutes
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
        status: 'matchup_display',
        timerStatus: 'idle',
        lastLadderSnapshot: null,
      };
    }

    case 'START_ROUND': {
      const round = getCurrentRound(state);
      if (!round){
        return state;
      } 
      const now = Date.now();
      const updatedRound: Round = {
        ...round,
        startedAt: round.startedAt ?? now,
        dueAt: action.dueTime
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        status: 'round',
        timerStatus: 'idle',
      };
    }

    case 'PAUSE_ROUND':
      return { ...state, timerStatus: 'paused' };

    case 'RESUME_ROUND':
      return { ...state, timerStatus: 'running' };

    case 'TICK_TIMER': {
      const round = getCurrentRound(state);
      if (!round){
        return state;
      }
      
      const updatedRound: Round = {
        ...round,
        currentAt: action.currentTime
      };
      return {
        ...updateCurrentRound(state, updatedRound)
      };
    }

    case 'END_ROUND': {
      const round = getCurrentRound(state);
      if (!round) return state;
      const updatedRound: Round = {
        ...round,
        endedAt: Date.now()
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        status: 'scoring',
        timerStatus: 'ended'        
      };
    }

    case 'SUBMIT_SCORES': {
      const round = getCurrentRound(state);
      if (!round) return state;

      const results = buildRoundResults(round.matchups, action.scores);
      const snapshot = [...state.ladder];
      const { ladder } = applyLadderUpdate(state.ladder, results);

      const updatedRound: Round = {
        ...round,
        results,
        ladderSnapshot: ladder,
      };
      const rounds = [...state.rounds];
      rounds[state.currentRoundIndex] = updatedRound;
      const isFinalRound = round.number === TOTAL_ROUNDS;

      return {
        ...state,
        rounds,
        ladder,
        lastLadderSnapshot: snapshot,
        status: isFinalRound ? 'finished' : 'matchup_display',
      };
    }

    case 'INIT_ROUND': {
      if (state.rounds.length >= TOTAL_ROUNDS){
        return state;
      }

      const nextNumber = state.rounds.length + 1;
      const round = createRound(nextNumber, state.ladder, false);
      return {
        ...state,
        rounds: [...state.rounds, round],
        currentRoundIndex: state.rounds.length,
        status: 'round',
        timerStatus: 'idle',
        lastLadderSnapshot: null,
      };
    }

    case 'NEXT_ROUND': {
      if (state.rounds.length >= TOTAL_ROUNDS){
        return state;
      }

      const nextNumber = state.rounds.length + 1;
      const round = createRound(nextNumber, state.ladder, false);
      return {
        ...state,
        rounds: [...state.rounds, round],
        currentRoundIndex: state.rounds.length,
        status: 'matchup_display',
        timerStatus: 'idle',
        lastLadderSnapshot: null,
      };
    }

    case 'RESET_TOURNAMENT': {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      return createInitialState();
    }

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private stateSubject = new BehaviorSubject<TournamentState>(getInitialTournamentState());
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.state$.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      debounceTime(1000)
    ).subscribe((state) => {
      if (state.status === 'setup' && state.teams.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
  }

  get state(): TournamentState {
    return this.stateSubject.value;
  }

  dispatch(action: TournamentAction): void {
    const newState = tournamentReducer(this.stateSubject.value, action);
    this.stateSubject.next(newState);
  }

  select<K>(selector: (state: TournamentState) => K): Observable<K> {
    return this.state$.pipe(map(selector));
  }

  clearPersistedState(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
