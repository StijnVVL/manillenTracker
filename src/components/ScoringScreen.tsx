import { useMemo, useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getMatchupDiffs, getWinnerId, scoreWarning } from '../logic/scoring';
import { getCurrentRound, getTeamMap, getTeamName } from '../utils/teams';
import { LadderBoard } from './LadderBoard';
import { RoundHistory } from './RoundHistory';

export function ScoringScreen() {
  const { state, dispatch } = useTournament();
  const currentRound = getCurrentRound(state);
  const teamMap = getTeamMap(state.teams);
  const [scores, setScores] = useState<Record<string, string>>(() => {
    if (!currentRound || currentRound.results.length === 0) return {};
    return Object.fromEntries(
      currentRound.results.map((result) => [result.teamId, String(result.rawScore)]),
    );
  });
  const [confirmed, setConfirmed] = useState(
    () => (currentRound?.results.length ?? 0) > 0,
  );

  const numericScores = useMemo(() => {
    const parsed: Record<string, number> = {};
    for (const [teamId, value] of Object.entries(scores)) {
      const num = Number(value);
      if (!Number.isNaN(num)) parsed[teamId] = num;
    }
    return parsed;
  }, [scores]);

  if (!currentRound) return null;

  const allMatchupsFilled = currentRound.matchups.every((matchup) => {
    const scoreA = numericScores[matchup.teamAId];
    const scoreB = numericScores[matchup.teamBId];
    return scoreA !== undefined && scoreB !== undefined;
  });

  const handleScoreChange = (teamId: string, value: string) => {
    setScores((prev) => ({ ...prev, [teamId]: value }));
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!allMatchupsFilled) return;
    dispatch({ type: 'SUBMIT_SCORES', scores: numericScores });
    setConfirmed(true);
  };

  const handleNextRound = () => {
    dispatch({ type: 'NEXT_ROUND' });
    setScores({});
    setConfirmed(false);
  };

  const showUpdatedLadder = confirmed && state.lastLadderSnapshot;

  return (
    <>
      <div className="card">
        <h2 className="card-title">Enter Scores — Round {currentRound.number}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          Enter raw card points per team. Table movement is based on the score difference
          between the winning and losing team.
        </p>

        {currentRound.matchups.map((matchup, index) => {
          const scoreA = numericScores[matchup.teamAId];
          const scoreB = numericScores[matchup.teamBId];
          const winnerId = getWinnerId(matchup.teamAId, matchup.teamBId, numericScores);
          const matchupDiffs = getMatchupDiffs(
            matchup.teamAId,
            matchup.teamBId,
            numericScores,
          );
          const warning =
            scoreA !== undefined && scoreB !== undefined
              ? scoreWarning(scoreA, scoreB)
              : null;

          return (
            <div key={`${matchup.teamAId}-${matchup.teamBId}`} className="card score-card">
              <div className="score-card-header">Table {index + 1}</div>
              <div className="score-inputs">
                <div>
                  <label className="field-label" htmlFor={`score-${matchup.teamAId}`}>
                    {getTeamName(teamMap, matchup.teamAId)}
                  </label>
                  <input
                    id={`score-${matchup.teamAId}`}
                    className="input-number"
                    type="number"
                    min={0}
                    max={61}
                    value={scores[matchup.teamAId] ?? ''}
                    onChange={(e) => handleScoreChange(matchup.teamAId, e.target.value)}
                  />
                  {matchupDiffs && matchupDiffs.winnerId === matchup.teamAId && (
                    <div className="score-preview">Winner: +{matchupDiffs.margin}</div>
                  )}
                  {matchupDiffs && matchupDiffs.loserId === matchup.teamAId && (
                    <div className="score-preview">Loser: -{matchupDiffs.margin}</div>
                  )}
                </div>
                <div>
                  <label className="field-label" htmlFor={`score-${matchup.teamBId}`}>
                    {getTeamName(teamMap, matchup.teamBId)}
                  </label>
                  <input
                    id={`score-${matchup.teamBId}`}
                    className="input-number"
                    type="number"
                    min={0}
                    max={61}
                    value={scores[matchup.teamBId] ?? ''}
                    onChange={(e) => handleScoreChange(matchup.teamBId, e.target.value)}
                  />
                  {matchupDiffs && matchupDiffs.winnerId === matchup.teamBId && (
                    <div className="score-preview">Winner: +{matchupDiffs.margin}</div>
                  )}
                  {matchupDiffs && matchupDiffs.loserId === matchup.teamBId && (
                    <div className="score-preview">Loser: -{matchupDiffs.margin}</div>
                  )}
                </div>
              </div>
              {matchupDiffs && (
                <div className="score-preview">
                  Score difference: {matchupDiffs.margin} — Winner:{' '}
                  {getTeamName(teamMap, matchupDiffs.winnerId)}
                </div>
              )}
              {!matchupDiffs && winnerId === null && scoreA !== undefined && scoreB !== undefined && (
                <div className="score-preview">Tie — no table movement</div>
              )}
              {warning && <div className="score-warning">{warning}</div>}
            </div>
          );
        })}

        {currentRound.byeTeamId && (
          <p className="bye-note">
            Bye: {getTeamName(teamMap, currentRound.byeTeamId)} (no score entry needed)
          </p>
        )}

        <div className="setup-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allMatchupsFilled}
            onClick={handleConfirm}
          >
            Confirm Scores
          </button>
          {confirmed && (
            <button type="button" className="btn btn-secondary" onClick={handleNextRound}>
              Next Round
            </button>
          )}
        </div>
      </div>

      {showUpdatedLadder && (
        <div className="grid-2" style={{ marginTop: '1rem' }}>
          <LadderBoard
            teams={state.teams}
            ladder={state.lastLadderSnapshot!}
            roundDiffs={new Map(currentRound.results.map((r) => [r.teamId, r.matchDiff]))}
            title="Ladder Before"
          />
          <LadderBoard
            teams={state.teams}
            ladder={state.ladder}
            roundDiffs={new Map(currentRound.results.map((r) => [r.teamId, r.matchDiff]))}
            title="Ladder After"
          />
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <RoundHistory
          rounds={state.rounds}
          teams={state.teams}
          currentRoundIndex={state.currentRoundIndex}
        />
      </div>
    </>
  );
}
