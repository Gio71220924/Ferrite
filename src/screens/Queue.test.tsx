import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Queue } from './Queue';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const tracks: Record<string, Track> = {
  a: { id: 'a', title: 'A', artist: 'X', source: 'Local', durationSec: 100 },
  b: { id: 'b', title: 'B', artist: 'X', source: 'Local', durationSec: 100 },
  c: { id: 'c', title: 'C', artist: 'X', source: 'Local', durationSec: 100 },
};

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: ['a', 'b', 'c'], index: 0 })}>start</button>
      <Queue getTrack={id => tracks[id]} />
    </>
  );
}

describe('Queue', () => {
  it('moves a row down and clears everything after now-playing', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));

    await userEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    const rows = screen.getAllByTestId('queue-row').map(r => r.textContent);
    expect(rows[0]).toContain('C');

    await userEvent.click(screen.getByText('Clear'));
    expect(screen.queryAllByTestId('queue-row')).toHaveLength(0);
  });

  it('blocks moving a row up to or above the now-playing track', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));

    // Try to move up the first upcoming row (b, at absoluteIndex=1)
    // This would try to move it to index 0, but should be blocked
    await userEvent.click(screen.getAllByRole('button', { name: 'Move up' })[0]);

    // b should still be the first and only visible row
    const rows = screen.getAllByTestId('queue-row').map(r => r.textContent);
    expect(rows[0]).toContain('B');
    expect(rows).toHaveLength(2); // b and c still visible
  });
});
