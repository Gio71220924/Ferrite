import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sources } from './Sources';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';

describe('Sources', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('shows importing then connected status after connecting Apple Music', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SourcesProvider>
        <LibraryProvider>
          <Sources />
        </LibraryProvider>
      </SourcesProvider>,
    );

    await user.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    expect(screen.getByText('Importing library…')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByText('812 songs · 24 playlists')).toBeInTheDocument();
    expect(screen.getAllByText('Just now')).toHaveLength(1);
  });

  it('a stream-dependent preference stays disabled until a source is connected, then toggles', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SourcesProvider>
        <LibraryProvider>
          <Sources />
        </LibraryProvider>
      </SourcesProvider>,
    );

    const wifiToggle = screen.getByRole('button', { name: 'Sync over Wi-Fi only' });
    expect(wifiToggle).toBeDisabled();

    await user.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    expect(wifiToggle).not.toBeDisabled();
    expect(wifiToggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(wifiToggle);
    expect(wifiToggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('cancels an in-progress connect instead of starting a second one', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SourcesProvider>
        <LibraryProvider>
          <Sources />
        </LibraryProvider>
      </SourcesProvider>,
    );

    await user.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    expect(screen.getByText('Importing library…')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getAllByRole('button', { name: 'Connect' })).toHaveLength(2);
    expect(screen.getAllByText('Not connected')).toHaveLength(2);
  });
});
