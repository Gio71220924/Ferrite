import type { Track } from '../types/track';

export interface SourceConnector {
  connect(): Promise<{ trackCount: number; playlistCount: number }>;
  disconnect(): void;
  catalog(): Track[];
}
