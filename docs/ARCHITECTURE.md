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
| Audio | Native `HTMLAudioElement` + `URL.createObjectURL` (Local); Spotify Web Playback SDK (Spotify, real) | No dependency needed for local playback; Spotify requires its own SDK for in-browser Connect playback — see §5. |
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
    SpotifyPlayer.ts          # wraps the real Spotify Web Playback SDK
  services/
    sourceConnector.ts       # SourceConnector interface (Apple Music only, now)
    mockAppleMusic.ts
    mockSpotify.ts            # still used by onboarding's ConnectStep as a
                               # reference shape; Sources.tsx no longer uses it
    spotifyAuth.ts             # real OAuth: PKCE login, token exchange/refresh
    spotifyApi.ts               # real Spotify Web API: profile, saved tracks
    spotifyLive.ts               # in-memory cache of the real fetched library
  lib/
    duplicates.ts            # findDuplicates(), resolution helpers
    format.ts                # formatDuration()
    useOnlineStatus.ts        # navigator.onLine + online/offline listeners
    useMediaQuery.ts           # real matchMedia hook, drives desktop/mobile layout
    pkce.ts                     # code_verifier/code_challenge for spotifyAuth
    trackFromFile.ts             # filename -> Track, shared by ScanStep + Sources
  app/
    AppShell.tsx             # desktop sidebar / mobile tab bar + outlet + mini player + duplicate sheet
    BottomTabBar.tsx
    Sidebar.tsx                # desktop-only nav (>=1024px)
  screens/
    Library.tsx
    NowPlaying.tsx
    Sources.tsx
    Search.tsx
    Queue.tsx
    Album.tsx                 # variant='local'|'streaming'|'mixed'
    Callback.tsx                # Spotify OAuth redirect landing page
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
  artworkUrl?: string;    // real image URL, Spotify tracks only (album.images)
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
- **`PlaybackContext`** — `{ queue: string[]; currentIndex: number; playing: boolean; positionSec: number; volume: number; error: string | null }`
  (`queue` holds track ids, resolved back to `Track` objects via `App.tsx`'s
  `useTrackLookup()`).
  Actions: `PLAY_TRACK` (replaces queue from a track-id list + index),
  `ENQUEUE`, `REORDER`, `CLEAR_UPCOMING`, `TOGGLE_PLAY`, `SEEK`, `NEXT`,
  `PREV`, `TICK` (position update from the audio engine), `PLAYBACK_ERROR`
  (sets `error` + stops `playing`; surfaced in `NowPlaying` — currently only
  raised by a failed Spotify `playUri`, e.g. a non-Premium account).
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

## 5. Source connectors — mocked Apple Music, real Spotify

```ts
// src/services/sourceConnector.ts
export interface SourceConnector {
  connect(): Promise<{ trackCount: number; playlistCount: number }>;
  disconnect(): void;
  catalog(): Track[];
}
```

`mockAppleMusic.ts` implements this with a `setTimeout(1600ms)` before
resolving — the same delay the design's `connect()` method already uses —
and returns a fixed track list (ported from the design's `SEARCH` mock).
`mockSpotify.ts` still exists and implements the same interface (used only
by onboarding's `ConnectStep` as a fallback shape), but `Sources.tsx` and
the real Spotify path no longer call through it.

The PRD §9 assumption that Phase 2 would be "a drop-in replacement behind
the same interface" turned out not to fit Spotify: `connect()` here is a
synchronous-looking async function, but real Spotify login is a full-page
OAuth redirect — the browser navigates away entirely and comes back on a
different route, so there is no single call that can `await` the result.
Spotify's real integration therefore bypasses `SourceConnector` and is its
own set of modules:

- **`lib/pkce.ts`** — `generateCodeVerifier()` / `generateCodeChallenge()`
  (SHA-256 via Web Crypto), for OAuth 2.0 Authorization Code + PKCE (no
  client secret needed in a browser-only app).
- **`services/spotifyAuth.ts`** — `startLogin()` builds the PKCE challenge
  and a random `state` (CSRF guard — rejected by `handleCallback` if it
  doesn't match what was stored), stores both in `sessionStorage`, and
  redirects to Spotify's `/authorize`. `handleCallback(code, state)` runs
  on the way back (`screens/Callback.tsx`), exchanges the code for a token
  at `/api/token`, and stores `{accessToken, refreshToken, expiresAt}` in
  `localStorage['ferrite:spotify:token']`. `getValidAccessToken()` returns
  the cached token or refreshes it first if it's within 60s of expiry.
- **`services/spotifyApi.ts`** — `getProfile()` and `getSavedTracks()`
  (paginated via the response's `next` link, capped at 20 pages) against
  the real Spotify Web API, mapping each saved track to a `Track` —
  including `artworkUrl` from `album.images`.
- **`services/spotifyLive.ts`** — a small in-memory cache
  (`setSpotifyLibrary`/`getSpotifyTracks`/`getSpotifyProfile`) that
  `Library.tsx`, `Search.tsx`, `Sources.tsx`, and `App.tsx`'s
  `useTrackLookup()` read instead of `spotifyConnector.catalog()`.
  `refreshSpotifyLibrary()` fetches + populates it in one call, shared by
  `Callback.tsx` (after a fresh login) and `Gated`'s boot-time rehydrate
  (below).
- **`audio/SpotifyPlayer.ts`** — wraps the real Web Playback SDK
  (`https://sdk.scdn.co/spotify-player.js`, injected once): `connect()`
  creates a `Spotify.Player` device, `playUri()`/`pause()`/`resume()`/
  `seek()`/`setVolume()` drive Spotify Connect playback on it. `playUri()`
  throws a Premium-required message on a 403 response — Spotify's Web
  Playback SDK is Premium-only server-side; a Free account can log in and
  browse its real library, but can't play through it.

**Reload persistence:** unlike Apple's mock (which never survives a
reload, by design — it's not meant to), Spotify's connection is expected
to survive one, since the OAuth token already lives in `localStorage`.
`App.tsx`'s `Gated` runs a boot-time effect: if `getStoredToken()` returns
a token, it dispatches `CONNECT_START`/`refreshSpotifyLibrary()`/
`CONNECT_DONE` for Spotify silently, rather than showing it as unlinked
until the user reconnects.

**Onboarding:** `ConnectStep`'s Spotify button also calls `startLogin()`
(Apple Music's card stays on the mock `connect()`). Because the OAuth
redirect reloads the page, `OnboardingFlow`'s step index is persisted to
`localStorage['ferrite:onboarding:step']` so the wizard resumes at
`ConnectStep` instead of restarting at `ScanStep`. `/callback` is
reachable regardless of onboarding status (`Gated`'s `<Routes>` always
includes it, unlike the rest of the app which is gated behind
`ferrite:onboarded`), and `Callback.tsx` navigates to `/` (resume
onboarding) or `/sources` (already onboarded) depending on which case it
was called from.

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
plays real audio. `AudioBridge` (`App.tsx`) branches on `track.source`:

- **Spotify** — routes through `SpotifyPlayer` instead of `AudioEngine`:
  connects the SDK lazily on first use, calls `playUri()` on a track
  change or `resume()`/`pause()` on a play/pause toggle, and mirrors the
  SDK's `player_state_changed` event back into `TICK` (real position, not
  a simulated one).
  A `PLAYBACK_ERROR` is dispatched if `playUri()` throws (see §5).
- **Apple Music (mocked)** — has no `fileUrl`; `AudioEngine.load()` is
  skipped and a local `setInterval` ticks `positionSec` once a second,
  capped at `track.durationSec` — the scrubber moves for a mocked track
  too (PRD §6.2: "visually indistinguishable to the user").
- **Local** — the real `AudioEngine` path described above.

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

## 9. Environment / setup

Real Spotify login needs two Vite env vars, set in `.env.local` (gitignored;
`.env.example` has the placeholder template):

```sh
VITE_SPOTIFY_CLIENT_ID=<client id from the Spotify Developer Dashboard>
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5199/callback
```

The redirect URI must be registered exactly on the Spotify app (Web API +
Web Playback SDK scopes) and use `127.0.0.1`, not `localhost` — Spotify
requires HTTPS for redirect URIs except loopback IPs. `npm run dev` should
be started with a matching port (`--port 5199 --host 127.0.0.1`) so the
redirect actually lands on a running dev server.

## 10. Build/CI

- `npm run build` — `tsc --noEmit && vite build`. Must be clean (project
  rule: "no broken builds").
- `npm run lint` — ESLint, zero warnings.
- `npm run test` — Vitest, run once (`--run`) in CI mode.
- No `console.log`/debug artifacts left in shipped code (project rule).
