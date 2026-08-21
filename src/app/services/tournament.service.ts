import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';
import { getExclusionPickerById, getExclusionScorerById, DEFAULT_EXCLUSION_PICKER_ID, DEFAULT_EXCLUSION_SCORER_ID } from '../logic/matchup-algorithm';
import { buildRoundResults } from '../logic/scoring';
import {
  DEFAULT_ROUND_DURATION_SECONDS,
  DEFAULT_TOTAL_ROUNDS,
  DEFAULT_SPONSOR_INTERVAL_SECONDS,
  STORAGE_KEY,
  type LadderSnapshotEntry,
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

function buildInitialSnapshot(teams: Team[]): LadderSnapshotEntry[] {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  return shuffled.map(t => ({ teamId: t.id, wins: 0, exclusions: 0, cumulativeScore: 0, roundScores: [] }));
}

function createRound(number: number, teams: Team[], preRoundSnapshot: LadderSnapshotEntry[], exclusionPickerId: string): Round {
  const picker = getExclusionPickerById(exclusionPickerId);
  const { matchups, excludedTeamId, preRoundLadderSnapshot } = picker.buildMatchups(teams, preRoundSnapshot);

  return {
    number,
    matchups,
    excludedTeamId,
    excludedTeamScore: null,
    preRoundLadderSnapshot,
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

function applyRoundDelta(
  preRoundSnapshot: LadderSnapshotEntry[],
  round: Round,
  teams: Team[],
): LadderSnapshotEntry[] {
  const statsMap = new Map<string, LadderSnapshotEntry>();
  for (const entry of preRoundSnapshot) {
    statsMap.set(entry.teamId, {
      ...entry,
      roundScores: [...entry.roundScores],
    });
  }
  // Ensure every team has an entry (handles round 1 empty snapshot)
  for (const t of teams) {
    if (!statsMap.has(t.id)) {
      statsMap.set(t.id, { teamId: t.id, wins: 0, exclusions: 0, cumulativeScore: 0, roundScores: [] });
    }
  }

  for (const m of round.matchups) {
    if (m.teamAScore === undefined || m.teamBScore === undefined) continue;
    const a = statsMap.get(m.teamAId)!;
    const b = statsMap.get(m.teamBId)!;
    if (m.teamAScore >= m.teamBScore) a.wins++;
    if (m.teamBScore >= m.teamAScore) b.wins++;
    a.cumulativeScore += m.teamAScore;
    b.cumulativeScore += m.teamBScore;
    a.roundScores.push(m.teamAScore);
    b.roundScores.push(m.teamBScore);
  }

  if (round.excludedTeamId && round.excludedTeamScore !== null && round.excludedTeamScore !== undefined) {
    const ex = statsMap.get(round.excludedTeamId)!;
    ex.wins++;
    ex.exclusions++;
    ex.cumulativeScore += round.excludedTeamScore;
    ex.roundScores.push(round.excludedTeamScore);
  }

  const nameOf = (id: string) => teams.find(t => t.id === id)?.name ?? '';
  return [...statsMap.values()].sort((a, b) => {
    const wDiff = b.wins - a.wins;
    if (wDiff !== 0) return wDiff;
    const sDiff = b.cumulativeScore - a.cumulativeScore;
    if (sDiff !== 0) return sDiff;
    return nameOf(a.teamId).localeCompare(nameOf(b.teamId), undefined, { sensitivity: 'base' });
  });
}

function createEmptyState(): TournamentState {
  return {
    tournamentName: '',
    showSponsors: true,
    sponsorIntervalSeconds: DEFAULT_SPONSOR_INTERVAL_SECONDS,
    teams: [],
    postRoundLadderSnapshot: [],
    rounds: [],
    roundDurationSeconds: DEFAULT_ROUND_DURATION_SECONDS,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    exclusionPickerId: DEFAULT_EXCLUSION_PICKER_ID,
    exclusionScorerId: DEFAULT_EXCLUSION_SCORER_ID,
    status: 'none',
    timerStatus: 'idle',
    teamPresence: {},
  };
}

function createInitialState(
  defaultTotalRounds = DEFAULT_TOTAL_ROUNDS,
  teams: Team[] = [],
  roundDurationSeconds = DEFAULT_ROUND_DURATION_SECONDS,
  tournamentName = '',
  teamPresence: Record<string, boolean> = {},
  exclusionPickerId = DEFAULT_EXCLUSION_PICKER_ID,
  exclusionScorerId = DEFAULT_EXCLUSION_SCORER_ID,
  showSponsors = true,
  sponsorIntervalSeconds = DEFAULT_SPONSOR_INTERVAL_SECONDS,
): TournamentState {
  return {
    tournamentName,
    showSponsors,
    sponsorIntervalSeconds,
    teams: teams.map(t => ({ ...t })),
    postRoundLadderSnapshot: [],
    rounds: [],
    roundDurationSeconds,
    totalRounds: defaultTotalRounds,
    exclusionPickerId,
    exclusionScorerId,
    status: 'setup',
    timerStatus: 'idle',
    teamPresence,
  };
}

function backupPersistedState(): void {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}-${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  localStorage.setItem(`${STORAGE_KEY}.${stamp}`, raw);
}

function loadPersistedState(): TournamentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TournamentState;
    const anyParsed = parsed as any;
    if (!parsed.teams || (!Array.isArray(parsed.postRoundLadderSnapshot) && !Array.isArray(anyParsed['ladder']))) return null;
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
    // Migrate showSponsors if missing
    parsed.showSponsors = parsed.showSponsors ?? true;
    // Migrate sponsorIntervalSeconds if missing
    parsed.sponsorIntervalSeconds = parsed.sponsorIntervalSeconds ?? DEFAULT_SPONSOR_INTERVAL_SECONDS;
    // Migrate exclusionPickerId / exclusionScorerId (previously matchupAlgorithmId)
    const anyParsed2 = parsed as any;
    parsed.exclusionPickerId = parsed.exclusionPickerId ?? anyParsed2['matchupAlgorithmId'] ?? DEFAULT_EXCLUSION_PICKER_ID;
    parsed.exclusionScorerId = parsed.exclusionScorerId ?? DEFAULT_EXCLUSION_SCORER_ID;
    // Migrate postRoundLadderSnapshot (old field was 'ladder': string[])
    if (!Array.isArray(parsed.postRoundLadderSnapshot)) {
      parsed.postRoundLadderSnapshot = [];
    }
    // Migrate rounds: old ladderSnapshot field -> preRoundLadderSnapshot; old string[] -> empty
    if (parsed.rounds) {
      parsed.rounds = parsed.rounds.map(r => {
        const anyR = r as any;
        const snap = anyR['preRoundLadderSnapshot'] ?? anyR['ladderSnapshot'];
        return {
          ...r,
          excludedTeamId: r.excludedTeamId ?? null,
          excludedTeamScore: r.excludedTeamScore ?? null,
          preRoundLadderSnapshot: (Array.isArray(snap) && snap.length > 0 && typeof snap[0] === 'string') ? [] : (snap ?? []),
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

    case 'SET_EXCLUSION_PICKER_TOURNAMENT': {
      if (state.status !== 'setup') return state;
      return { ...state, exclusionPickerId: action.exclusionPickerId };
    }

    case 'SET_EXCLUSION_SCORER_TOURNAMENT': {
      if (state.status !== 'setup') return state;
      return { ...state, exclusionScorerId: action.exclusionScorerId };
    }

    case 'SET_TOURNAMENT_NAME': {
      return { ...state, tournamentName: action.name };
    }

    case 'SET_SHOW_SPONSORS': {
      return { ...state, showSponsors: action.showSponsors };
    }

    case 'SET_SPONSOR_INTERVAL': {
      return { ...state, sponsorIntervalSeconds: action.sponsorIntervalSeconds };
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

      const initialSnapshot = buildInitialSnapshot(state.teams);
      const round = createRound(1, state.teams, initialSnapshot, state.exclusionPickerId);
      return {
        ...state,
        postRoundLadderSnapshot: initialSnapshot,
        rounds: [round],
        status: 'round',
        timerStatus: 'idle',
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

      // Build results for excluded score calculation
      const results = buildRoundResults(updatedMatchups, action.scores);

      // Compute excluded team score if applicable
      let excludedTeamScore: number | null = null;
      if (round.excludedTeamId) {
        const scorer = getExclusionScorerById(state.exclusionScorerId);
        excludedTeamScore = scorer.calculateExcludedScore(results);
        results.push({ teamId: round.excludedTeamId, rawScore: excludedTeamScore, matchDiff: 0 });
      }

      const updatedRound: Round = {
        ...round,
        matchups: updatedMatchups,
        excludedTeamScore,
      };
      const rounds = [...state.rounds];
      rounds[state.rounds.length - 1] = updatedRound;

      const postRoundLadderSnapshot = applyRoundDelta(round.preRoundLadderSnapshot, updatedRound, state.teams);

      return {
        ...state,
        rounds,
        postRoundLadderSnapshot,
        status: 'round-winner'
      };
    }

    case 'INIT_ROUND': {
      return {
        ...state,
        status: 'round',
        timerStatus: 'idle',
      };
    }

    case 'NEXT_ROUND': {
      const currentRound = getCurrentRound(state)!;
      const isFinalRound = currentRound.number === state.totalRounds;
      if (state.rounds.length >= state.totalRounds){
        return state;
      }

      return {
        ...state,
        rounds: isFinalRound ? state.rounds : [...state.rounds, createRound(currentRound.number + 1, state.teams, state.postRoundLadderSnapshot, state.exclusionPickerId)],
        status: isFinalRound ? 'finished' : 'round',
        timerStatus: 'idle',
      };
    }

    case 'STOP_TOURNAMENT':
      if (typeof localStorage !== 'undefined') {
        backupPersistedState();
        localStorage.removeItem(STORAGE_KEY);
      }
      return createEmptyState();

    case 'RESET_TOURNAMENT': {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      const initialPresence = USE_DUMMY_DATA ? DUMMY_TEAM_PRESENCE : {};
      return createInitialState(action.defaultTotalRounds, action.teams, action.roundDurationSeconds, action.tournamentName, initialPresence, action.exclusionPickerId, action.exclusionScorerId);
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
        exclusionPickerId: s.exclusionPickerId,
        exclusionScorerId: s.exclusionScorerId,
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
