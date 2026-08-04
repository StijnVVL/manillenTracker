import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_MATCHUP_ALGORITHM_ID,
  DEFAULT_ROUND_DURATION_MINUTES,
  DEFAULT_TOTAL_ROUNDS,
  SETTINGS_STORAGE_KEY,
  sanitizeRoundDurationMinutes,
  sanitizeTotalRounds,
  type SettingsAction,
  type SettingsState,
  type SupportedLanguage,
} from '../models/settings.model';
import { type Team } from '../models/tournament.model';
import { DUMMY_TEAMS, USE_DUMMY_DATA } from '../data/dummy-teams';

function createTeam(name: string, player1: string, player2: string): Team {
  return { id: crypto.randomUUID(), name: name.trim(), player1: player1.trim(), player2: player2.trim() };
}

function createDefaultSettings(): SettingsState {
  return {
    defaultTournamentName: '',
    roundDurationMinutes: DEFAULT_ROUND_DURATION_MINUTES,
    defaultTotalRounds: DEFAULT_TOTAL_ROUNDS,
    language: DEFAULT_LANGUAGE,
    matchupAlgorithmId: DEFAULT_MATCHUP_ALGORITHM_ID,
    teams: USE_DUMMY_DATA ? [...DUMMY_TEAMS] : [],
  };
}

function loadPersistedSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultSettings();
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      defaultTournamentName: typeof parsed.defaultTournamentName === 'string' ? parsed.defaultTournamentName : '',
      roundDurationMinutes: sanitizeRoundDurationMinutes(parsed.roundDurationMinutes),
      defaultTotalRounds: sanitizeTotalRounds(parsed.defaultTotalRounds),
      language: (parsed.language === 'en-GB' || parsed.language === 'nl-BE')
        ? parsed.language as SupportedLanguage
        : DEFAULT_LANGUAGE,
      matchupAlgorithmId: typeof parsed.matchupAlgorithmId === 'string' ? parsed.matchupAlgorithmId : DEFAULT_MATCHUP_ALGORITHM_ID,
      teams: Array.isArray(parsed.teams) ? parsed.teams : (USE_DUMMY_DATA ? [...DUMMY_TEAMS] : []),
    };
  } catch {
    return createDefaultSettings();
  }
}

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'SET_DEFAULT_TOURNAMENT_NAME':
      return { ...state, defaultTournamentName: action.name };

    case 'SET_ROUND_DURATION':
      return { ...state, roundDurationMinutes: sanitizeRoundDurationMinutes(action.minutes) };

    case 'SET_DEFAULT_TOTAL_ROUNDS':
      return { ...state, defaultTotalRounds: sanitizeTotalRounds(action.totalRounds) };

    case 'SET_LANGUAGE':
      return { ...state, language: action.language };

    case 'SET_MATCHUP_ALGORITHM':
      return { ...state, matchupAlgorithmId: action.algorithmId };

    case 'ADD_SETTINGS_TEAM': {
      const name = action.name.trim();
      if (!name) return state;
      const team = createTeam(name, action.player1, action.player2);
      return { ...state, teams: [...state.teams, team] };
    }

    case 'REMOVE_SETTINGS_TEAM':
      return { ...state, teams: state.teams.filter(t => t.id !== action.teamId) };

    case 'UPDATE_SETTINGS_TEAM':
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.teamId
            ? { ...t, name: action.name.trim(), player1: action.player1.trim(), player2: action.player2.trim() }
            : t
        ),
      };

    default:
      return state;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private stateSubject = new BehaviorSubject<SettingsState>(loadPersistedSettings());
  public state$ = this.stateSubject.asObservable();

  constructor() {
    this.state$.subscribe((state) => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
    });
  }

  get state(): SettingsState {
    return this.stateSubject.value;
  }

  dispatch(action: SettingsAction): void {
    const newState = settingsReducer(this.stateSubject.value, action);
    this.stateSubject.next(newState);
  }
}
