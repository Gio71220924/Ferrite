import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { MiniPlayer } from '../components/MiniPlayer';
import { DuplicateSheet } from '../components/DuplicateSheet';
import { usePlayback } from '../state/PlaybackContext';
import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import type { Track } from '../types/track';

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
  const currentId = state.queue[state.currentIndex];
  const current = currentId ? getTrack(currentId) : undefined;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: current ? 176 : 88 }}>
      <Outlet context={{ onPlay: requestPlay, getTrack } satisfies ShellContext} />
      {current && <MiniPlayer track={current} onOpen={() => navigate('/now-playing')} />}
      <DuplicateSheet />
      <BottomTabBar />
    </div>
  );
}
