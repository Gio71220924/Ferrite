import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider } from '../state/PlaybackContext';
import { DuplicateSheetProvider } from '../state/DuplicateSheetContext';

function renderShell() {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <PlaybackProvider>
          <DuplicateSheetProvider>
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route element={<AppShell getTrack={() => undefined} />}>
                  <Route index element={<div>Library screen</div>} />
                  <Route path="search" element={<div>Search screen</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </DuplicateSheetProvider>
        </PlaybackProvider>
      </LibraryProvider>
    </SourcesProvider>,
  );
}

function setDesktop(matches: boolean) {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      matches: matches && query.includes('min-width'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  return original;
}

describe('AppShell', () => {
  it('navigates between tabs', async () => {
    renderShell();
    expect(screen.getByText('Library screen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /search/i }));
    expect(screen.getByText('Search screen')).toBeInTheDocument();
  });

  describe('on a desktop-width viewport', () => {
    const original = window.matchMedia;
    afterEach(() => {
      window.matchMedia = original;
    });

    it('shows the sidebar instead of the bottom tab bar, and no duplicate nav', () => {
      setDesktop(true);
      renderShell();
      expect(screen.getByText('Ferrite')).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: /search/i })).toHaveLength(1);
    });
  });
});
