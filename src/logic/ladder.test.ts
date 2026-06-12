import { describe, expect, it } from 'vitest';
import { applyLadderUpdate } from './ladder';

describe('applyLadderUpdate', () => {
  it('moves winners up and losers down proportionally', () => {
    const ladder = ['a', 'b', 'c', 'd'];
    const results = [
      { teamId: 'a', rawScore: 24, matchDiff: -13 },
      { teamId: 'b', rawScore: 37, matchDiff: 13 },
      { teamId: 'c', rawScore: 42, matchDiff: 23 },
      { teamId: 'd', rawScore: 19, matchDiff: -23 },
    ];

    const { ladder: updated, movements } = applyLadderUpdate(ladder, results);

    expect(updated).toHaveLength(4);
    expect(new Set(updated)).toEqual(new Set(ladder));
    expect(updated[0]).toBe('c');
    expect(movements.some((m) => m.teamId === 'c' && m.direction === 'up')).toBe(true);
    expect(movements.some((m) => m.teamId === 'a' && m.direction === 'down')).toBe(true);
    expect(updated.indexOf('a')).toBeGreaterThan(ladder.indexOf('a'));
  });

  it('leaves ladder unchanged for ties', () => {
    const ladder = ['a', 'b'];
    const results = [
      { teamId: 'a', rawScore: 30, matchDiff: 0 },
      { teamId: 'b', rawScore: 30, matchDiff: 0 },
    ];

    const { ladder: updated, movements } = applyLadderUpdate(ladder, results);
    expect(movements).toHaveLength(0);
    expect(updated).toEqual(ladder);
  });

  it('handles bye teams with no results', () => {
    const ladder = ['a', 'b', 'c'];
    const results = [
      { teamId: 'a', rawScore: 36, matchDiff: 11 },
      { teamId: 'b', rawScore: 25, matchDiff: -11 },
    ];

    const { ladder: updated } = applyLadderUpdate(ladder, results);
    expect(updated).toContain('c');
    expect(new Set(updated).size).toBe(3);
  });
});
