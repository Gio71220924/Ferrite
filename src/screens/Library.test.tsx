import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Library } from './Library';
import { SourcesProvider, useSources } from '../state/SourcesContext';
import { LibraryProvider, useLibrary } from '../state/LibraryContext';
import { albums } from '../data/mockLibrary';

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

function Seeded() {
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
          sourcesDispatch({ type: 'CONNECT_START', key: 'apple' });
          sourcesDispatch({ type: 'CONNECT_DONE', key: 'apple' });
        }}
      >
        seed
      </button>
      <Library onPlay={() => {}} />
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

  it('the recently-played rail links each album card to its album route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <SourcesProvider>
          <LibraryProvider>
            <Routes>
              <Route path="/" element={<Library onPlay={() => {}} />} />
              <Route path="/album/:id" element={<div>Album screen</div>} />
            </Routes>
          </LibraryProvider>
        </SourcesProvider>
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByText(albums[0].title));
    expect(screen.getByText('Album screen')).toBeInTheDocument();
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
