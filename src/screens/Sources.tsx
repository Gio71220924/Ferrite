import { useRef, useState, useCallback } from 'react';
import { useSources } from '../state/SourcesContext';
import { useLibrary } from '../state/LibraryContext';
import { startLogin as startSpotifyLogin, clearStoredToken as clearSpotifyToken } from '../services/spotifyAuth';
import { getSpotifyTracks, getSpotifyProfile, clearSpotifyLibrary } from '../services/spotifyLive';
import { startLogin as startYoutubeLogin, clearStoredToken as clearYoutubeToken } from '../services/youtubeAuth';
import { getYoutubeTracks, getYoutubeProfile, clearYoutubeLibrary } from '../services/youtubeLive';
import { getDownloadStatus } from '../services/youtubeDownload';
import { trackFromFile } from '../lib/trackFromFile';
import { DownloadProgress } from '../components/DownloadProgress';
import type { SourcesState, StreamingKey } from '../state/sourcesReducer';
import styles from './Sources.module.css';

const SERVICES: { key: StreamingKey; name: string; color: string }[] = [
  { key: 'youtube', name: 'YouTube', color: 'var(--youtube)' },
  { key: 'spotify', name: 'Spotify', color: 'var(--spotify)' },
];

const PREF_ROWS: { key: keyof SourcesState['prefs']; label: string; hint: string; needsStream: boolean }[] = [
  { key: 'wifiOnly', label: 'Sync over Wi-Fi only', hint: 'Pause streaming-library sync on cellular', needsStream: true },
  { key: 'preferLocal', label: 'Prefer local file when duplicated', hint: 'Play your own copy instead of the stream', needsStream: true },
  { key: 'cacheOffline', label: 'Cache artwork & metadata', hint: 'Keeps the library browsable offline', needsStream: false },
];

export function Sources() {
  const { state, dispatch } = useSources();
  const { state: library, dispatch: libDispatch } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [undownloadedIds, setUndownloadedIds] = useState<string[]>([]);

  const anyStreamLinked = state.youtube || state.spotify;

  const handleDownloadComplete = useCallback(() => {
    setUndownloadedIds([]);
  }, []);

  const triggerDownloadCheck = async () => {
    const youtubeTracks = getYoutubeTracks();
    if (youtubeTracks.length === 0) return;
    const ids = youtubeTracks.map(t => t.id);
    const status = await getDownloadStatus(ids);
    const pending = ids.filter(id => !status.get(id));
    setUndownloadedIds(pending);
  };

  const disconnect = (key: StreamingKey) => {
    dispatch({ type: 'DISCONNECT', key });
    if (key === 'spotify') {
      clearSpotifyToken();
      clearSpotifyLibrary();
    } else {
      clearYoutubeToken();
      clearYoutubeLibrary();
    }
  };

  const onManageFiles = (files: FileList) => {
    libDispatch({ type: 'IMPORT_LOCAL_FILES', tracks: Array.from(files).map(trackFromFile) });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sources</h1>
      {SERVICES.map(({ key, name, color }) => {
        const on = state[key];
        const busy = state.syncing === key;
        const spotifyProfile = key === 'spotify' ? getSpotifyProfile() : null;
        const youtubeProfile = key === 'youtube' ? getYoutubeProfile() : null;
        const statusText = busy
          ? 'Importing library…'
          : on
            ? key === 'youtube'
              ? `${getYoutubeTracks().length.toLocaleString()} liked videos${youtubeProfile ? ` · ${youtubeProfile.channelTitle}` : ''}`
              : `${getSpotifyTracks().length.toLocaleString()} songs${spotifyProfile ? ` · ${spotifyProfile.displayName}` : ''}`
            : 'Not connected';
        const onClick = () => {
          if (busy || on) {
            disconnect(key);
            return;
          }
          if (key === 'spotify') void startSpotifyLogin();
          else void startYoutubeLogin();
        };
        return (
          <div className={styles.card} key={key}>
            <div className={styles.row}>
              <div className={styles.dot}><div style={{ width: 9, height: 9, borderRadius: 5, background: color }} /></div>
              <div style={{ flex: 1 }}>
                <div className={styles.name}>{name}</div>
                <div className={styles.status}>
                  {busy && <span className={styles.spinner} />}{' '}
                  {statusText}
                </div>
              </div>
              <button className={styles.btn} onClick={onClick} data-tap>
                {busy ? 'Cancel' : on ? 'Unlink' : 'Connect'}
              </button>
            </div>
            <div className={styles.syncedRow}>
              <span className={styles.syncedLabel}>Last synced</span>
              <span className={styles.syncedValue}>{on ? 'Just now' : '—'}</span>
            </div>
          </div>
        );
      })}

      {state.youtube && getYoutubeTracks().length > 0 && (
        <>
          <div className={styles.sectionLabel}>YouTube Audio Download</div>
          <div className={styles.prefsCard}>
            <div className={styles.storageRow}>
              <span className={styles.storageLabel}>Download audio from liked videos to play in-app</span>
            </div>
            {undownloadedIds.length > 0 ? (
              <DownloadProgress videoIds={undownloadedIds} onComplete={handleDownloadComplete} />
            ) : (
              <button className={styles.manageLink} onClick={triggerDownloadCheck} data-tap>
                Check for undownloaded tracks
              </button>
            )}
          </div>
        </>
      )}

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
