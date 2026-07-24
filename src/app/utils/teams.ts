import { Team, TournamentState, Round } from '../models/tournament.model';
import { getMatchupDiffs } from '../logic/scoring';

export function getTeamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((team) => [team.id, team]));
}

export function getTeamName(teamMap: Map<string, Team>, teamId: string): string {
  return teamMap.get(teamId)?.name ?? 'Unknown team';
}

export function getCurrentRound(state: TournamentState): Round | null {
  if (state.rounds.length <= 0) {
    return null;
  }
  return state.rounds[state.rounds.length - 1] ?? null;
}

function getMatchDiffsFromRound(round: Round): Map<string, number> {
  const diffs = new Map<string, number>();
  for (const matchup of round.matchups) {
    if (matchup.teamAScore !== undefined && matchup.teamBScore !== undefined) {
      const diff = getMatchupDiffs(matchup.teamAId, matchup.teamBId, {
        [matchup.teamAId]: matchup.teamAScore,
        [matchup.teamBId]: matchup.teamBScore
      });

      if (diff) {
        diffs.set(diff.winnerId, diff.margin);
        diffs.set(diff.loserId, -diff.margin);
      } else {
        diffs.set(matchup.teamAId, 0);
        diffs.set(matchup.teamBId, 0);
      }
    }
  }
  return diffs;
}

function hasAnyScores(round: Round): boolean {
  return round.matchups.some(m => m.teamAScore !== undefined || m.teamBScore !== undefined);
}

export function getLatestRoundDiffs(state: TournamentState): Map<string, number> {
  const current = getCurrentRound(state);
  if (!current || !hasAnyScores(current)) {
    const previous = state.rounds[state.rounds.length - 2];
    if (!previous){
      return new Map(); 
    }
    return getMatchDiffsFromRound(previous);
  }
  return getMatchDiffsFromRound(current);
}
