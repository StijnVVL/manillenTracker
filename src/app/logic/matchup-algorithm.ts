import { Matchup, RoundResult } from '../models/tournament.model';

export interface MatchupResult {
  matchups: Matchup[];
  excludedTeamId: string | null;
}

export interface MatchupAlgorithm {
  readonly id: string;
  readonly nameKey: string;
  buildMatchups(ladder: string[], previouslyExcludedIds: string[]): MatchupResult;
  calculateExcludedScore(roundResults: RoundResult[]): number;
}

/**
 * "Mean of 3" algorithm.
 *
 * Matchup phase (odd number of teams):
 *   - Find the team in the middle of the ladder.
 *   - If that team was already excluded in a previous round, move to the next
 *     lower-ranked team; repeat until an un-excluded team is found.
 *   - Exclude that team. Pair the remaining teams consecutively: (1,2), (3,4), …
 *
 * Score phase (excluded team):
 *   - Sort the playing teams' raw scores.
 *   - Compute: ceil( (best + worst + mid1 + mid2) / 4 )
 *   - Where mid1 = score at floor((n-1)/2), mid2 = score at ceil((n-1)/2).
 */
export class MeanOf3Algorithm implements MatchupAlgorithm {
  readonly id = 'mean-of-3';
  readonly nameKey = 'algorithm.fairness.meanof3';

  buildMatchups(ladder: string[], previouslyExcludedIds: string[]): MatchupResult {
    if (ladder.length === 0) {
      return { matchups: [], excludedTeamId: null };
    }

    let excludedTeamId: string | null = null;
    let remaining = [...ladder];

    if (ladder.length % 2 === 1) {
      const middleIndex = Math.floor(ladder.length / 2);
      let candidateIndex = middleIndex;

      // Walk downward until we find a team not previously excluded
      while (
        candidateIndex < ladder.length &&
        previouslyExcludedIds.includes(ladder[candidateIndex])
      ) {
        candidateIndex++;
      }

      // Fallback: if every lower-ranked candidate was excluded, use the middle
      if (candidateIndex >= ladder.length) {
        candidateIndex = middleIndex;
      }

      excludedTeamId = ladder[candidateIndex];
      remaining = ladder.filter((_, i) => i !== candidateIndex);
    }

    const matchups: Matchup[] = [];
    for (let i = 0; i + 1 < remaining.length; i += 2) {
      matchups.push({ teamAId: remaining[i], teamBId: remaining[i + 1] });
    }

    return { matchups, excludedTeamId };
  }

  calculateExcludedScore(roundResults: RoundResult[]): number {
    if (roundResults.length === 0) return 0;

    const sorted = [...roundResults].sort((a, b) => a.rawScore - b.rawScore);
    const n = sorted.length;

    const worst = sorted[0].rawScore;
    const best = sorted[n - 1].rawScore;
    const mid1 = sorted[Math.floor((n - 1) / 2)].rawScore;
    const mid2 = sorted[Math.ceil((n - 1) / 2)].rawScore;

    return Math.ceil((best + worst + mid1 + mid2) / 4);
  }
}

export const MATCHUP_ALGORITHMS: MatchupAlgorithm[] = [new MeanOf3Algorithm()];

export const DEFAULT_MATCHUP_ALGORITHM_ID = 'mean-of-3';

export function getAlgorithmById(id: string): MatchupAlgorithm {
  return MATCHUP_ALGORITHMS.find(a => a.id === id) ?? MATCHUP_ALGORITHMS[0];
}
