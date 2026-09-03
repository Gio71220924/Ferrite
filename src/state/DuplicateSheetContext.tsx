import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Source, Track } from '../types/track';
import { keyOf, findDuplicates } from '../lib/duplicates';
import { useLibrary } from './LibraryContext';
import { useSources } from './SourcesContext';
import { usePlayback } from './PlaybackContext';

interface Pending {
  key: string;
  copies: Track[];
  pool: Track[];
}

interface Ctx {
  pending: Pending | null;
  requestPlay: (track: Track, pool: Track[]) => void;
  resolve: (source: Source) => void;
  cancel: () => void;
}

const DuplicateSheetContext = createContext<Ctx | null>(null);

export function DuplicateSheetProvider({ children }: { children: ReactNode }) {
  const { state: library, dispatch: libDispatch } = useLibrary();
  const { state: sources } = useSources();
  const { dispatch: playbackDispatch } = usePlayback();
  const [pending, setPending] = useState<Pending | null>(null);

  const playTrack = (track: Track, pool: Track[]) => {
    const ids = pool.map(t => t.id);
    playbackDispatch({ type: 'PLAY_TRACK', trackIds: ids, index: ids.indexOf(track.id) });
  };

  const requestPlay = (track: Track, pool: Track[]) => {
    const key = keyOf(track);
    const groups = findDuplicates(pool);
    const copies = groups.get(key);

    if (!copies || copies.length < 2) {
      playTrack(track, pool);
      return;
    }

    const remembered = sources.rememberDuplicates ? library.duplicateChoice[key] : undefined;
    if (remembered) {
      const chosen = copies.find(c => c.source === remembered) ?? track;
      playTrack(chosen, pool);
      return;
    }

    setPending({ key, copies, pool });
  };

  const resolve = (source: Source) => {
    if (!pending) return;
    const chosen = pending.copies.find(c => c.source === source);
    if (chosen) {
      playTrack(chosen, pending.pool);
      libDispatch({ type: 'RESOLVE_DUPLICATE', key: pending.key, source });
    }
    setPending(null);
  };

  const cancel = () => setPending(null);

  return (
    <DuplicateSheetContext.Provider value={{ pending, requestPlay, resolve, cancel }}>
      {children}
    </DuplicateSheetContext.Provider>
  );
}

export function useDuplicateSheet() {
  const ctx = useContext(DuplicateSheetContext);
  if (!ctx) throw new Error('useDuplicateSheet must be used within DuplicateSheetProvider');
  return ctx;
}
