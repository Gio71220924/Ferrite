import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Library } from './Library';
import { SourcesProvider, useSources } from '../state/SourcesContext';
import { LibraryProvider, useLibrary } from '../state/LibraryContext';
import { recordPlayed } from '../lib/recentlyPlayed';
import type { Track } from '../types/track';

function renderLibrary() {
  return render(
    <MemoryRouter>
      <SourcesProvider>
        <LibraryProvider>
          <Library onPlay={() => {}} />
        </LibraryProvider>
      </SourcesProvider>
    </MemoryRouter>,
  );
}

function Seeded({ onPlay = () => {} }: { onPlay?: (track: Track, pool: Track[]) => void }) {
  const { dispatch: libDispatch } = useLibrary();
  const { dispatch: sourcesDispatch } = useSources();
  return (
    <>
      <button
        onClick={() => {
          libDispatch({
            type: 'IMPORT_LOCAL_FILES',
            tracks: [{ id: 'l1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 }],
          });
          sourcesDispatch({ type: 'CONNECT_START', key: 'youtube' });
          sourcesDispatch({ type: 'CONNECT_DONE', key: 'youtube' });
        }}
      >
        seed
      </button>
      <Library onPlay={onPlay} />
    </>
  );
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value });
  act(() => window.dispatchEvent(new Event(value ? 'online' : 'offline')));
}

describe('Library', () => {
  afterEach(() => setOnline(true));

  it('dims streaming tracks instead of hiding them when offline', async () => {
    render(
      <MemoryRouter>
        <SourcesProvider>
          <LibraryProvider>
            <Seeded />
          </LibraryProvider>
        </SourcesProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText('seed'));
    expect(screen.getByText('Slow Static')).toBeInTheDocument();

    setOnline(false);

    expect(screen.getAllByText('Midnight Ferry').length).toBeGreaterThan(0);
    expect(screen.getByText('Slow Static')).toBeInTheDocument();
  });

  it('shows a recently-played rail only for tracks actually played, and clicking one plays it again', async () => {
    localStorage.clear();
    recordPlayed('l1');
    const onPlay = vi.fn();
    render(
      <MemoryRouter>
        <SourcesProvider>
          <LibraryProvider>
            <Seeded onPlay={onPlay} />
          </LibraryProvider>
        </SourcesProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Recently played')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('seed'));

    expect(screen.getByText('Recently played')).toBeInTheDocument();
    const [railCard] = screen.getAllByText('Midnight Ferry');
    await userEvent.click(railCard);
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }), expect.any(Array));
  });

  it('shows the empty state when the Local filter has no tracks', async () => {
    renderLibrary();
    await userEvent.click(screen.getByRole('button', { name: 'Local' }));
    expect(screen.getByText('No Local tracks')).toBeInTheDocument();
  });

  it('shows the all-sources empty state by default (no local files imported, nothing connected)', () => {
    renderLibrary();
    expect(screen.getByText('Nothing to play yet')).toBeInTheDocument();
  });
});
