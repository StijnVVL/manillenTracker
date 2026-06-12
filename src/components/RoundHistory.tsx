import type { Round, Team } from '../types';
import { getTeamMap, getTeamName } from '../utils/teams';

interface RoundHistoryProps {
  rounds: Round[];
  teams: Team[];
  currentRoundIndex: number;
}

export function RoundHistory({ rounds, teams, currentRoundIndex }: RoundHistoryProps) {
  const teamMap = getTeamMap(teams);
  const completedRounds = rounds.filter(
    (round, index) => index < currentRoundIndex || round.results.length > 0,
  );

  if (completedRounds.length === 0) {
    return null;
  }

  return (
    <details className="card collapsible">
      <summary>Round History</summary>
      <ul className="history-list">
        {completedRounds.map((round) => (
          <li key={round.number} className="history-item">
            <div>
              <strong>Round {round.number}</strong>
              {round.matchups.map((matchup) => {
                const resultA = round.results.find((r) => r.teamId === matchup.teamAId);
                const resultB = round.results.find((r) => r.teamId === matchup.teamBId);
                const labelA = getTeamName(teamMap, matchup.teamAId);
                const labelB = getTeamName(teamMap, matchup.teamBId);
                const scoreA = resultA ? `${resultA.rawScore} (${resultA.matchDiff >= 0 ? '+' : ''}${resultA.matchDiff})` : '—';
                const scoreB = resultB ? `${resultB.rawScore} (${resultB.matchDiff >= 0 ? '+' : ''}${resultB.matchDiff})` : '—';
                return (
                  <div key={`${round.number}-${matchup.teamAId}`} style={{ marginTop: '0.35rem', color: 'var(--muted)' }}>
                    {labelA} {scoreA} vs {labelB} {scoreB}
                  </div>
                );
              })}
              {round.byeTeamId && (
                <div style={{ marginTop: '0.35rem', color: 'var(--muted)' }}>
                  Bye: {getTeamName(teamMap, round.byeTeamId)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
