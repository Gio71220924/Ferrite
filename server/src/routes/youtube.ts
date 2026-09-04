import { Router } from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { downloadAudio, deleteAudio, isDownloaded, getAudioStreamUrl } from '../services/downloader.js';

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

youtubeRouter.post('/download-batch', async (req, res) => {
  const { videoIds } = req.body;

  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    res.status(400).json({ error: 'videoIds array is required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const total = videoIds.length;
  let completed = 0;
  let failed = 0;

  for (const videoId of videoIds) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      failed++;
      completed++;
      res.write(`data: ${JSON.stringify({ videoId, status: 'error', error: 'Invalid videoId format', completed, total, failed })}\n\n`);
      continue;
    }

    if (isDownloaded(videoId)) {
      completed++;
      res.write(`data: ${JSON.stringify({ videoId, status: 'skipped', completed, total, failed })}\n\n`);
      continue;
    }

    try {
      await downloadAudio(videoId);
      completed++;
      res.write(`data: ${JSON.stringify({ videoId, status: 'ok', completed, total, failed })}\n\n`);
    } catch (err) {
      failed++;
      completed++;
      const error = err instanceof Error ? err.message : 'Download failed';
      console.error(`Batch download failed for ${videoId}:`, error);
      res.write(`data: ${JSON.stringify({ videoId, status: 'error', error, completed, total, failed })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true, completed, total, failed })}\n\n`);
  res.end();
});

youtubeRouter.get('/stream/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    res.status(400).json({ error: 'Invalid videoId format' });
    return;
  }

  try {
    const result = await getAudioStreamUrl(videoId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get stream URL';
    console.error(`Stream URL failed for ${videoId}:`, message);
    res.status(500).json({ error: message });
  }
});
