/**
 * Dummy team data for development/testing purposes.
 * Remove this file and its import in tournament.service.ts when no longer needed.
 */

import { Team } from '../models/tournament.model';

export const DUMMY_TEAMS: Team[] = [
  { id: '00000000-0000-0000-0000-000000000000', name: 'The Aces',          player1: 'Alice',   player2: 'Bob' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Royal Flush',       player1: 'Charlie', player2: 'Diana' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'The Magnificent Card Playing Champions', player1: 'Eve',     player2: 'Frank' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'The Jokers',        player1: 'Grace',   player2: 'Hank' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Unstoppable Diamond Kings of the Table', player1: 'Iris',    player2: 'Jack' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Spade Warriors',    player1: 'Karen',   player2: 'Leo' },
  { id: '00000000-0000-0000-0000-000000000006', name: 'The Legendary Heart Breakers of the Grand Manillen Circuit', player1: 'Mia',     player2: 'Nick' },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Club Masters',      player1: 'Olivia',  player2: 'Paul' },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Wild Cards United Championship Defenders of the Realm 2024', player1: 'Quinn',   player2: 'Rachel' },
  { id: '00000000-0000-0000-0000-000000000009', name: 'Full House',        player1: 'Sam',     player2: 'Tina' },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Straight Shooters', player1: 'Uma',     player2: 'Victor' },
  { id: '00000000-0000-0000-0000-000000000011', name: 'The Bluffers',      player1: 'Wendy',   player2: 'Xavier' },
  { id: '00000000-0000-0000-0000-000000000012', name: 'High Rollers',     player1: 'Yasmine',  player2: 'Zach' },
  { id: '00000000-0000-0000-0000-000000000013', name: 'Lucky Sevens',     player1: 'Aaron',    player2: 'Bella' },
  { id: '00000000-0000-0000-0000-000000000014', name: 'Trump Cards',      player1: 'Carl',     player2: 'Donna' },
  { id: '00000000-0000-0000-0000-000000000015', name: 'Deck Destroyers',  player1: 'Ethan',    player2: 'Fiona' },
  { id: '00000000-0000-0000-0000-000000000016', name: 'Manille Maniacs',  player1: 'George',   player2: 'Hannah' },
  { id: '00000000-0000-0000-0000-000000000017', name: 'Trick Takers',     player1: 'Ivan',     player2: 'Julia' },
  { id: '00000000-0000-0000-0000-000000000018', name: 'The Shufflers',    player1: 'Kevin',    player2: 'Laura' },
  { id: '00000000-0000-0000-0000-000000000019', name: 'Card Counters',    player1: 'Marco',    player2: 'Nina' },
];

// All teams present except the first one (index 0 = 'The Aces')
export const DUMMY_TEAM_PRESENCE: Record<string, boolean> = Object.fromEntries(
  DUMMY_TEAMS.map((t, i) => [t.id, i !== 0])
);

/**
 * Set to true to load dummy teams on startup (when no persisted state exists).
 * Set to false to disable dummy data.
 */
export const USE_DUMMY_DATA = true;
