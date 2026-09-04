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

  it('ticks the scrubber for a mocked streaming track that has no real audio to play', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    localStorage.setItem('ferrite:onboarded', 'true');
    render(<App />);

    await user.click(screen.getByRole('link', { name: /sources/i }));
    await user.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    await user.click(screen.getByRole('link', { name: /search/i }));
    await user.type(screen.getByPlaceholderText('Search'), 'slow');
    await user.click(screen.getByText('Slow Static'));

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
