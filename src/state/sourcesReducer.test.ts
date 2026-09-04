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

  it('a stale CONNECT_DONE after cancel does not silently reconnect the source', () => {
    let s = sourcesReducer(initialSourcesState, { type: 'CONNECT_START', key: 'apple' });
    s = sourcesReducer(s, { type: 'DISCONNECT', key: 'apple' });
    expect(s.syncing).toBeNull();
    expect(s.apple).toBe(false);
    s = sourcesReducer(s, { type: 'CONNECT_DONE', key: 'apple' });
    expect(s.apple).toBe(false);
    expect(s.syncing).toBeNull();
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

  it('SET_DUPLICATE_PREFERENCE records which source to auto-pick for future duplicates', () => {
    expect(initialSourcesState.duplicatePreference).toBeNull();
    const s = sourcesReducer(initialSourcesState, { type: 'SET_DUPLICATE_PREFERENCE', source: 'Apple Music' });
    expect(s.duplicatePreference).toBe('Apple Music');
  });

  it('SET_REMEMBER_DUPLICATES sets the flag explicitly', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_REMEMBER_DUPLICATES', value: true });
    expect(s.rememberDuplicates).toBe(true);
  });
});
