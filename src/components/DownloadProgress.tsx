import { useState, useCallback, useRef } from 'react';
import { downloadBatch, type BatchProgress } from '../services/youtubeDownload';
import { useSources } from '../state/SourcesContext';
import styles from './DownloadProgress.module.css';

interface Props {
  videoIds: string[];
  onComplete: () => void;
}

export function DownloadProgress({ videoIds, onComplete }: Props) {
  const { dispatch: sourcesDispatch } = useSources();
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async () => {
    setIsRunning(true);
    setIsCancelled(false);
    setProgress(null);
    abortRef.current = new AbortController();

    try {
      const generator = downloadBatch(videoIds, abortRef.current.signal);
      for await (const p of generator) {
        setProgress(p);
        if (p.status === 'ok' && p.videoId) {
          sourcesDispatch({
            type: 'YOUTUBE_TRACK_DOWNLOADED',
            videoId: p.videoId,
            fileUrl: `/api/youtube/audio/${p.videoId}`,
          });
        }
      }
      onComplete();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setIsCancelled(true);
      } else {
        console.error('Batch download error:', err);
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [videoIds, onComplete, sourcesDispatch]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  if (!isRunning && !progress) {
    return (
      <button className={styles.start} onClick={start} data-tap>
        Download All as Audio ({videoIds.length} tracks)
      </button>
    );
  }

  const percent = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.stats}>
        {progress ? (
          <>
            <span>{progress.completed} / {progress.total}</span>
            {progress.failed > 0 && <span className={styles.failed}>{progress.failed} failed</span>}
          </>
        ) : (
          <span>Starting...</span>
        )}
      </div>
      {isRunning && (
        <button className={styles.cancel} onClick={cancel} data-tap>
          Cancel
        </button>
      )}
      {isCancelled && <div className={styles.cancelled}>Download cancelled</div>}
    </div>
  );
}
