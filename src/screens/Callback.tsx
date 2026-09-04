import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback } from '../services/spotifyAuth';
import { refreshSpotifyLibrary } from '../services/spotifyLive';
import { useSources } from '../state/SourcesContext';

export function Callback({ onboarded }: { onboarded: boolean }) {
  const navigate = useNavigate();
  const { dispatch } = useSources();
  const [error, setError] = useState<string | null>(null);
  // React 18 StrictMode double-invokes effects in dev; the code/verifier
  // exchange is one-shot (Spotify rejects a reused code, and handleCallback
  // clears the stored state on first use), so a second run must be skipped
  // rather than treated as a real retry.
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('Spotify login was cancelled.');
      return;
    }
    const code = params.get('code');
    if (!code) {
      setError('Missing authorization code from Spotify.');
      return;
    }
    const state = params.get('state');

    dispatch({ type: 'CONNECT_START', key: 'spotify' });
    (async () => {
      try {
        await handleCallback(code, state);
        await refreshSpotifyLibrary();
        dispatch({ type: 'CONNECT_DONE', key: 'spotify' });
        // Mid-onboarding, '/' resumes the wizard at its persisted step
        // (ConnectStep); post-onboarding, '/sources' is where this login
        // was started from.
        navigate(onboarded ? '/sources' : '/', { replace: true });
      } catch (e) {
        dispatch({ type: 'DISCONNECT', key: 'spotify' });
        setError(e instanceof Error ? e.message : 'Spotify login failed.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--l1)', font: '500 15px var(--f-text)' }}>
      {error ?? 'Connecting to Spotify…'}
    </div>
  );
}
