import type { Track, Album } from '../types/track';

export const appleMusicCatalog: Track[] = [
  { id: 'am-1', title: 'Slow Static', artist: 'The Harbour Lights', source: 'Apple Music', durationSec: 221, format: 'Lossless' },
  { id: 'am-2', title: 'Weather Systems', artist: 'Junia', source: 'Apple Music', durationSec: 380, format: 'Lossless' },
  { id: 'am-3', title: 'Midsummer Static', artist: 'The Harbour Lights', source: 'Apple Music', durationSec: 221, format: 'Lossless' },
  { id: 'am-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless 24/48' },
  { id: 'am-5', title: 'Midnight Ferry (Live)', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless' },
];

export const spotifyCatalog: Track[] = [
  { id: 'sp-1', title: 'Pale Blue Hours', artist: 'Nima Okonkwo', source: 'Spotify', durationSec: 312, format: 'OGG 320' },
  { id: 'sp-2', title: 'Nightbus', artist: 'Ferrograph', source: 'Spotify', durationSec: 206, format: 'OGG 320' },
  { id: 'sp-3', title: 'Midway', artist: 'Ferrograph', source: 'Spotify', durationSec: 206, format: 'OGG 320' },
  { id: 'sp-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Spotify', durationSec: 278, format: 'OGG 320' },
  { id: 'sp-5', title: 'Midnight Ferry — Slowed', artist: 'lo-fi archive', source: 'Spotify', durationSec: 302, format: 'OGG 320' },
];

export const albums: Album[] = [
  { id: 'alb-harbour-tapes', title: 'Harbour Tapes', artist: 'Rosalind Ver', variant: 'local', year: 2019, sizeLabel: '512 MB',
    trackIds: ['ht-1', 'ht-2', 'ht-3', 'ht-4', 'ht-5', 'ht-6'] },
  { id: 'alb-weather-systems', title: 'Weather Systems', artist: 'Junia', variant: 'streaming', year: 2021,
    trackIds: ['ws-1', 'ws-2', 'ws-3', 'ws-4', 'ws-5', 'ws-6'] },
  { id: 'alb-nightbus-sessions', title: 'Nightbus Sessions', artist: 'Ferrograph', variant: 'mixed', year: 2022,
    trackIds: ['ns-1', 'ns-2', 'ns-3', 'ns-4', 'ns-5', 'ns-6'] },
];

export const albumTracks: Record<string, Track> = {
  'ht-1': { id: 'ht-1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-2': { id: 'ht-2', title: 'Cassette Sunday', artist: 'Rosalind Ver', source: 'Local', durationSec: 178, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-3': { id: 'ht-3', title: 'Low Tide', artist: 'Rosalind Ver', source: 'Local', durationSec: 202, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-4': { id: 'ht-4', title: 'Harbour Lights', artist: 'Rosalind Ver', source: 'Local', durationSec: 301, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-5': { id: 'ht-5', title: 'Saltwater', artist: 'Rosalind Ver', source: 'Local', durationSec: 224, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-6': { id: 'ht-6', title: 'Ferry Home', artist: 'Rosalind Ver', source: 'Local', durationSec: 372, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ws-1': { id: 'ws-1', title: 'Weather Systems', artist: 'Junia', source: 'Apple Music', durationSec: 380, albumId: 'alb-weather-systems' },
  'ws-2': { id: 'ws-2', title: 'Barometer', artist: 'Junia', source: 'Apple Music', durationSec: 238, albumId: 'alb-weather-systems' },
  'ws-3': { id: 'ws-3', title: 'Cold Front', artist: 'Junia', source: 'Apple Music', durationSec: 271, albumId: 'alb-weather-systems' },
  'ws-4': { id: 'ws-4', title: 'Anticyclone', artist: 'Junia', source: 'Apple Music', durationSec: 309, albumId: 'alb-weather-systems' },
  'ws-5': { id: 'ws-5', title: 'Still Air', artist: 'Junia', source: 'Apple Music', durationSec: 167, albumId: 'alb-weather-systems' },
  'ws-6': { id: 'ws-6', title: 'After Rain', artist: 'Junia', source: 'Apple Music', durationSec: 423, albumId: 'alb-weather-systems' },
  'ns-1': { id: 'ns-1', title: 'Nightbus', artist: 'Ferrograph', source: 'Local', durationSec: 206, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-2': { id: 'ns-2', title: 'Depot', artist: 'Ferrograph', source: 'Local', durationSec: 252, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-3': { id: 'ns-3', title: 'Last Service', artist: 'Ferrograph', source: 'Spotify', durationSec: 230, format: 'Lossless', albumId: 'alb-nightbus-sessions' },
  'ns-4': { id: 'ns-4', title: 'Terminus', artist: 'Ferrograph', source: 'Local', durationSec: 333, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-5': { id: 'ns-5', title: 'Night Shift', artist: 'Ferrograph', source: 'Spotify', durationSec: 247, format: '320', albumId: 'alb-nightbus-sessions' },
  'ns-6': { id: 'ns-6', title: 'First Light', artist: 'Ferrograph', source: 'Spotify', durationSec: 404, format: 'Lossless', albumId: 'alb-nightbus-sessions' },
};
