import { Team } from './tournament.model';
import { DEFAULT_EXCLUSION_PICKER_ID, DEFAULT_EXCLUSION_SCORER_ID } from '../logic/matchup-algorithm';

export type SupportedLanguage = 'en-GB' | 'nl-BE';

export interface LanguageOption {
  code: SupportedLanguage;
  nameKey: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-GB', nameKey: 'language.english' },
  { code: 'nl-BE', nameKey: 'language.dutch' },
];

export interface SettingsState {
  defaultTournamentName: string;
  roundDurationMinutes: number;
  defaultTotalRounds: number;
  language: SupportedLanguage;
  exclusionPickerId: string;
  exclusionScorerId: string;
  teams: Team[];
}

export const DEFAULT_ROUND_DURATION_MINUTES = 25;
export const DEFAULT_TOTAL_ROUNDS = 5;
export const MAX_ROUND_DURATION_MINUTES = 120;
export const MAX_TOTAL_ROUNDS = 10;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en-GB';
export const SETTINGS_STORAGE_KEY = 'manillen-settings';
export { DEFAULT_EXCLUSION_PICKER_ID, DEFAULT_EXCLUSION_SCORER_ID };

export type SettingsAction =
  | { type: 'SET_DEFAULT_TOURNAMENT_NAME'; name: string }
  | { type: 'SET_ROUND_DURATION'; minutes: number }
  | { type: 'SET_DEFAULT_TOTAL_ROUNDS'; totalRounds: number }
  | { type: 'SET_LANGUAGE'; language: SupportedLanguage }
  | { type: 'SET_EXCLUSION_PICKER'; exclusionPickerId: string }
  | { type: 'SET_EXCLUSION_SCORER'; exclusionScorerId: string }
  | { type: 'ADD_SETTINGS_TEAM'; name: string; player1: string; player2: string; id?: string }
  | { type: 'REMOVE_SETTINGS_TEAM'; teamId: string }
  | { type: 'UPDATE_SETTINGS_TEAM'; teamId: string; name: string; player1: string; player2: string };

export function sanitizeRoundDurationMinutes(value: unknown): number {
  const n = Math.round(Number(value));
  if (!isFinite(n) || n < 1 || n > MAX_ROUND_DURATION_MINUTES) {
    return DEFAULT_ROUND_DURATION_MINUTES;
  }
  return n;
}

export function sanitizeTotalRounds(value: unknown): number {
  const n = Math.round(Number(value));
  if (!isFinite(n) || n < 1 || n > MAX_TOTAL_ROUNDS) {
    return DEFAULT_TOTAL_ROUNDS;
  }
  return n;
}
