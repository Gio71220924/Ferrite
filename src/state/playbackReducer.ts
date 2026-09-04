export interface PlaybackState {
  queue: string[];
  currentIndex: number;
  playing: boolean;
  positionSec: number;
  volume: number;
  error: string | null;
}

export const initialPlaybackState: PlaybackState = {
  queue: [],
  currentIndex: 0,
  playing: false,
  positionSec: 0,
  volume: 0.7,
  error: null,
};

export type PlaybackAction =
  | { type: 'PLAY_TRACK'; trackIds: string[]; index: number }
  | { type: 'ENQUEUE'; trackId: string }
  | { type: 'REORDER'; from: number; to: number }
  | { type: 'CLEAR_UPCOMING' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SEEK'; positionSec: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TICK'; positionSec: number }
  | { type: 'PLAYBACK_ERROR'; message: string };

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY_TRACK':
      return { ...state, queue: action.trackIds, currentIndex: action.index, playing: true, positionSec: 0, error: null };
    case 'ENQUEUE':
      return { ...state, queue: [...state.queue, action.trackId] };
    case 'REORDER': {
      const queue = [...state.queue];
      const currentId = queue[state.currentIndex];
      const [moved] = queue.splice(action.from, 1);
      queue.splice(action.to, 0, moved);
      return { ...state, queue, currentIndex: queue.indexOf(currentId) };
    }
    case 'CLEAR_UPCOMING':
      return { ...state, queue: state.queue.slice(0, state.currentIndex + 1) };
    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing, error: null };
    case 'SEEK':
      return { ...state, positionSec: action.positionSec };
    case 'SET_VOLUME':
      return { ...state, volume: Math.min(1, Math.max(0, action.volume)) };
    case 'NEXT':
      return { ...state, currentIndex: (state.currentIndex + 1) % Math.max(state.queue.length, 1), positionSec: 0, error: null };
    case 'PREV':
      return { ...state, currentIndex: (state.currentIndex - 1 + state.queue.length) % Math.max(state.queue.length, 1), positionSec: 0, error: null };
    case 'TICK':
      return { ...state, positionSec: action.positionSec };
    case 'PLAYBACK_ERROR':
      return { ...state, playing: false, error: action.message };
    default:
      return state;
  }
}
