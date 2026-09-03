import type { Track, Source } from '../types/track';

export interface LibraryState {
  localTracks: Track[];
  filter: Source | 'All';
  duplicateChoice: Record<string, Source>;
}

export const initialLibraryState: LibraryState = {
  localTracks: [],
  filter: 'All',
  duplicateChoice: {},
};

export type LibraryAction =
  | { type: 'SET_FILTER'; filter: Source | 'All' }
  | { type: 'IMPORT_LOCAL_FILES'; tracks: Track[] }
  | { type: 'RESOLVE_DUPLICATE'; key: string; source: Source };

export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'IMPORT_LOCAL_FILES':
      return { ...state, localTracks: [...state.localTracks, ...action.tracks] };
    case 'RESOLVE_DUPLICATE':
      return { ...state, duplicateChoice: { ...state.duplicateChoice, [action.key]: action.source } };
    default:
      return state;
  }
}
