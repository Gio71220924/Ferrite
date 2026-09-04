import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { YouTubePreview } from './YouTubePreview';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider } from '../state/PlaybackContext';
import { DuplicateSheetProvider } from '../state/DuplicateSheetContext';
import type { Track } from '../types/track';

vi.mock('../services/youtubeDownload', () => ({
  downloadAudio: vi.fn().mockResolvedValue({ fileUrl: '/api/youtube/audio/test', duration: 0, fileSize: 1000 }),
  getAudioUrl: vi.fn().mockReturnValue('/api/youtube/audio/test'),
}));

const mockTrack: Track = {
  id: 'test-video-1',
  title: 'Test Video',
  artist: 'Test Channel',
  source: 'YouTube',
  durationSec: 180,
  artworkUrl: 'https://example.com/thumb.jpg',
};

const mockTrackWithFile: Track = {
  ...mockTrack,
  id: 'test-video-2',
  fileUrl: '/api/youtube/audio/test-video-2',
  downloaded: true,
};

function renderPreview(track: Track | null = mockTrack, onClose = vi.fn()) {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <PlaybackProvider>
          <DuplicateSheetProvider>
            <YouTubePreview track={track} onClose={onClose} />
          </DuplicateSheetProvider>
        </PlaybackProvider>
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('YouTubePreview', () => {
  it('renders track info', () => {
    renderPreview();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Test Channel')).toBeInTheDocument();
  });

  it('shows Download button when not downloaded', () => {
    renderPreview();
    expect(screen.getByText('Download as Audio')).toBeInTheDocument();
  });

  it('shows Play button when downloaded', () => {
    renderPreview(mockTrackWithFile);
    expect(screen.getByText('Play Audio')).toBeInTheDocument();
  });

  it('shows Open in YouTube link', () => {
    renderPreview();
    const link = screen.getByText('Open in YouTube');
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=test-video-1');
  });

  it('calls onClose when Close button clicked', async () => {
    const onClose = vi.fn();
    renderPreview(mockTrack, onClose);
    const user = userEvent.setup();
    await user.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error message on download failure', async () => {
    const { downloadAudio } = await import('../services/youtubeDownload');
    vi.mocked(downloadAudio).mockRejectedValueOnce(new Error('Network error'));
    
    renderPreview();
    const user = userEvent.setup();
    await user.click(screen.getByText('Download as Audio'));
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});
