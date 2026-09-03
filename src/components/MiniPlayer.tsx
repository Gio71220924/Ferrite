import { Play, Pause } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';
import styles from './MiniPlayer.module.css';

export function MiniPlayer({ track, onOpen }: { track: Track; onOpen?: () => void }) {
  const { state, dispatch } = usePlayback();
  return (
    <div className={styles.bar}>
      <button className={styles.art} onClick={onOpen} aria-label="Open now playing" data-tap />
      <div className={styles.info} onClick={onOpen}>
        <div className={styles.title}>{track.title}</div>
        <div className={styles.sub}>{track.artist} · {track.source}</div>
      </div>
      <button
        className={styles.toggle}
        onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
        aria-label={state.playing ? 'Pause' : 'Play'}
        data-tap
      >
        {state.playing ? <Pause size={17} /> : <Play size={17} />}
      </button>
    </div>
  );
}
