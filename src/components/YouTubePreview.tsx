import type { Track } from '../types/track';
import styles from './YouTubePreview.module.css';

export function YouTubePreview({ track, onClose }: { track: Track | null; onClose: () => void }) {
  if (!track) return null;

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
        <div className={styles.note}>YouTube videos play on YouTube, not inside Ferrite.</div>
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
