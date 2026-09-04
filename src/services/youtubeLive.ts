import { getProfile, getLikedVideos } from './youtubeApi';
import type { Track } from '../types/track';

interface YouTubeLiveProfile {
  channelTitle: string;
}

let cachedTracks: Track[] = [];
let cachedProfile: YouTubeLiveProfile | null = null;

export function setYoutubeLibrary(tracks: Track[], profile: YouTubeLiveProfile) {
  cachedTracks = tracks;
  cachedProfile = profile;
}

export function getYoutubeTracks(): Track[] {
  return cachedTracks;
}

export function getYoutubeProfile(): YouTubeLiveProfile | null {
  return cachedProfile;
}

export function clearYoutubeLibrary() {
  cachedTracks = [];
  cachedProfile = null;
}

/** Fetches the profile + liked videos and populates the cache. Shared by
 * the OAuth callback and the reload-time rehydrate. */
export async function refreshYoutubeLibrary(): Promise<void> {
  const [profile, tracks] = await Promise.all([getProfile(), getLikedVideos()]);
  setYoutubeLibrary(tracks, { channelTitle: profile.channelTitle });
}
