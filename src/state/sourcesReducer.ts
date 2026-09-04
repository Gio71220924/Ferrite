import type { Source } from '../types/track';

export type StreamingKey = 'youtube' | 'spotify';

export interface SourcesState {
  youtube: boolean;
  spotify: boolean;
  syncing: StreamingKey | null;
  prefs: { wifiOnly: boolean; preferLocal: boolean; cacheOffline: boolean };
  rememberDuplicates: boolean;
  /** Source to auto-pick for every future duplicate once rememberDuplicates
   * is on. null means no choice has been learned yet, so a new duplicate
   * still opens the sheet even with "remember" enabled. */
  duplicatePreference: Source | null;
}

export const initialSourcesState: SourcesState = {
  youtube: false,
  spotify: false,
  syncing: null,
  prefs: { wifiOnly: true, preferLocal: false, cacheOffline: true },
  rememberDuplicates: false,
  duplicatePreference: null,
};

export type SourcesAction =
  | { type: 'CONNECT_START'; key: StreamingKey }
  | { type: 'CONNECT_DONE'; key: StreamingKey }
  | { type: 'DISCONNECT'; key: StreamingKey }
  | { type: 'SET_PREF'; key: keyof SourcesState['prefs'] }
  | { type: 'SET_DUPLICATE_PREFERENCE'; source: Source }
  | { type: 'SET_REMEMBER_DUPLICATES'; value: boolean };

export function sourcesReducer(state: SourcesState, action: SourcesAction): SourcesState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, syncing: action.key, [action.key]: false };
    case 'CONNECT_DONE':
      if (state.syncing !== action.key) return state;
      return { ...state, syncing: null, [action.key]: true };
    case 'DISCONNECT':
      return { ...state, [action.key]: false, syncing: state.syncing === action.key ? null : state.syncing };
    case 'SET_PREF':
      return { ...state, prefs: { ...state.prefs, [action.key]: !state.prefs[action.key] } };
    case 'SET_DUPLICATE_PREFERENCE':
      return { ...state, duplicatePreference: action.source };
    case 'SET_REMEMBER_DUPLICATES':
      return { ...state, rememberDuplicates: action.value };
    default:
      return state;
  }
}
