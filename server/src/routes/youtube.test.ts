import { describe, it, expect } from 'vitest';
import { youtubeRouter } from './youtube.js';

describe('youtube router', () => {
  it('exports a router', () => {
    expect(youtubeRouter).toBeDefined();
    expect(typeof youtubeRouter).toBe('function');
  });

  it('has required routes', () => {
    const routes = youtubeRouter.stack.map((r: { route?: { path: string } }) => r.route?.path).filter(Boolean);
    expect(routes).toContain('/download');
    expect(routes).toContain('/audio/:videoId');
    expect(routes).toContain('/status');
    expect(routes).toContain('/download-batch');
  });
});
