/**
 * Dummy team data for development/testing purposes.
 * Remove this file and its import in tournament.service.ts when no longer needed.
 */

import { Team } from '../models/tournament.model';

export const DUMMY_TEAMS: Team[] = [
  { id: '00000000-0000-0000-0000-000000000000', name: 'The Aces' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Royal Flush' },
 { id: '00000000-0000-0000-0000-000000000002', name: 'Card Sharks' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'The Jokers' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Diamond Kings' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Spade Warriors' },
/*   { id: '00000000-0000-0000-0000-000000000006', name: 'Heart Breakers' },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Club Masters' },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Wild Cards' },
  { id: '00000000-0000-0000-0000-000000000009', name: 'Full House' },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Straight Shooters' },
  { id: '00000000-0000-0000-0000-000000000011', name: 'The Bluffers' },
  { id: '00000000-0000-0000-0000-000000000012', name: 'High Rollers' },
  { id: '00000000-0000-0000-0000-000000000013', name: 'Lucky Sevens' },
  { id: '00000000-0000-0000-0000-000000000014', name: 'Trump Cards' },
  { id: '00000000-0000-0000-0000-000000000015', name: 'Deck Destroyers' },
  { id: '00000000-0000-0000-0000-000000000016', name: 'Manille Maniacs' },
  { id: '00000000-0000-0000-0000-000000000017', name: 'Trick Takers' },
  { id: '00000000-0000-0000-0000-000000000018', name: 'The Shufflers' },
  { id: '00000000-0000-0000-0000-000000000019', name: 'Card Counters' },*/
];

/**
 * Set to true to load dummy teams on startup (when no persisted state exists).
 * Set to false to disable dummy data.
 */
export const USE_DUMMY_DATA = true;
