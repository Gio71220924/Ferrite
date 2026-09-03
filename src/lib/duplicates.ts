import type { Track } from '../types/track';

export function keyOf(t: Pick<Track, 'title' | 'artist'>): string {
  return `${t.title.trim().toLowerCase()} ${t.artist.trim().toLowerCase()}`;
}

export function findDuplicates(tracks: Track[]): Map<string, Track[]> {
  const groups = new Map<string, Track[]>();
  for (const t of tracks) {
    const k = keyOf(t);
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  for (const [k, v] of groups) if (v.length < 2) groups.delete(k);
  return groups;
}
