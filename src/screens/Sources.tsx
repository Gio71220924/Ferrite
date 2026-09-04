import { useRef, useState } from 'react';
import { useSources } from '../state/SourcesContext';
import { useLibrary } from '../state/LibraryContext';
import { appleMusicConnector } from '../services/mockAppleMusic';
import { spotifyConnector } from '../services/mockSpotify';
import { trackFromFile } from '../lib/trackFromFile';
import type { SourceConnector } from '../services/sourceConnector';
import type { SourcesState, StreamingKey } from '../state/sourcesReducer';
import styles from './Sources.module.css';

const SERVICES: { key: StreamingKey; name: string; color: string; connector: SourceConnector }[] = [
  { key: 'apple', name: 'Apple Music', color: 'var(--apple)', connector: appleMusicConnector },
  { key: 'spotify', name: 'Spotify', color: 'var(--spotify)', connector: spotifyConnector },
];

const PREF_ROWS: { key: keyof SourcesState['prefs']; label: string; hint: string; needsStream: boolean }[] = [
  { key: 'wifiOnly', label: 'Sync over Wi-Fi only', hint: 'Pause streaming-library sync on cellular', needsStream: true },
  { key: 'preferLocal', label: 'Prefer local file when duplicated', hint: 'Play your own copy instead of the stream', needsStream: true },
  { key: 'cacheOffline', label: 'Cache artwork & metadata', hint: 'Keeps the library browsable offline', needsStream: false },
];

export function Sources() {
  const { state, dispatch } = useSources();
  const { state: library, dispatch: libDispatch } = useLibrary();
  const [lastSynced, setLastSynced] = useState<Partial<Record<StreamingKey, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const anyStreamLinked = state.apple || state.spotify;

  const connect = async (key: StreamingKey, connector: SourceConnector) => {
    dispatch({ type: 'CONNECT_START', key });
    await connector.connect();
    dispatch({ type: 'CONNECT_DONE', key });
    setLastSynced(s => ({ ...s, [key]: 'Just now' }));
  };

  const onManageFiles = (files: FileList) => {
    libDispatch({ type: 'IMPORT_LOCAL_FILES', tracks: Array.from(files).map(trackFromFile) });
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
            <div className={styles.syncedRow}>
              <span className={styles.syncedLabel}>Last synced</span>
              <span className={styles.syncedValue}>{on ? (lastSynced[key] ?? 'Just now') : '—'}</span>
            </div>
          </div>
        );
      })}

      <div className={styles.sectionLabel}>Sync preferences</div>
      <div className={styles.prefsCard}>
        {PREF_ROWS.map(({ key, label, hint, needsStream }) => {
          const off = needsStream && !anyStreamLinked;
          return (
            <div className={styles.prefRow} key={key} style={{ opacity: off ? 0.4 : 1 }}>
              <div style={{ flex: 1 }}>
                <div className={styles.prefLabel}>{label}</div>
                <div className={styles.prefHint}>{hint}</div>
              </div>
              <button
                className={`${styles.toggle} ${state.prefs[key] && !off ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => !off && dispatch({ type: 'SET_PREF', key })}
                disabled={off}
                aria-label={label}
                aria-pressed={state.prefs[key]}
                data-tap
              >
                <div className={styles.toggleKnob} />
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>Storage</div>
      <div className={styles.prefsCard}>
        <div className={styles.storageRow}>
          <span className={styles.storageLabel}>Local files</span>
          <span className={styles.storageValue}>{library.localTracks.length.toLocaleString()}</span>
        </div>
        <div className={styles.storageRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => e.target.files && onManageFiles(e.target.files)}
          />
          <button className={styles.manageLink} onClick={() => fileInputRef.current?.click()} data-tap>
            Manage local files
          </button>
        </div>
      </div>
    </div>
  );
}
