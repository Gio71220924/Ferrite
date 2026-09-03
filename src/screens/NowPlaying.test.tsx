import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NowPlaying } from './NowPlaying';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const track: Track = { id: 't1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 };

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: [track.id], index: 0 })}>start</button>
      <NowPlaying track={track} onClose={() => {}} />
    </>
  );
}

describe('NowPlaying', () => {
  it('toggles transport play/pause', async () => {
    render(
      <MemoryRouter>
        <PlaybackProvider>
          <Harness />
        </PlaybackProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('start'));
    const toggle = screen.getByRole('button', { name: /pause/i });
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('navigates to the queue screen when the queue button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PlaybackProvider>
          <Routes>
            <Route path="/" element={<NowPlaying track={track} onClose={() => {}} />} />
            <Route path="/queue" element={<div>Queue screen</div>} />
          </Routes>
        </PlaybackProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /open queue/i }));
    expect(screen.getByText('Queue screen')).toBeInTheDocument();
  });
});
