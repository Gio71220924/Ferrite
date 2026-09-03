import { describe, it, expect } from 'vitest';
import { sourcesReducer, initialSourcesState } from './sourcesReducer';

describe('sourcesReducer', () => {
  it('connect starts syncing then completes on CONNECT_DONE', () => {
    let s = sourcesReducer(initialSourcesState, { type: 'CONNECT_START', key: 'apple' });
    expect(s.syncing).toBe('apple');
    expect(s.apple).toBe(false);
    s = sourcesReducer(s, { type: 'CONNECT_DONE', key: 'apple' });
    expect(s.syncing).toBeNull();
    expect(s.apple).toBe(true);
  });

  it('disconnect clears the linked flag', () => {
    const connected = { ...initialSourcesState, apple: true };
    const s = sourcesReducer(connected, { type: 'DISCONNECT', key: 'apple' });
    expect(s.apple).toBe(false);
  });

  it('SET_PREF toggles a preference', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_PREF', key: 'wifiOnly' });
    expect(s.prefs.wifiOnly).toBe(!initialSourcesState.prefs.wifiOnly);
  });

  it('SET_REMEMBER_DUPLICATES sets the flag explicitly', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_REMEMBER_DUPLICATES', value: true });
    expect(s.rememberDuplicates).toBe(true);
  });
});
