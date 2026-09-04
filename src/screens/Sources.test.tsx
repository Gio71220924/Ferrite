import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Sources } from './Sources';
import { SourcesProvider, useSources } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { setYoutubeLibrary, clearYoutubeLibrary } from '../services/youtubeLive';

vi.mock('../services/spotifyAuth', () => ({
  startLogin: vi.fn(),
  clearStoredToken: vi.fn(),
}));
vi.mock('../services/youtubeAuth', () => ({
  startLogin: vi.fn(),
  clearStoredToken: vi.fn(),
}));

// Connecting is real OAuth now (a redirect), so it can't be driven by
// clicking Connect in a test — this harness dispatches the CONNECT_START/
// CONNECT_DONE pair a real callback screen would, to exercise the busy and
// connected rendering. Clicking Connect/Cancel is still tested via the UI.
function Harness() {
  const { dispatch } = useSources();
  return (
    <>
      <button onClick={() => dispatch({ type: 'CONNECT_START', key: 'youtube' })}>start youtube</button>
      <button onClick={() => dispatch({ type: 'CONNECT_DONE', key: 'youtube' })}>finish youtube</button>
      <Sources />
    </>
  );
}

function renderSources() {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <Harness />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('Sources', () => {
  afterEach(() => clearYoutubeLibrary());

  it('shows importing then connected status once youtube finishes connecting', async () => {
    setYoutubeLibrary(
      [{ id: 'yt-1', title: 'Slow Static', artist: 'The Harbour Lights', source: 'YouTube', durationSec: 221 }],
      { channelTitle: 'Rosalind' },
    );
    const user = userEvent.setup();
    renderSources();

    await user.click(screen.getByText('start youtube'));
    expect(screen.getByText('Importing library…')).toBeInTheDocument();

    await user.click(screen.getByText('finish youtube'));
    expect(screen.getByText('1 liked videos · Rosalind')).toBeInTheDocument();
  });

  it('a stream-dependent preference stays disabled until a source is connected, then toggles', async () => {
    const user = userEvent.setup();
    renderSources();

    const wifiToggle = screen.getByRole('button', { name: 'Sync over Wi-Fi only' });
    expect(wifiToggle).toBeDisabled();

    await user.click(screen.getByText('start youtube'));
    await user.click(screen.getByText('finish youtube'));

    expect(wifiToggle).not.toBeDisabled();
    expect(wifiToggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(wifiToggle);
    expect(wifiToggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('cancels an in-progress connect instead of starting a second one', async () => {
    const user = userEvent.setup();
    renderSources();

    await user.click(screen.getByText('start youtube'));
    expect(screen.getByText('Importing library…')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(2);
    expect(screen.getAllByText('Not connected')).toHaveLength(2);
  });

  it('clicking Connect starts the real login flow for each service', async () => {
    const { startLogin: startSpotify } = await import('../services/spotifyAuth');
    const { startLogin: startYoutube } = await import('../services/youtubeAuth');
    const user = userEvent.setup();
    renderSources();

    const [youtubeConnect, spotifyConnect] = screen.getAllByRole('button', { name: 'Connect' });
    await user.click(youtubeConnect);
    expect(startYoutube).toHaveBeenCalled();
    await user.click(spotifyConnect);
    expect(startSpotify).toHaveBeenCalled();
  });
});
