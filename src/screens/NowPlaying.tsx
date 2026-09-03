import { useNavigate } from 'react-router-dom';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, ListMusic } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import { formatDuration } from '../lib/format';
import type { Track } from '../types/track';
import styles from './NowPlaying.module.css';

export function NowPlaying({ track, onClose }: { track: Track; onClose: () => void }) {
  const { state, dispatch } = usePlayback();
  const navigate = useNavigate();
  const pct = track.durationSec ? Math.min(state.positionSec / track.durationSec, 1) * 100 : 0;

  return (
    <div className={styles.page}>
      <button onClick={onClose} aria-label="Close" data-tap>
        <ChevronDown size={16} />
      </button>

      <div className={styles.art} />

      <div className={styles.title}>{track.title}</div>
      <div className={styles.artist}>{track.artist} — {track.source}</div>

      <div className={styles.scrubTrack}>
        <div className={styles.scrubFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.times}>
        <span>{formatDuration(state.positionSec)}</span>
        <span>-{formatDuration(Math.max(track.durationSec - state.positionSec, 0))}</span>
      </div>

      <div className={styles.transport}>
        <button onClick={() => dispatch({ type: 'PREV' })} aria-label="Previous" data-tap>
          <SkipBack size={30} />
        </button>
        <button
          className={styles.playBtn}
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          aria-label={state.playing ? 'Pause' : 'Play'}
          data-tap
        >
          {state.playing ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button onClick={() => dispatch({ type: 'NEXT' })} aria-label="Next" data-tap>
          <SkipForward size={30} />
        </button>
      </div>

      <button
        onClick={() => navigate('/queue')}
        aria-label="Open queue"
        data-tap
        style={{ alignSelf: 'center', marginTop: 20 }}
      >
        <ListMusic size={22} />
      </button>
    </div>
  );
}
