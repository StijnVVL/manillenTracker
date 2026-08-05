import { Matchup, LadderSnapshotEntry, RoundResult, Team } from '../models/tournament.model';

// ---------------------------------------------------------------------------
// Shared result type
// ---------------------------------------------------------------------------

export interface MatchupResult {
  matchups: Matchup[];
  excludedTeamId: string | null;
  preRoundLadderSnapshot: LadderSnapshotEntry[];
}

// ---------------------------------------------------------------------------
// ExclusionPicker — decides WHICH team sits out and builds the matchup pairs
// ---------------------------------------------------------------------------

export interface ExclusionPicker {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  buildMatchups(teams: Team[], preRoundSnapshot: LadderSnapshotEntry[]): MatchupResult;
}

// ---------------------------------------------------------------------------
// ExclusionScorer — decides WHAT SCORE the excluded team receives
// ---------------------------------------------------------------------------

export interface ExclusionScorer {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  calculateExcludedScore(roundResults: RoundResult[]): number;
}

// ---------------------------------------------------------------------------
// MiddleExclusionPicker
//
// Ordering: teams sorted by wins desc → cumulative score desc → name asc.
// The initial random ordering for round 1 is established externally via the
// tournament snapshot; the algorithm itself always sorts deterministically.
//
// Pick phase (odd number of teams):
//   - Take the ordered list; pick the middle team.
//   - If that team was already excluded in a previous round, walk downward;
//     repeat until an un-excluded team is found.
//   - Fallback: use the original middle candidate.
//   - Exclude that team. Pair remaining consecutively: (1,2), (3,4), …
// ---------------------------------------------------------------------------

export class MiddleExclusionPicker implements ExclusionPicker {
  readonly id = 'middle';
  readonly nameKey = 'exclusionPicker.middle';
  readonly descriptionKey = 'exclusionPicker.middle.description';

  buildMatchups(teams: Team[], preRoundSnapshot: LadderSnapshotEntry[]): MatchupResult {
    if (teams.length === 0) {
      return { matchups: [], excludedTeamId: null, preRoundLadderSnapshot: [] };
    }

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
    for (const entry of preRoundSnapshot) {
      winsMap.set(entry.teamId, entry.wins);
      exclusionsMap.set(entry.teamId, entry.exclusions);
      cumulativeScoreMap.set(entry.teamId, entry.cumulativeScore);
      roundScoresMap.set(entry.teamId, [...entry.roundScores]);
    }

    const previouslyExcludedIds = preRoundSnapshot
      .filter(e => e.exclusions > 0)
      .map(e => e.teamId);

    const nameOf = (id: string) => teams.find(t => t.id === id)?.name ?? '';
    const ordered = [...teams].sort((a, b) => {
      const wDiff = (winsMap.get(b.id) ?? 0) - (winsMap.get(a.id) ?? 0);
      if (wDiff !== 0) return wDiff;
      const sDiff = (cumulativeScoreMap.get(b.id) ?? 0) - (cumulativeScoreMap.get(a.id) ?? 0);
      if (sDiff !== 0) return sDiff;
      return nameOf(a.id).localeCompare(nameOf(b.id), undefined, { sensitivity: 'base' });
    });

    const preRoundLadderSnapshot: LadderSnapshotEntry[] = ordered.map(t => ({
      teamId: t.id,
      wins: winsMap.get(t.id) ?? 0,
      exclusions: exclusionsMap.get(t.id) ?? 0,
      cumulativeScore: cumulativeScoreMap.get(t.id) ?? 0,
      roundScores: [...(roundScoresMap.get(t.id) ?? [])],
    }));

    const orderedIds = ordered.map(t => t.id);

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

    return { matchups, excludedTeamId, preRoundLadderSnapshot };
  }
}

// ---------------------------------------------------------------------------
// MeanOf3ExclusionScorer
//
// Score formula: ceil( (best + worst + mid1 + mid2) / 4 )
// ---------------------------------------------------------------------------

export class MeanOf3ExclusionScorer implements ExclusionScorer {
  readonly id = 'mean-of-3';
  readonly nameKey = 'exclusionScorer.meanOf3';
  readonly descriptionKey = 'exclusionScorer.meanOf3.description';

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

// ---------------------------------------------------------------------------
// BestScoreExclusionScorer
//
// The excluded team receives the same score as the best-performing team
// that played this round.
// ---------------------------------------------------------------------------

export class BestScoreExclusionScorer implements ExclusionScorer {
  readonly id = 'best-score';
  readonly nameKey = 'exclusionScorer.bestScore';
  readonly descriptionKey = 'exclusionScorer.bestScore.description';

  calculateExcludedScore(roundResults: RoundResult[]): number {
    if (roundResults.length === 0) return 0;
    return Math.max(...roundResults.map(r => r.rawScore));
  }
}

// ---------------------------------------------------------------------------
// Registries
// ---------------------------------------------------------------------------

export const EXCLUSION_PICKERS: ExclusionPicker[] = [new MiddleExclusionPicker()];
export const EXCLUSION_SCORERS: ExclusionScorer[] = [new MeanOf3ExclusionScorer(), new BestScoreExclusionScorer()];

export const DEFAULT_EXCLUSION_PICKER_ID = 'middle';
export const DEFAULT_EXCLUSION_SCORER_ID = 'mean-of-3';

export function getExclusionPickerById(id: string): ExclusionPicker {
  return EXCLUSION_PICKERS.find(p => p.id === id) ?? EXCLUSION_PICKERS[0];
}

export function getExclusionScorerById(id: string): ExclusionScorer {
  return EXCLUSION_SCORERS.find(s => s.id === id) ?? EXCLUSION_SCORERS[0];
}

// ---------------------------------------------------------------------------
// Legacy alias — kept temporarily so callers that still import
// DEFAULT_MATCHUP_ALGORITHM_ID compile until they are migrated.
// ---------------------------------------------------------------------------
/** @deprecated Use DEFAULT_EXCLUSION_PICKER_ID or DEFAULT_EXCLUSION_SCORER_ID */
export const DEFAULT_MATCHUP_ALGORITHM_ID = DEFAULT_EXCLUSION_PICKER_ID;
