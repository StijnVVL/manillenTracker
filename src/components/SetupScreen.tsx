import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';

export function SetupScreen() {
  const { state, dispatch } = useTournament();
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    dispatch({ type: 'ADD_TEAM', name: newTeamName });
    setNewTeamName('');
  };

  return (
    <div className="card">
      <h2 className="card-title">Tournament Setup</h2>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Add fixed teams, set the round duration, then start the match. Round 1 pairings
        are randomized.
      </p>

      <label className="field-label" htmlFor="round-duration">
        Round duration (minutes)
      </label>
      <input
        id="round-duration"
        className="input-number"
        type="number"
        min={1}
        max={240}
        value={state.roundDurationMinutes}
        onChange={(e) =>
          dispatch({ type: 'SET_ROUND_DURATION', minutes: Number(e.target.value) })
        }
      />

      <div style={{ marginTop: '1.5rem' }}>
        <label className="field-label" htmlFor="team-name">
          Team name
        </label>
        <div className="setup-team-row">
          <input
            id="team-name"
            className="input"
            value={newTeamName}
            placeholder="e.g. Team Alpha"
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTeam();
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={handleAddTeam}>
            Add
          </button>
        </div>
      </div>

      {state.teams.length > 0 && (
        <ul className="ladder-list" style={{ marginTop: '1rem' }}>
          {state.teams.map((team) => (
            <li key={team.id} className="ladder-item">
              <input
                className="input"
                value={team.name}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_TEAM', teamId: team.id, name: e.target.value })
                }
              />
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => dispatch({ type: 'REMOVE_TEAM', teamId: team.id })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="setup-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={state.teams.length < 2}
          onClick={() => dispatch({ type: 'START_TOURNAMENT' })}
        >
          Start Tournament
        </button>
      </div>
    </div>
  );
}
