import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
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

describe('AppShell', () => {
  it('navigates between tabs', async () => {
    renderShell();
    expect(screen.getByText('Library screen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /search/i }));
    expect(screen.getByText('Search screen')).toBeInTheDocument();
  });
});
