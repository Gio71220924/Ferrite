import { getProfile, getLikedVideos } from './youtubeApi';
import type { Track } from '../types/track';

interface YouTubeLiveProfile {
  channelTitle: string;
}

const CACHE_KEY = 'ferrite:youtube:library';

function loadCache(): { tracks: Track[]; profile: YouTubeLiveProfile } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const cached = loadCache();
let cachedTracks: Track[] = cached?.tracks ?? [];
let cachedProfile: YouTubeLiveProfile | null = cached?.profile ?? null;

export function setYoutubeLibrary(tracks: Track[], profile: YouTubeLiveProfile) {
  cachedTracks = tracks;
  cachedProfile = profile;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ tracks, profile }));
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
  localStorage.removeItem(CACHE_KEY);
}

/** Fetches the profile + liked videos and populates the cache. Shared by
 * the OAuth callback and the reload-time rehydrate. */
export async function refreshYoutubeLibrary(): Promise<void> {
  const [profile, tracks] = await Promise.all([getProfile(), getLikedVideos()]);
  setYoutubeLibrary(tracks, { channelTitle: profile.channelTitle });
}
