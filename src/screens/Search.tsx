import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import type { Source, Track } from '../types/track';
import { useLibrary } from '../state/LibraryContext';
import { useSources } from '../state/SourcesContext';
import { getYoutubeTracks } from '../services/youtubeLive';
import { getSpotifyTracks } from '../services/spotifyLive';
import { TrackRow } from '../components/TrackRow';
import styles from './Search.module.css';

const SCOPES: (Source | 'All')[] = ['All', 'Local', 'YouTube', 'Spotify'];

export function Search({ onPlay }: { onPlay: (track: Track, pool: Track[]) => void }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Source | 'All'>('All');
  const { state: library } = useLibrary();
  const { state: sources } = useSources();

  const linked = (s: Source) => s === 'Local' || (s === 'YouTube' ? sources.youtube : sources.spotify);

  const bySource: Record<Source, Track[]> = {
    Local: library.localTracks,
    YouTube: sources.youtube ? getYoutubeTracks() : [],
    Spotify: sources.spotify ? getSpotifyTracks() : [],
  };

  const allSources: Source[] = ['Local', 'YouTube', 'Spotify'];
  const scopeNames = (scope === 'All' ? allSources : [scope as Source]).filter(linked);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopeNames
      .map(name => ({
        name,
        items: bySource[name].filter(t => !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scope, library.localTracks, sources.youtube, sources.spotify]);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <div className={styles.input}>
          <SearchIcon size={16} color="var(--l2)" />
          <input
            className={styles.field}
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.scopes}>
        {SCOPES.map(s => {
          const disabled = s !== 'All' && !linked(s);
          return (
            <button
              key={s}
              className={`${styles.scopeBtn} ${scope === s ? styles.scopeBtnActive : ''}`}
              disabled={disabled}
              onClick={() => setScope(s)}
            >
              {s}
            </button>
          );
        })}
      </div>

      {groups.map(g => (
        <div key={g.name}>
          <div className={styles.groupHeader}>
            <span className={styles.groupName}>{g.name}</span>
            <span className={styles.groupCount}>{g.items.length} results</span>
          </div>
          {g.items.map(t => (
            <TrackRow key={t.id} track={t} sub={t.artist} onClick={() => onPlay(t, g.items)} />
          ))}
        </div>
      ))}
    </div>
  );
}
