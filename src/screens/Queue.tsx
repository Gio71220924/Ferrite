import { ArrowUp, ArrowDown, Play, Pause } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import { formatDuration } from '../lib/format';
import type { Track } from '../types/track';
import styles from './Queue.module.css';

export function Queue({ getTrack }: { getTrack: (id: string) => Track | undefined }) {
  const { state, dispatch } = usePlayback();
  const currentId = state.queue[state.currentIndex];
  const current = currentId ? getTrack(currentId) : undefined;
  const upcoming = state.queue.slice(state.currentIndex + 1);

  const move = (from: number, to: number) => {
    if (to <= state.currentIndex || to >= state.queue.length) return;
    dispatch({ type: 'REORDER', from, to });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Up Next</span>
      </div>

      {current && (
        <div className={styles.nowPlaying}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '400 var(--t-cap) var(--f-text)', color: 'var(--l2)', textTransform: 'uppercase' }}>Now playing</div>
            <div style={{ font: '590 var(--t-body) var(--f-text)', color: 'var(--l1)' }}>{current.title}</div>
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_PLAY' })} aria-label={state.playing ? 'Pause' : 'Play'} data-tap>
            {state.playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
        </div>
      )}

      <div className={styles.sectionRow}>
        <span>Next up</span>
        <button onClick={() => dispatch({ type: 'CLEAR_UPCOMING' })} data-tap>Clear</button>
      </div>

      {upcoming.map((id, i) => {
        const track = getTrack(id);
        if (!track) return null;
        const absoluteIndex = state.currentIndex + 1 + i;
        return (
          <div className={styles.row} key={`${id}-${absoluteIndex}`} data-testid="queue-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>{track.title}</div>
              <div style={{ color: 'var(--l2)', fontSize: 13 }}>{track.artist} · {formatDuration(track.durationSec)}</div>
            </div>
            <div className={styles.moveBtns}>
              <button onClick={() => move(absoluteIndex, absoluteIndex - 1)} aria-label="Move up" data-tap>
                <ArrowUp size={14} />
              </button>
              <button onClick={() => move(absoluteIndex, absoluteIndex + 1)} aria-label="Move down" data-tap>
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
