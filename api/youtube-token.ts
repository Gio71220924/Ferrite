// Vercel serverless function. Google's OAuth client requires client_secret
// even for this PKCE "Desktop app" client type (a recent Google Auth
// Platform change) - this proxy holds that secret server-side so it never
// reaches the browser bundle.
interface Req {
  method?: string;
  body?: { code?: string; redirect_uri?: string; code_verifier?: string };
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

  const { code, redirect_uri, code_verifier } = req.body ?? {};
  if (!code || !redirect_uri || !code_verifier) {
    res.status(400).json({ error: 'Missing code, redirect_uri, or code_verifier' });
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier,
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
