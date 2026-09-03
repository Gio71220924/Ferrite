export type Source = 'Local' | 'Apple Music' | 'Spotify';

export interface Track {
  id: string;
  title: string;
  artist: string;
  source: Source;
  durationSec: number;
  format?: string;
  albumId?: string;
  fileUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  variant: 'local' | 'streaming' | 'mixed';
  year: number;
  trackIds: string[];
  sizeLabel?: string;
}
