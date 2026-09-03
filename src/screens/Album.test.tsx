import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Album } from './Album';
import { albums } from '../data/mockLibrary';

describe('Album', () => {
  it('shows Play/Shuffle for a local album', () => {
    const local = albums.find(a => a.variant === 'local')!;
    render(<Album album={local} onPlay={() => {}} />);
    expect(screen.getByText('Shuffle')).toBeInTheDocument();
  });

  it('shows Play/Save plus the streaming disclosure for a streaming album', () => {
    const streaming = albums.find(a => a.variant === 'streaming')!;
    render(<Album album={streaming} onPlay={() => {}} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText(/Nothing is stored on this iPhone/)).toBeInTheDocument();
  });

  it('shows Play/Download N for a mixed album, N = stream-only tracks', () => {
    const mixed = albums.find(a => a.variant === 'mixed')!;
    render(<Album album={mixed} onPlay={() => {}} />);
    expect(screen.getByText('Download 3')).toBeInTheDocument();
  });
});
