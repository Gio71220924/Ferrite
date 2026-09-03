import type { SourceConnector } from './sourceConnector';
import { spotifyCatalog } from '../data/mockLibrary';

export const spotifyConnector: SourceConnector = {
  connect() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ trackCount: 1140, playlistCount: 31 }), 1600);
    });
  },
  disconnect() {},
  catalog() {
    return spotifyCatalog;
  },
};
