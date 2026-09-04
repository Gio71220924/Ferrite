import { getValidAccessToken } from './spotifyAuth';
import type { Track } from '../types/track';

const API_BASE = 'https://api.spotify.com/v1';
// ponytail: hard cap on paginated fetches — a personal library (single-digit
// users, this app's stated scale) fits well under 1000 saved tracks; raise
// this if someone's real library turns out bigger.
const MAX_PAGES = 20;

async function apiFetch(path: string): Promise<unknown> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not logged in to Spotify');
  const res = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export interface SpotifyProfile {
  id: string;
  displayName: string;
  /** 'premium' | 'free' | 'open' — Web Playback SDK needs 'premium'. */
  product: string;
}

export async function getProfile(): Promise<SpotifyProfile> {
  const data = (await apiFetch('/me')) as { id: string; display_name: string; product: string };
  return { id: data.id, displayName: data.display_name, product: data.product };
}

interface SpotifySavedTrackItem {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: { images: { url: string; width: number; height: number }[] };
  };
}

interface SpotifySavedTracksPage {
  items: SpotifySavedTrackItem[];
  next: string | null;
}

function toTrack(item: SpotifySavedTrackItem): Track {
  const images = item.track.album.images;
  // Spotify returns images largest-first (typically 640/300/64px) — a
  // track row thumbnail doesn't need the full-size one.
  const artworkUrl = images[1]?.url ?? images[0]?.url;
  return {
    id: item.track.id,
    title: item.track.name,
    artist: item.track.artists.map(a => a.name).join(', '),
    source: 'Spotify',
    durationSec: Math.round(item.track.duration_ms / 1000),
    artworkUrl,
  };
}

export async function getSavedTracks(): Promise<Track[]> {
  const tracks: Track[] = [];
  let url: string | null = '/me/tracks?limit=50';
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data = (await apiFetch(url)) as SpotifySavedTracksPage;
    tracks.push(...data.items.map(toTrack));
    url = data.next;
  }
  return tracks;
}
