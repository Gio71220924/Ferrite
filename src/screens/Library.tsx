import { useMemo } from 'react';
import type { Source, Track } from '../types/track';
import { useLibrary } from '../state/LibraryContext';
import { useSources } from '../state/SourcesContext';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { getYoutubeTracks } from '../services/youtubeLive';
import { getSpotifyTracks } from '../services/spotifyLive';
import { getRecentlyPlayedIds } from '../lib/recentlyPlayed';
import { TrackRow } from '../components/TrackRow';
import { FerriteMark } from '../components/FerriteMark';
import { WifiOff } from 'lucide-react';
import styles from './Library.module.css';

const ALL_SOURCES: (Source | 'All')[] = ['All', 'Local', 'YouTube', 'Spotify'];

export function Library({ onPlay }: { onPlay: (track: Track, pool: Track[]) => void }) {
  const { state: library, dispatch } = useLibrary();
  const { state: sources } = useSources();
  const online = useOnlineStatus();

  const linked = (s: Source) => s === 'Local' || (s === 'YouTube' ? sources.youtube : sources.spotify);

  const pool: Track[] = useMemo(() => {
    const streaming = [
      ...(sources.youtube ? getYoutubeTracks() : []),
      ...(sources.spotify ? getSpotifyTracks() : []),
    ];
    return [...library.localTracks, ...streaming];
  }, [library.localTracks, sources.youtube, sources.spotify]);

  const recentTracks = useMemo(() => {
    const byId = new Map(pool.map(t => [t.id, t]));
    return getRecentlyPlayedIds()
      .map(id => byId.get(id))
      .filter((t): t is Track => !!t);
  }, [pool]);

  const effectiveFilter: Source | 'All' = !online && library.filter !== 'Local' ? 'Local' : library.filter;

  // Offline: show every linked track (local + previously-connected sources'
  // cached catalog) so streaming rows stay visible-but-dimmed rather than
  // disappearing — the segment picker still restricts to Local, but the
  // list itself isn't filtered down while offline.
  const visible = !online
    ? pool.filter(t => linked(t.source))
    : effectiveFilter === 'All'
      ? pool.filter(t => linked(t.source))
      : pool.filter(t => t.source === effectiveFilter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Library</h1>
      </div>

      {!online && (
        <div className={styles.offlineBanner}>
          <WifiOff size={18} color="var(--l2)" />
          <div>
            <div style={{ font: '590 var(--t-sub) var(--f-text)', color: 'var(--l1)' }}>No connection</div>
            <div style={{ font: '400 var(--t-foot) var(--f-text)', color: 'var(--l2)' }}>
              {library.localTracks.length} local tracks still play. Streaming resumes when you are back online.
            </div>
          </div>
        </div>
      )}

      {recentTracks.length > 0 && (
        <>
          <div className={styles.railLabel}>Recently played</div>
          <div className={styles.rail}>
            {recentTracks.map(t => (
              <button key={t.id} className={styles.railCard} onClick={() => onPlay(t, pool)} data-tap>
                {t.artworkUrl ? <img className={styles.railArt} src={t.artworkUrl} alt="" /> : <div className={styles.railArt} />}
                <div className={styles.railTitle}>{t.title}</div>
                <div className={styles.railSub}>{t.artist}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className={styles.segment}>
        {ALL_SOURCES.map(s => {
          const disabled = (s !== 'All' && s !== 'Local' && !linked(s)) || (!online && s !== 'Local' && s !== 'All');
          return (
            <button
              key={s}
              className={`${styles.segBtn} ${effectiveFilter === s ? styles.segBtnActive : ''} ${disabled ? styles.segBtnDisabled : ''}`}
              disabled={disabled}
              onClick={() => dispatch({ type: 'SET_FILTER', filter: s })}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>
        <span>{effectiveFilter === 'All' ? 'All tracks' : effectiveFilter}</span>
        <span>{visible.length} {visible.length === 1 ? 'track' : 'tracks'}</span>
      </div>

      {visible.length === 0 && (
        <div className={styles.empty}>
          <FerriteMark size={22} color="var(--l3)" />
          <div className={styles.emptyTitle} style={{ marginTop: 10 }}>
            {effectiveFilter === 'All' ? 'Nothing to play yet' : `No ${effectiveFilter} tracks`}
          </div>
          <div className={styles.emptyBody}>
            Connect a service in Settings, or add files from your device.
          </div>
        </div>
      )}

      {visible.map(t => (
        <TrackRow key={t.id} track={t} offline={!online} onClick={() => onPlay(t, visible)} />
      ))}
    </div>
  );
}
