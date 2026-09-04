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
import { OnboardingFlow } from './screens/onboarding/OnboardingFlow';
import { albums, albumTracks, appleMusicCatalog, spotifyCatalog } from './data/mockLibrary';
import { AudioEngine } from './audio/AudioEngine';
import type { Track } from './types/track';

function useTrackLookup() {
  const { state: library } = useLibrary();
  const { state: sources } = useSources();
  return useMemo(() => {
    const all: Track[] = [
      ...library.localTracks,
      ...(sources.apple ? appleMusicCatalog : []),
      ...(sources.spotify ? spotifyCatalog : []),
      ...Object.values(albumTracks),
    ];
    const byId = new Map(all.map(t => [t.id, t]));
    return (id: string) => byId.get(id);
  }, [library.localTracks, sources.apple, sources.spotify]);
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
  const currentId = state.queue[state.currentIndex];
  const track = currentId ? getTrack(currentId) : undefined;

  useEffect(() => {
    const engine = engineRef.current!;
    engine.onEnded = () => dispatch({ type: 'NEXT' });
    engine.onTick = sec => dispatch({ type: 'TICK', positionSec: sec });
  }, [dispatch]);

  useEffect(() => {
    // When switching to a track with no fileUrl (e.g. a streaming track),
    // there's nothing to load — pause any audio left playing from a
    // previous local track so it doesn't keep playing under the new UI.
    const engine = engineRef.current!;
    if (track?.fileUrl) engine.load(track.fileUrl);
    else engine.pause();
  }, [track?.fileUrl]);

  useEffect(() => {
    if (!track?.fileUrl) return;
    if (state.playing) engineRef.current!.play();
    else engineRef.current!.pause();
  }, [state.playing, track?.fileUrl]);

  useEffect(() => {
    engineRef.current!.setVolume(state.volume);
  }, [state.volume]);

  // Mocked/streaming tracks (no fileUrl) never fire the real audio engine's
  // timeupdate event, so the scrubber would otherwise sit frozen at 0:00.
  // Approximate real playback with a local 1s counter (PRD §6.2: "visually
  // indistinguishable to the user") — this owns its own elapsed count
  // rather than reading state.positionSec each tick, so it doesn't need to
  // re-run on every TICK it dispatches.
  useEffect(() => {
    if (!track || track.fileUrl || !state.playing) return;
    let elapsed = state.positionSec;
    const interval = setInterval(() => {
      elapsed = Math.min(elapsed + 1, track.durationSec);
      dispatch({ type: 'TICK', positionSec: elapsed });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.fileUrl, state.playing]);

  return null;
}

function Gated() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('ferrite:onboarded') === 'true');
  const getTrack = useTrackLookup();

  if (!onboarded) {
    return <OnboardingFlow onFinish={() => setOnboarded(true)} />;
  }

  return (
    <BrowserRouter>
      <AudioBridge />
      <Routes>
        <Route element={<AppShell getTrack={getTrack} />}>
          <Route index element={<LibraryRoute />} />
          <Route path="search" element={<SearchRoute />} />
          <Route path="sources" element={<Sources />} />
          <Route path="queue" element={<QueueRoute />} />
          <Route path="now-playing" element={<NowPlayingRoute />} />
          <Route path="album/:id" element={<AlbumRoute />} />
        </Route>
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
