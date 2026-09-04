import type { Track } from '../types/track';

// ponytail: filename-based tagging only ("Artist - Title.ext"); real ID3
// parsing (e.g. music-metadata-browser) is the upgrade if users need it.
export function trackFromFile(file: File): Track {
  const base = file.name.replace(/\.[^.]+$/, '');
  const parts = base.split(' - ');
  const [artist, title] = parts.length >= 2 ? [parts[0], parts.slice(1).join(' - ')] : ['Unknown Artist', base];
  return {
    id: crypto.randomUUID(),
    title,
    artist,
    source: 'Local',
    durationSec: 0,
    fileUrl: URL.createObjectURL(file),
  };
}
