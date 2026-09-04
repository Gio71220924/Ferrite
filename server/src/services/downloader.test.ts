import { describe, it, expect } from 'vitest';
import { isDownloaded, getAudioUrl } from './downloader.js';

describe('downloader service', () => {
  it('isDownloaded returns false for non-existent video', () => {
    expect(isDownloaded('nonexistent123')).toBe(false);
  });

  it('getAudioUrl returns correct path', () => {
    expect(getAudioUrl('dQw4w9WgXcQ')).toBe('/api/youtube/audio/dQw4w9WgXcQ');
  });
});
