import { Router } from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { downloadAudio, deleteAudio, isDownloaded } from '../services/downloader.js';

export const youtubeRouter = Router();

const STORAGE_DIR = join(import.meta.dirname, '..', 'storage', 'audio');

youtubeRouter.post('/download', async (req, res) => {
  const { videoId } = req.body;

  if (!videoId || typeof videoId !== 'string') {
    res.status(400).json({ error: 'videoId is required' });
    return;
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    res.status(400).json({ error: 'Invalid videoId format' });
    return;
  }

  try {
    const result = await downloadAudio(videoId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Download failed';
    console.error(`Download failed for ${videoId}:`, message);
    res.status(500).json({ error: message });
  }
});

youtubeRouter.get('/audio/:videoId', (req, res) => {
  const { videoId } = req.params;
  const filePath = join(STORAGE_DIR, `${videoId}.mp3`);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'Audio not found' });
    return;
  }

  res.sendFile(filePath);
});

youtubeRouter.get('/status', (req, res) => {
  const videoIds = req.query.videoIds;

  if (!videoIds || typeof videoIds !== 'string') {
    res.status(400).json({ error: 'videoIds query parameter is required' });
    return;
  }

  const ids = videoIds.split(',').filter(Boolean);
  const status: Record<string, boolean> = {};

  for (const id of ids) {
    status[id] = isDownloaded(id);
  }

  res.json(status);
});

youtubeRouter.delete('/audio/:videoId', (req, res) => {
  const { videoId } = req.params;
  const deleted = deleteAudio(videoId);

  if (deleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Audio not found' });
  }
});
