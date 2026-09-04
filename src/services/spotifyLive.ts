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
