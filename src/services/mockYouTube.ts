import type { SourceConnector } from './sourceConnector';
import { youtubeCatalog } from '../data/mockLibrary';

export const youtubeConnector: SourceConnector = {
  connect() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ trackCount: 812, playlistCount: 24 }), 1600);
    });
  },
  disconnect() {},
  catalog() {
    return youtubeCatalog;
  },
};
