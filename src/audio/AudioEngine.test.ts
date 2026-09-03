import { describe, it, expect, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';

describe('AudioEngine', () => {
  it('load sets the underlying audio src', () => {
    const engine = new AudioEngine();
    engine.load('blob:fake-url');
    expect(engine.getSrc()).toContain('blob:fake-url');
  });

  it('play calls through to HTMLMediaElement.play', () => {
    const engine = new AudioEngine();
    const spy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue();
    engine.play();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('pause calls through to HTMLMediaElement.pause', () => {
    const engine = new AudioEngine();
    const spy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    engine.pause();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('onEnded fires when the underlying element dispatches "ended"', () => {
    const engine = new AudioEngine();
    const onEnded = vi.fn();
    engine.onEnded = onEnded;
    engine.getElementForTest().dispatchEvent(new Event('ended'));
    expect(onEnded).toHaveBeenCalled();
  });
});
