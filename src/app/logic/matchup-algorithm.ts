import { Matchup, LadderSnapshotEntry, Round, RoundResult, Team } from '../models/tournament.model';

export interface MatchupResult {
  matchups: Matchup[];
  excludedTeamId: string | null;
  ladderSnapshot: LadderSnapshotEntry[];
}

export interface MatchupAlgorithm {
  readonly id: string;
  readonly nameKey: string;
  buildMatchups(teams: Team[], completedRounds: Round[], previouslyExcludedIds: string[], useRandom: boolean): MatchupResult;
  calculateExcludedScore(roundResults: RoundResult[]): number;
}

/**
 * "Mean of 3" algorithm.
 *
 * Ordering: teams sorted by wins desc → cumulative score desc → name asc (case-insensitive).
 * Round 1 uses a random shuffle instead of sorted order.
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

  buildMatchups(teams: Team[], completedRounds: Round[], previouslyExcludedIds: string[], useRandom: boolean): MatchupResult {
    if (teams.length === 0) {
      return { matchups: [], excludedTeamId: null, ladderSnapshot: [] };
    }

    // --- compute stats per team from completed rounds ---
    const winsMap = new Map<string, number>();
    const exclusionsMap = new Map<string, number>();
    const cumulativeScoreMap = new Map<string, number>();
    const roundScoresMap = new Map<string, number[]>();
    for (const t of teams) {
      winsMap.set(t.id, 0);
      exclusionsMap.set(t.id, 0);
      cumulativeScoreMap.set(t.id, 0);
      roundScoresMap.set(t.id, []);
    }

    for (const round of completedRounds) {
      for (const m of round.matchups) {
        if (m.teamAScore === undefined || m.teamBScore === undefined) continue;
        if (m.teamAScore >= m.teamBScore) winsMap.set(m.teamAId, (winsMap.get(m.teamAId) ?? 0) + 1);
        if (m.teamBScore >= m.teamAScore) winsMap.set(m.teamBId, (winsMap.get(m.teamBId) ?? 0) + 1);
        cumulativeScoreMap.set(m.teamAId, (cumulativeScoreMap.get(m.teamAId) ?? 0) + m.teamAScore);
        cumulativeScoreMap.set(m.teamBId, (cumulativeScoreMap.get(m.teamBId) ?? 0) + m.teamBScore);
        roundScoresMap.get(m.teamAId)!.push(m.teamAScore);
        roundScoresMap.get(m.teamBId)!.push(m.teamBScore);
      }
      if (round.excludedTeamId && round.excludedTeamScore !== null && round.excludedTeamScore !== undefined) {
        winsMap.set(round.excludedTeamId, (winsMap.get(round.excludedTeamId) ?? 0) + 1);
        exclusionsMap.set(round.excludedTeamId, (exclusionsMap.get(round.excludedTeamId) ?? 0) + 1);
        cumulativeScoreMap.set(round.excludedTeamId, (cumulativeScoreMap.get(round.excludedTeamId) ?? 0) + round.excludedTeamScore);
        roundScoresMap.get(round.excludedTeamId)!.push(round.excludedTeamScore);
      }
    }

    // --- sort or shuffle ---
    const nameOf = (id: string) => teams.find(t => t.id === id)?.name ?? '';
    let ordered: Team[];
    if (useRandom) {
      ordered = [...teams].sort(() => Math.random() - 0.5);
    } else {
      ordered = [...teams].sort((a, b) => {
        const wDiff = (winsMap.get(b.id) ?? 0) - (winsMap.get(a.id) ?? 0);
        if (wDiff !== 0) return wDiff;
        const sDiff = (cumulativeScoreMap.get(b.id) ?? 0) - (cumulativeScoreMap.get(a.id) ?? 0);
        if (sDiff !== 0) return sDiff;
        return nameOf(a.id).localeCompare(nameOf(b.id), undefined, { sensitivity: 'base' });
      });
    }

    // --- build ladderSnapshot (the canonical pre-round ranking) ---
    const ladderSnapshot: LadderSnapshotEntry[] = ordered.map(t => ({
      teamId: t.id,
      wins: winsMap.get(t.id) ?? 0,
      exclusions: exclusionsMap.get(t.id) ?? 0,
      cumulativeScore: cumulativeScoreMap.get(t.id) ?? 0,
      roundScores: [...(roundScoresMap.get(t.id) ?? [])],
    }));

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

    return { matchups, excludedTeamId, ladderSnapshot };
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
