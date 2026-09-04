import { useRef, useState } from 'react';
import { useLibrary } from '../../state/LibraryContext';
import { FerriteMark } from '../../components/FerriteMark';
import { trackFromFile } from '../../lib/trackFromFile';
import styles from './OnboardingFlow.module.css';

export function ScanStep({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useLibrary();
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = (files: FileList) => {
    const tracks = Array.from(files).map(trackFromFile);
    dispatch({ type: 'IMPORT_LOCAL_FILES', tracks });
    setProgress(100);
    setTimeout(onNext, 400);
  };

  return (
    <div className={styles.step}>
      <FerriteMark size={28} color="var(--l1)" />
      <div className={styles.heading} style={{ marginTop: 18 }}>Reading your files</div>
      <div className={styles.sub}>Ferrite works before you connect anything.</div>
      <div style={{ marginTop: 44 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ font: '700 56px/1 var(--f-mono)', color: 'var(--l1)' }}>{state.localTracks.length}</div>
          <div style={{ color: 'var(--l2)' }}>songs</div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.14)', marginTop: 22, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--l1)' }} />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && onFiles(e.target.files)}
      />
      <button className={styles.primaryBtn} style={{ marginTop: 24 }} onClick={() => inputRef.current?.click()} data-tap>
        Add files
      </button>
      <div className={styles.spacer} />
      <button className={styles.skip} onClick={onNext} data-tap>Skip for now</button>
      <div className={styles.dots}>
        <div className={`${styles.dot} ${styles.dotActive}`} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
