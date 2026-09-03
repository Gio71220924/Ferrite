import type { Track } from '../types/track';
import { formatDuration } from '../lib/format';
import styles from './TrackRow.module.css';

export function TrackRow({ track, onClick, sub }: { track: Track; onClick: () => void; sub?: string }) {
  return (
    <button className={styles.row} onClick={onClick} data-tap>
      <div className={styles.art} />
      <div className={styles.body}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.title}>{track.title}</div>
          <div className={styles.sub}>{sub ?? `${track.artist} · ${track.source}`}</div>
        </div>
        <div className={styles.dur}>{formatDuration(track.durationSec)}</div>
      </div>
    </button>
  );
}
