import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DuplicateSheet } from './DuplicateSheet';
import { DuplicateSheetProvider, useDuplicateSheet } from '../state/DuplicateSheetContext';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const local: Track = { id: 'l1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244, format: 'FLAC 24/96' };
const apple: Track = { id: 'am-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless 24/48' };

function Harness() {
  const { requestPlay } = useDuplicateSheet();
  const { state } = usePlayback();
  return (
    <>
      <button onClick={() => requestPlay(local, [local, apple])}>tap</button>
      <div data-testid="current">{state.queue[state.currentIndex]}</div>
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

    await userEvent.click(screen.getByText('Apple Music'));
    expect(screen.getByTestId('current')).toHaveTextContent('am-4');
  });
});
