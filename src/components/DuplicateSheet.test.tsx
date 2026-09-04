import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DuplicateSheet } from './DuplicateSheet';
import { DuplicateSheetProvider, useDuplicateSheet } from '../state/DuplicateSheetContext';
import { SourcesProvider, useSources } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const local: Track = { id: 'l1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244, format: 'FLAC 24/96' };
const stream: Track = { id: 'sp-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Spotify', durationSec: 278, format: 'OGG 320' };
const local2: Track = { id: 'l2', title: 'Cassette Sunday', artist: 'Rosalind Ver', source: 'Local', durationSec: 178 };
const stream2: Track = { id: 'sp-9', title: 'Cassette Sunday', artist: 'Rosalind Ver', source: 'Spotify', durationSec: 178, format: 'OGG 320' };
const youtube: Track = { id: 'yt-1', title: 'Low Tide', artist: 'Rosalind Ver', source: 'YouTube', durationSec: 200, format: '1080p' };
const local3: Track = { id: 'l3', title: 'Low Tide', artist: 'Rosalind Ver', source: 'Local', durationSec: 202 };

function Harness() {
  const { requestPlay, previewTrack } = useDuplicateSheet();
  const { dispatch: sourcesDispatch } = useSources();
  const { state } = usePlayback();
  return (
    <>
      <button onClick={() => sourcesDispatch({ type: 'SET_REMEMBER_DUPLICATES', value: true })}>enable remember</button>
      <button onClick={() => requestPlay(local, [local, stream])}>tap</button>
      <button onClick={() => requestPlay(local2, [local2, stream2])}>tap2</button>
      <button onClick={() => requestPlay(local3, [local3, youtube])}>tap3</button>
      <div data-testid="current">{state.queue[state.currentIndex]}</div>
      <div data-testid="preview">{previewTrack?.id}</div>
      <DuplicateSheet />
    </>
  );
}

describe('DuplicateSheet', () => {
  it('opens on a duplicate hit and plays the chosen copy', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <PlaybackProvider>
            <DuplicateSheetProvider>
              <Harness />
            </DuplicateSheetProvider>
          </PlaybackProvider>
        </LibraryProvider>
      </SourcesProvider>,
    );

    await userEvent.click(screen.getByText('tap'));
    expect(screen.getByText('Found in 2 places. Choose which copy plays.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Spotify'));
    expect(screen.getByTestId('current')).toHaveTextContent('sp-4');
  });

  it('choosing a YouTube copy opens the preview instead of playing it', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <PlaybackProvider>
            <DuplicateSheetProvider>
              <Harness />
            </DuplicateSheetProvider>
          </PlaybackProvider>
        </LibraryProvider>
      </SourcesProvider>,
    );

    await userEvent.click(screen.getByText('tap3'));
    await userEvent.click(screen.getByText('YouTube'));

    expect(screen.getByTestId('preview')).toHaveTextContent('yt-1');
    expect(screen.getByTestId('current')).toHaveTextContent('');
  });

  it('remembers the chosen source for every future duplicate once "remember" is on', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <PlaybackProvider>
            <DuplicateSheetProvider>
              <Harness />
            </DuplicateSheetProvider>
          </PlaybackProvider>
        </LibraryProvider>
      </SourcesProvider>,
    );

    await userEvent.click(screen.getByText('enable remember'));
    await userEvent.click(screen.getByText('tap'));
    await userEvent.click(screen.getByText('Spotify'));
    expect(screen.getByTestId('current')).toHaveTextContent('sp-4');

    await userEvent.click(screen.getByText('tap2'));
    expect(screen.queryByText('Found in 2 places. Choose which copy plays.')).not.toBeInTheDocument();
    expect(screen.getByTestId('current')).toHaveTextContent('sp-9');
  });
});
