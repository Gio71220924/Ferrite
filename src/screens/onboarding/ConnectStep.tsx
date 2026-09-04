import { useSources } from '../../state/SourcesContext';
import { appleMusicConnector } from '../../services/mockAppleMusic';
import { startLogin } from '../../services/spotifyAuth';
import type { SourceConnector } from '../../services/sourceConnector';
import type { StreamingKey } from '../../state/sourcesReducer';
import styles from './OnboardingFlow.module.css';

const SERVICES: { key: StreamingKey; name: string; connector: SourceConnector | null }[] = [
  { key: 'apple', name: 'Apple Music', connector: appleMusicConnector },
  { key: 'spotify', name: 'Spotify', connector: null },
];

export function ConnectStep({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useSources();

  const connect = async (key: StreamingKey, connector: SourceConnector) => {
    dispatch({ type: 'CONNECT_START', key });
    await connector.connect();
    dispatch({ type: 'CONNECT_DONE', key });
  };

  const onConnectClick = (key: StreamingKey, connector: SourceConnector | null) => {
    if (key === 'spotify') void startLogin();
    else if (connector) void connect(key, connector);
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>Add your accounts</div>
      <div className={styles.sub}>Optional. You can do this later.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}>
        {SERVICES.map(({ key, name, connector }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--card)', border: '1px solid var(--card-line)' }}>
            <div style={{ flex: 1 }}>{name}</div>
            <button onClick={() => onConnectClick(key, connector)} data-tap>
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
