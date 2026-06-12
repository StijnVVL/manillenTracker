import { SetupScreen } from './components/SetupScreen';
import { RoundScreen } from './components/RoundScreen';
import { ScoringScreen } from './components/ScoringScreen';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { clearPersistedState } from './hooks/useTournamentPersistence';

function AppContent() {
  const { state, dispatch } = useTournament();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="app-title">Manillen Match Tracker</h1>
          <p className="app-subtitle">Track scores, ladder positions, and round timers</p>
        </div>
        {state.status !== 'setup' && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              clearPersistedState();
              dispatch({ type: 'RESET_TOURNAMENT' });
            }}
          >
            Reset Tournament
          </button>
        )}
      </header>

      {state.status === 'setup' && <SetupScreen />}
      {state.status === 'round' && <RoundScreen />}
      {state.status === 'scoring' && <ScoringScreen />}
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}
