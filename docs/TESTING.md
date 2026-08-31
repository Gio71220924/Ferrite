# Ferrite — Testing Strategy (Phase 1)

Referenced by `docs/ARCHITECTURE.md` §8. Principle: test what can actually
break (state transitions, merge/dedupe logic, engine wiring), not JSX that
can only fail to compile.

## 1. Tooling

- **Vitest** (`npm run test`) — shares Vite's TS/JSX transform, so no
  separate Babel/ts-jest config to keep in sync with the app.
- **`@testing-library/react`** + **`jsdom`** — render real components,
  query by role/text like a user would, not by CSS class.
- No E2E framework in Phase 1 — the whole app is one browser tab with no
  backend, so an RTL test that renders `<App/>` already covers most of what
  Playwright would buy us. Revisit if Phase 2 adds real OAuth redirects.

## 2. What gets a unit test (pure logic, no DOM)

| Module | Cases |
|---|---|
| `state/sourcesReducer` | connect → syncing state → connected; disconnect clears counts; prefs toggle no-ops when the pref is disabled (no linked streaming source). |
| `state/libraryReducer` | filter switches active list; importing local files appends tracks with object URLs; resolving a duplicate records the choice keyed by track-group. |
| `state/playbackReducer` | `PLAY_TRACK` sets queue+index+playing; `NEXT`/`PREV` wrap correctly at queue bounds; `REORDER` moves an item without losing the currently-playing one. |
| `lib/duplicates.ts` | two tracks with same title+artist, different source → one group of 2; three sources, one unique → no group; case/whitespace differences in title still match. |
| `audio/AudioEngine` | `load(url)` sets `audio.src`; `play()`/`pause()` call through; `timeupdate`/`ended` DOM events invoke the registered callbacks — tested against a real `Audio` element in jsdom (jsdom stubs playback but does dispatch these events on the element). |

## 3. What gets one RTL behavior test (not full coverage)

One test per screen, covering the interaction that has actual logic behind
it — not "renders without crashing," and not a test per button.

| Screen | The one thing tested |
|---|---|
| `Library` | Switching the source segment filters the visible track list; an empty filtered list shows the correct empty-state copy. |
| `Sources` | Clicking Connect on a service shows "Importing library…" then, after the mock delay resolves, shows the connected status line. |
| `Search` | Typing a query and switching scope changes which grouped results render. |
| `DuplicateSheet` | Picking a copy calls the resolve callback with that source; "remember for all" persists the toggle state up. |
| `Queue` | Reordering moves a row; Clear empties everything after now-playing. |
| `Album` | The action-button pair (Play/Shuffle vs Play/Save vs Play/Download N) matches the `variant` prop. |
| `Offline` (Library in offline mode) | Simulating an `offline` event disables non-Local segments and dims streaming rows. |
| `OnboardingFlow` | Skip and "Open Library" both set the `ferrite:onboarded` flag and unmount the flow. |

## 4. Non-goals

- No snapshot tests (they fail on every intentional style change and catch
  nothing semantic).
- No visual regression tooling in Phase 1 — manual check via
  `npm run dev` + browser against the design canvas is the acceptance bar
  for each screen's implementation task.
- No coverage percentage gate. A module with zero branches (a pure
  presentational component) does not need a test to hit a number.
