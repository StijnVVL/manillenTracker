import type { Team } from '../types';
import { getTeamMap, getTeamName } from '../utils/teams';

interface LadderBoardProps {
  teams: Team[];
  ladder: string[];
  roundDiffs?: Map<string, number>;
  title?: string;
}

function formatDiff(diff: number | undefined): string | null {
  if (diff === undefined) return null;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return '0';
}

function diffClass(diff: number | undefined): string {
  if (diff === undefined) return 'diff-neutral';
  if (diff > 0) return 'diff-positive';
  if (diff < 0) return 'diff-negative';
  return 'diff-neutral';
}

export function LadderBoard({
  teams,
  ladder,
  roundDiffs,
  title = 'Ladder',
}: LadderBoardProps) {
  const teamMap = getTeamMap(teams);

  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      {ladder.length === 0 ? (
        <p className="empty-state">No teams on the ladder yet.</p>
      ) : (
        <ul className="ladder-list">
          {ladder.map((teamId, index) => {
            const diff = roundDiffs?.get(teamId);
            const diffLabel = formatDiff(diff);
            return (
              <li key={teamId} className="ladder-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="ladder-rank">{index + 1}</span>
                  <span>{getTeamName(teamMap, teamId)}</span>
                </div>
                {diffLabel !== null && (
                  <span className={`diff-badge ${diffClass(diff)}`}>{diffLabel}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
