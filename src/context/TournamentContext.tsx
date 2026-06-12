import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { useTournamentPersistence, getInitialTournamentState } from '../hooks/useTournamentPersistence';
import {
  tournamentReducer,
  type TournamentAction,
} from '../state/tournamentReducer';
import type { TournamentState } from '../types';

interface TournamentContextValue {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tournamentReducer, undefined, getInitialTournamentState);
  useTournamentPersistence(state);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within TournamentProvider');
  }
  return context;
}
