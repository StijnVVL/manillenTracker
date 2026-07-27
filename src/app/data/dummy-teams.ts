/**
 * Dummy team data for development/testing purposes.
 * Remove this file and its import in tournament.service.ts when no longer needed.
 */

import { Team } from '../models/tournament.model';

export const DUMMY_TEAMS: Team[] = [
  { id: '00000000-0000-0000-0000-000000000000', name: 'The Aces', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000001', name: 'Royal FlushRoyal FlushRoyal FlushRoyal FlushRoyal FlushRoyal FlushRoyal FlushRoyal FlushRoyal Flush', player1: '', player2: '' },
 { id: '00000000-0000-0000-0000-000000000002', name: 'Card Sharks', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'The Jokers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Diamond Kings', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Spade Warriors', player1: '', player2: '' },
   { id: '00000000-0000-0000-0000-000000000006', name: 'Heart Breakers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Club Masters', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Wild Cards', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000009', name: 'Full House', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000010', name: 'Straight Shooters', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000011', name: 'The Bluffers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000012', name: 'High Rollers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000013', name: 'Lucky Sevens', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000014', name: 'Trump Cards', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000015', name: 'Deck Destroyers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000016', name: 'Manille Maniacs', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000017', name: 'Trick Takers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000018', name: 'The Shufflers', player1: '', player2: '' },
  { id: '00000000-0000-0000-0000-000000000019', name: 'Card Counters', player1: '', player2: '' },
];

/**
 * Set to true to load dummy teams on startup (when no persisted state exists).
 * Set to false to disable dummy data.
 */
export const USE_DUMMY_DATA = true;
