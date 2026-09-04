import { describe, it, expect } from 'vitest';
import { keyOf, findDuplicates } from './duplicates';
import type { Track } from '../types/track';

const t = (over: Partial<Track>): Track => ({
  id: over.id ?? 'x', title: 'Midnight Ferry', artist: 'Rosalind Ver',
  source: 'Local', durationSec: 244, ...over,
});

describe('duplicates', () => {
  it('keys are case- and whitespace-insensitive', () => {
    expect(keyOf({ title: ' Midnight Ferry ', artist: 'Rosalind Ver' }))
      .toBe(keyOf({ title: 'midnight ferry', artist: 'rosalind ver' }));
  });

  it('groups same title+artist across sources', () => {
    const tracks = [
      t({ id: 'a', source: 'Local' }),
      t({ id: 'b', source: 'YouTube' }),
      t({ id: 'c', title: 'Unrelated Song' }),
    ];
    const groups = findDuplicates(tracks);
    expect(groups.size).toBe(1);
    expect([...groups.values()][0]).toHaveLength(2);
  });

  it('does not group a track that only appears once', () => {
    const tracks = [t({ id: 'a' })];
    expect(findDuplicates(tracks).size).toBe(0);
  });
});
