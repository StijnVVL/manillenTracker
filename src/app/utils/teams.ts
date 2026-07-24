import { Team, TournamentState, Round } from '../models/tournament.model';

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

export function getLatestRoundDiffs(state: TournamentState): Map<string, number> {
  const current = getCurrentRound(state);
  if (!current || current.results.length === 0) {
    const previous = state.rounds[state.rounds.length - 2];
    if (!previous){
      return new Map(); 
    }
    return new Map(previous.results.map((r) => [r.teamId, r.matchDiff]));
  }
  return new Map(current.results.map((r) => [r.teamId, r.matchDiff]));
}
