import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback } from '../services/youtubeAuth';
import { refreshYoutubeLibrary } from '../services/youtubeLive';
import { useSources } from '../state/SourcesContext';

export function CallbackYouTube({ onboarded }: { onboarded: boolean }) {
  const navigate = useNavigate();
  const { dispatch } = useSources();
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setError('YouTube login was cancelled.');
      return;
    }
    const code = params.get('code');
    if (!code) {
      setError('Missing authorization code from Google.');
      return;
    }
    const state = params.get('state');

    dispatch({ type: 'CONNECT_START', key: 'youtube' });
    (async () => {
      try {
        await handleCallback(code, state);
        await refreshYoutubeLibrary();
        dispatch({ type: 'CONNECT_DONE', key: 'youtube' });
        navigate(onboarded ? '/settings' : '/', { replace: true });
      } catch (e) {
        dispatch({ type: 'DISCONNECT', key: 'youtube' });
        setError(e instanceof Error ? e.message : 'YouTube login failed.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--l1)', font: '500 15px var(--f-text)' }}>
      {error ?? 'Connecting to YouTube…'}
    </div>
  );
}
