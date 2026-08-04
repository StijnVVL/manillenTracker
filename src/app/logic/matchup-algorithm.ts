import { Matchup, Round, RoundResult, Team } from '../models/tournament.model';

export interface MatchupResult {
  matchups: Matchup[];
  excludedTeamId: string | null;
}

export interface MatchupAlgorithm {
  readonly id: string;
  readonly nameKey: string;
  buildMatchups(teams: Team[], completedRounds: Round[], previouslyExcludedIds: string[]): MatchupResult;
  calculateExcludedScore(roundResults: RoundResult[]): number;
}

/**
 * "Mean of 3" algorithm.
 *
 * Ordering: teams sorted by wins desc → cumulative score desc → name asc (case-insensitive).
 *
 * Matchup phase (odd number of teams):
 *   - Take the ordered list; pick the middle team.
 *   - If that team was already excluded in a previous round, walk downward;
 *     repeat until an un-excluded team is found.
 *   - Fallback: use the original middle candidate.
 *   - Exclude that team. Pair remaining consecutively: (1,2), (3,4), …
 *
 * Score phase (excluded team):
 *   - Sort playing teams' raw scores.
 *   - Compute: ceil( (best + worst + mid1 + mid2) / 4 )
 */
export class MeanOf3Algorithm implements MatchupAlgorithm {
  readonly id = 'mean-of-3';
  readonly nameKey = 'algorithm.fairness.meanof3';

  buildMatchups(teams: Team[], completedRounds: Round[], previouslyExcludedIds: string[]): MatchupResult {
    if (teams.length === 0) {
      return { matchups: [], excludedTeamId: null };
    }

    // --- compute stats per team ---
    const wins = new Map<string, number>();
    const cumulativeScore = new Map<string, number>();
    for (const t of teams) { wins.set(t.id, 0); cumulativeScore.set(t.id, 0); }

    for (const round of completedRounds) {
      for (const m of round.matchups) {
        if (m.teamAScore === undefined || m.teamBScore === undefined) continue;
        // wins: score >= opponent score counts as a win
        if (m.teamAScore >= m.teamBScore) wins.set(m.teamAId, (wins.get(m.teamAId) ?? 0) + 1);
        if (m.teamBScore >= m.teamAScore) wins.set(m.teamBId, (wins.get(m.teamBId) ?? 0) + 1);
        cumulativeScore.set(m.teamAId, (cumulativeScore.get(m.teamAId) ?? 0) + m.teamAScore);
        cumulativeScore.set(m.teamBId, (cumulativeScore.get(m.teamBId) ?? 0) + m.teamBScore);
      }
      // excluded team's score (if computed)
      if (round.excludedTeamId && round.excludedTeamScore !== null && round.excludedTeamScore !== undefined) {
        cumulativeScore.set(round.excludedTeamId, (cumulativeScore.get(round.excludedTeamId) ?? 0) + round.excludedTeamScore);
        // excluded team did not face an opponent, no win/loss recorded
      }
    }

    // --- sort: wins desc → cumulative score desc → name asc (case-insensitive) ---
    const nameOf = (id: string) => teams.find(t => t.id === id)?.name ?? '';
    const ordered = [...teams].sort((a, b) => {
      const wDiff = (wins.get(b.id) ?? 0) - (wins.get(a.id) ?? 0);
      if (wDiff !== 0) return wDiff;
      const sDiff = (cumulativeScore.get(b.id) ?? 0) - (cumulativeScore.get(a.id) ?? 0);
      if (sDiff !== 0) return sDiff;
      return nameOf(a.id).localeCompare(nameOf(b.id), undefined, { sensitivity: 'base' });
    });

    const orderedIds = ordered.map(t => t.id);

    // --- pick excluded team (odd count) ---
    let excludedTeamId: string | null = null;
    let remaining = [...orderedIds];

    if (orderedIds.length % 2 === 1) {
      const middleIndex = Math.floor(orderedIds.length / 2);
      let candidateIndex = middleIndex;

      while (
        candidateIndex < orderedIds.length &&
        previouslyExcludedIds.includes(orderedIds[candidateIndex])
      ) {
        candidateIndex++;
      }

      if (candidateIndex >= orderedIds.length) {
        candidateIndex = middleIndex;
      }

      excludedTeamId = orderedIds[candidateIndex];
      remaining = orderedIds.filter((_, i) => i !== candidateIndex);
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
