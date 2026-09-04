import { useState } from 'react';
import { useSources } from '../../state/SourcesContext';
import type { Source } from '../../types/track';
import styles from './OnboardingFlow.module.css';

export function DuplicatesStep({ onFinish }: { onFinish: () => void }) {
  const { dispatch } = useSources();
  const [rule, setRule] = useState<Source>('Local');

  const finish = () => {
    dispatch({ type: 'SET_REMEMBER_DUPLICATES', value: true });
    dispatch({ type: 'SET_DUPLICATE_PREFERENCE', source: rule });
    onFinish();
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>When a song is in two places</div>
      <div className={styles.sub}>Change this any time in Settings.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}>
        <button
          onClick={() => setRule('Local')}
          style={{ textAlign: 'left', padding: 18, borderRadius: 'var(--r-lg)', background: rule === 'Local' ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.03)', border: '1px solid var(--card-line)' }}
          data-tap
        >
          <div style={{ fontWeight: 590, color: 'var(--l1)' }}>Play my file</div>
          <div style={{ color: 'var(--l2)', fontSize: 13, marginTop: 4 }}>Streams only when no file exists.</div>
        </button>
        <button
          onClick={() => setRule('Spotify')}
          style={{ textAlign: 'left', padding: 18, borderRadius: 'var(--r-lg)', background: rule === 'Spotify' ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.03)', border: '1px solid var(--card-line)' }}
          data-tap
        >
          <div style={{ fontWeight: 590, color: 'var(--l1)' }}>Play the stream</div>
          <div style={{ color: 'var(--l2)', fontSize: 13, marginTop: 4 }}>Files stay available offline.</div>
        </button>
      </div>
      <div className={styles.spacer} />
      <button className={styles.primaryBtn} onClick={finish} data-tap>Open Library</button>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={`${styles.dot} ${styles.dotActive}`} />
      </div>
    </div>
  );
}
