import { Matchup } from '../models/tournament.model';

export interface PairingResult {
  matchups: Matchup[];
  byeTeamId: string | null;
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pairTeams(teamIds: string[]): PairingResult {
  const matchups: Matchup[] = [];
  const pairCount = Math.floor(teamIds.length / 2);

  for (let i = 0; i < pairCount; i++) {
    matchups.push({
      teamAId: teamIds[i * 2],
      teamBId: teamIds[i * 2 + 1],
    });
  }

  const byeTeamId = teamIds.length % 2 === 1 ? teamIds[teamIds.length - 1] : null;
  return { matchups, byeTeamId };
}

export function randomPairings(teamIds: string[]): PairingResult {
  return pairTeams(shuffle(teamIds));
}

export function ladderPairings(ladder: string[]): PairingResult {
  return pairTeams(ladder);
}
