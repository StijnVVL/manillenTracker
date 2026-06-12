import { describe, expect, it, vi } from 'vitest';
import { ladderPairings, pairTeams, randomPairings, shuffle } from './pairing';

describe('pairTeams', () => {
  it('pairs teams sequentially', () => {
    const { matchups, byeTeamId } = pairTeams(['a', 'b', 'c', 'd']);
    expect(matchups).toEqual([
      { teamAId: 'a', teamBId: 'b' },
      { teamAId: 'c', teamBId: 'd' },
    ]);
    expect(byeTeamId).toBeNull();
  });

  it('assigns bye for odd team count', () => {
    const { matchups, byeTeamId } = pairTeams(['a', 'b', 'c']);
    expect(matchups).toEqual([{ teamAId: 'a', teamBId: 'b' }]);
    expect(byeTeamId).toBe('c');
  });
});

describe('ladderPairings', () => {
  it('pairs adjacent ladder positions', () => {
    const { matchups } = ladderPairings(['top', 'second', 'third', 'fourth']);
    expect(matchups[0]).toEqual({ teamAId: 'top', teamBId: 'second' });
    expect(matchups[1]).toEqual({ teamAId: 'third', teamBId: 'fourth' });
  });
});

describe('randomPairings', () => {
  it('produces valid pairings', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const teamIds = ['a', 'b', 'c', 'd'];
    const { matchups } = randomPairings(teamIds);
    expect(matchups).toHaveLength(2);
    const paired = new Set(matchups.flatMap((m) => [m.teamAId, m.teamBId]));
    expect(paired.size).toBe(4);
    vi.restoreAllMocks();
  });
});

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input);
    expect(output).toHaveLength(input.length);
    expect(output.sort()).toEqual(input.sort());
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
