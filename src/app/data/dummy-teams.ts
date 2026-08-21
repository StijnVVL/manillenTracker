/**
 * Dummy team data for development/testing purposes.
 * Remove this file and its import in tournament.service.ts when no longer needed.
 */

import { Team } from '../models/tournament.model';

const DUMMY_TEAM_NAMES: string[] = [
  'The Aces', 'Royal Flush', 'The Jokers', 'Club Masters', 'Diamond Kings',
  'Spade Squad', 'Heart Breakers', 'Full House', 'Trump Card', 'The Shufflers',
  'Card Sharks', 'Lucky Sevens', 'The Dealers', 'Straight Flush', 'Wild Cards',
  'The Bidders', 'Trick Takers', 'The Manillers', 'Green Table', 'Ace High',
];

const DUMMY_PLAYER_NAMES: string[] = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank',
  'Ivy', 'Jack', 'Karen', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Ruth', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yara', 'Zack', 'Amber', 'Brian', 'Cara', 'Derek', 'Ella', 'Finn',
  'Gina', 'Harry', 'Iris', 'Jake', 'Kira', 'Liam', 'Nora', 'Oscar',
];

function padId(index: number): string {
  return index.toString().padStart(12, '0');
}

export const DUMMY_TEAMS: Team[] = Array.from({ length: 20 }, (_, i) => ({
  id: `00000000-0000-0000-0000-${padId(i)}`,
  name: DUMMY_TEAM_NAMES[i % DUMMY_TEAM_NAMES.length],
  player1: DUMMY_PLAYER_NAMES[(i * 2) % DUMMY_PLAYER_NAMES.length],
  player2: DUMMY_PLAYER_NAMES[(i * 2 + 1) % DUMMY_PLAYER_NAMES.length],
  present: true,
}));

/**
 * Set to true to load dummy teams on startup (when no persisted state exists).
 * Set to false to disable dummy data.
 */
export const USE_DUMMY_DATA = true;
