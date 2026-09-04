import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

describe('pkce', () => {
  it('generateCodeVerifier produces a base64url string with no padding', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(verifier.length).toBeGreaterThan(40);
  });

  it('generateCodeVerifier produces different values each call', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });

  it('generateCodeChallenge is deterministic for the same verifier', async () => {
    const verifier = 'a-fixed-test-verifier-value';
    const a = await generateCodeChallenge(verifier);
    const b = await generateCodeChallenge(verifier);
    expect(a).toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('generateCodeChallenge differs for different verifiers', async () => {
    const a = await generateCodeChallenge('verifier-one');
    const b = await generateCodeChallenge('verifier-two');
    expect(a).not.toBe(b);
  });
});
