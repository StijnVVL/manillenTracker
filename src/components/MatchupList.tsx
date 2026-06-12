import type { Round, Team } from '../types';
import { getTeamMap, getTeamName } from '../utils/teams';

interface MatchupListProps {
  round: Round;
  teams: Team[];
}

export function MatchupList({ round, teams }: MatchupListProps) {
  const teamMap = getTeamMap(teams);

  return (
    <div className="card">
      <h2 className="card-title">This Round&apos;s Matchups</h2>
      {round.matchups.length === 0 ? (
        <p className="empty-state">No matchups scheduled.</p>
      ) : (
        <ul className="matchup-list">
          {round.matchups.map((matchup, index) => (
            <li key={`${matchup.teamAId}-${matchup.teamBId}`} className="matchup-item">
              <span className="matchup-teams">
                Table {index + 1}: {getTeamName(teamMap, matchup.teamAId)} vs{' '}
                {getTeamName(teamMap, matchup.teamBId)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {round.byeTeamId && (
        <p className="bye-note">
          Bye this round: {getTeamName(teamMap, round.byeTeamId)}
        </p>
      )}
    </div>
  );
}
