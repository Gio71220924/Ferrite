import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback } from '../services/spotifyAuth';
import { getProfile, getSavedTracks } from '../services/spotifyApi';
import { setSpotifyLibrary } from '../services/spotifyLive';
import { useSources } from '../state/SourcesContext';

export function Callback() {
  const navigate = useNavigate();
  const { dispatch } = useSources();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    dispatch({ type: 'CONNECT_START', key: 'spotify' });
    (async () => {
      try {
        await handleCallback(code);
        const [profile, tracks] = await Promise.all([getProfile(), getSavedTracks()]);
        setSpotifyLibrary(tracks, { displayName: profile.displayName, product: profile.product });
        dispatch({ type: 'CONNECT_DONE', key: 'spotify' });
        navigate('/sources', { replace: true });
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
