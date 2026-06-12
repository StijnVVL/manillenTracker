import { useEffect, useRef } from 'react';
import { createInitialState } from '../state/tournamentReducer';
import type { TournamentState } from '../types';
import { STORAGE_KEY } from '../types';

export function loadPersistedState(): TournamentState | null {
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

export function getInitialTournamentState(): TournamentState {
  return loadPersistedState() ?? createInitialState();
}

export function useTournamentPersistence(state: TournamentState) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (state.status === 'setup' && state.teams.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
}

export function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}
