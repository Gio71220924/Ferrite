import { describe, it, expect } from 'vitest';
import { albums, albumTracks } from './mockLibrary';

describe('mockLibrary', () => {
  it('every album trackId resolves to a track tagged with that album', () => {
    for (const album of albums) {
      for (const id of album.trackIds) {
        expect(albumTracks[id]?.albumId).toBe(album.id);
      }
    }
  });
});
