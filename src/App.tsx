import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { SourcesProvider, useSources } from './state/SourcesContext';
import { LibraryProvider, useLibrary } from './state/LibraryContext';
import { PlaybackProvider, usePlayback } from './state/PlaybackContext';
import { DuplicateSheetProvider } from './state/DuplicateSheetContext';
import { AppShell, useShellContext } from './app/AppShell';
import { Library } from './screens/Library';
import { NowPlaying } from './screens/NowPlaying';
import { Sources } from './screens/Sources';
import { Search } from './screens/Search';
import { Queue } from './screens/Queue';
import { Album } from './screens/Album';
import { Callback } from './screens/Callback';
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow';
import { albums, albumTracks, youtubeCatalog } from './data/mockLibrary';
import { AudioEngine } from './audio/AudioEngine';
import { SpotifyPlayer } from './audio/SpotifyPlayer';
import { getValidAccessToken, getStoredToken, clearStoredToken } from './services/spotifyAuth';
import { getSpotifyTracks, refreshSpotifyLibrary } from './services/spotifyLive';
import { recordPlayed } from './lib/recentlyPlayed';
import type { Track } from './types/track';

function useTrackLookup() {
  const { state: library } = useLibrary();
  const { state: sources } = useSources();
  return useMemo(() => {
    const all: Track[] = [
      ...library.localTracks,
      ...(sources.youtube ? youtubeCatalog : []),
      ...(sources.spotify ? getSpotifyTracks() : []),
      ...Object.values(albumTracks),
    ];
    const byId = new Map(all.map(t => [t.id, t]));
    return (id: string) => byId.get(id);
  }, [library.localTracks, sources.youtube, sources.spotify]);
}

function LibraryRoute() {
  const { onPlay } = useShellContext();
  return <Library onPlay={onPlay} />;
}

function SearchRoute() {
  const { onPlay } = useShellContext();
  return <Search onPlay={onPlay} />;
}

function AlbumRoute() {
  const { onPlay } = useShellContext();
  const { id } = useParams<{ id: string }>();
  const album = albums.find(a => a.id === id);
  if (!album) return <div>Album not found</div>;
  return <Album album={album} onPlay={onPlay} />;
}

function QueueRoute() {
  const { getTrack } = useShellContext();
  return <Queue getTrack={getTrack} />;
}

function NowPlayingRoute() {
  const { getTrack } = useShellContext();
  const { state } = usePlayback();
  const navigate = useNavigate();
  const currentId = state.queue[state.currentIndex];
  const track = currentId ? getTrack(currentId) : undefined;
  if (!track) return <div>Nothing playing</div>;
  return <NowPlaying track={track} onClose={() => navigate(-1)} />;
}

function AudioBridge() {
  const { state, dispatch } = usePlayback();
  const getTrack = useTrackLookup();
  const engineRef = useRef<AudioEngine>();
  if (!engineRef.current) engineRef.current = new AudioEngine();
  const spotifyRef = useRef<SpotifyPlayer>();
  if (!spotifyRef.current) spotifyRef.current = new SpotifyPlayer();
  const spotifyConnectingRef = useRef<Promise<void> | null>(null);
  const lastSpotifyTrackId = useRef<string | null>(null);
  const currentId = state.queue[state.currentIndex];
  const track = currentId ? getTrack(currentId) : undefined;
  const isSpotify = track?.source === 'Spotify';

  useEffect(() => {
    const engine = engineRef.current!;
    engine.onEnded = () => dispatch({ type: 'NEXT' });
    engine.onTick = sec => dispatch({ type: 'TICK', positionSec: sec });
    spotifyRef.current!.onStateChange = s => dispatch({ type: 'TICK', positionSec: Math.round(s.position / 1000) });
  }, [dispatch]);

  useEffect(() => {
    if (track?.id) recordPlayed(track.id);
  }, [track?.id]);

  useEffect(() => {
    // When switching to a track with no fileUrl (e.g. a streaming track),
    // there's nothing to load — pause any audio left playing from a
    // previous local track so it doesn't keep playing under the new UI.
    const engine = engineRef.current!;
    if (isSpotify) {
      engine.pause();
      return;
    }
    lastSpotifyTrackId.current = null;
    if (track?.fileUrl) engine.load(track.fileUrl);
    else engine.pause();
  }, [track?.fileUrl, isSpotify]);

  useEffect(() => {
    if (!track?.fileUrl || isSpotify) return;
    if (state.playing) engineRef.current!.play();
    else engineRef.current!.pause();
  }, [state.playing, track?.fileUrl, isSpotify]);

  // Real Spotify playback: connects the Web Playback SDK on first use, then
  // drives Spotify Connect (play/resume/pause) for this app's device.
  useEffect(() => {
    if (!isSpotify || !track) return;
    const sp = spotifyRef.current!;
    let cancelled = false;
    (async () => {
      if (!spotifyConnectingRef.current) spotifyConnectingRef.current = sp.connect(getValidAccessToken);
      await spotifyConnectingRef.current;
      if (cancelled) return;
      if (!sp.getDeviceId()) await new Promise<void>(resolve => { sp.onReady = resolve; });
      if (cancelled) return;
      const token = await getValidAccessToken();
      if (!token || cancelled) return;
      if (!state.playing) {
        sp.pause();
        return;
      }
      try {
        if (lastSpotifyTrackId.current !== track.id) {
          lastSpotifyTrackId.current = track.id;
          await sp.playUri(track.id, token);
        } else {
          sp.resume();
        }
      } catch (e) {
        if (!cancelled) {
          dispatch({ type: 'PLAYBACK_ERROR', message: e instanceof Error ? e.message : 'Spotify playback failed' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, isSpotify, state.playing]);

  useEffect(() => {
    engineRef.current!.setVolume(state.volume);
    spotifyRef.current!.setVolume(state.volume);
  }, [state.volume]);

  // Mocked tracks (no fileUrl, not Spotify) never fire a real timeupdate
  // event, so the scrubber would otherwise sit frozen at 0:00. Approximate
  // real playback with a local 1s counter (PRD §6.2: "visually
  // indistinguishable to the user") — this owns its own elapsed count
  // rather than reading state.positionSec each tick, so it doesn't need to
  // re-run on every TICK it dispatches. Real Spotify tracks get their TICKs
  // from the SDK's onStateChange above instead.
  useEffect(() => {
    if (!track || track.fileUrl || isSpotify || !state.playing) return;
    let elapsed = state.positionSec;
    const interval = setInterval(() => {
      elapsed = Math.min(elapsed + 1, track.durationSec);
      dispatch({ type: 'TICK', positionSec: elapsed });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.fileUrl, isSpotify, state.playing]);

  return null;
}

function Gated() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('ferrite:onboarded') === 'true');
  const getTrack = useTrackLookup();
  const { dispatch: sourcesDispatch } = useSources();

  // A page reload wipes the in-memory "connected" flag and track cache,
  // but the Spotify token itself lives in localStorage — reconnect
  // silently on boot instead of showing Spotify as unlinked.
  useEffect(() => {
    if (!getStoredToken()) return;
    sourcesDispatch({ type: 'CONNECT_START', key: 'spotify' });
    (async () => {
      try {
        await refreshSpotifyLibrary();
        sourcesDispatch({ type: 'CONNECT_DONE', key: 'spotify' });
      } catch {
        clearStoredToken();
        sourcesDispatch({ type: 'DISCONNECT', key: 'spotify' });
      }
    })();
  }, [sourcesDispatch]);

  return (
    <BrowserRouter>
      <AudioBridge />
      <Routes>
        {/* Always reachable, even mid-onboarding: connecting Spotify from
            ConnectStep redirects the whole page away and back here. */}
        <Route path="callback" element={<Callback onboarded={onboarded} />} />
        {onboarded ? (
          <Route element={<AppShell getTrack={getTrack} />}>
            <Route index element={<LibraryRoute />} />
            <Route path="search" element={<SearchRoute />} />
            <Route path="sources" element={<Sources />} />
            <Route path="queue" element={<QueueRoute />} />
            <Route path="now-playing" element={<NowPlayingRoute />} />
            <Route path="album/:id" element={<AlbumRoute />} />
          </Route>
        ) : (
          <Route path="*" element={<OnboardingFlow onFinish={() => setOnboarded(true)} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <SourcesProvider>
      <LibraryProvider>
        <PlaybackProvider>
          <DuplicateSheetProvider>
            <Gated />
          </DuplicateSheetProvider>
        </PlaybackProvider>
      </LibraryProvider>
    </SourcesProvider>
  );
}
