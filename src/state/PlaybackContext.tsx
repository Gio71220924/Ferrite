import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { playbackReducer, initialPlaybackState, type PlaybackState, type PlaybackAction } from './playbackReducer';

const PlaybackContext = createContext<{ state: PlaybackState; dispatch: React.Dispatch<PlaybackAction> } | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  return <PlaybackContext.Provider value={{ state, dispatch }}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}
