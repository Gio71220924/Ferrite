const KEY = 'ferrite:recentlyPlayed';
const MAX = 10;

interface Entry {
  id: string;
  playedAt: number;
}

function readEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Entry[];
  } catch {
    return [];
  }
}

export function getRecentlyPlayedIds(): string[] {
  return readEntries().map(e => e.id);
}

export function recordPlayed(id: string) {
  const entries = readEntries().filter(e => e.id !== id);
  entries.unshift({ id, playedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
}
