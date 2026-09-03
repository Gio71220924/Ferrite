import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Library } from './Library';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';

function renderLibrary() {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <Library onPlay={() => {}} />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('Library', () => {
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
