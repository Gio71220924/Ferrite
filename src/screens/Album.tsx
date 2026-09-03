import type { Album as AlbumType, Track } from '../types/track';
import { albumTracks } from '../data/mockLibrary';
import { formatDuration } from '../lib/format';
import styles from './Album.module.css';

export function Album({ album, onPlay }: { album: AlbumType; onPlay: (track: Track, pool: Track[]) => void }) {
  const tracks = album.trackIds.map(id => albumTracks[id]).filter(Boolean);
  const streamOnly = tracks.filter(t => t.source !== 'Local').length;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.art} />
        <div className={styles.title}>{album.title}</div>
        <div className={styles.artist}>{album.artist}</div>
        <div className={styles.meta}>
          {album.year} · {tracks.length} tracks
          {album.variant === 'local' && album.sizeLabel && ` · FLAC 24/96 · ${album.sizeLabel}`}
          {album.variant === 'streaming' && ' · Lossless'}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} onClick={() => tracks[0] && onPlay(tracks[0], tracks)} data-tap>Play</button>
        {album.variant === 'local' && <button className={styles.secondary} data-tap>Shuffle</button>}
        {album.variant === 'streaming' && <button className={styles.secondary} data-tap>Save</button>}
        {album.variant === 'mixed' && <button className={styles.secondary} data-tap>Download {streamOnly}</button>}
      </div>

      {album.variant === 'streaming' && (
        <div className={styles.disclosure}>Streams from {tracks[0]?.source}. Nothing is stored on this iPhone.</div>
      )}

      {tracks.map((t, i) => (
        <div className={styles.trackRow} key={t.id} onClick={() => onPlay(t, tracks)} data-tap>
          <div className={styles.n}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{t.title}</div>
          {album.variant === 'mixed' && t.format && (
            <div style={{ padding: '2px 7px', borderRadius: 5, border: '1px solid var(--card-line)', font: '590 10px var(--f-mono)', color: 'var(--l2)' }}>
              {t.format}
            </div>
          )}
          <div style={{ font: '400 var(--t-foot) var(--f-mono)', color: 'var(--l3)' }}>{formatDuration(t.durationSec)}</div>
        </div>
      ))}
    </div>
  );
}
