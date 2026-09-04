const BACKEND = 'http://localhost:3001';

interface DownloadResult {
  fileUrl: string;
  duration: number;
  fileSize: number;
}

export async function downloadAudio(videoId: string): Promise<DownloadResult> {
  const res = await fetch(`${BACKEND}/api/youtube/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getDownloadStatus(videoIds: string[]): Promise<Map<string, boolean>> {
  if (videoIds.length === 0) return new Map();

  const res = await fetch(`${BACKEND}/api/youtube/status?videoIds=${videoIds.join(',')}`);
  if (!res.ok) throw new Error(`Status check failed: HTTP ${res.status}`);

  const data: Record<string, boolean> = await res.json();
  return new Map(Object.entries(data));
}

export function getAudioUrl(videoId: string): string {
  return `${BACKEND}/api/youtube/audio/${videoId}`;
}

export async function deleteAudio(videoId: string): Promise<void> {
  const res = await fetch(`${BACKEND}/api/youtube/audio/${videoId}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete failed: HTTP ${res.status}`);
  }
}
