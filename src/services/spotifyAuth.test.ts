import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredToken,
  clearStoredToken,
  handleCallback,
  getValidAccessToken,
} from './spotifyAuth';

function tokenResponse(overrides: Partial<{ access_token: string; refresh_token: string; expires_in: number }> = {}) {
  return {
    ok: true,
    json: async () => ({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      expires_in: 3600,
      ...overrides,
    }),
  } as Response;
}

describe('spotifyAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getStoredToken returns null when nothing has been stored', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('handleCallback throws without a PKCE verifier in session storage', async () => {
    await expect(handleCallback('some-code')).rejects.toThrow(/verifier/i);
  });

  it('handleCallback exchanges the code, stores the token, and clears the verifier', async () => {
    sessionStorage.setItem('ferrite:spotify:verifier', 'test-verifier');
    vi.mocked(fetch).mockResolvedValueOnce(tokenResponse());

    const token = await handleCallback('auth-code-123');

    expect(token.accessToken).toBe('access-1');
    expect(token.refreshToken).toBe('refresh-1');
    expect(getStoredToken()?.accessToken).toBe('access-1');
    expect(sessionStorage.getItem('ferrite:spotify:verifier')).toBeNull();
  });

  it('getValidAccessToken returns null when never logged in', async () => {
    expect(await getValidAccessToken()).toBeNull();
  });

  it('getValidAccessToken returns the stored token without refreshing when it is still fresh', async () => {
    sessionStorage.setItem('ferrite:spotify:verifier', 'v');
    vi.mocked(fetch).mockResolvedValueOnce(tokenResponse({ access_token: 'fresh-token' }));
    await handleCallback('code');

    const result = await getValidAccessToken();
    expect(result).toBe('fresh-token');
    expect(fetch).toHaveBeenCalledTimes(1); // only the original exchange, no refresh call
  });

  it('getValidAccessToken refreshes when the stored token is about to expire', async () => {
    sessionStorage.setItem('ferrite:spotify:verifier', 'v');
    vi.mocked(fetch).mockResolvedValueOnce(tokenResponse({ access_token: 'old-token', expires_in: 30 }));
    await handleCallback('code');

    vi.mocked(fetch).mockResolvedValueOnce(tokenResponse({ access_token: 'refreshed-token' }));
    const result = await getValidAccessToken();

    expect(result).toBe('refreshed-token');
    expect(getStoredToken()?.accessToken).toBe('refreshed-token');
  });

  it('clearStoredToken removes the token', async () => {
    sessionStorage.setItem('ferrite:spotify:verifier', 'v');
    vi.mocked(fetch).mockResolvedValueOnce(tokenResponse());
    await handleCallback('code');
    expect(getStoredToken()).not.toBeNull();

    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
