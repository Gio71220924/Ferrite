# Ferrite — Architecture (Phase 1)

Implements `docs/PRD.md`. Read that first for *what*; this is *how*.

## 1. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast dev server, zero-config TS+React, builds to static files — no server needed, matches "web app, buildable on Windows" decision. |
| UI | React 18 + TypeScript | Design canvas is already React-shaped (`x-import` components, JSX device frame). Strict TS catches the state-shape bugs a music-library app is full of (missing duration, wrong source enum, etc). |
| Routing | `react-router-dom` v6 | Screens map cleanly to routes; nested routes give us the tab-bar-plus-outlet shell for free. |
| State | React Context + `useReducer`, one context per domain (`Library`, `Playback`, `Sources`) | The state shape is small enough that Redux/Zustand would be unused ceremony (ponytail: stdlib first). Reducers are unit-testable in isolation without React. |
| Styling | Plain CSS Modules + a shared `tokens.css` (CSS custom properties) | The source design already hand-rolls a complete CSS var system (`--l1`, `--t-body`, `--tint`, …) — porting it verbatim preserves visual fidelity better than reinterpreting it through a utility framework. |
| Icons | `lucide-react` | Design's `support.js` mock data pulls icons from `lucide-static` by the same names — same icon set, so screens match 1:1 with zero re-lookup. |
| Audio | Native `HTMLAudioElement` + `URL.createObjectURL` | No dependency needed for playback; browser does the decoding. |
| Testing | Vitest + `@testing-library/react` + `jsdom` | Vite-native test runner (shares config/transform with the app, no separate Jest config), RTL for component behavior tests. |
| Lint | ESLint (typescript-eslint + react-hooks plugin) | Catches hook-rule violations, which matter a lot once `Playback`/`Library` contexts are in play. |

No backend in Phase 1. Everything is client-side; "sync" and "connect" are
mocked async functions (§5).

## 2. Module layout

```
src/
  main.tsx                 # ReactDOM root, mounts <App/>
  App.tsx                  # Providers + Router + onboarding gate + AudioBridge
  styles/
    tokens.css              # ported :root vars from Ferrite.dc.html
    reset.css
  types/
    track.ts                 # Track, Source, Album types
  data/
    mockLibrary.ts           # ported TRACKS/SEARCH/albums mock data
  state/
    LibraryContext.tsx / libraryReducer.ts       # localTracks, filter, duplicateChoice
    PlaybackContext.tsx / playbackReducer.ts     # queue, currentIndex, playing, positionSec, volume
    SourcesContext.tsx / sourcesReducer.ts       # apple/spotify linked state, sync prefs, duplicatePreference
    DuplicateSheetContext.tsx                    # overlay context combining the three above
  audio/
    AudioEngine.ts           # wraps HTMLAudioElement, queue advance
  services/
    sourceConnector.ts       # SourceConnector interface
    mockAppleMusic.ts
    mockSpotify.ts
  lib/
    duplicates.ts            # findDuplicates(), resolution helpers
    format.ts                # formatDuration()
    useOnlineStatus.ts        # navigator.onLine + online/offline listeners
  app/
    AppShell.tsx             # bottom tab bar + outlet + mini player + duplicate sheet
    BottomTabBar.tsx
  screens/
    Library.tsx
    NowPlaying.tsx
    Sources.tsx
    Search.tsx
    Queue.tsx
    Album.tsx                 # variant='local'|'streaming'|'mixed'
    onboarding/
      OnboardingFlow.tsx
      ScanStep.tsx
      ConnectStep.tsx
      DuplicatesStep.tsx
  components/
    DuplicateSheet.tsx
    FerriteMark.tsx            # icon/wordmark, from PRD §6.8
    TrackRow.tsx
    MiniPlayer.tsx
```

Offline (PRD §6.7) is not a separate route — it's a rendering mode of
`Library.tsx`, driven by a `useOnlineStatus()` hook reading
`navigator.onLine` + `online`/`offline` listeners. This matches how the
design actually uses it (same list, same tab bar, different segmented
control state).

## 3. Data model

```ts
// src/types/track.ts
export type Source = 'Local' | 'Apple Music' | 'Spotify';

export interface Track {
  id: string;
  title: string;
  artist: string;
  source: Source;
  durationSec: number;
  format?: string;        // 'FLAC 24/96' | 'Lossless' | 'MP3 320' ...
  albumId?: string;
  fileUrl?: string;       // object URL, Local tracks only
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  variant: 'local' | 'streaming' | 'mixed';
  year: number;
  trackIds: string[];
  sizeLabel?: string;      // '512 MB', local/mixed only
}

export interface QueueItem {
  trackId: string;
}
```

## 4. State

Three contexts, each `{ state, dispatch }` via `useReducer`, no
cross-context reads inside reducers (a component that needs both reads both
hooks).

- **`SourcesContext`** — `{ apple: boolean; spotify: boolean; syncing: 'apple' | 'spotify' | null; prefs: { wifiOnly, preferLocal, cacheOffline }; rememberDuplicates: boolean; duplicatePreference: Source | null }`.
  Actions: `CONNECT_START`, `CONNECT_DONE` (no-ops if `syncing` no longer
  matches the key — guards a stale resolve after `DISCONNECT`), `DISCONNECT`,
  `SET_PREF` (generic toggle for the `prefs` sub-object), `SET_DUPLICATE_PREFERENCE`
  (explicit set, not a toggle — records which source to auto-pick for every
  future duplicate once `rememberDuplicates` is on; `null` until the user
  resolves a sheet or finishes onboarding's `DuplicatesStep`),
  `SET_REMEMBER_DUPLICATES`.
- **`LibraryContext`** — `{ localTracks: Track[]; filter: Source | 'All'; duplicateChoice: Record<string, Source> }`.
  Actions: `IMPORT_LOCAL_FILES`, `SET_FILTER`, `RESOLVE_DUPLICATE` (kept as a
  per-track record for history/debugging; duplicate *auto*-resolution reads
  `SourcesContext.duplicatePreference` instead, not this map — see §7).
  Album data lives in `data/mockLibrary.ts`, not in this context. Derives
  `linkedSources()` from `SourcesContext` at the call site (passed in), not
  duplicated into this reducer's state.
- **`PlaybackContext`** — `{ queue: string[]; currentIndex: number; playing: boolean; positionSec: number; volume: number }`
  (`queue` holds track ids, resolved back to `Track` objects via `App.tsx`'s
  `useTrackLookup()`).
  Actions: `PLAY_TRACK` (replaces queue from a track-id list + index),
  `ENQUEUE`, `REORDER`, `CLEAR_UPCOMING`, `TOGGLE_PLAY`, `SEEK`, `NEXT`,
  `PREV`, `TICK` (position update from the audio engine).
- **`DuplicateSheetContext`** — not a reducer; a thin overlay (`useState`)
  that reads all three contexts above and owns `pending: {key, copies, pool} | null`.
  `requestPlay(track, pool)` checks `findDuplicates` (§7); if a group exists
  and `rememberDuplicates && duplicatePreference` can resolve it, plays
  directly, otherwise opens the sheet. `resolve(source)` plays the chosen
  copy and, when `rememberDuplicates` is on, calls
  `SET_DUPLICATE_PREFERENCE` so every subsequent duplicate (any title) uses
  that same source without re-prompting (PRD §6.5/§10 source-priority
  remember).

`AudioEngine` (§6) is not a context — it is a singleton class instantiated
once in `App.tsx` and driven by a `useEffect` that mirrors
`PlaybackContext` state into it (play/pause/seek) and mirrors its events
(`timeupdate`, `ended`) back into `PLAYBACK` actions. Keeping it outside
React state means test code can construct one against a fake `Audio` and
assert on calls without rendering anything.

## 5. Mocked source connectors

```ts
// src/services/sourceConnector.ts
export interface SourceConnector {
  connect(): Promise<{ trackCount: number; playlistCount: number }>;
  disconnect(): void;
  catalog(): Track[];
}
```

`mockAppleMusic.ts` / `mockSpotify.ts` implement this with a
`setTimeout(1600ms)` before resolving — the same delay the design's
`connect()` method already uses — and return a fixed track list (ported
from the design's `SEARCH` mock). `Sources.tsx` and `ConnectStep.tsx` both
call through this interface, never a concrete mock class, so Phase 2 (real
MusicKit JS / Spotify Web API) is a drop-in replacement (PRD §9).

## 6. Audio engine

```ts
// src/audio/AudioEngine.ts
export class AudioEngine {
  private audio = new Audio();
  onTick?: (sec: number) => void;
  onEnded?: () => void;

  constructor() {
    this.audio.addEventListener('timeupdate', () => this.onTick?.(this.audio.currentTime));
    this.audio.addEventListener('ended', () => this.onEnded?.());
  }

  load(url: string) { this.audio.src = url; }
  play() { void this.audio.play(); }
  pause() { this.audio.pause(); }
  seek(sec: number) { this.audio.currentTime = sec; }
  setVolume(v: number) { this.audio.volume = v; }
}
```

Local tracks: `fileUrl` is a real `URL.createObjectURL(file)`, so `load()`
plays real audio. Apple Music/Spotify (mocked) tracks have no `fileUrl`;
`AudioEngine.load()` is skipped for those. The `setInterval` position-tick
fallback described in the original plan (so the scrubber still moves for a
mocked track, per PRD §6.2's "visually indistinguishable to the user") is
**not yet implemented** — the scrubber currently stays at 0:00 for
streaming tracks. Tracked as a parked follow-up, not done in Phase 1's
first pass.

## 7. Duplicate detection

```ts
// src/lib/duplicates.ts
export function keyOf(t: Pick<Track, 'title' | 'artist'>) {
  return (t.title + ' ' + t.artist).toLowerCase();
}

export function findDuplicates(tracks: Track[]): Map<string, Track[]> {
  const groups = new Map<string, Track[]>();
  for (const t of tracks) {
    const k = keyOf(t);
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  for (const [k, v] of groups) if (v.length < 2) groups.delete(k);
  return groups;
}
```

Called against the currently-linked tracks (Local + any connected
streaming source's mock catalog) whenever a track is about to play. If the
tapped track's key resolves to a group of 2+, `DuplicateSheetContext`
first checks whether `rememberDuplicates` is on and `duplicatePreference`
already names one of the copies' sources — if so it plays that copy
directly. Otherwise it opens `DuplicateSheet` instead of dispatching
`PLAY_TRACK`.

## 8. Testing strategy

See `docs/TESTING.md` for the full breakdown; summary: reducers and
`lib/duplicates.ts` get real unit tests (pure functions, no DOM), screens
get one RTL behavior test each for their one non-obvious interaction
(not full coverage of every button — CLAUDE.md says don't add tests for
what can't fail), `AudioEngine` gets a test against a stubbed
`HTMLMediaElement` (jsdom doesn't implement real playback, so this test
asserts on calls: `load()`→sets `src`, `play()`→calls `.play()`).

## 9. Build/CI

- `npm run build` — `tsc --noEmit && vite build`. Must be clean (project
  rule: "no broken builds").
- `npm run lint` — ESLint, zero warnings.
- `npm run test` — Vitest, run once (`--run`) in CI mode.
- No `console.log`/debug artifacts left in shipped code (project rule).
