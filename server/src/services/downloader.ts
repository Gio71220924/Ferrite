import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const STORAGE_DIR = join(import.meta.dirname, '..', 'storage', 'audio');

interface DownloadResult {
  fileUrl: string;
  duration: number;
  fileSize: number;
}

function getAudioPath(videoId: string): string {
  return join(STORAGE_DIR, `${videoId}.mp3`);
}

export function isDownloaded(videoId: string): boolean {
  return existsSync(getAudioPath(videoId));
}

export function getAudioUrl(videoId: string): string {
  return `/api/youtube/audio/${videoId}`;
}

export async function downloadAudio(videoId: string): Promise<DownloadResult> {
  const outputPath = join(STORAGE_DIR, `${videoId}.%(ext)s`);
  const finalPath = getAudioPath(videoId);

  if (existsSync(finalPath)) {
    const stats = statSync(finalPath);
    return {
      fileUrl: getAudioUrl(videoId),
      duration: 0,
      fileSize: stats.size,
    };
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  await execFileAsync('yt-dlp', [
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '192K',
    '--no-playlist',
    '--no-warnings',
    '--output', outputPath,
    url,
  ], { timeout: 300000 });

  const webmPath = join(STORAGE_DIR, `${videoId}.webm`);
  if (existsSync(webmPath) && !existsSync(finalPath)) {
    renameSync(webmPath, finalPath);
  }

  if (!existsSync(finalPath)) {
    throw new Error(`Download failed: output file not found`);
  }

  const stats = statSync(finalPath);

  return {
    fileUrl: getAudioUrl(videoId),
    duration: 0,
    fileSize: stats.size,
  };
}

export function deleteAudio(videoId: string): boolean {
  const path = getAudioPath(videoId);
  if (existsSync(path)) {
    unlinkSync(path);
    return true;
  }
  return false;
}
