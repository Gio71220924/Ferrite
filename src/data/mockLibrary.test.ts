import { describe, it, expect } from 'vitest';
import { appleMusicCatalog, spotifyCatalog, albums, albumTracks } from './mockLibrary';

describe('mockLibrary', () => {
  it('seeds a Midnight Ferry / Rosalind Ver duplicate on both streaming catalogs, for the duplicate-sheet demo', () => {
    expect(appleMusicCatalog.some(t => t.title === 'Midnight Ferry' && t.artist === 'Rosalind Ver')).toBe(true);
    expect(spotifyCatalog.some(t => t.title === 'Midnight Ferry' && t.artist === 'Rosalind Ver')).toBe(true);
  });

  it('every album trackId resolves to a track tagged with that album', () => {
    for (const album of albums) {
      for (const id of album.trackIds) {
        expect(albumTracks[id]?.albumId).toBe(album.id);
      }
    }
  });
});
