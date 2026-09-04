// Vercel serverless function - refresh-token counterpart to youtube-token.ts.
interface Req {
  method?: string;
  body?: { refresh_token?: string };
}
interface Res {
  status(code: number): Res;
  json(data: unknown): void;
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { refresh_token } = req.body ?? {};
  if (!refresh_token) {
    res.status(400).json({ error: 'Missing refresh_token' });
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
  });

  const googleRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await googleRes.json();
  res.status(googleRes.status).json(data);
}
