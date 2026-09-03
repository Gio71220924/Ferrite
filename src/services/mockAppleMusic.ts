import type { SourceConnector } from './sourceConnector';
import { appleMusicCatalog } from '../data/mockLibrary';

export const appleMusicConnector: SourceConnector = {
  connect() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ trackCount: 812, playlistCount: 24 }), 1600);
    });
  },
  disconnect() {},
  catalog() {
    return appleMusicCatalog;
  },
};
