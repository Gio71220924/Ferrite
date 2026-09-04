import { getProfile, getSavedTracks } from './spotifyApi';
import type { Track } from '../types/track';

interface SpotifyLiveProfile {
  displayName: string;
  product: string;
}

const CACHE_KEY = 'ferrite:spotify:library';

function loadCache(): { tracks: Track[]; profile: SpotifyLiveProfile } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const cached = loadCache();
let cachedTracks: Track[] = cached?.tracks ?? [];
let cachedProfile: SpotifyLiveProfile | null = cached?.profile ?? null;

export function setSpotifyLibrary(tracks: Track[], profile: SpotifyLiveProfile) {
  cachedTracks = tracks;
  cachedProfile = profile;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ tracks, profile }));
}

export function getSpotifyTracks(): Track[] {
  return cachedTracks;
}

export function getSpotifyProfile(): SpotifyLiveProfile | null {
  return cachedProfile;
}

export function clearSpotifyLibrary() {
  cachedTracks = [];
  cachedProfile = null;
  localStorage.removeItem(CACHE_KEY);
}

/** Fetches the profile + saved tracks and populates the cache. Shared by
 * the OAuth callback and by the reload-time rehydrate, since both just
 * need "fetch everything, cache it" once a valid token is available. */
export async function refreshSpotifyLibrary(): Promise<void> {
  const [profile, tracks] = await Promise.all([getProfile(), getSavedTracks()]);
  setSpotifyLibrary(tracks, { displayName: profile.displayName, product: profile.product });
}
