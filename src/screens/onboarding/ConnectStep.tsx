import { useSources } from '../../state/SourcesContext';
import { startLogin as startYoutubeLogin } from '../../services/youtubeAuth';
import { startLogin as startSpotifyLogin } from '../../services/spotifyAuth';
import type { StreamingKey } from '../../state/sourcesReducer';
import styles from './OnboardingFlow.module.css';

const SERVICES: { key: StreamingKey; name: string }[] = [
  { key: 'youtube', name: 'YouTube' },
  { key: 'spotify', name: 'Spotify' },
];

export function ConnectStep({ onNext }: { onNext: () => void }) {
  const { state } = useSources();

  const onConnectClick = (key: StreamingKey) => {
    if (key === 'spotify') void startSpotifyLogin();
    else void startYoutubeLogin();
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>Add your accounts</div>
      <div className={styles.sub}>Optional. You can do this later.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}>
        {SERVICES.map(({ key, name }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--card)', border: '1px solid var(--card-line)' }}>
            <div style={{ flex: 1 }}>{name}</div>
            <button onClick={() => onConnectClick(key)} data-tap>
              {state.syncing === key ? 'Connecting…' : state[key] ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
      <div className={styles.spacer} />
      <button className={styles.skip} onClick={onNext} data-tap>Skip</button>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={`${styles.dot} ${styles.dotActive}`} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
