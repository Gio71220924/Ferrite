import { CloudOff } from 'lucide-react';
import type { Track } from '../types/track';
import { formatDuration } from '../lib/format';
import styles from './TrackRow.module.css';

export function TrackRow({ track, onClick, sub, offline }: { track: Track; onClick: () => void; sub?: string; offline?: boolean }) {
  const unavailable = offline && track.source !== 'Local';
  return (
    <button className={styles.row} onClick={onClick} data-tap style={unavailable ? { opacity: 0.4 } : undefined}>
      <div className={styles.art} />
      <div className={styles.body}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.title}>{track.title}</div>
          <div className={styles.sub}>{sub ?? `${track.artist} · ${track.source}`}</div>
        </div>
        {unavailable ? (
          <CloudOff size={16} color="var(--l3)" />
        ) : (
          <div className={styles.dur}>{formatDuration(track.durationSec)}</div>
        )}
      </div>
    </button>
  );
}
