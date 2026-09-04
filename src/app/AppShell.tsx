import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../components/MiniPlayer';
import { DuplicateSheet } from '../components/DuplicateSheet';
import { usePlayback } from '../state/PlaybackContext';
import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import { useMediaQuery } from '../lib/useMediaQuery';
import type { Track } from '../types/track';
import styles from './AppShell.module.css';

interface ShellContext {
  onPlay: (track: Track, pool: Track[]) => void;
  getTrack: (id: string) => Track | undefined;
}

export function useShellContext() {
  return useOutletContext<ShellContext>();
}

export function AppShell({ getTrack }: { getTrack: (id: string) => Track | undefined }) {
  const { state } = usePlayback();
  const { requestPlay } = useDuplicateSheet();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const currentId = state.queue[state.currentIndex];
  const current = currentId ? getTrack(currentId) : undefined;
  const outlet = <Outlet context={{ onPlay: requestPlay, getTrack } satisfies ShellContext} />;

  if (isDesktop) {
    return (
      <div className={styles.root}>
        <div className={styles.desktopRow}>
          <Sidebar />
          <div className={styles.content} style={{ paddingBottom: current ? 96 : 0 }}>
            <div className={styles.contentInner}>{outlet}</div>
          </div>
        </div>
        {current && <MiniPlayer track={current} onOpen={() => navigate('/now-playing')} />}
        <DuplicateSheet />
      </div>
    );
  }

  return (
    <div className={styles.root} style={{ paddingBottom: current ? 176 : 88 }}>
      {outlet}
      {current && <MiniPlayer track={current} onOpen={() => navigate('/now-playing')} />}
      <DuplicateSheet />
      <BottomTabBar />
    </div>
  );
}
