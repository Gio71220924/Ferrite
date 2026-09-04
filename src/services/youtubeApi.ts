import { getValidAccessToken } from './youtubeAuth';
import type { Track } from '../types/track';

const API_BASE = 'https://www.googleapis.com/youtube/v3';
// ponytail: hard cap on paginated fetches — a personal library (single-digit
// users, this app's stated scale) fits well under 1000 liked videos; raise
// this if someone's real liked-videos list turns out bigger.
const MAX_PAGES = 20;

async function apiFetch(path: string): Promise<unknown> {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not logged in to YouTube');
  const res = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  return res.json();
}

export interface YouTubeProfile {
  channelTitle: string;
}

async function getLikesPlaylistId(): Promise<string> {
  const data = (await apiFetch('/channels?part=contentDetails,snippet&mine=true')) as {
    items: { contentDetails: { relatedPlaylists: { likes: string } }; snippet: { title: string } }[];
  };
  const channel = data.items[0];
  if (!channel) throw new Error('No YouTube channel found on this Google account');
  return channel.contentDetails.relatedPlaylists.likes;
}

export async function getProfile(): Promise<YouTubeProfile> {
  const data = (await apiFetch('/channels?part=snippet&mine=true')) as {
    items: { snippet: { title: string } }[];
  };
  return { channelTitle: data.items[0]?.snippet.title ?? 'YouTube' };
}

interface PlaylistItemsPage {
  items: { contentDetails: { videoId: string } }[];
  nextPageToken?: string;
}

function parseIsoDuration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

interface VideoDetails {
  id: string;
  snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } };
  contentDetails: { duration: string };
}

async function getVideoDetails(videoIds: string[]): Promise<Map<string, VideoDetails>> {
  const byId = new Map<string, VideoDetails>();
  // videos.list accepts at most 50 ids per call.
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = (await apiFetch(`/videos?part=snippet,contentDetails&id=${batch.join(',')}`)) as { items: VideoDetails[] };
    for (const v of data.items) byId.set(v.id, v);
  }
  return byId;
}

export async function getLikedVideos(): Promise<Track[]> {
  const playlistId = await getLikesPlaylistId();

  const videoIds: string[] = [];
  let url: string | null = `/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}`;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data = (await apiFetch(url)) as PlaylistItemsPage;
    videoIds.push(...data.items.map(i => i.contentDetails.videoId));
    url = data.nextPageToken
      ? `/playlistItems?part=contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${data.nextPageToken}`
      : null;
  }

  const details = await getVideoDetails(videoIds);
  return videoIds
    .map(id => details.get(id))
    .filter((v): v is VideoDetails => !!v)
    .map(v => ({
      id: v.id,
      title: v.snippet.title,
      artist: v.snippet.channelTitle,
      source: 'YouTube' as const,
      durationSec: parseIsoDuration(v.contentDetails.duration),
      artworkUrl: v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.default?.url,
    }));
}
