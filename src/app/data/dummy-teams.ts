/**
 * Dummy team data for development/testing purposes.
 * Remove this file and its import in tournament.service.ts when no longer needed.
 */

import { Team } from '../models/tournament.model';

export const DUMMY_TEAMS: Team[] = [
  { id: '00000000-0000-0000-0000-000000000000', name: 'The Aces',     player1: 'Alice',   player2: 'Bob' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Royal Flush',  player1: 'Charlie', player2: 'Diana' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'The Jokers',   player1: 'Eve',     player2: 'Frank' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Club Masters', player1: 'Grace',   player2: 'Hank' },
];

// All teams present
export const DUMMY_TEAM_PRESENCE: Record<string, boolean> = Object.fromEntries(
  DUMMY_TEAMS.map(t => [t.id, true])
);

/**
 * Set to true to load dummy teams on startup (when no persisted state exists).
 * Set to false to disable dummy data.
 */
export const USE_DUMMY_DATA = true;
