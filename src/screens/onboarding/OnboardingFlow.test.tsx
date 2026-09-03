import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';
import { SourcesProvider } from '../../state/SourcesContext';
import { LibraryProvider } from '../../state/LibraryContext';

beforeEach(() => localStorage.clear());

function renderFlow(onFinish: () => void) {
  render(
    <SourcesProvider>
      <LibraryProvider>
        <OnboardingFlow onFinish={onFinish} />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('OnboardingFlow', () => {
  it('skip through scan and connect, then finishing sets the onboarded flag', async () => {
    let finished = false;
    renderFlow(() => { finished = true; });
    await userEvent.click(screen.getByText('Skip for now'));
    await userEvent.click(screen.getByText('Skip'));
    await userEvent.click(screen.getByText('Open Library'));
    expect(localStorage.getItem('ferrite:onboarded')).toBe('true');
    expect(finished).toBe(true);
  });
});
