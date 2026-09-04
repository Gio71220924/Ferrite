import { getProfile, getSavedTracks } from './spotifyApi';
import type { Track } from '../types/track';

interface SpotifyLiveProfile {
  displayName: string;
  product: string;
}

let cachedTracks: Track[] = [];
let cachedProfile: SpotifyLiveProfile | null = null;

export function setSpotifyLibrary(tracks: Track[], profile: SpotifyLiveProfile) {
  cachedTracks = tracks;
  cachedProfile = profile;
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
}

/** Fetches the profile + saved tracks and populates the cache. Shared by
 * the OAuth callback and by the reload-time rehydrate, since both just
 * need "fetch everything, cache it" once a valid token is available. */
export async function refreshSpotifyLibrary(): Promise<void> {
  const [profile, tracks] = await Promise.all([getProfile(), getSavedTracks()]);
  setSpotifyLibrary(tracks, { displayName: profile.displayName, product: profile.product });
}
