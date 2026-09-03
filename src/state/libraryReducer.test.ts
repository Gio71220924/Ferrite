import { describe, it, expect } from 'vitest';
import { libraryReducer, initialLibraryState } from './libraryReducer';
import type { Track } from '../types/track';

const localTrack: Track = { id: 'l1', title: 'A', artist: 'B', source: 'Local', durationSec: 100, fileUrl: 'blob:1' };

describe('libraryReducer', () => {
  it('SET_FILTER changes the active filter', () => {
    const s = libraryReducer(initialLibraryState, { type: 'SET_FILTER', filter: 'Local' });
    expect(s.filter).toBe('Local');
  });

  it('IMPORT_LOCAL_FILES appends tracks', () => {
    const s = libraryReducer(initialLibraryState, { type: 'IMPORT_LOCAL_FILES', tracks: [localTrack] });
    expect(s.localTracks).toEqual([localTrack]);
  });

  it('RESOLVE_DUPLICATE records a choice keyed by the group key', () => {
    const s = libraryReducer(initialLibraryState, { type: 'RESOLVE_DUPLICATE', key: 'a b', source: 'Local' });
    expect(s.duplicateChoice['a b']).toBe('Local');
  });
});
