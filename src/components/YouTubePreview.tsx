import { useState } from 'react';
import type { Track } from '../types/track';
import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import { useSources } from '../state/SourcesContext';
import { downloadAudio, getAudioStreamUrl } from '../services/youtubeDownload';
import styles from './YouTubePreview.module.css';

export function YouTubePreview({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const { playPreview, playStream } = useDuplicateSheet();
  const { dispatch: sourcesDispatch } = useSources();
  const [downloading, setDownloading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!track) return null;

  const isDownloaded = !!track.fileUrl;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const result = await downloadAudio(track.id);
      sourcesDispatch({
        type: 'YOUTUBE_TRACK_DOWNLOADED',
        videoId: track.id,
        fileUrl: result.fileUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleStream = async () => {
    setStreaming(true);
    setError(null);
    try {
      const result = await getAudioStreamUrl(track.id);
      playStream(track, result.streamUrl, result.duration);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream failed');
    } finally {
      setStreaming(false);
    }
  };

  const handlePlay = () => {
    playPreview();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.grabber} />
        {track.artworkUrl ? (
          <img className={styles.art} src={track.artworkUrl} alt="" />
        ) : (
          <div className={styles.art} />
        )}
        <div className={styles.title}>{track.title}</div>
        <div className={styles.artist}>{track.artist}</div>

        {error && <div className={styles.error}>{error}</div>}

        {isDownloaded ? (
          <button className={styles.play} onClick={handlePlay} data-tap>
            Play Audio
          </button>
        ) : (
          <>
            <button
              className={styles.stream}
              onClick={handleStream}
              disabled={streaming}
              data-tap
            >
              {streaming ? 'Loading...' : 'Play Audio'}
            </button>
            <button
              className={styles.download}
              onClick={handleDownload}
              disabled={downloading}
              data-tap
            >
              {downloading ? 'Downloading...' : 'Download as Audio'}
            </button>
          </>
        )}

        <a
          className={styles.open}
          href={`https://www.youtube.com/watch?v=${track.id}`}
          target="_blank"
          rel="noreferrer"
          data-tap
        >
          Open in YouTube
        </a>
        <button className={styles.cancel} onClick={onClose} data-tap>Close</button>
      </div>
    </>
  );
}
