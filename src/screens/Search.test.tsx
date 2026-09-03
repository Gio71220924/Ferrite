import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useEffect } from 'react';
import { Search } from './Search';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider, useLibrary } from '../state/LibraryContext';

function Seed({ children }: { children: React.ReactNode }) {
  const { dispatch } = useLibrary();
  useEffect(() => {
    dispatch({
      type: 'IMPORT_LOCAL_FILES',
      tracks: [{ id: 'l1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 }],
    });
  }, [dispatch]);
  return <>{children}</>;
}

describe('Search', () => {
  it('filters grouped results by the typed query', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <Seed>
            <Search onPlay={() => {}} />
          </Seed>
        </LibraryProvider>
      </SourcesProvider>,
    );
    expect(screen.getByText('Midnight Ferry')).toBeInTheDocument();
    const field = screen.getByPlaceholderText('Search');
    await userEvent.type(field, 'zzz-no-match');
    expect(screen.queryByText('Midnight Ferry')).not.toBeInTheDocument();
  });
});
