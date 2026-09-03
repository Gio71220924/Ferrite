import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
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
});
