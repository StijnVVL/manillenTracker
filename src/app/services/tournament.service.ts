import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, distinctUntilChanged } from 'rxjs';
import { getExclusionPickerById, getExclusionScorerById, DEFAULT_EXCLUSION_PICKER_ID, DEFAULT_EXCLUSION_SCORER_ID } from '../logic/matchup-algorithm';
import { buildRoundResults } from '../logic/scoring';
import {
  DEFAULT_ROUND_DURATION_SECONDS,
  DEFAULT_TOTAL_ROUNDS,
  DEFAULT_SPONSOR_INTERVAL_SECONDS,
  DEFAULT_POINTS_60_0,
  sanitizePoints60_0,
  STORAGE_KEY,
  type LadderSnapshotEntry,
  type Round,
  type Team,
  type TournamentState,
  type TournamentAction,
  type CommandRecord,
  type UndoableActionType,
} from '../models/tournament.model';
import { SettingsService } from './settings.service';

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
    points60_0: DEFAULT_POINTS_60_0,
    undoStack: [],
    redoStack: [],
  };
}

function createInitialState(
  defaultTotalRounds = DEFAULT_TOTAL_ROUNDS,
  teams: Team[] = [],
  roundDurationSeconds = DEFAULT_ROUND_DURATION_SECONDS,
  tournamentName = '',
  exclusionPickerId = DEFAULT_EXCLUSION_PICKER_ID,
  exclusionScorerId = DEFAULT_EXCLUSION_SCORER_ID,
  showSponsors = true,
  sponsorIntervalSeconds = DEFAULT_SPONSOR_INTERVAL_SECONDS,
  points60_0 = DEFAULT_POINTS_60_0,
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
    points60_0,
    undoStack: [],
    redoStack: [],
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
    // Migrate existing teams to include player names if missing,
    // and merge legacy teamPresence record into per-team present flags.
    const legacyPresence = (anyParsed['teamPresence'] ?? {}) as Record<string, boolean>;
    parsed.teams = parsed.teams.map(team => ({
      ...team,
      player1: team.player1 ?? '',
      player2: team.player2 ?? '',
      present: team.present ?? !!legacyPresence[team.id],
    }));
    delete anyParsed['teamPresence'];
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
    // Migrate points60_0 if missing
    parsed.points60_0 = sanitizePoints60_0(parsed.points60_0);
    // Migrate undo/redo stacks if missing (older saves predate undo/redo)
    parsed.undoStack = Array.isArray(parsed.undoStack) ? parsed.undoStack : [];
    parsed.redoStack = Array.isArray(parsed.redoStack) ? parsed.redoStack : [];
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
      return { ...state, teams: state.teams.map((t) => t.id === action.teamId ? { ...t, present: true } : t) };
    }

    case 'SET_TEAM_ABSENT': {
      if (state.status !== 'setup') return state;
      return { ...state, teams: state.teams.map((t) => t.id === action.teamId ? { ...t, present: false } : t) };
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

    case 'SET_POINTS_60_0_TOURNAMENT': {
      if (state.status !== 'setup') return state;
      return {
        ...state,
        points60_0: sanitizePoints60_0(action.points60_0),
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
      if (!isFinalRound && state.rounds.length >= state.totalRounds){
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
      return createInitialState(action.defaultTotalRounds, action.teams, action.roundDurationSeconds, action.tournamentName, action.exclusionPickerId, action.exclusionScorerId, true, DEFAULT_SPONSOR_INTERVAL_SECONDS, action.points60_0);
    }

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}

/**
 * A single undoable command: up() applies the change (and, on first run,
 * captures into cmd.memento any non-deterministic artifacts or prior-state
 * values its own down() will need). down() reverses the change using only
 * cmd.memento, so it never references any other command.
 *
 * up() must be deterministic across re-runs (redo): once an artifact (e.g. a
 * generated team id or a generated round) is captured in the memento, later
 * runs reuse it instead of regenerating.
 */
interface UndoableCommand {
  up(state: TournamentState, cmd: CommandRecord): TournamentState;
  down(state: TournamentState, cmd: CommandRecord): TournamentState;
}

const UNDOABLE_COMMANDS: Record<UndoableActionType, UndoableCommand> = {
  ADD_TEAM: {
    up(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'ADD_TEAM' }>;
      const name = action.name.trim();
      if (!name) return state;
      // Capture the generated id once so redo reproduces the same team.
      const id = (cmd.memento['id'] as string | undefined) ?? action.id ?? crypto.randomUUID();
      cmd.memento['id'] = id;
      const team: Team = { id, name, player1: action.player1.trim(), player2: action.player2.trim() };
      return { ...state, teams: [...state.teams, team] };
    },
    down(state, cmd) {
      const id = cmd.memento['id'] as string;
      return { ...state, teams: state.teams.filter(t => t.id !== id) };
    },
  },

  REMOVE_TEAM: {
    up(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'REMOVE_TEAM' }>;
      const index = state.teams.findIndex(t => t.id === action.teamId);
      if (index === -1) return state;
      // Capture the removed team and its position so down() can restore it exactly.
      cmd.memento['team'] = { ...state.teams[index] };
      cmd.memento['index'] = index;
      return { ...state, teams: state.teams.filter(t => t.id !== action.teamId) };
    },
    down(state, cmd) {
      const team = cmd.memento['team'] as Team | undefined;
      const index = cmd.memento['index'] as number | undefined;
      if (!team || index === undefined) return state;
      const teams = [...state.teams];
      teams.splice(index, 0, { ...team });
      return { ...state, teams };
    },
  },

  UPDATE_TEAM: {
    up(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'UPDATE_TEAM' }>;
      const prev = state.teams.find(t => t.id === action.teamId);
      if (!prev) return state;
      // Capture the prior name/players so down() can restore them.
      cmd.memento['prev'] = { name: prev.name, player1: prev.player1, player2: prev.player2 };
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.teamId
            ? { ...t, name: action.name.trim(), player1: action.player1.trim(), player2: action.player2.trim() }
            : t,
        ),
      };
    },
    down(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'UPDATE_TEAM' }>;
      const prev = cmd.memento['prev'] as { name: string; player1: string; player2: string } | undefined;
      if (!prev) return state;
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.teamId ? { ...t, name: prev.name, player1: prev.player1, player2: prev.player2 } : t,
        ),
      };
    },
  },

  START_TOURNAMENT: {
    up(state, cmd) {
      if (state.status !== 'setup' || state.teams.length < 2) return state;
      // Capture prior state so down() can restore setup, and the generated
      // snapshot/round so redo reproduces the same random draw.
      cmd.memento['prevPostRoundLadderSnapshot'] = state.postRoundLadderSnapshot;
      cmd.memento['prevRounds'] = state.rounds;
      cmd.memento['prevStatus'] = state.status;
      cmd.memento['prevTimerStatus'] = state.timerStatus;
      const snapshot = (cmd.memento['snapshot'] as LadderSnapshotEntry[] | undefined) ?? buildInitialSnapshot(state.teams);
      const round = (cmd.memento['round'] as Round | undefined) ?? createRound(1, state.teams, snapshot, state.exclusionPickerId);
      cmd.memento['snapshot'] = snapshot;
      cmd.memento['round'] = round;
      return {
        ...state,
        postRoundLadderSnapshot: snapshot,
        rounds: [round],
        status: 'round',
        timerStatus: 'idle',
      };
    },
    down(state, cmd) {
      const prevStatus = cmd.memento['prevStatus'] as TournamentState['status'] | undefined;
      const prevTimerStatus = cmd.memento['prevTimerStatus'] as TournamentState['timerStatus'] | undefined;
      if (prevStatus === undefined || prevTimerStatus === undefined) return state;
      return {
        ...state,
        postRoundLadderSnapshot: cmd.memento['prevPostRoundLadderSnapshot'] as LadderSnapshotEntry[],
        rounds: cmd.memento['prevRounds'] as Round[],
        status: prevStatus,
        timerStatus: prevTimerStatus,
      };
    },
  },

  START_ROUND: {
    up(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'START_ROUND' }>;
      const round = getCurrentRound(state);
      if (!round) return state;

      // Capture prior flow state and the round as it was, so down() restores
      // exactly what existed before the round was started.
      cmd.memento['prevRound'] = JSON.parse(JSON.stringify(round));
      cmd.memento['prevStatus'] = state.status;
      cmd.memento['prevTimerStatus'] = state.timerStatus;

      // Capture the generated startedAt once so redo reproduces the same value.
      const startedAt = (cmd.memento['startedAt'] as number | undefined) ?? round.startedAt ?? Date.now();
      cmd.memento['startedAt'] = startedAt;

      const updatedRound: Round = { ...round, startedAt, dueAt: action.dueTime };
      return { ...updateCurrentRound(state, updatedRound), status: 'round', timerStatus: 'running' };
    },
    down(state, cmd) {
      const prevRound = cmd.memento['prevRound'] as Round | undefined;
      const prevStatus = cmd.memento['prevStatus'] as TournamentState['status'] | undefined;
      const prevTimerStatus = cmd.memento['prevTimerStatus'] as TournamentState['timerStatus'] | undefined;
      if (!prevRound || prevStatus === undefined || prevTimerStatus === undefined) return state;
      return {
        ...updateCurrentRound(state, JSON.parse(JSON.stringify(prevRound))),
        status: prevStatus,
        timerStatus: prevTimerStatus,
      };
    },
  },

  END_ROUND: {
    up(state, cmd) {
      const round = getCurrentRound(state);
      if (!round) return state;

      // Capture prior flow state and the round as it was, so down() restores
      // exactly what existed before the round was ended.
      cmd.memento['prevRound'] = JSON.parse(JSON.stringify(round));
      cmd.memento['prevStatus'] = state.status;
      cmd.memento['prevTimerStatus'] = state.timerStatus;

      // Capture the generated endedAt once so redo reproduces the same value.
      const endedAt = (cmd.memento['endedAt'] as number | undefined) ?? Date.now();
      cmd.memento['endedAt'] = endedAt;

      const updatedRound: Round = { ...round, endedAt };
      return { ...updateCurrentRound(state, updatedRound), status: 'scoring', timerStatus: 'ended' };
    },
    down(state, cmd) {
      const prevRound = cmd.memento['prevRound'] as Round | undefined;
      const prevStatus = cmd.memento['prevStatus'] as TournamentState['status'] | undefined;
      const prevTimerStatus = cmd.memento['prevTimerStatus'] as TournamentState['timerStatus'] | undefined;
      if (!prevRound || prevStatus === undefined || prevTimerStatus === undefined) return state;
      return {
        ...updateCurrentRound(state, JSON.parse(JSON.stringify(prevRound))),
        status: prevStatus,
        timerStatus: prevTimerStatus,
      };
    },
  },

  SUBMIT_SCORES: {
    up(state, cmd) {
      const action = cmd.action as Extract<TournamentAction, { type: 'SUBMIT_SCORES' }>;
      const round = getCurrentRound(state);
      if (!round) return state;

      // Capture everything SUBMIT_SCORES overwrites so down() restores the
      // pre-bake state (a state the UI cannot otherwise reach).
      cmd.memento['prevRound'] = JSON.parse(JSON.stringify(round));
      cmd.memento['prevPostRoundLadderSnapshot'] = JSON.parse(JSON.stringify(state.postRoundLadderSnapshot));
      cmd.memento['prevStatus'] = state.status;

      const updatedMatchups = round.matchups.map(matchup => ({
        ...matchup,
        teamAScore: action.scores[matchup.teamAId],
        teamBScore: action.scores[matchup.teamBId],
      }));

      const results = buildRoundResults(updatedMatchups, action.scores);

      let excludedTeamScore: number | null = null;
      if (round.excludedTeamId) {
        const scorer = getExclusionScorerById(state.exclusionScorerId);
        excludedTeamScore = scorer.calculateExcludedScore(results);
        results.push({ teamId: round.excludedTeamId, rawScore: excludedTeamScore, matchDiff: 0 });
      }

      const updatedRound: Round = { ...round, matchups: updatedMatchups, excludedTeamScore };
      const rounds = [...state.rounds];
      rounds[state.rounds.length - 1] = updatedRound;

      const postRoundLadderSnapshot = applyRoundDelta(round.preRoundLadderSnapshot, updatedRound, state.teams);

      return { ...state, rounds, postRoundLadderSnapshot, status: 'round-winner' };
    },
    down(state, cmd) {
      const prevRound = cmd.memento['prevRound'] as Round | undefined;
      const prevSnapshot = cmd.memento['prevPostRoundLadderSnapshot'] as LadderSnapshotEntry[] | undefined;
      const prevStatus = cmd.memento['prevStatus'] as TournamentState['status'] | undefined;
      if (!prevRound || !prevSnapshot || !prevStatus) return state;
      const rounds = [...state.rounds];
      rounds[rounds.length - 1] = JSON.parse(JSON.stringify(prevRound));
      return {
        ...state,
        rounds,
        postRoundLadderSnapshot: JSON.parse(JSON.stringify(prevSnapshot)),
        status: prevStatus,
      };
    },
  },

  NEXT_ROUND: {
    up(state, cmd) {
      const currentRound = getCurrentRound(state);
      if (!currentRound) return state;

      const isFinalRound = currentRound.number === state.totalRounds;
      // Block only appending a new round past the limit; the final round must
      // still be allowed to transition the tournament to 'finished'.
      if (!isFinalRound && state.rounds.length >= state.totalRounds) return state;

      // Capture prior flow state and (for non-final rounds) the generated round,
      // so down() can reverse exactly and redo() reproduces the same round.
      cmd.memento['prevStatus'] = state.status;
      cmd.memento['prevTimerStatus'] = state.timerStatus;
      cmd.memento['appended'] = !isFinalRound;

      let newRound = cmd.memento['newRound'] as Round | undefined;
      if (!isFinalRound && !newRound) {
        newRound = createRound(currentRound.number + 1, state.teams, state.postRoundLadderSnapshot, state.exclusionPickerId);
        cmd.memento['newRound'] = newRound;
      }

      return {
        ...state,
        rounds: isFinalRound ? state.rounds : [...state.rounds, JSON.parse(JSON.stringify(newRound))],
        status: isFinalRound ? 'finished' : 'round',
        timerStatus: 'idle',
      };
    },
    down(state, cmd) {
      const appended = cmd.memento['appended'] as boolean | undefined;
      const prevStatus = cmd.memento['prevStatus'] as TournamentState['status'] | undefined;
      const prevTimerStatus = cmd.memento['prevTimerStatus'] as TournamentState['timerStatus'] | undefined;
      if (prevStatus === undefined || prevTimerStatus === undefined) return state;
      const rounds = appended ? state.rounds.slice(0, -1) : [...state.rounds];
      return { ...state, rounds, status: prevStatus, timerStatus: prevTimerStatus };
    },
  },
};

const UNDOABLE_TYPES = new Set<string>(Object.keys(UNDOABLE_COMMANDS));

@Injectable({
  providedIn: 'root',
})
export class TournamentService {
  private stateSubject: BehaviorSubject<TournamentState>;
  public state$: Observable<TournamentState>;
  /** Emits whether an undo is currently available. */
  public canUndo$: Observable<boolean>;
  /** Emits whether a redo is currently available. */
  public canRedo$: Observable<boolean>;

  constructor(private settingsService: SettingsService) {
    const initialState = loadPersistedState() ?? createEmptyState();
    this.stateSubject = new BehaviorSubject<TournamentState>(initialState);
    this.state$ = this.stateSubject.asObservable();
    this.canUndo$ = this.state$.pipe(map((s) => s.undoStack.length > 0), distinctUntilChanged());
    this.canRedo$ = this.state$.pipe(map((s) => s.redoStack.length > 0), distinctUntilChanged());

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
        points60_0: s.points60_0,
      };
    }

    // Undoable commands are routed through the command registry: run up(),
    // record the command on the undoStack, and clear the redoStack.
    if (UNDOABLE_TYPES.has(processedAction.type)) {
      const current = this.stateSubject.value;
      const cmd: CommandRecord = {
        type: processedAction.type as UndoableActionType,
        action: processedAction,
        memento: {},
      };
      const command = UNDOABLE_COMMANDS[cmd.type];
      const afterUp = command.up(current, cmd);
      // If the command was a no-op (guard failed) leave the stacks untouched.
      if (afterUp === current) {
        this.stateSubject.next(afterUp);
        return;
      }
      this.stateSubject.next({
        ...afterUp,
        undoStack: [...afterUp.undoStack, cmd],
        redoStack: [],
      });
      return;
    }

    // Non-undoable actions run through the reducer and never touch the stacks.
    const newState = tournamentReducer(this.stateSubject.value, processedAction);
    this.stateSubject.next(newState);
  }

  /** Whether there is at least one command that can be undone. */
  get canUndo(): boolean {
    return this.stateSubject.value.undoStack.length > 0;
  }

  /** Whether there is at least one command that can be redone. */
  get canRedo(): boolean {
    return this.stateSubject.value.redoStack.length > 0;
  }

  /** Reverse the most recent undoable command, moving it onto the redo stack. */
  undo(): void {
    const state = this.stateSubject.value;
    if (state.undoStack.length === 0) return;
    const cmd = state.undoStack[state.undoStack.length - 1];
    const afterDown = UNDOABLE_COMMANDS[cmd.type].down(state, cmd);
    this.stateSubject.next({
      ...afterDown,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, cmd],
    });
  }

  /** Re-apply the most recently undone command, moving it back onto the undo stack. */
  redo(): void {
    const state = this.stateSubject.value;
    if (state.redoStack.length === 0) return;
    const cmd = state.redoStack[state.redoStack.length - 1];
    const afterUp = UNDOABLE_COMMANDS[cmd.type].up(state, cmd);
    this.stateSubject.next({
      ...afterUp,
      undoStack: [...state.undoStack, cmd],
      redoStack: state.redoStack.slice(0, -1),
    });
  }

  select<K>(selector: (state: TournamentState) => K): Observable<K> {
    return this.state$.pipe(map(selector));
  }

  clearPersistedState(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
