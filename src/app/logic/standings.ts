import { Round, TournamentState } from '../models/tournament.model';
import { TOTAL_ROUNDS } from '../models/tournament.model';

export interface TeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  totalMarginWon: number;
  currentRank: number;
  roundRanks: { round: number; rank: number }[];
}

function getResultForTeam(round: Round, teamId: string) {
  return round.results.find((result) => result.teamId === teamId);
}

export function getMatchupWinner(round: Round, tableIndex: number): string | null {
  const matchup = round.matchups[tableIndex];
  if (!matchup || round.results.length === 0) {
    return null;
  }

  const resultA = getResultForTeam(round, matchup.teamAId);
  const resultB = getResultForTeam(round, matchup.teamBId);
  if (!resultA || !resultB) {
    return null;
  }

  if (resultA.matchDiff > 0) return matchup.teamAId;
  if (resultB.matchDiff > 0) return matchup.teamBId;

  if (resultA.rawScore > resultB.rawScore) return matchup.teamAId;
  if (resultB.rawScore > resultA.rawScore) return matchup.teamBId;

  return null;
}

export function getTournamentWinner(state: TournamentState): string | null {
  const finalRound = state.rounds.find((round) => round.number === TOTAL_ROUNDS);
  if (!finalRound || finalRound.results.length === 0) {
    return null;
  }

  return getMatchupWinner(finalRound, 0);
}

export function computeStandings(state: TournamentState): TeamStanding[] {
  const stats = new Map<string, Omit<TeamStanding, 'currentRank'>>();

  for (const team of state.teams) {
    stats.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      ties: 0,
      totalMarginWon: 0,
      roundRanks: [],
    });
  }

  for (const round of state.rounds) {
    if (round.results.length === 0) {
      continue;
    }

    for (const result of round.results) {
      const standing = stats.get(result.teamId);
      if (!standing) continue;

      if (result.matchDiff > 0) {
        standing.wins += 1;
        standing.totalMarginWon += result.matchDiff;
      } else if (result.matchDiff < 0) {
        standing.losses += 1;
      } else {
        standing.ties += 1;
      }
    }

    if (round.ladderSnapshot) {
      round.ladderSnapshot.forEach((teamId, index) => {
        const standing = stats.get(teamId);
        if (!standing) return;
        standing.roundRanks.push({ round: round.number, rank: index + 1 });
      });
    }
  }

  return state.ladder.map((teamId, index) => {
    const standing = stats.get(teamId);
    return {
      teamId,
      wins: standing?.wins ?? 0,
      losses: standing?.losses ?? 0,
      ties: standing?.ties ?? 0,
      totalMarginWon: standing?.totalMarginWon ?? 0,
      currentRank: index + 1,
      roundRanks: standing?.roundRanks ?? [],
    };
  });
}
