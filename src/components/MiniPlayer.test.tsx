import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MiniPlayer } from './MiniPlayer';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const track: Track = { id: 't1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 };

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: [track.id], index: 0 })}>start</button>
      <MiniPlayer track={track} />
    </>
  );
}

describe('MiniPlayer', () => {
  it('toggles play/pause state when tapped', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });
});
