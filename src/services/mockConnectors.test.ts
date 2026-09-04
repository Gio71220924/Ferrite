import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { youtubeConnector } from './mockYouTube';
import { spotifyConnector } from './mockSpotify';

describe('mock connectors', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('youtubeConnector resolves after the mock delay with counts', async () => {
    const p = youtubeConnector.connect();
    await vi.advanceTimersByTimeAsync(1600);
    await expect(p).resolves.toEqual({ trackCount: 812, playlistCount: 24 });
  });

  it('spotifyConnector resolves after the mock delay with counts', async () => {
    const p = spotifyConnector.connect();
    await vi.advanceTimersByTimeAsync(1600);
    await expect(p).resolves.toEqual({ trackCount: 1140, playlistCount: 31 });
  });

  it('catalog() returns the mock streaming tracks', () => {
    expect(youtubeConnector.catalog().length).toBeGreaterThan(0);
    expect(spotifyConnector.catalog().length).toBeGreaterThan(0);
  });
});
