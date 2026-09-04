import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DownloadProgress } from './DownloadProgress';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';

vi.mock('../services/youtubeDownload', () => ({
  downloadBatch: vi.fn().mockReturnValue({
    [Symbol.asyncIterator]: () => ({
      next: vi.fn().mockResolvedValue({ done: true }),
    }),
  }),
}));

function renderProgress(videoIds = ['video1', 'video2'], onComplete = vi.fn()) {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <DownloadProgress videoIds={videoIds} onComplete={onComplete} />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('DownloadProgress', () => {
  it('shows start button with track count', () => {
    renderProgress();
    expect(screen.getByText('Download All as Audio (2 tracks)')).toBeInTheDocument();
  });

  it('renders with correct video count', () => {
    renderProgress(['a', 'b', 'c']);
    expect(screen.getByText('Download All as Audio (3 tracks)')).toBeInTheDocument();
  });
});
