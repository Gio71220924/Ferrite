import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSavedTracks, getProfile } from './spotifyApi';

vi.mock('./spotifyAuth', () => ({
  getValidAccessToken: vi.fn().mockResolvedValue('test-access-token'),
}));

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 401, json: async () => body } as Response;
}

describe('spotifyApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getProfile maps the Spotify /me response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ id: 'user123', display_name: 'Rosalind', product: 'premium' }),
    );
    const profile = await getProfile();
    expect(profile).toEqual({ id: 'user123', displayName: 'Rosalind', product: 'premium' });
  });

  it('getSavedTracks maps track items and follows pagination until next is null', async () => {
    const track = (id: string, name: string) => ({
      track: { id, name, duration_ms: 200_000, artists: [{ name: 'Rosalind Ver' }] },
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ items: [track('t1', 'Midnight Ferry')], next: 'https://api.spotify.com/v1/me/tracks?offset=50' }))
      .mockResolvedValueOnce(jsonResponse({ items: [track('t2', 'Slow Static')], next: null }));

    const tracks = await getSavedTracks();

    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toEqual({
      id: 't1',
      title: 'Midnight Ferry',
      artist: 'Rosalind Ver',
      source: 'Spotify',
      durationSec: 200,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('getSavedTracks throws on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, false));
    await expect(getSavedTracks()).rejects.toThrow(/401/);
  });
});
