import type { Matchup, RoundResult } from '../types';

export function calcScoreMargin(winnerScore: number, loserScore: number): number {
  return Math.abs(winnerScore - loserScore);
}

export interface MatchupDiffs {
  winnerId: string;
  loserId: string;
  margin: number;
}

export function getMatchupDiffs(
  teamAId: string,
  teamBId: string,
  scores: Record<string, number>,
): MatchupDiffs | null {
  const scoreA = scores[teamAId];
  const scoreB = scores[teamBId];
  if (scoreA === undefined || scoreB === undefined) {
    return null;
  }
  if (scoreA === scoreB) {
    return null;
  }

  const winnerId = scoreA > scoreB ? teamAId : teamBId;
  const loserId = scoreA > scoreB ? teamBId : teamAId;
  const winnerScore = Math.max(scoreA, scoreB);
  const loserScore = Math.min(scoreA, scoreB);

  return {
    winnerId,
    loserId,
    margin: calcScoreMargin(winnerScore, loserScore),
  };
}

export function scoreWarning(teamAScore: number, teamBScore: number): string | null {
  const sum = teamAScore + teamBScore;
  if (Math.abs(sum - 61) > 1) {
    return `Card points sum to ${sum} (expected ~61)`;
  }
  return null;
}

export function buildRoundResults(
  matchups: Matchup[],
  scores: Record<string, number>,
): RoundResult[] {
  const results: RoundResult[] = [];

  for (const matchup of matchups) {
    const scoreA = scores[matchup.teamAId];
    const scoreB = scores[matchup.teamBId];
    if (
      scoreA === undefined ||
      scoreB === undefined ||
      Number.isNaN(scoreA) ||
      Number.isNaN(scoreB)
    ) {
      continue;
    }

    const diffs = getMatchupDiffs(matchup.teamAId, matchup.teamBId, scores);
    if (!diffs) {
      results.push(
        { teamId: matchup.teamAId, rawScore: scoreA, matchDiff: 0 },
        { teamId: matchup.teamBId, rawScore: scoreB, matchDiff: 0 },
      );
      continue;
    }

    results.push(
      {
        teamId: diffs.winnerId,
        rawScore: scores[diffs.winnerId],
        matchDiff: diffs.margin,
      },
      {
        teamId: diffs.loserId,
        rawScore: scores[diffs.loserId],
        matchDiff: -diffs.margin,
      },
    );
  }

  return results;
}

export function getWinnerId(
  teamAId: string,
  teamBId: string,
  scores: Record<string, number>,
): string | null {
  const scoreA = scores[teamAId];
  const scoreB = scores[teamBId];
  if (scoreA === undefined || scoreB === undefined) {
    return null;
  }
  if (scoreA > scoreB) return teamAId;
  if (scoreB > scoreA) return teamBId;
  return null;
}
