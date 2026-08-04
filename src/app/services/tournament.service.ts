import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';
import { applyLadderUpdate } from '../logic/ladder';
import { getAlgorithmById, DEFAULT_MATCHUP_ALGORITHM_ID } from '../logic/matchup-algorithm';
import { shuffle } from '../logic/pairing';
import { buildRoundResults } from '../logic/scoring';
import {
  DEFAULT_ROUND_DURATION_SECONDS,
  DEFAULT_TOTAL_ROUNDS,
  STORAGE_KEY,
  type Round,
  type Team,
  type TournamentState,
  type TournamentAction,
} from '../models/tournament.model';
import { SettingsService } from './settings.service';
import { DUMMY_TEAM_PRESENCE, USE_DUMMY_DATA } from '../data/dummy-teams';

function createTeam(name: string, player1: string, player2: string): Team {
  return { id: crypto.randomUUID(), name: name.trim(), player1: player1.trim(), player2: player2.trim() };
}

function createRound(number: number, teams: Team[], completedRounds: Round[], algorithmId: string, previouslyExcludedIds: string[], useRandom: boolean): Round {
  const algorithm = getAlgorithmById(algorithmId);
  const teamsToUse = useRandom ? shuffle([...teams]) : teams;
  const { matchups, excludedTeamId } = algorithm.buildMatchups(teamsToUse, completedRounds, previouslyExcludedIds);

  return {
    number,
    matchups,
    excludedTeamId,
    excludedTeamScore: null,
    startedAt: null,
    endedAt: null,
    dueAt: null,
    pausedAt: null
  };
}

function getCurrentRound(state: TournamentState): Round | null {
  if (state.rounds == null){
    return null;
  } 

  return state.rounds[state.rounds.length - 1];
}

function updateCurrentRound(state: TournamentState, round: Round): TournamentState {
  const rounds = [...state.rounds];
  rounds[rounds.length - 1] = round;
  return { ...state, rounds };
}

function createEmptyState(): TournamentState {
  return {
    tournamentName: '',
    teams: [],
    ladder: [],
    rounds: [],
    roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    matchupAlgorithmId: DEFAULT_MATCHUP_ALGORITHM_ID,
    status: 'none',
    timerStatus: 'idle',
    lastLadderSnapshot: null,
    teamPresence: {},
  };
}

function createInitialState(
  defaultTotalRounds = DEFAULT_TOTAL_ROUNDS,
  teams: Team[] = [],
  roundDurationSeconds = DEFAULT_ROUND_DURATION_SECONDS,
  tournamentName = '',
  teamPresence: Record<string, boolean> = {},
  matchupAlgorithmId = DEFAULT_MATCHUP_ALGORITHM_ID,
): TournamentState {
  return {
    tournamentName,
    teams: teams.map(t => ({ ...t })),
    ladder: [],
    rounds: [],
    roundDurationSeconds,
    totalRounds: defaultTotalRounds,
    matchupAlgorithmId,
    status: 'setup',
    timerStatus: 'idle',
    lastLadderSnapshot: null,
    teamPresence,
  };
}

function loadPersistedState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TournamentState;
    if (!parsed.teams || !Array.isArray(parsed.ladder)) return null;
    // Migrate existing teams to include player names if missing
    parsed.teams = parsed.teams.map(team => ({
      ...team,
      player1: team.player1 ?? '',
      player2: team.player2 ?? '',
    }));
    // Migrate teamPresence if missing
    parsed.teamPresence = parsed.teamPresence ?? {};
    // Migrate tournamentName if missing
    parsed.tournamentName = parsed.tournamentName ?? '';
    // Migrate matchupAlgorithmId if missing
    parsed.matchupAlgorithmId = parsed.matchupAlgorithmId ?? DEFAULT_MATCHUP_ALGORITHM_ID;
    // Migrate rounds: byeTeamId -> excludedTeamId
    if (parsed.rounds) {
      parsed.rounds = parsed.rounds.map(r => {
        const anyR = r as any;
        return {
          ...r,
          excludedTeamId: r.excludedTeamId ?? anyR['byeTeamId'] ?? null,
          excludedTeamScore: r.excludedTeamScore ?? null,
        };
      });
    }
    return parsed;
  } catch {
    return null;
  }
}

function tournamentReducer(
  state: TournamentState,
  action: TournamentAction,
): TournamentState {
  if (action.type != 'TICK_TIMER'){
    console.log("Action!", action.type);
  }

  switch (action.type) {
    case 'ADD_TEAM': {
      const name = action.name.trim();
      if (!name) return state;
      const team = action.id
        ? { id: action.id, name, player1: action.player1.trim(), player2: action.player2.trim() }
        : createTeam(name, action.player1, action.player2);
      return { ...state, teams: [...state.teams, team] };
    }

    case 'REMOVE_TEAM':
      return {
        ...state,
        teams: state.teams.filter((t) => t.id !== action.teamId),
        teamPresence: Object.fromEntries(
          Object.entries(state.teamPresence).filter(([id]) => id !== action.teamId)
        ),
      };

    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.teamId ? { ...t, name: action.name.trim(), player1: action.player1.trim(), player2: action.player2.trim() } : t,
        ),
      };

    case 'SET_MATCHUP_ALGORITHM_TOURNAMENT': {
      if (state.status !== 'setup') return state;
      return { ...state, matchupAlgorithmId: action.algorithmId };
    }

    case 'SET_TOURNAMENT_NAME': {
      if (state.status !== 'setup') return state;
      return { ...state, tournamentName: action.name };
    }

    case 'SET_SETUP_ROUND_DURATION': {
      if (state.status !== 'setup') return state;
      return { ...state, roundDurationSeconds: action.roundDurationSeconds };
    }

    case 'SET_TEAM_PRESENT': {
      if (state.status !== 'setup') return state;
      return { ...state, teamPresence: { ...state.teamPresence, [action.teamId]: true } };
    }

    case 'SET_TEAM_ABSENT': {
      if (state.status !== 'setup') return state;
      const { [action.teamId]: _, ...rest } = state.teamPresence;
      return { ...state, teamPresence: rest };
    }

    case 'SET_TOTAL_ROUNDS': {
      if (state.status !== 'setup') return state;
      const n = Math.round(Number(action.totalRounds));
      const totalRounds = (isFinite(n) && n >= 1 && n <= 10) ? n : DEFAULT_TOTAL_ROUNDS;
      return {
        ...state,
        totalRounds
      };
    }

    case 'START_TOURNAMENT': {
      if (state.teams.length < 2){
        return state;
      } 

      const ladder = state.teams.map((t) => t.id);
      const round = createRound(1, state.teams, [], state.matchupAlgorithmId, [], true);
      return {
        ...state,
        ladder,
        rounds: [round],
        status: 'round',
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
        timerStatus: 'running',
      };
    }

    case 'PAUSE_ROUND': {
      const round = getCurrentRound(state);
      if (!round){
        return state;
      } 
      const now = Date.now();
      const updatedRound: Round = {
        ...round,
        pausedAt: now
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        timerStatus: 'paused',
      };
    }

    case 'RESUME_ROUND': {
      const round = getCurrentRound(state);
      if (!round){
        return state;
      } 
      const now = Date.now();
      const dueAt = round.dueAt! + (now - round.pausedAt!);
      const updatedRound: Round = {
        ...round,
        pausedAt: null,
        dueAt: dueAt
      };
      return {
        ...updateCurrentRound(state, updatedRound),
        timerStatus: 'running',
      };
    }

    case 'TICK_TIMER': {
      return state;
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

    case 'UPDATE_SCORES': {
      const round = getCurrentRound(state);
      if (!round){ 
        return state;
      }

      // Update matchup scores directly
      const updatedMatchups = round.matchups.map(matchup => ({
        ...matchup,
        teamAScore: action.scores[matchup.teamAId],
        teamBScore: action.scores[matchup.teamBId]
      }));

      const updatedRound: Round = {
        ...round,
        matchups: updatedMatchups
      };
      const rounds = [...state.rounds];
      rounds[state.rounds.length - 1] = updatedRound;

      return {
        ...state,
        rounds
      };
    }

    case 'SUBMIT_SCORES': {
      const round = getCurrentRound(state);
      if (!round){ 
        return state;
      }

      // Update matchup scores
      const updatedMatchups = round.matchups.map(matchup => ({
        ...matchup,
        teamAScore: action.scores[matchup.teamAId],
        teamBScore: action.scores[matchup.teamBId]
      }));

      // Build results for ladder calculation
      const results = buildRoundResults(updatedMatchups, action.scores);

      // Compute excluded team score if applicable
      let excludedTeamScore: number | null = null;
      if (round.excludedTeamId) {
        const algorithm = getAlgorithmById(state.matchupAlgorithmId);
        excludedTeamScore = algorithm.calculateExcludedScore(results);
        results.push({ teamId: round.excludedTeamId, rawScore: excludedTeamScore, matchDiff: 0 });
      }

      const snapshot = [...state.ladder];
      const { ladder } = applyLadderUpdate(state.ladder, results);

      const updatedRound: Round = {
        ...round,
        matchups: updatedMatchups,
        excludedTeamScore,
        ladderSnapshot: ladder,
      };
      const rounds = [...state.rounds];
      rounds[state.rounds.length - 1] = updatedRound;

      return {
        ...state,
        rounds,
        ladder,
        lastLadderSnapshot: snapshot,
        status: 'round-winner'
      };
    }

    case 'INIT_ROUND': {
      return {
        ...state,
        status: 'round',
        timerStatus: 'idle',
        lastLadderSnapshot: null,
      };
    }

    case 'NEXT_ROUND': {
      const currentRound = getCurrentRound(state)!;
      const isFinalRound = currentRound.number === state.totalRounds;
      if (state.rounds.length >= state.totalRounds){
        return state;
      }

      const previouslyExcludedIds = state.rounds
        .map(r => r.excludedTeamId)
        .filter((id): id is string => id !== null);

      return {
        ...state,
        rounds: isFinalRound ? state.rounds : [...state.rounds, createRound(currentRound.number + 1, state.teams, state.rounds, state.matchupAlgorithmId, previouslyExcludedIds, false)],
        status: isFinalRound ? 'finished' : 'round',
        timerStatus: 'idle',
        lastLadderSnapshot: null,
      };
    }

    case 'STOP_TOURNAMENT': {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      return createEmptyState();
    }

    case 'RESET_TOURNAMENT': {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      const initialPresence = USE_DUMMY_DATA ? DUMMY_TEAM_PRESENCE : {};
      return createInitialState(action.defaultTotalRounds, action.teams, action.roundDurationSeconds, action.tournamentName, initialPresence, action.matchupAlgorithmId);
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
  private stateSubject: BehaviorSubject<TournamentState>;
  public state$: Observable<TournamentState>;

  constructor(private settingsService: SettingsService) {
    const initialState = loadPersistedState() ?? createEmptyState();
    this.stateSubject = new BehaviorSubject<TournamentState>(initialState);
    this.state$ = this.stateSubject.asObservable();

    // Persist state changes to localStorage
    this.state$.pipe(
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe((state) => {
      this.persistState(state);
    });
  }

  private persistState(state: TournamentState): void {
    if (state.status === 'none' || (state.status === 'setup' && state.teams.length === 0)) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  get state(): TournamentState {
    return this.stateSubject.value;
  }

  dispatch(action: TournamentAction): void {
    let processedAction = action;
    if (action.type === 'RESET_TOURNAMENT') {
      const s = this.settingsService.state;
      processedAction = {
        ...action,
        defaultTotalRounds: s.defaultTotalRounds,
        teams: s.teams,
        roundDurationSeconds: s.roundDurationMinutes * 60,
        tournamentName: s.defaultTournamentName,
        matchupAlgorithmId: s.matchupAlgorithmId,
      };
    }
    const newState = tournamentReducer(this.stateSubject.value, processedAction);
    this.stateSubject.next(newState);
  }

  select<K>(selector: (state: TournamentState) => K): Observable<K> {
    return this.state$.pipe(map(selector));
  }

  clearPersistedState(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
