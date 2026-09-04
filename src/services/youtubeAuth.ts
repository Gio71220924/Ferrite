import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const VERIFIER_KEY = 'ferrite:youtube:verifier';
const STATE_KEY = 'ferrite:youtube:state';
const TOKEN_KEY = 'ferrite:youtube:token';

export interface YouTubeToken {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export function getStoredToken(): YouTubeToken | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as YouTubeToken;
  } catch {
    return null;
  }
}

function storeToken(token: YouTubeToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function startLogin(): Promise<void> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateCodeVerifier();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
    response_type: 'code',
    redirect_uri: import.meta.env.VITE_YOUTUBE_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
    state,
    // Google only returns a refresh_token on the first consent grant unless
    // both of these are set — without a refresh_token the login would stop
    // working again after ~1 hour.
    access_type: 'offline',
    prompt: 'consent',
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function handleCallback(code: string, state: string | null): Promise<YouTubeToken> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier — start login again');

  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!expectedState || state !== expectedState) {
    throw new Error('YouTube login state mismatch — start login again');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: import.meta.env.VITE_YOUTUBE_REDIRECT_URI,
    client_id: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`YouTube token exchange failed: ${res.status}`);
  const data = await res.json();
  const token: YouTubeToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeToken(token);
  sessionStorage.removeItem(VERIFIER_KEY);
  return token;
}

async function refreshAccessToken(refreshToken: string): Promise<YouTubeToken> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`YouTube token refresh failed: ${res.status}`);
  const data = await res.json();
  const token: YouTubeToken = {
    accessToken: data.access_token,
    refreshToken: refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeToken(token);
  return token;
}

/** A valid access token, refreshing first if it's expired or about to (within 60s). Null if never logged in or no refresh token available. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;
  if (token.expiresAt - Date.now() > 60_000) return token.accessToken;
  if (!token.refreshToken) return null;
  const refreshed = await refreshAccessToken(token.refreshToken);
  return refreshed.accessToken;
}
