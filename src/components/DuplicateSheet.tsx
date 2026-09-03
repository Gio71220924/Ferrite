import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import styles from './DuplicateSheet.module.css';

export function DuplicateSheet() {
  const { pending, resolve, cancel } = useDuplicateSheet();
  if (!pending) return null;

  return (
    <>
      <div className={styles.overlay} onClick={cancel} />
      <div className={styles.sheet}>
        <div className={styles.grabber} />
        <div className={styles.header}>
          <div className={styles.title}>{pending.copies[0].title}</div>
          <div className={styles.body}>Found in {pending.copies.length} places. Choose which copy plays.</div>
        </div>
        <div className={styles.list}>
          {pending.copies.map(c => (
            <button key={c.id} className={styles.copy} onClick={() => resolve(c.source)} data-tap>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.copyLabel}>{c.source === 'Local' ? 'On this iPhone' : c.source}</div>
                <div className={styles.copyMeta}>{c.format ?? c.source}</div>
              </div>
            </button>
          ))}
        </div>
        <button className={styles.cancel} onClick={cancel} data-tap>Cancel</button>
      </div>
    </>
  );
}
