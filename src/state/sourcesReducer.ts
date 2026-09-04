export type StreamingKey = 'apple' | 'spotify';

export interface SourcesState {
  apple: boolean;
  spotify: boolean;
  syncing: StreamingKey | null;
  prefs: { wifiOnly: boolean; preferLocal: boolean; cacheOffline: boolean };
  rememberDuplicates: boolean;
}

export const initialSourcesState: SourcesState = {
  apple: false,
  spotify: false,
  syncing: null,
  prefs: { wifiOnly: true, preferLocal: false, cacheOffline: true },
  rememberDuplicates: false,
};

export type SourcesAction =
  | { type: 'CONNECT_START'; key: StreamingKey }
  | { type: 'CONNECT_DONE'; key: StreamingKey }
  | { type: 'DISCONNECT'; key: StreamingKey }
  | { type: 'SET_PREF'; key: keyof SourcesState['prefs'] }
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
    case 'SET_REMEMBER_DUPLICATES':
      return { ...state, rememberDuplicates: action.value };
    default:
      return state;
  }
}
