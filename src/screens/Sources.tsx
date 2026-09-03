import { useSources } from '../state/SourcesContext';
import { appleMusicConnector } from '../services/mockAppleMusic';
import { spotifyConnector } from '../services/mockSpotify';
import type { SourceConnector } from '../services/sourceConnector';
import type { StreamingKey } from '../state/sourcesReducer';
import styles from './Sources.module.css';

const SERVICES: { key: StreamingKey; name: string; color: string; connector: SourceConnector }[] = [
  { key: 'apple', name: 'Apple Music', color: 'var(--apple)', connector: appleMusicConnector },
  { key: 'spotify', name: 'Spotify', color: 'var(--spotify)', connector: spotifyConnector },
];

export function Sources() {
  const { state, dispatch } = useSources();

  const connect = async (key: StreamingKey, connector: SourceConnector) => {
    dispatch({ type: 'CONNECT_START', key });
    await connector.connect();
    dispatch({ type: 'CONNECT_DONE', key });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sources</h1>
      {SERVICES.map(({ key, name, color, connector }) => {
        const on = state[key];
        const busy = state.syncing === key;
        return (
          <div className={styles.card} key={key}>
            <div className={styles.row}>
              <div className={styles.dot}><div style={{ width: 9, height: 9, borderRadius: 5, background: color }} /></div>
              <div style={{ flex: 1 }}>
                <div className={styles.name}>{name}</div>
                <div className={styles.status}>
                  {busy && <span className={styles.spinner} />}{' '}
                  {busy ? 'Importing library…' : on ? (key === 'apple' ? '812 songs · 24 playlists' : '1,140 songs · 31 playlists') : 'Not connected'}
                </div>
              </div>
              <button
                className={styles.btn}
                onClick={() => (busy || on ? dispatch({ type: 'DISCONNECT', key }) : connect(key, connector))}
                data-tap
              >
                {busy ? 'Cancel' : on ? 'Unlink' : 'Connect'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
