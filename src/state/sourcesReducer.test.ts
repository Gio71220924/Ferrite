import { describe, it, expect } from 'vitest';
import { sourcesReducer, initialSourcesState } from './sourcesReducer';

describe('sourcesReducer', () => {
  it('connect starts syncing then completes on CONNECT_DONE', () => {
    let s = sourcesReducer(initialSourcesState, { type: 'CONNECT_START', key: 'youtube' });
    expect(s.syncing).toBe('youtube');
    expect(s.youtube).toBe(false);
    s = sourcesReducer(s, { type: 'CONNECT_DONE', key: 'youtube' });
    expect(s.syncing).toBeNull();
    expect(s.youtube).toBe(true);
  });

  it('a stale CONNECT_DONE after cancel does not silently reconnect the source', () => {
    let s = sourcesReducer(initialSourcesState, { type: 'CONNECT_START', key: 'youtube' });
    s = sourcesReducer(s, { type: 'DISCONNECT', key: 'youtube' });
    expect(s.syncing).toBeNull();
    expect(s.youtube).toBe(false);
    s = sourcesReducer(s, { type: 'CONNECT_DONE', key: 'youtube' });
    expect(s.youtube).toBe(false);
    expect(s.syncing).toBeNull();
  });

  it('disconnect clears the linked flag', () => {
    const connected = { ...initialSourcesState, youtube: true };
    const s = sourcesReducer(connected, { type: 'DISCONNECT', key: 'youtube' });
    expect(s.youtube).toBe(false);
  });

  it('SET_PREF toggles a preference', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_PREF', key: 'wifiOnly' });
    expect(s.prefs.wifiOnly).toBe(!initialSourcesState.prefs.wifiOnly);
  });

  it('SET_DUPLICATE_PREFERENCE records which source to auto-pick for future duplicates', () => {
    expect(initialSourcesState.duplicatePreference).toBeNull();
    const s = sourcesReducer(initialSourcesState, { type: 'SET_DUPLICATE_PREFERENCE', source: 'YouTube' });
    expect(s.duplicatePreference).toBe('YouTube');
  });

  it('SET_REMEMBER_DUPLICATES sets the flag explicitly', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_REMEMBER_DUPLICATES', value: true });
    expect(s.rememberDuplicates).toBe(true);
  });
});
