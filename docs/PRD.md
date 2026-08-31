# Ferrite — Product Requirements Document

**Status:** Draft v1
**Source of truth (visual):** `ClaudeDesign/Ferrite.dc.html` (Claude Design canvas, 14 screens + icon)
**Owner:** Giovanka Steviano Harry Premono

## 1. Problem

Music collectors who own local files (FLAC/MP3 rips, purchased downloads) and also
pay for one or more streaming services end up with their library split across three
places: a local folder, Apple Music, and Spotify. No single app shows "everything I
can play" as one list, so people either abandon their local files or keep three apps
open and manually remember what lives where. When the same song exists in two or
three places, most apps either show three duplicate rows or silently pick one without
asking.

## 2. Product

Ferrite is a music library app that merges Local files, Apple Music, and Spotify into
one browsable, searchable library. It never uploads or re-hosts audio — local files
play from the device, streaming sources play through their own linked service. Its
one opinionated feature is duplicate handling: when a title+artist exists in more than
one linked source, Ferrite asks which copy to play (once, or remembered).

## 3. Goals

- One Library view across Local + Apple Music + Spotify, filterable by source.
- Local audio actually plays (real file import + playback), not a mock.
- Duplicate detection by title+artist, with an explicit resolution UI and a
  "remember for all duplicates" preference.
- Unified search across all linked sources, grouped by source.
- A queue the user can inspect and reorder.
- Graceful offline state: local tracks stay playable, streaming tracks show as
  unavailable rather than erroring.
- First-run onboarding that explains local-first scanning and optional linking.

## 4. Non-goals (this phase)

- Real Apple Music / Spotify OAuth and playback SDKs. Phase 1 mocks the connect
  flow (a timed "Importing library…" state) and the "streaming" catalog. See
  §9 Phased Rollout.
- Native iOS app / App Store distribution. Phase 1 ships as a browser web app
  (installable as a PWA later) so it can be built and tested on the current
  (Windows, no Xcode) machine. See `docs/ARCHITECTURE.md`.
- Cloud sync of library state across devices. State lives in the browser
  (localStorage/IndexedDB) per device.
- Lyrics, AirPlay, and social features shown as icons in the design are visual
  affordances only in this phase (present, non-functional, documented as such).

## 5. Primary persona

**Rosalind** — owns ~1,300 local FLAC/MP3 tracks from a decade of buying music,
also subscribes to Apple Music and Spotify for discovery. Wants one place to see
"everything," wants her own FLAC rip to win when it's better quality than the
stream, and gets annoyed seeing the same song three times in a search result.

## 6. Feature spec, by screen

Each subsection maps 1:1 to a numbered screen in `Ferrite.dc.html`.

### 6.1 Library (01)
- Large title, profile glyph (top right).
- Segmented filter: All / Local / Apple Music / Spotify. A segment for a
  disconnected source is present but disabled (dimmed, non-interactive,
  tooltip "X is not connected").
- "Recently played" horizontal rail (album cards → Album screen).
- Filter chips row (Downloaded, Weekly Mix, Saved albums, Recently added) —
  visual in phase 1, wired to real filters is a fast-follow, not required for
  ship.
- Track list, grouped by the active filter; empty state ("Nothing to play yet"
  / "No {source} tracks") with a body hint when the active filter is empty.
- Persistent mini player bar (floating, glass) when something is loaded, tap
  → Now Playing.
- Bottom tab bar: Library / Search / Sources.

### 6.2 Now Playing (02)
- Full-screen player: artwork, title/artist, source badge (e.g.
  "LOCAL · FLAC 24/96"), scrubber with elapsed/remaining time, transport
  (prev/play-pause/next), volume slider, and a row of secondary actions
  (Lyrics / AirPlay / Queue — Queue is functional and opens the Queue screen,
  Lyrics/AirPlay are visual-only in phase 1).
- Real transport: play/pause controls actual `<audio>` playback for Local
  tracks. For Apple Music/Spotify (mocked) tracks, transport updates UI state
  only and is visually indistinguishable to the user (no dead-end error).

### 6.3 Sources & Sync (03)
- One card per service (Apple Music, Spotify) with connect/unlink button and
  status line (song/playlist counts once connected, "Importing library…"
  with a spinner while connecting, "Not connected" otherwise).
- "Last synced" timestamp per service.
- Sync preferences (toggles): "Sync over Wi-Fi only" and "Prefer local file
  when duplicated" (both disabled/dimmed if no streaming source is linked),
  "Cache artwork & metadata" (always available).
- "Merge duplicates: By title + artist" row (states the matching strategy;
  static in phase 1 — the strategy is not user-configurable yet).
- Storage section: local file count, space used, "Manage local files" link
  (opens the same file-import control used during onboarding/library-empty
  state).

### 6.4 Unified Search (04)
- Search field with live query, clear button, Cancel.
- Scope segmented control: All / Local / Apple Music / Spotify (same
  disabled-when-unlinked rule as Library).
- Results grouped by source, each group shows a count and its matching
  tracks.

### 6.5 Duplicate resolution (05)
- Bottom sheet, triggered when the user taps to play a track whose
  title+artist matches a track in more than one **linked** source.
- Lists each copy (source, quality/format meta) with a checkmark on the
  currently-chosen copy.
- "Remember for all duplicates" toggle — when on, future duplicate hits for
  *any* track resolve automatically using the same source-preference order
  the user just picked, without re-prompting, until turned off in Sources.
- Cancel dismisses without changing playback.

### 6.6 Queue (06)
- "Now playing" card at top (art, title, source, play/pause).
- "Next from {context}" list, reorderable, "Clear" empties everything after
  the now-playing item.
- Each row is draggable (native HTML5 drag-and-drop, no added dependency)
  with an explicit grip affordance; keyboard users get Move-up/Move-down via
  the row's context (button pair), since drag alone is not keyboard
  accessible.

### 6.7 Offline (07)
- Appears automatically when the browser reports offline
  (`navigator.onLine` + `online`/`offline` events) — this is real detection,
  not a simulated toggle.
- Banner: "No connection — N local tracks still play. Streaming resumes when
  you are back online."
- Segmented control collapses to Local-only (other segments disabled).
- Track list shows all Local tracks normally; streaming tracks appear dimmed
  with a cloud-off glyph and no duration, rather than being hidden (so the
  user still sees "what's missing right now").

### 6.8 Icon & wordmark (08)
- App icon: squircle ground (`#1C1A24`), a cassette-shell silhouette (two
  unequal punched-through reel holes) filled with the current ambient
  accent color. Reused as the browser tab favicon and PWA icon.
- Wordmark "Ferrite" in the rounded system font, paired with the mark at
  three sizes, used in the onboarding screens and empty states.

### 6.9–6.11 Album — Local / Streaming / Mixed (09, 10, 11)
- Shared layout: square artwork, title, artist, meta line (year · track
  count · format/size, varies per source), track list numbered with
  duration.
- Local: actions are Play / Shuffle.
- Streaming: actions are Play / Save, plus a disclosure line ("Streams from
  Apple Music. Nothing is stored on this iPhone.").
- Mixed: actions are Play / Download N (N = tracks not yet available
  locally), plus an on-device vs. stream-only count pair, and per-row format
  badge (FLAC/Lossless/320) with dimmed styling for stream-only rows.

### 6.12–6.14 Onboarding — Scan / Connect / Duplicates (12, 13, 14)
- 3-step first-run flow, gated behind a `localStorage` flag
  (`ferrite:onboarded`); shown once, replayable from a future Settings
  screen (not required for ship).
- Step 1 (Scan): local file count ticking up with a progress bar as files
  are read — this is real progress against the actual `FileList` being
  imported, not a fake timer, when the user arrives via "add files"; a
  scripted demo progression is acceptable when no files have been chosen
  yet (so the screen is still presentable standalone).
- Step 2 (Connect): Apple Music / Spotify cards with a Connect button
  (same mocked connect flow as Sources), Skip.
- Step 3 (Duplicates): pick the default duplicate-resolution rule ("Play my
  file" vs "Play the stream") — this seeds the "remember for all
  duplicates" preference from §6.5. "Open Library" finishes onboarding.

## 7. Cross-cutting requirements

- **Source badges & colors** are consistent everywhere a track/source is
  shown: Local `#2BD9C4`, Apple Music `#FF6B7E`, Spotify `#4BD98A`.
- **Ambient tint**: a soft radial glow behind artwork/content, color driven
  by a user-selectable "Ambient" setting (Dusk/Ocean/Ember, per the design's
  own editable prop) — cosmetic, not required for core flows to work.
- **44×44pt minimum tap targets**, focus-visible outlines on every
  interactive element (already encoded as a rule in the source design's
  CSS) — carry this into the real app's base styles.
- **No dead buttons**: every control either does something real (state
  change, navigation, playback) or is documented in this PRD as
  visual-only for this phase (Lyrics, AirPlay, filter chips, Merge-duplicates
  strategy picker).

## 8. Success criteria (phase 1)

- A user can: import a folder of local audio files, see them in Library,
  play one, see it in Now Playing with working transport, add more to a
  queue, reorder the queue, and see the Offline state correctly when the
  browser goes offline — all without a backend.
- Connecting Apple Music/Spotify (mocked) produces tracks that appear in
  Library/Search alongside Local ones, and a title+artist collision across
  two linked sources triggers the duplicate sheet exactly once (or is
  auto-resolved if "remember for all" is on).
- `npm run build`, `npm run lint`, and `npm run test` all pass — CI-ready,
  per project rules.

## 9. Phased rollout

- **Phase 1 (this plan):** Web app, real local playback, mocked Apple
  Music/Spotify connect + catalog. See `docs/ARCHITECTURE.md`.
- **Phase 2:** Real Apple Music (MusicKit JS) and Spotify (Web Playback
  SDK + Web API) integration behind the same `SourceConnector` interface
  defined in Phase 1 — swap the mock implementation, UI does not change.
- **Phase 3:** Packaging decision (PWA install vs. a native/Capacitor
  wrapper) revisited once Phase 2 integrations are real and a target
  platform (iOS App Store vs. installable web) is chosen.

## 10. Open questions

- Should "remember for all duplicates" be per-source-priority (e.g. always
  prefer Local) or per-track (remembers the exact past choice per title)?
  Phase 1 implements source-priority (simpler, matches the copy in 6.5/6.14).
- Filter chips (Downloaded, Weekly Mix, Saved albums, Recently added) need
  real semantics before they can do anything — deferred, tracked as a
  fast-follow in §6.1.
