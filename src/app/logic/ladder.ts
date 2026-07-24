import { RoundResult } from '../models/tournament.model';

export interface LadderMovement {
  teamId: string;
  fromIndex: number;
  toIndex: number;
  slots: number;
  direction: 'up' | 'down';
}

function calcMoveSlots(absDiff: number, maxDiff: number, maxSlots: number): number {
  if (maxDiff <= 0) return 1;
  return Math.max(1, Math.round((absDiff / maxDiff) * maxSlots));
}

function moveTeamUp(ladder: string[], teamId: string, slots: number): string[] {
  const index = ladder.indexOf(teamId);
  if (index === -1) return ladder;

  const result = [...ladder];
  result.splice(index, 1);
  const newIndex = Math.max(0, index - slots);
  result.splice(newIndex, 0, teamId);
  return result;
}

function moveTeamDown(ladder: string[], teamId: string, slots: number): string[] {
  const index = ladder.indexOf(teamId);
  if (index === -1) return ladder;

  const result = [...ladder];
  result.splice(index, 1);
  const newIndex = Math.min(result.length, index + slots);
  result.splice(newIndex, 0, teamId);
  return result;
}

export function applyLadderUpdate(
  ladder: string[],
  results: RoundResult[],
): { ladder: string[]; movements: LadderMovement[] } {
  const diffByTeam = new Map(results.map((r) => [r.teamId, r.matchDiff]));
  const maxSlots = Math.max(1, Math.floor(ladder.length / 2));

  const winners = ladder
    .map((teamId, index) => ({ teamId, index, diff: diffByTeam.get(teamId) ?? 0 }))
    .filter((entry) => entry.diff > 0);

  const losers = ladder
    .map((teamId, index) => ({ teamId, index, diff: diffByTeam.get(teamId) ?? 0 }))
    .filter((entry) => entry.diff < 0);

  const maxPositiveDiff = Math.max(...winners.map((w) => w.diff), 1);
  const maxNegativeDiff = Math.max(...losers.map((l) => Math.abs(l.diff)), 1);

  const movements: LadderMovement[] = [];
  let updatedLadder = [...ladder];

  const sortedWinners = [...winners].sort((a, b) => a.index - b.index);
  for (const winner of sortedWinners) {
    const slots = calcMoveSlots(winner.diff, maxPositiveDiff, maxSlots);
    const before = updatedLadder.indexOf(winner.teamId);
    updatedLadder = moveTeamUp(updatedLadder, winner.teamId, slots);
    const after = updatedLadder.indexOf(winner.teamId);
    movements.push({
      teamId: winner.teamId,
      fromIndex: before,
      toIndex: after,
      slots,
      direction: 'up',
    });
  }

  const sortedLosers = [...losers].sort((a, b) => b.index - a.index);
  for (const loser of sortedLosers) {
    const slots = calcMoveSlots(Math.abs(loser.diff), maxNegativeDiff, maxSlots);
    const before = updatedLadder.indexOf(loser.teamId);
    updatedLadder = moveTeamDown(updatedLadder, loser.teamId, slots);
    const after = updatedLadder.indexOf(loser.teamId);
    movements.push({
      teamId: loser.teamId,
      fromIndex: before,
      toIndex: after,
      slots,
      direction: 'down',
    });
  }

  return { ladder: updatedLadder, movements };
}
