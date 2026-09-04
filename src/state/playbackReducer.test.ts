import { describe, it, expect } from 'vitest';
import { playbackReducer, initialPlaybackState } from './playbackReducer';

describe('playbackReducer', () => {
  it('PLAY_TRACK sets queue, index and playing', () => {
    const s = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 1 });
    expect(s.queue).toEqual(['a', 'b']);
    expect(s.currentIndex).toBe(1);
    expect(s.playing).toBe(true);
  });

  it('NEXT wraps to 0 at the end of the queue', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 1 });
    const s = playbackReducer(started, { type: 'NEXT' });
    expect(s.currentIndex).toBe(0);
  });

  it('PREV wraps to the last index from 0', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 0 });
    const s = playbackReducer(started, { type: 'PREV' });
    expect(s.currentIndex).toBe(1);
  });

  it('REORDER moves an item and keeps currentIndex pointed at the same track', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b', 'c'], index: 0 });
    const s = playbackReducer(started, { type: 'REORDER', from: 2, to: 1 });
    expect(s.queue).toEqual(['a', 'c', 'b']);
    expect(s.queue[s.currentIndex]).toBe('a');
  });

  it('TOGGLE_PLAY flips playing', () => {
    const s = playbackReducer(initialPlaybackState, { type: 'TOGGLE_PLAY' });
    expect(s.playing).toBe(true);
  });

  it('SET_VOLUME clamps to the 0-1 range', () => {
    expect(playbackReducer(initialPlaybackState, { type: 'SET_VOLUME', volume: 0.3 }).volume).toBe(0.3);
    expect(playbackReducer(initialPlaybackState, { type: 'SET_VOLUME', volume: 1.5 }).volume).toBe(1);
    expect(playbackReducer(initialPlaybackState, { type: 'SET_VOLUME', volume: -0.2 }).volume).toBe(0);
  });
});
