import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { App } from './App';

beforeEach(() => localStorage.clear());

describe('App', () => {
  it('shows onboarding first, then the library after finishing', async () => {
    render(<App />);
    expect(screen.getByText('Reading your files')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Skip for now'));
    await userEvent.click(screen.getByText('Skip'));
    await userEvent.click(screen.getByText('Open Library'));

    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument();
  });

  it('skips onboarding on a second run', () => {
    localStorage.setItem('ferrite:onboarded', 'true');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument();
  });

  it('ticks the scrubber for a mocked demo track that has no real audio to play', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem('ferrite:onboarded', 'true');
    // The Harbour Tapes album's demo tracks are labeled 'Local' but, like all
    // of data/mockLibrary.ts's album data, carry no real fileUrl — this is
    // the only reachable case of AudioBridge's mocked-tick fallback now that
    // YouTube tracks open a preview instead of entering playback.
    window.history.pushState({}, '', '/album/alb-harbour-tapes');
    render(<App />);

    await user.click(screen.getByText('Cassette Sunday'));

    await user.click(screen.getByRole('button', { name: 'Open now playing' }));
    expect(screen.getByText('0:00')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('0:03')).toBeInTheDocument();

    vi.useRealTimers();
  });

  afterEach(() => vi.useRealTimers());
});
