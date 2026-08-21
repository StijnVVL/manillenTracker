import { Team, TournamentState, Round } from '../models/tournament.model';
import { getMatchupDiffs } from '../logic/scoring';

export function getTeamMap(teams: Team[]): Map<string, Team> {
  return new Map(teams.map((team) => [team.id, team]));
}

export function getTeamName(teamMap: Map<string, Team>, teamId: string): string {
  return teamMap.get(teamId)?.name ?? 'Unknown team';
}

/** Trim the name and collapse any whitespace chain into a single space. */
export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** Classic Levenshtein (edit) distance between two strings. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function getCurrentRound(state: TournamentState): Round | null {
  if (state.rounds.length <= 0) {
    return null;
  }
  return state.rounds[state.rounds.length - 1] ?? null;
}

export function getRoundByNumber(state: TournamentState, roundNumber: number): Round | null {
  return state.rounds.find(r => r.number === roundNumber) ?? null;
}

export function isRoundInFuture(state: TournamentState, roundNumber: number): boolean {
  // A round is in the future if it doesn't exist yet in the rounds array
  return roundNumber > state.rounds.length;
}

export function isPageInFuture(state: TournamentState, roundNumber: number, pageType: 'play' | 'scoring' | 'round-winner'): boolean {
  // First check if the entire round is in the future
  if (isRoundInFuture(state, roundNumber)) {
    return true;
  }

  // Check if we're on the current round but the page type is ahead of the current status
  const currentRound = getCurrentRound(state);
  if (currentRound && roundNumber === currentRound.number) {
    // Map status to page stages
    const statusToPage: Record<string, string[]> = {
      'round': ['play', 'scoring'],
      'scoring': ['play', 'scoring'],
      'round-winner': ['play', 'scoring', 'round-winner'],
      'finished': ['play', 'scoring', 'round-winner']
    };

    const allowedPages = statusToPage[state.status] || [];
    return !allowedPages.includes(pageType);
  }

  // Past rounds are always accessible
  return false;
}

export function roundExists(state: TournamentState, roundNumber: number): boolean {
  return state.rounds.some(r => r.number === roundNumber);
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
