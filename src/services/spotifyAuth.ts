import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce';

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

const VERIFIER_KEY = 'ferrite:spotify:verifier';
const STATE_KEY = 'ferrite:spotify:state';
const TOKEN_KEY = 'ferrite:spotify:token';

export interface SpotifyToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getStoredToken(): SpotifyToken | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SpotifyToken;
  } catch {
    return null;
  }
}

function storeToken(token: SpotifyToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function startLogin(): Promise<void> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = await generateCodeChallenge(verifier);
  // CSRF guard: an attacker who tricks a victim into visiting our callback
  // URL with their own authorization code could otherwise link their
  // Spotify account to the victim's session. `state` ties the callback
  // back to the browser tab that started this specific login.
  const state = generateCodeVerifier();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
    state,
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function handleCallback(code: string, state: string | null): Promise<SpotifyToken> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error('Missing PKCE verifier — start login again');

  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!expectedState || state !== expectedState) {
    throw new Error('Spotify login state mismatch — start login again');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed: ${res.status}`);
  const data = await res.json();
  const token: SpotifyToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeToken(token);
  sessionStorage.removeItem(VERIFIER_KEY);
  return token;
}

async function refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token refresh failed: ${res.status}`);
  const data = await res.json();
  const token: SpotifyToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  storeToken(token);
  return token;
}

/** A valid access token, refreshing first if it's expired or about to (within 60s). Null if never logged in. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;
  if (token.expiresAt - Date.now() > 60_000) return token.accessToken;
  const refreshed = await refreshAccessToken(token.refreshToken);
  return refreshed.accessToken;
}
