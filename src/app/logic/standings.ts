import { Round, TournamentState, Matchup } from '../models/tournament.model';
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

function getScoreForTeam(matchup: Matchup, teamId: string): number | undefined {
  if (matchup.teamAId === teamId) return matchup.teamAScore;
  if (matchup.teamBId === teamId) return matchup.teamBScore;
  return undefined;
}

export function getMatchupWinner(round: Round, tableIndex: number): string | null {
  const matchup = round.matchups[tableIndex];
  if (!matchup || matchup.teamAScore === undefined || matchup.teamBScore === undefined) {
    return null;
  }

  if (matchup.teamAScore > matchup.teamBScore) return matchup.teamAId;
  if (matchup.teamBScore > matchup.teamAScore) return matchup.teamBId;

  return null; // Tie
}

export function getTournamentWinner(state: TournamentState): string | null {
  const finalRound = state.rounds.find((round) => round.number === TOTAL_ROUNDS);
  if (!finalRound) {
    return null;
  }

  return getMatchupWinner(finalRound, 0);
}

function hasAnyScores(round: Round): boolean {
  return round.matchups.some(m => m.teamAScore !== undefined || m.teamBScore !== undefined);
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
    if (!hasAnyScores(round)) {
      continue;
    }

    // Process each matchup
    for (const matchup of round.matchups) {
      if (matchup.teamAScore === undefined || matchup.teamBScore === undefined) {
        continue;
      }

      const standingA = stats.get(matchup.teamAId);
      const standingB = stats.get(matchup.teamBId);

      if (!standingA || !standingB) continue;

      const margin = Math.abs(matchup.teamAScore - matchup.teamBScore);

      if (matchup.teamAScore > matchup.teamBScore) {
        standingA.wins += 1;
        standingA.totalMarginWon += margin;
        standingB.losses += 1;
      } else if (matchup.teamBScore > matchup.teamAScore) {
        standingB.wins += 1;
        standingB.totalMarginWon += margin;
        standingA.losses += 1;
      } else {
        standingA.ties += 1;
        standingB.ties += 1;
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
