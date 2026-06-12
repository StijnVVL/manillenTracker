import { describe, expect, it } from 'vitest';
import {
  buildRoundResults,
  calcScoreMargin,
  getMatchupDiffs,
  getWinnerId,
  scoreWarning,
} from './scoring';

describe('calcScoreMargin', () => {
  it('returns absolute difference between winner and loser scores', () => {
    expect(calcScoreMargin(36, 25)).toBe(11);
    expect(calcScoreMargin(25, 36)).toBe(11);
    expect(calcScoreMargin(30, 30)).toBe(0);
  });
});

describe('getMatchupDiffs', () => {
  it('returns winner, loser, and margin', () => {
    expect(getMatchupDiffs('a', 'b', { a: 36, b: 25 })).toEqual({
      winnerId: 'a',
      loserId: 'b',
      margin: 11,
    });
  });

  it('returns null on tie or missing scores', () => {
    expect(getMatchupDiffs('a', 'b', { a: 30, b: 30 })).toBeNull();
    expect(getMatchupDiffs('a', 'b', { a: 36 })).toBeNull();
  });
});

describe('scoreWarning', () => {
  it('warns when sum deviates from 61', () => {
    expect(scoreWarning(36, 24)).toBeNull();
    expect(scoreWarning(40, 40)).toContain('80');
  });
});

describe('getWinnerId', () => {
  it('returns winner or null on tie', () => {
    expect(getWinnerId('a', 'b', { a: 36, b: 24 })).toBe('a');
    expect(getWinnerId('a', 'b', { a: 30, b: 30 })).toBeNull();
  });
});

describe('buildRoundResults', () => {
  it('assigns positive margin to winner and negative to loser', () => {
    const results = buildRoundResults(
      [{ teamAId: 'a', teamBId: 'b' }],
      { a: 36, b: 25 },
    );
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.teamId === 'a')?.matchDiff).toBe(11);
    expect(results.find((r) => r.teamId === 'b')?.matchDiff).toBe(-11);
  });

  it('assigns zero margin on tie', () => {
    const results = buildRoundResults(
      [{ teamAId: 'a', teamBId: 'b' }],
      { a: 30, b: 30 },
    );
    expect(results.find((r) => r.teamId === 'a')?.matchDiff).toBe(0);
    expect(results.find((r) => r.teamId === 'b')?.matchDiff).toBe(0);
  });
});
