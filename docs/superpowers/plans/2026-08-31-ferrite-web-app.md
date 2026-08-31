# Ferrite Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 Ferrite web app — a React/TypeScript music-library app that merges Local files, Apple Music, and Spotify into one library, with real local audio playback, mocked streaming connectors, and duplicate resolution — matching the 14 screens in `ClaudeDesign/Ferrite.dc.html`.

**Architecture:** Vite + React 18 + TypeScript, client-only (no backend). Three domain contexts (`Sources`, `Library`, `Playback`) built on `useReducer`, a singleton `AudioEngine` wrapping `HTMLAudioElement`, and a `SourceConnector` interface so Phase-2 real integrations can replace the mocks without UI changes.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom v6, CSS Modules, lucide-react, Vitest + @testing-library/react + jsdom, ESLint.

**Spec:** `docs/PRD.md` (product spec, screen-by-screen) and `docs/ARCHITECTURE.md` (technical design this plan implements). Visual source of truth: `ClaudeDesign/Ferrite.dc.html`.

## Global Constraints

- No backend, no real OAuth — Apple Music/Spotify are mocked per `docs/ARCHITECTURE.md` §5 (PRD §4, §9).
- State: React Context + `useReducer` only — no Redux/Zustand/MobX (`docs/ARCHITECTURE.md` §1).
- Styling: CSS Modules + `src/styles/tokens.css` (ported CSS custom properties) — no Tailwind/styled-components (`docs/ARCHITECTURE.md` §1).
- Icons: `lucide-react` only, same icon names the design already uses (`docs/ARCHITECTURE.md` §1).
- Audio: native `HTMLAudioElement`, no playback library (`docs/ARCHITECTURE.md` §1, §6).
- Real playback applies only to tracks with a `fileUrl` (user-imported local files). Mocked-catalog tracks and demo album tracks have no `fileUrl` and use the position-tick approximation (`docs/ARCHITECTURE.md` §6) — this plan's CSS/JSX captures structure and token usage; exact pixel spacing is refined by comparing the running app against `ClaudeDesign/Ferrite.dc.html` in a browser during each task's manual-check step, not something the written-out JSX below needs to nail to the pixel.
- `npm run build` (`tsc --noEmit && vite build`), `npm run lint` (zero warnings), `npm run test` (`vitest run`) must all stay green — commit only on green (project rule: CI/CD-ready, no broken builds).
- Commit messages: lowercase, imperative, `type: description` format, no em dash, no `Co-authored-by` (project rule).

---

## File Structure

```
package.json  tsconfig.json  vite.config.ts  index.html  .eslintrc.cjs  .gitignore  README.md
public/
  favicon.svg
src/
  main.tsx  App.tsx
  styles/tokens.css  styles/reset.css
  types/track.ts
  data/mockLibrary.ts
  lib/duplicates.ts  lib/format.ts  lib/useOnlineStatus.ts
  services/sourceConnector.ts  services/mockAppleMusic.ts  services/mockSpotify.ts
  state/sourcesReducer.ts  state/SourcesContext.tsx
  state/libraryReducer.ts  state/LibraryContext.tsx
  state/playbackReducer.ts state/PlaybackContext.tsx
  audio/AudioEngine.ts
  app/AppShell.tsx  app/BottomTabBar.tsx
  components/FerriteMark.tsx  components/MiniPlayer.tsx  components/TrackRow.tsx
  components/DuplicateSheet.tsx  state/DuplicateSheetContext.tsx  lib/usePlayTrack.ts
  screens/Library.tsx  screens/NowPlaying.tsx  screens/Sources.tsx  screens/Search.tsx
  screens/Queue.tsx  screens/Album.tsx
  screens/onboarding/OnboardingFlow.tsx  screens/onboarding/ScanStep.tsx
  screens/onboarding/ConnectStep.tsx  screens/onboarding/DuplicatesStep.tsx
```

Each screen/component keeps its `.module.css` alongside it (e.g. `Library.tsx` + `Library.module.css`), tests alongside as `*.test.ts(x)`.

---

### Task 1: Project scaffold, tokens, README

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.eslintrc.cjs`, `.gitignore`, `README.md`
- Create: `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`
- Create: `src/styles/tokens.css`, `src/styles/reset.css`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: `npm run dev|build|lint|test` scripts every later task relies on; `src/styles/tokens.css` custom properties (`--l1`, `--l2`, `--tint`, `--paper`, `--card`, `--sep`, `--r-md`, `--r-lg`, `--f-text`, `--f-round`, `--t-large`...) every later component imports.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "ferrite",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^0.454.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "@vitejs/plugin-react": "^4.3.3",
    "eslint": "^8.57.1",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.13",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
});
```

Also create `src/setupTests.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Ferrite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 7: Write `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M50 1.5C87 1.5 98.5 13 98.5 50S87 98.5 50 98.5 1.5 87 1.5 50 13 1.5 50 1.5Z" fill="#1C1A24"/>
  <g transform="translate(9,9) scale(0.82)">
    <path fill-rule="evenodd" fill="#E4655C" d="M18 26H82a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H18A10 10 0 0 1 8 64V36a10 10 0 0 1 10-10ZM47 50a13 13 0 1 1-26 0 13 13 0 1 1 26 0ZM75 50a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z"/>
  </g>
</svg>
```

(Ported from `ClaudeDesign/Ferrite.dc.html` screen 08 — the icon's ground + cassette-shell path, Dusk accent.)

- [ ] **Step 8: Write `src/styles/tokens.css`** — ported verbatim from `ClaudeDesign/Ferrite.dc.html`'s `:root` block (lines 11-25):

```css
:root {
  --f-text: -apple-system, "SF Pro Text", system-ui, sans-serif;
  --f-round: ui-rounded, "SF Pro Rounded", -apple-system, system-ui, sans-serif;
  --f-mono: ui-monospace, Menlo, monospace;
  --t-large: 34px; --t-title: 26px; --t-body: 17px; --t-sub: 15px; --t-foot: 13px; --t-cap: 11px;
  --l1: #fff; --l2: rgba(235,235,245,.72); --l3: rgba(235,235,245,.55);
  --tint: #0A84FF; --danger: #FF453A; --on: #34C759; --local: #2BD9C4;
  --apple: #FF6B7E; --spotify: #4BD98A;
  --paper: #0B0A0E; --fill: rgba(120,120,128,.3); --sep: rgba(255,255,255,.09);
  --glass: rgba(255,255,255,.1); --glass-line: rgba(255,255,255,.16);
  --card: rgba(255,255,255,.045); --card-line: rgba(255,255,255,.08);
  --art: repeating-linear-gradient(135deg,#17181B 0 5px,#1F2024 5px 10px);
  --ease-out: cubic-bezier(.16,1,.3,1);
  --icon-ground: #1C1A24;
  --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-xl: 22px;
}
```

- [ ] **Step 9: Write `src/styles/reset.css`**

```css
html { background: #0a0a0c; }
body {
  margin: 0;
  background: #0a0a0c;
  font-family: var(--f-text);
  -webkit-font-smoothing: antialiased;
  color: var(--l1);
}
* { box-sizing: border-box; }
button { font: inherit; color: inherit; background: none; border: none; padding: 0; }
[data-tap] { cursor: pointer; }
[data-tap]:focus-visible { outline: 2px solid var(--tint); outline-offset: 2px; border-radius: 8px; }
```

- [ ] **Step 10: Write `src/App.tsx`**

```tsx
export function App() {
  return <div>Ferrite</div>;
}
```

- [ ] **Step 11: Write `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/reset.css';
import './styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 12: Write the failing test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the app name', () => {
    render(<App />);
    expect(screen.getByText('Ferrite')).toBeInTheDocument();
  });
});
```

- [ ] **Step 13: Install and verify**

Run: `npm install`
Run: `npm run test`
Expected: 1 passed.
Run: `npm run build`
Expected: exits 0, `dist/` produced.
Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 14: Write `README.md`**

```markdown
# Ferrite

One library across Local files, Apple Music, and Spotify. See `docs/PRD.md`
for the product spec and `docs/ARCHITECTURE.md` for the technical design.

## Run

    npm install
    npm run dev

## Test / build

    npm run test
    npm run lint
    npm run build

## Try the duplicate-resolution flow

1. `npm run dev`, open the app.
2. In Library, import a file named `Rosalind Ver - Midnight Ferry.mp3`
   (any small audio file renamed to that pattern works — filename parsing
   is `Artist - Title.ext`).
3. In Sources, connect Apple Music or Spotify (mocked, ~1.6s).
4. Tap the Midnight Ferry row in Library — the duplicate sheet opens
   showing the local copy alongside the connected service's copy.
```

- [ ] **Step 15: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html .eslintrc.cjs .gitignore README.md src public
git commit -m "chore: scaffold vite react ts project with design tokens"
```

---

### Task 2: Data model and mock library

**Files:**
- Create: `src/types/track.ts`
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`
- Create: `src/data/mockLibrary.ts`, `src/data/mockLibrary.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Track`, `Source`, `Album` types; `formatDuration(sec): string`; `appleMusicCatalog`, `spotifyCatalog`, `albums`, `albumTracks` used by every later task that renders tracks.

- [ ] **Step 1: Write `src/types/track.ts`**

```ts
export type Source = 'Local' | 'Apple Music' | 'Spotify';

export interface Track {
  id: string;
  title: string;
  artist: string;
  source: Source;
  durationSec: number;
  format?: string;
  albumId?: string;
  fileUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  variant: 'local' | 'streaming' | 'mixed';
  year: number;
  trackIds: string[];
  sizeLabel?: string;
}
```

- [ ] **Step 2: Write the failing test `src/lib/format.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { formatDuration } from './format';

describe('formatDuration', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(244)).toBe('4:04');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(0)).toBe('0:00');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- format.test.ts`
Expected: FAIL, `formatDuration` not defined.

- [ ] **Step 4: Write `src/lib/format.ts`**

```ts
export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- format.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `src/data/mockLibrary.ts`** (ported from `ClaudeDesign/Ferrite.dc.html`'s `SEARCH`/album mock data, `mm:ss` converted to seconds)

```ts
import type { Track, Album } from '../types/track';

export const appleMusicCatalog: Track[] = [
  { id: 'am-1', title: 'Slow Static', artist: 'The Harbour Lights', source: 'Apple Music', durationSec: 221, format: 'Lossless' },
  { id: 'am-2', title: 'Weather Systems', artist: 'Junia', source: 'Apple Music', durationSec: 380, format: 'Lossless' },
  { id: 'am-3', title: 'Midsummer Static', artist: 'The Harbour Lights', source: 'Apple Music', durationSec: 221, format: 'Lossless' },
  { id: 'am-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless 24/48' },
  { id: 'am-5', title: 'Midnight Ferry (Live)', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless' },
];

export const spotifyCatalog: Track[] = [
  { id: 'sp-1', title: 'Pale Blue Hours', artist: 'Nima Okonkwo', source: 'Spotify', durationSec: 312, format: 'OGG 320' },
  { id: 'sp-2', title: 'Nightbus', artist: 'Ferrograph', source: 'Spotify', durationSec: 206, format: 'OGG 320' },
  { id: 'sp-3', title: 'Midway', artist: 'Ferrograph', source: 'Spotify', durationSec: 206, format: 'OGG 320' },
  { id: 'sp-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Spotify', durationSec: 278, format: 'OGG 320' },
  { id: 'sp-5', title: 'Midnight Ferry — Slowed', artist: 'lo-fi archive', source: 'Spotify', durationSec: 302, format: 'OGG 320' },
];

export const albums: Album[] = [
  { id: 'alb-harbour-tapes', title: 'Harbour Tapes', artist: 'Rosalind Ver', variant: 'local', year: 2019, sizeLabel: '512 MB',
    trackIds: ['ht-1', 'ht-2', 'ht-3', 'ht-4', 'ht-5', 'ht-6'] },
  { id: 'alb-weather-systems', title: 'Weather Systems', artist: 'Junia', variant: 'streaming', year: 2021,
    trackIds: ['ws-1', 'ws-2', 'ws-3', 'ws-4', 'ws-5', 'ws-6'] },
  { id: 'alb-nightbus-sessions', title: 'Nightbus Sessions', artist: 'Ferrograph', variant: 'mixed', year: 2022,
    trackIds: ['ns-1', 'ns-2', 'ns-3', 'ns-4', 'ns-5', 'ns-6'] },
];

export const albumTracks: Record<string, Track> = {
  'ht-1': { id: 'ht-1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-2': { id: 'ht-2', title: 'Cassette Sunday', artist: 'Rosalind Ver', source: 'Local', durationSec: 178, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-3': { id: 'ht-3', title: 'Low Tide', artist: 'Rosalind Ver', source: 'Local', durationSec: 202, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-4': { id: 'ht-4', title: 'Harbour Lights', artist: 'Rosalind Ver', source: 'Local', durationSec: 301, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-5': { id: 'ht-5', title: 'Saltwater', artist: 'Rosalind Ver', source: 'Local', durationSec: 224, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ht-6': { id: 'ht-6', title: 'Ferry Home', artist: 'Rosalind Ver', source: 'Local', durationSec: 372, format: 'FLAC 24/96', albumId: 'alb-harbour-tapes' },
  'ws-1': { id: 'ws-1', title: 'Weather Systems', artist: 'Junia', source: 'Apple Music', durationSec: 380, albumId: 'alb-weather-systems' },
  'ws-2': { id: 'ws-2', title: 'Barometer', artist: 'Junia', source: 'Apple Music', durationSec: 238, albumId: 'alb-weather-systems' },
  'ws-3': { id: 'ws-3', title: 'Cold Front', artist: 'Junia', source: 'Apple Music', durationSec: 271, albumId: 'alb-weather-systems' },
  'ws-4': { id: 'ws-4', title: 'Anticyclone', artist: 'Junia', source: 'Apple Music', durationSec: 309, albumId: 'alb-weather-systems' },
  'ws-5': { id: 'ws-5', title: 'Still Air', artist: 'Junia', source: 'Apple Music', durationSec: 167, albumId: 'alb-weather-systems' },
  'ws-6': { id: 'ws-6', title: 'After Rain', artist: 'Junia', source: 'Apple Music', durationSec: 423, albumId: 'alb-weather-systems' },
  'ns-1': { id: 'ns-1', title: 'Nightbus', artist: 'Ferrograph', source: 'Local', durationSec: 206, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-2': { id: 'ns-2', title: 'Depot', artist: 'Ferrograph', source: 'Local', durationSec: 252, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-3': { id: 'ns-3', title: 'Last Service', artist: 'Ferrograph', source: 'Spotify', durationSec: 230, format: 'Lossless', albumId: 'alb-nightbus-sessions' },
  'ns-4': { id: 'ns-4', title: 'Terminus', artist: 'Ferrograph', source: 'Local', durationSec: 333, format: 'FLAC', albumId: 'alb-nightbus-sessions' },
  'ns-5': { id: 'ns-5', title: 'Night Shift', artist: 'Ferrograph', source: 'Spotify', durationSec: 247, format: '320', albumId: 'alb-nightbus-sessions' },
  'ns-6': { id: 'ns-6', title: 'First Light', artist: 'Ferrograph', source: 'Spotify', durationSec: 404, format: 'Lossless', albumId: 'alb-nightbus-sessions' },
};
```

- [ ] **Step 7: Write the failing test `src/data/mockLibrary.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { appleMusicCatalog, spotifyCatalog, albums, albumTracks } from './mockLibrary';

describe('mockLibrary', () => {
  it('seeds a Midnight Ferry / Rosalind Ver duplicate on both streaming catalogs, for the duplicate-sheet demo', () => {
    expect(appleMusicCatalog.some(t => t.title === 'Midnight Ferry' && t.artist === 'Rosalind Ver')).toBe(true);
    expect(spotifyCatalog.some(t => t.title === 'Midnight Ferry' && t.artist === 'Rosalind Ver')).toBe(true);
  });

  it('every album trackId resolves to a track tagged with that album', () => {
    for (const album of albums) {
      for (const id of album.trackIds) {
        expect(albumTracks[id]?.albumId).toBe(album.id);
      }
    }
  });
});
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test -- mockLibrary.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/types/track.ts src/lib/format.ts src/lib/format.test.ts src/data/mockLibrary.ts src/data/mockLibrary.test.ts
git commit -m "feat: add track/album types and mock catalog data"
```

---

### Task 3: Duplicate detection

**Files:**
- Create: `src/lib/duplicates.ts`, `src/lib/duplicates.test.ts`

**Interfaces:**
- Consumes: `Track` from `src/types/track.ts` (Task 2).
- Produces: `keyOf(track)`, `findDuplicates(tracks): Map<string, Track[]>` used by Task 13 (`usePlayTrack`).

- [ ] **Step 1: Write the failing test `src/lib/duplicates.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { keyOf, findDuplicates } from './duplicates';
import type { Track } from '../types/track';

const t = (over: Partial<Track>): Track => ({
  id: over.id ?? 'x', title: 'Midnight Ferry', artist: 'Rosalind Ver',
  source: 'Local', durationSec: 244, ...over,
});

describe('duplicates', () => {
  it('keys are case- and whitespace-insensitive', () => {
    expect(keyOf({ title: ' Midnight Ferry ', artist: 'Rosalind Ver' }))
      .toBe(keyOf({ title: 'midnight ferry', artist: 'rosalind ver' }));
  });

  it('groups same title+artist across sources', () => {
    const tracks = [
      t({ id: 'a', source: 'Local' }),
      t({ id: 'b', source: 'Apple Music' }),
      t({ id: 'c', title: 'Unrelated Song' }),
    ];
    const groups = findDuplicates(tracks);
    expect(groups.size).toBe(1);
    expect([...groups.values()][0]).toHaveLength(2);
  });

  it('does not group a track that only appears once', () => {
    const tracks = [t({ id: 'a' })];
    expect(findDuplicates(tracks).size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- duplicates.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/lib/duplicates.ts`**

```ts
import type { Track } from '../types/track';

export function keyOf(t: Pick<Track, 'title' | 'artist'>): string {
  return `${t.title.trim().toLowerCase()} ${t.artist.trim().toLowerCase()}`;
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- duplicates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/duplicates.ts src/lib/duplicates.test.ts
git commit -m "feat: add title+artist duplicate detection"
```

---

### Task 4: State layer — Sources, Library, Playback contexts

**Files:**
- Create: `src/state/sourcesReducer.ts`, `src/state/sourcesReducer.test.ts`, `src/state/SourcesContext.tsx`
- Create: `src/state/libraryReducer.ts`, `src/state/libraryReducer.test.ts`, `src/state/LibraryContext.tsx`
- Create: `src/state/playbackReducer.ts`, `src/state/playbackReducer.test.ts`, `src/state/PlaybackContext.tsx`

**Interfaces:**
- Consumes: `Track`, `Source` (Task 2).
- Produces: `useSources()`, `useLibrary()`, `usePlayback()` hooks and their action creators, consumed by every screen task (7 onward).

- [ ] **Step 1: Write the failing test `src/state/sourcesReducer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sourcesReducer, initialSourcesState } from './sourcesReducer';

describe('sourcesReducer', () => {
  it('connect starts syncing then completes on CONNECT_DONE', () => {
    let s = sourcesReducer(initialSourcesState, { type: 'CONNECT_START', key: 'apple' });
    expect(s.syncing).toBe('apple');
    expect(s.apple).toBe(false);
    s = sourcesReducer(s, { type: 'CONNECT_DONE', key: 'apple' });
    expect(s.syncing).toBeNull();
    expect(s.apple).toBe(true);
  });

  it('disconnect clears the linked flag', () => {
    const connected = { ...initialSourcesState, apple: true };
    const s = sourcesReducer(connected, { type: 'DISCONNECT', key: 'apple' });
    expect(s.apple).toBe(false);
  });

  it('SET_PREF toggles a preference', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_PREF', key: 'wifiOnly' });
    expect(s.prefs.wifiOnly).toBe(!initialSourcesState.prefs.wifiOnly);
  });

  it('SET_REMEMBER_DUPLICATES sets the flag explicitly', () => {
    const s = sourcesReducer(initialSourcesState, { type: 'SET_REMEMBER_DUPLICATES', value: true });
    expect(s.rememberDuplicates).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- sourcesReducer.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/state/sourcesReducer.ts`**

```ts
export type StreamingKey = 'apple' | 'spotify';

export interface SourcesState {
  apple: boolean;
  spotify: boolean;
  syncing: StreamingKey | null;
  prefs: { wifiOnly: boolean; preferLocal: boolean; cacheOffline: boolean };
  rememberDuplicates: boolean;
}

export const initialSourcesState: SourcesState = {
  apple: false,
  spotify: false,
  syncing: null,
  prefs: { wifiOnly: true, preferLocal: false, cacheOffline: true },
  rememberDuplicates: false,
};

export type SourcesAction =
  | { type: 'CONNECT_START'; key: StreamingKey }
  | { type: 'CONNECT_DONE'; key: StreamingKey }
  | { type: 'DISCONNECT'; key: StreamingKey }
  | { type: 'SET_PREF'; key: keyof SourcesState['prefs'] }
  | { type: 'SET_REMEMBER_DUPLICATES'; value: boolean };

export function sourcesReducer(state: SourcesState, action: SourcesAction): SourcesState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, syncing: action.key, [action.key]: false };
    case 'CONNECT_DONE':
      return { ...state, syncing: null, [action.key]: true };
    case 'DISCONNECT':
      return { ...state, [action.key]: false, syncing: state.syncing === action.key ? null : state.syncing };
    case 'SET_PREF':
      return { ...state, prefs: { ...state.prefs, [action.key]: !state.prefs[action.key] } };
    case 'SET_REMEMBER_DUPLICATES':
      return { ...state, rememberDuplicates: action.value };
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- sourcesReducer.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/state/SourcesContext.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { sourcesReducer, initialSourcesState, type SourcesState, type SourcesAction } from './sourcesReducer';

const SourcesContext = createContext<{ state: SourcesState; dispatch: React.Dispatch<SourcesAction> } | null>(null);

export function SourcesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sourcesReducer, initialSourcesState);
  return <SourcesContext.Provider value={{ state, dispatch }}>{children}</SourcesContext.Provider>;
}

export function useSources() {
  const ctx = useContext(SourcesContext);
  if (!ctx) throw new Error('useSources must be used within SourcesProvider');
  return ctx;
}
```

- [ ] **Step 6: Write the failing test `src/state/libraryReducer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { libraryReducer, initialLibraryState } from './libraryReducer';
import type { Track } from '../types/track';

const localTrack: Track = { id: 'l1', title: 'A', artist: 'B', source: 'Local', durationSec: 100, fileUrl: 'blob:1' };

describe('libraryReducer', () => {
  it('SET_FILTER changes the active filter', () => {
    const s = libraryReducer(initialLibraryState, { type: 'SET_FILTER', filter: 'Local' });
    expect(s.filter).toBe('Local');
  });

  it('IMPORT_LOCAL_FILES appends tracks', () => {
    const s = libraryReducer(initialLibraryState, { type: 'IMPORT_LOCAL_FILES', tracks: [localTrack] });
    expect(s.localTracks).toEqual([localTrack]);
  });

  it('RESOLVE_DUPLICATE records a choice keyed by the group key', () => {
    const s = libraryReducer(initialLibraryState, { type: 'RESOLVE_DUPLICATE', key: 'a b', source: 'Local' });
    expect(s.duplicateChoice['a b']).toBe('Local');
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm run test -- libraryReducer.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 8: Write `src/state/libraryReducer.ts`**

```ts
import type { Track, Source } from '../types/track';

export interface LibraryState {
  localTracks: Track[];
  filter: Source | 'All';
  duplicateChoice: Record<string, Source>;
}

export const initialLibraryState: LibraryState = {
  localTracks: [],
  filter: 'All',
  duplicateChoice: {},
};

export type LibraryAction =
  | { type: 'SET_FILTER'; filter: Source | 'All' }
  | { type: 'IMPORT_LOCAL_FILES'; tracks: Track[] }
  | { type: 'RESOLVE_DUPLICATE'; key: string; source: Source };

export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    case 'IMPORT_LOCAL_FILES':
      return { ...state, localTracks: [...state.localTracks, ...action.tracks] };
    case 'RESOLVE_DUPLICATE':
      return { ...state, duplicateChoice: { ...state.duplicateChoice, [action.key]: action.source } };
    default:
      return state;
  }
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm run test -- libraryReducer.test.ts`
Expected: PASS.

- [ ] **Step 10: Write `src/state/LibraryContext.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { libraryReducer, initialLibraryState, type LibraryState, type LibraryAction } from './libraryReducer';

const LibraryContext = createContext<{ state: LibraryState; dispatch: React.Dispatch<LibraryAction> } | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, initialLibraryState);
  return <LibraryContext.Provider value={{ state, dispatch }}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
```

- [ ] **Step 11: Write the failing test `src/state/playbackReducer.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { playbackReducer, initialPlaybackState } from './playbackReducer';

describe('playbackReducer', () => {
  it('PLAY_TRACK sets queue, index and playing', () => {
    const s = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 1 });
    expect(s.queue).toEqual(['a', 'b']);
    expect(s.currentIndex).toBe(1);
    expect(s.playing).toBe(true);
  });

  it('NEXT wraps to 0 at the end of the queue', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 1 });
    const s = playbackReducer(started, { type: 'NEXT' });
    expect(s.currentIndex).toBe(0);
  });

  it('PREV wraps to the last index from 0', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b'], index: 0 });
    const s = playbackReducer(started, { type: 'PREV' });
    expect(s.currentIndex).toBe(1);
  });

  it('REORDER moves an item and keeps currentIndex pointed at the same track', () => {
    const started = playbackReducer(initialPlaybackState, { type: 'PLAY_TRACK', trackIds: ['a', 'b', 'c'], index: 0 });
    const s = playbackReducer(started, { type: 'REORDER', from: 2, to: 1 });
    expect(s.queue).toEqual(['a', 'c', 'b']);
    expect(s.queue[s.currentIndex]).toBe('a');
  });

  it('TOGGLE_PLAY flips playing', () => {
    const s = playbackReducer(initialPlaybackState, { type: 'TOGGLE_PLAY' });
    expect(s.playing).toBe(true);
  });
});
```

- [ ] **Step 12: Run test to verify it fails**

Run: `npm run test -- playbackReducer.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 13: Write `src/state/playbackReducer.ts`**

```ts
export interface PlaybackState {
  queue: string[];
  currentIndex: number;
  playing: boolean;
  positionSec: number;
  volume: number;
}

export const initialPlaybackState: PlaybackState = {
  queue: [],
  currentIndex: 0,
  playing: false,
  positionSec: 0,
  volume: 0.7,
};

export type PlaybackAction =
  | { type: 'PLAY_TRACK'; trackIds: string[]; index: number }
  | { type: 'ENQUEUE'; trackId: string }
  | { type: 'REORDER'; from: number; to: number }
  | { type: 'CLEAR_UPCOMING' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SEEK'; positionSec: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'TICK'; positionSec: number };

export function playbackReducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case 'PLAY_TRACK':
      return { ...state, queue: action.trackIds, currentIndex: action.index, playing: true, positionSec: 0 };
    case 'ENQUEUE':
      return { ...state, queue: [...state.queue, action.trackId] };
    case 'REORDER': {
      const queue = [...state.queue];
      const currentId = queue[state.currentIndex];
      const [moved] = queue.splice(action.from, 1);
      queue.splice(action.to, 0, moved);
      return { ...state, queue, currentIndex: queue.indexOf(currentId) };
    }
    case 'CLEAR_UPCOMING':
      return { ...state, queue: state.queue.slice(0, state.currentIndex + 1) };
    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing };
    case 'SEEK':
      return { ...state, positionSec: action.positionSec };
    case 'NEXT':
      return { ...state, currentIndex: (state.currentIndex + 1) % Math.max(state.queue.length, 1), positionSec: 0 };
    case 'PREV':
      return { ...state, currentIndex: (state.currentIndex - 1 + state.queue.length) % Math.max(state.queue.length, 1), positionSec: 0 };
    case 'TICK':
      return { ...state, positionSec: action.positionSec };
    default:
      return state;
  }
}
```

- [ ] **Step 14: Run test to verify it passes**

Run: `npm run test -- playbackReducer.test.ts`
Expected: PASS.

- [ ] **Step 15: Write `src/state/PlaybackContext.tsx`**

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { playbackReducer, initialPlaybackState, type PlaybackState, type PlaybackAction } from './playbackReducer';

const PlaybackContext = createContext<{ state: PlaybackState; dispatch: React.Dispatch<PlaybackAction> } | null>(null);

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  return <PlaybackContext.Provider value={{ state, dispatch }}>{children}</PlaybackContext.Provider>;
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
}
```

- [ ] **Step 16: Commit**

```bash
git add src/state
git commit -m "feat: add sources, library and playback state contexts"
```

---

### Task 5: Mocked source connectors

**Files:**
- Create: `src/services/sourceConnector.ts`
- Create: `src/services/mockAppleMusic.ts`, `src/services/mockSpotify.ts`, `src/services/mockConnectors.test.ts`

**Interfaces:**
- Consumes: `Track` (Task 2), `appleMusicCatalog`/`spotifyCatalog` (Task 2).
- Produces: `SourceConnector` interface, `appleMusicConnector`, `spotifyConnector` used by Task 11 (Sources screen) and Task 16 (onboarding ConnectStep).

- [ ] **Step 1: Write `src/services/sourceConnector.ts`**

```ts
import type { Track } from '../types/track';

export interface SourceConnector {
  connect(): Promise<{ trackCount: number; playlistCount: number }>;
  disconnect(): void;
  catalog(): Track[];
}
```

- [ ] **Step 2: Write the failing test `src/services/mockConnectors.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appleMusicConnector } from './mockAppleMusic';
import { spotifyConnector } from './mockSpotify';

describe('mock connectors', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('appleMusicConnector resolves after the mock delay with counts', async () => {
    const p = appleMusicConnector.connect();
    await vi.advanceTimersByTimeAsync(1600);
    await expect(p).resolves.toEqual({ trackCount: 812, playlistCount: 24 });
  });

  it('spotifyConnector resolves after the mock delay with counts', async () => {
    const p = spotifyConnector.connect();
    await vi.advanceTimersByTimeAsync(1600);
    await expect(p).resolves.toEqual({ trackCount: 1140, playlistCount: 31 });
  });

  it('catalog() returns the mock streaming tracks', () => {
    expect(appleMusicConnector.catalog().length).toBeGreaterThan(0);
    expect(spotifyConnector.catalog().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- mockConnectors.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 4: Write `src/services/mockAppleMusic.ts`**

```ts
import type { SourceConnector } from './sourceConnector';
import { appleMusicCatalog } from '../data/mockLibrary';

export const appleMusicConnector: SourceConnector = {
  connect() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ trackCount: 812, playlistCount: 24 }), 1600);
    });
  },
  disconnect() {},
  catalog() {
    return appleMusicCatalog;
  },
};
```

- [ ] **Step 5: Write `src/services/mockSpotify.ts`**

```ts
import type { SourceConnector } from './sourceConnector';
import { spotifyCatalog } from '../data/mockLibrary';

export const spotifyConnector: SourceConnector = {
  connect() {
    return new Promise(resolve => {
      setTimeout(() => resolve({ trackCount: 1140, playlistCount: 31 }), 1600);
    });
  },
  disconnect() {},
  catalog() {
    return spotifyCatalog;
  },
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- mockConnectors.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/services
git commit -m "feat: add mocked apple music and spotify connectors"
```

---

### Task 6: Audio engine

**Files:**
- Create: `src/audio/AudioEngine.ts`, `src/audio/AudioEngine.test.ts`

**Interfaces:**
- Consumes: nothing (wraps the browser's native `Audio`).
- Produces: `AudioEngine` class (`load`, `play`, `pause`, `seek`, `setVolume`, `onTick`, `onEnded`) used by Task 7/17 (`AppShell`/`App`, where the singleton is created and wired to `PlaybackContext`).

- [ ] **Step 1: Write the failing test `src/audio/AudioEngine.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';

describe('AudioEngine', () => {
  it('load sets the underlying audio src', () => {
    const engine = new AudioEngine();
    engine.load('blob:fake-url');
    expect(engine.getSrc()).toContain('blob:fake-url');
  });

  it('play calls through to HTMLMediaElement.play', () => {
    const engine = new AudioEngine();
    const spy = vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue();
    engine.play();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('pause calls through to HTMLMediaElement.pause', () => {
    const engine = new AudioEngine();
    const spy = vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    engine.pause();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('onEnded fires when the underlying element dispatches "ended"', () => {
    const engine = new AudioEngine();
    const onEnded = vi.fn();
    engine.onEnded = onEnded;
    engine.getElementForTest().dispatchEvent(new Event('ended'));
    expect(onEnded).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- AudioEngine.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write `src/audio/AudioEngine.ts`**

```ts
export class AudioEngine {
  private audio = new Audio();
  onTick?: (sec: number) => void;
  onEnded?: () => void;

  constructor() {
    this.audio.addEventListener('timeupdate', () => this.onTick?.(this.audio.currentTime));
    this.audio.addEventListener('ended', () => this.onEnded?.());
  }

  load(url: string) {
    this.audio.src = url;
  }

  play() {
    void this.audio.play();
  }

  pause() {
    this.audio.pause();
  }

  seek(sec: number) {
    this.audio.currentTime = sec;
  }

  setVolume(v: number) {
    this.audio.volume = v;
  }

  getSrc() {
    return this.audio.src;
  }

  /** Test-only escape hatch to dispatch native events at the element. */
  getElementForTest() {
    return this.audio;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- AudioEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio
git commit -m "feat: add audio engine wrapping html audio element"
```

---

### Task 7: App shell — providers, routing, bottom tab bar, icon

**Files:**
- Create: `src/components/FerriteMark.tsx`
- Create: `src/app/BottomTabBar.tsx`, `src/app/BottomTabBar.module.css`
- Create: `src/app/AppShell.tsx`, `src/app/AppShell.test.tsx`
- Modify: `src/App.tsx` (replace Task 1 placeholder)
- Modify: `src/App.test.tsx` (replace Task 1 smoke test)

**Interfaces:**
- Consumes: `SourcesProvider`/`LibraryProvider`/`PlaybackProvider` (Task 4).
- Produces: `<FerriteMark size?/>` component used by Task 15/16 (onboarding) and Task 8 (MiniPlayer); route outlet other screen tasks render into. (This task's `AppShell`/`App.tsx` are rewritten again in Task 17 once every screen exists — the version here is a working intermediate checkpoint, not throwaway: it stays green with `npm run build`/`test` at every step.)

- [ ] **Step 1: Write `src/components/FerriteMark.tsx`** (ported from the icon path in `ClaudeDesign/Ferrite.dc.html` screen 08, lines 503-521)

```tsx
export function FerriteMark({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Ferrite mark">
      <g transform="translate(9,9) scale(0.82)">
        <path
          fillRule="evenodd"
          fill={color}
          d="M18 26H82a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H18A10 10 0 0 1 8 64V36a10 10 0 0 1 10-10ZM47 50a13 13 0 1 1-26 0 13 13 0 1 1 26 0ZM75 50a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z"
        />
      </g>
    </svg>
  );
}
```

- [ ] **Step 2: Write `src/app/BottomTabBar.module.css`**

```css
.bar {
  position: fixed; left: 0; right: 0; bottom: 0; height: 88px;
  padding: 12px 34px 0; display: flex; justify-content: space-between;
  background: linear-gradient(to top, rgba(10,9,14,.9), rgba(10,9,14,0));
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--card-line);
}
.tab {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  min-width: 52px; color: var(--l2); font: 500 10.5px var(--f-text);
  text-decoration: none;
}
.tabActive { color: var(--tint); }
```

- [ ] **Step 3: Write `src/app/BottomTabBar.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { Library, Search, Plug } from 'lucide-react';
import styles from './BottomTabBar.module.css';

const TABS = [
  { to: '/', label: 'Library', Icon: Library },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/sources', label: 'Sources', Icon: Plug },
];

export function BottomTabBar() {
  return (
    <nav className={styles.bar}>
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Write the failing test `src/app/AppShell.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './AppShell';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider } from '../state/PlaybackContext';

function renderShell() {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <PlaybackProvider>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<div>Library screen</div>} />
                <Route path="search" element={<div>Search screen</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </PlaybackProvider>
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('AppShell', () => {
  it('navigates between tabs', async () => {
    renderShell();
    expect(screen.getByText('Library screen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /search/i }));
    expect(screen.getByText('Search screen')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test -- AppShell.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 6: Write `src/app/AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

export function AppShell() {
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 88 }}>
      <Outlet />
      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- AppShell.test.tsx`
Expected: PASS.

- [ ] **Step 8: Replace `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SourcesProvider } from './state/SourcesContext';
import { LibraryProvider } from './state/LibraryContext';
import { PlaybackProvider } from './state/PlaybackContext';
import { AppShell } from './app/AppShell';

export function App() {
  return (
    <SourcesProvider>
      <LibraryProvider>
        <PlaybackProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<div>Library screen (Task 9)</div>} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PlaybackProvider>
      </LibraryProvider>
    </SourcesProvider>
  );
}
```

- [ ] **Step 9: Replace `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the library tab by default', () => {
    render(<App />);
    expect(screen.getByText(/Library screen/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 10: Run full test suite and build**

Run: `npm run test`
Expected: all pass.
Run: `npm run build && npm run lint`
Expected: both exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/components/FerriteMark.tsx src/app src/App.tsx src/App.test.tsx
git commit -m "feat: add app shell with tab navigation and ferrite mark"
```

---

### Task 8: TrackRow and MiniPlayer

**Files:**
- Create: `src/components/TrackRow.tsx`, `src/components/TrackRow.module.css`
- Create: `src/components/MiniPlayer.tsx`, `src/components/MiniPlayer.module.css`, `src/components/MiniPlayer.test.tsx`

**Interfaces:**
- Consumes: `usePlayback()` (Task 4) — this task only dispatches `TOGGLE_PLAY`; `AudioEngine` wiring lands in Task 17.
- Produces: `<TrackRow track playing? onClick/>` reused by Library/Search/Album/Queue tasks (9-16); `<MiniPlayer track onOpen/>` wired into `AppShell` in Task 17.

- [ ] **Step 1: Write `src/components/TrackRow.module.css`**

```css
.row {
  display: flex; align-items: center; gap: 13px; padding: 0 22px;
  cursor: pointer; background: transparent; width: 100%; text-align: left;
  transition: background .15s var(--ease-out);
}
.row:hover { background: rgba(255,255,255,.04); }
.row:active { background: rgba(255,255,255,.08); }
.art {
  width: 46px; height: 46px; border-radius: 9px; flex: none;
  border: 1px solid var(--card-line); background: var(--art);
}
.body {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px;
  min-height: 44px; padding: 11px 0; border-bottom: 1px solid var(--sep);
}
.title { font: 400 var(--t-body) var(--f-text); color: var(--l1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font: 400 var(--t-foot) var(--f-text); color: var(--l2); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dur { font: 400 var(--t-foot) var(--f-mono); color: var(--l3); flex: none; }
```

- [ ] **Step 2: Write `src/components/TrackRow.tsx`**

```tsx
import type { Track } from '../types/track';
import { formatDuration } from '../lib/format';
import styles from './TrackRow.module.css';

export function TrackRow({ track, onClick, sub }: { track: Track; onClick: () => void; sub?: string }) {
  return (
    <button className={styles.row} onClick={onClick} data-tap>
      <div className={styles.art} />
      <div className={styles.body}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.title}>{track.title}</div>
          <div className={styles.sub}>{sub ?? `${track.artist} · ${track.source}`}</div>
        </div>
        <div className={styles.dur}>{formatDuration(track.durationSec)}</div>
      </div>
    </button>
  );
}
```

- [ ] **Step 3: Write `src/components/MiniPlayer.module.css`**

```css
.bar {
  position: fixed; left: 18px; right: 18px; bottom: 96px; z-index: 5;
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border-radius: 20px; background: var(--glass); border: 1px solid var(--glass-line);
  backdrop-filter: blur(34px) saturate(180%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.2), 0 22px 48px rgba(0,0,0,.55);
}
.art { width: 40px; height: 40px; border-radius: var(--r-sm); flex: none; border: 1px solid var(--card-line); background: var(--art); }
.info { flex: 1; min-width: 0; }
.title { font: 400 var(--t-sub) var(--f-text); color: var(--l1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font: 400 var(--t-foot) var(--f-text); color: var(--l2); margin-top: 2px; }
.toggle {
  width: 36px; height: 36px; border-radius: 18px; flex: none;
  background: rgba(255,255,255,.14); display: flex; align-items: center; justify-content: center;
}
```

- [ ] **Step 4: Write the failing test `src/components/MiniPlayer.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MiniPlayer } from './MiniPlayer';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const track: Track = { id: 't1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 };

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: [track.id], index: 0 })}>start</button>
      <MiniPlayer track={track} />
    </>
  );
}

describe('MiniPlayer', () => {
  it('toggles play/pause state when tapped', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test -- MiniPlayer.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 6: Write `src/components/MiniPlayer.tsx`**

```tsx
import { Play, Pause } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';
import styles from './MiniPlayer.module.css';

export function MiniPlayer({ track, onOpen }: { track: Track; onOpen?: () => void }) {
  const { state, dispatch } = usePlayback();
  return (
    <div className={styles.bar}>
      <button className={styles.art} onClick={onOpen} aria-label="Open now playing" data-tap />
      <div className={styles.info} onClick={onOpen}>
        <div className={styles.title}>{track.title}</div>
        <div className={styles.sub}>{track.artist} · {track.source}</div>
      </div>
      <button
        className={styles.toggle}
        onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
        aria-label={state.playing ? 'Pause' : 'Play'}
        data-tap
      >
        {state.playing ? <Pause size={17} /> : <Play size={17} />}
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- MiniPlayer.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/TrackRow.tsx src/components/TrackRow.module.css src/components/MiniPlayer.tsx src/components/MiniPlayer.module.css src/components/MiniPlayer.test.tsx
git commit -m "feat: add track row and mini player components"
```

---

### Task 9: Library screen (with offline mode)

**Files:**
- Create: `src/lib/useOnlineStatus.ts`
- Create: `src/screens/Library.tsx`, `src/screens/Library.module.css`, `src/screens/Library.test.tsx`

**Interfaces:**
- Consumes: `useLibrary()`, `useSources()` (Task 4), `TrackRow` (Task 8), `appleMusicCatalog`/`spotifyCatalog` (Task 2, via the connectors' `.catalog()`).
- Produces: `useOnlineStatus()` hook, reused verbatim wherever online/offline matters.

- [ ] **Step 1: Write `src/lib/useOnlineStatus.ts`**

```ts
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return online;
}
```

- [ ] **Step 2: Write `src/screens/Library.module.css`**

```css
.page { padding: 62px 0 178px; }
.header { display: flex; align-items: flex-end; justify-content: space-between; padding: 8px 22px 18px; }
.title { font: 700 var(--t-large)/1.05 var(--f-round); letter-spacing: -.022em; margin: 0; color: var(--l1); }
.segment { margin: 0 18px 22px; padding: 2px; display: flex; border-radius: 9px; background: var(--fill); }
.segBtn { flex: 1; text-align: center; padding: 7px 2px; border-radius: 7px; font: 590 var(--t-foot) var(--f-text); color: var(--l2); }
.segBtnActive { background: rgba(235,235,245,.26); color: #fff; }
.segBtnDisabled { color: rgba(235,235,245,.28); cursor: not-allowed; }
.sectionLabel { font: 400 var(--t-foot) var(--f-text); color: var(--l2); padding: 0 22px 6px; display: flex; justify-content: space-between; }
.empty { margin: 12px 22px 0; padding: 28px 20px; border-radius: var(--r-lg); border: 1px dashed var(--card-line); text-align: center; }
.emptyTitle { font: 590 var(--t-body) var(--f-text); color: var(--l1); }
.emptyBody { font: 400 var(--t-foot)/1.4 var(--f-text); color: var(--l2); margin-top: 6px; }
.offlineBanner { margin: 0 18px 18px; display: flex; align-items: center; gap: 11px; padding: 13px 15px; border-radius: var(--r-lg); background: rgba(255,255,255,.05); border: 1px solid var(--card-line); }
```

- [ ] **Step 3: Write the failing test `src/screens/Library.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Library } from './Library';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';

function renderLibrary() {
  return render(
    <SourcesProvider>
      <LibraryProvider>
        <Library onPlay={() => {}} />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('Library', () => {
  it('shows the empty state when the Local filter has no tracks', async () => {
    renderLibrary();
    await userEvent.click(screen.getByRole('button', { name: 'Local' }));
    expect(screen.getByText('No Local tracks')).toBeInTheDocument();
  });

  it('shows the all-sources empty state by default (no local files imported, nothing connected)', () => {
    renderLibrary();
    expect(screen.getByText('Nothing to play yet')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test -- Library.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 5: Write `src/screens/Library.tsx`**

```tsx
import { useMemo } from 'react';
import type { Source, Track } from '../types/track';
import { useLibrary } from '../state/LibraryContext';
import { useSources } from '../state/SourcesContext';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { appleMusicConnector } from '../services/mockAppleMusic';
import { spotifyConnector } from '../services/mockSpotify';
import { TrackRow } from '../components/TrackRow';
import { WifiOff } from 'lucide-react';
import styles from './Library.module.css';

const ALL_SOURCES: (Source | 'All')[] = ['All', 'Local', 'Apple Music', 'Spotify'];

export function Library({ onPlay }: { onPlay: (track: Track, pool: Track[]) => void }) {
  const { state: library, dispatch } = useLibrary();
  const { state: sources } = useSources();
  const online = useOnlineStatus();

  const linked = (s: Source) => s === 'Local' || (s === 'Apple Music' ? sources.apple : sources.spotify);

  const pool: Track[] = useMemo(() => {
    const streaming = [
      ...(sources.apple ? appleMusicConnector.catalog() : []),
      ...(sources.spotify ? spotifyConnector.catalog() : []),
    ];
    return [...library.localTracks, ...streaming];
  }, [library.localTracks, sources.apple, sources.spotify]);

  const effectiveFilter: Source | 'All' = !online && library.filter !== 'Local' ? 'Local' : library.filter;

  const visible = effectiveFilter === 'All'
    ? pool.filter(t => linked(t.source))
    : pool.filter(t => t.source === effectiveFilter);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Library</h1>
      </div>

      {!online && (
        <div className={styles.offlineBanner}>
          <WifiOff size={18} color="var(--l2)" />
          <div>
            <div style={{ font: '590 var(--t-sub) var(--f-text)', color: 'var(--l1)' }}>No connection</div>
            <div style={{ font: '400 var(--t-foot) var(--f-text)', color: 'var(--l2)' }}>
              {library.localTracks.length} local tracks still play. Streaming resumes when you are back online.
            </div>
          </div>
        </div>
      )}

      <div className={styles.segment}>
        {ALL_SOURCES.map(s => {
          const disabled = (s !== 'All' && s !== 'Local' && !linked(s)) || (!online && s !== 'Local' && s !== 'All');
          return (
            <button
              key={s}
              className={`${styles.segBtn} ${effectiveFilter === s ? styles.segBtnActive : ''} ${disabled ? styles.segBtnDisabled : ''}`}
              disabled={disabled}
              onClick={() => dispatch({ type: 'SET_FILTER', filter: s })}
            >
              {s === 'Apple Music' ? 'Apple' : s}
            </button>
          );
        })}
      </div>

      <div className={styles.sectionLabel}>
        <span>{effectiveFilter === 'All' ? 'All tracks' : effectiveFilter}</span>
        <span>{visible.length} {visible.length === 1 ? 'track' : 'tracks'}</span>
      </div>

      {visible.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>
            {effectiveFilter === 'All' ? 'Nothing to play yet' : `No ${effectiveFilter} tracks`}
          </div>
          <div className={styles.emptyBody}>
            Connect a service in Sources, or add files from your device.
          </div>
        </div>
      )}

      {visible.map(t => (
        <TrackRow key={t.id} track={t} onClick={() => onPlay(t, visible)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- Library.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/useOnlineStatus.ts src/screens/Library.tsx src/screens/Library.module.css src/screens/Library.test.tsx
git commit -m "feat: add library screen with source filter and offline mode"
```

---

### Task 10: Now Playing screen

**Files:**
- Create: `src/screens/NowPlaying.tsx`, `src/screens/NowPlaying.module.css`, `src/screens/NowPlaying.test.tsx`

**Interfaces:**
- Consumes: `usePlayback()` (Task 4), `formatDuration` (Task 2).
- Produces: nothing consumed by later tasks (leaf screen, mounted by Task 17's route).

- [ ] **Step 1: Write `src/screens/NowPlaying.module.css`**

```css
.page { display: flex; flex-direction: column; padding: 60px 26px 40px; min-height: 100vh; }
.art { position: relative; width: 100%; max-width: 360px; aspect-ratio: 1; border-radius: 16px; overflow: hidden; border: 1px solid var(--card-line); background: var(--art); align-self: center; }
.title { font: 700 var(--t-title)/1.15 var(--f-text); letter-spacing: -.02em; color: var(--l1); margin-top: 24px; }
.artist { font: 400 var(--t-body)/1.3 var(--f-text); color: var(--l2); margin-top: 5px; }
.scrubTrack { position: relative; height: 5px; border-radius: 3px; background: rgba(255,255,255,.16); margin-top: 22px; }
.scrubFill { position: absolute; left: 0; height: 5px; border-radius: 3px; background: var(--l1); }
.times { display: flex; justify-content: space-between; margin-top: 4px; font: 500 var(--t-foot) var(--f-mono); color: var(--l2); }
.transport { display: flex; align-items: center; justify-content: center; gap: 38px; padding: 20px 0 0; }
.playBtn { width: 76px; height: 76px; border-radius: 38px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24); display: flex; align-items: center; justify-content: center; }
```

- [ ] **Step 2: Write the failing test `src/screens/NowPlaying.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { NowPlaying } from './NowPlaying';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const track: Track = { id: 't1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244 };

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: [track.id], index: 0 })}>start</button>
      <NowPlaying track={track} onClose={() => {}} />
    </>
  );
}

describe('NowPlaying', () => {
  it('toggles transport play/pause', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    const toggle = screen.getByRole('button', { name: /pause/i });
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- NowPlaying.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Write `src/screens/NowPlaying.tsx`**

```tsx
import { ChevronDown, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import { formatDuration } from '../lib/format';
import type { Track } from '../types/track';
import styles from './NowPlaying.module.css';

export function NowPlaying({ track, onClose }: { track: Track; onClose: () => void }) {
  const { state, dispatch } = usePlayback();
  const pct = track.durationSec ? Math.min(state.positionSec / track.durationSec, 1) * 100 : 0;

  return (
    <div className={styles.page}>
      <button onClick={onClose} aria-label="Close" data-tap>
        <ChevronDown size={16} />
      </button>

      <div className={styles.art} />

      <div className={styles.title}>{track.title}</div>
      <div className={styles.artist}>{track.artist} — {track.source}</div>

      <div className={styles.scrubTrack}>
        <div className={styles.scrubFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.times}>
        <span>{formatDuration(state.positionSec)}</span>
        <span>-{formatDuration(Math.max(track.durationSec - state.positionSec, 0))}</span>
      </div>

      <div className={styles.transport}>
        <button onClick={() => dispatch({ type: 'PREV' })} aria-label="Previous" data-tap>
          <SkipBack size={30} />
        </button>
        <button
          className={styles.playBtn}
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          aria-label={state.playing ? 'Pause' : 'Play'}
          data-tap
        >
          {state.playing ? <Pause size={30} /> : <Play size={30} />}
        </button>
        <button onClick={() => dispatch({ type: 'NEXT' })} aria-label="Next" data-tap>
          <SkipForward size={30} />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- NowPlaying.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/NowPlaying.tsx src/screens/NowPlaying.module.css src/screens/NowPlaying.test.tsx
git commit -m "feat: add now playing screen with transport controls"
```

---

### Task 11: Sources & Sync screen

**Files:**
- Create: `src/screens/Sources.tsx`, `src/screens/Sources.module.css`, `src/screens/Sources.test.tsx`

**Interfaces:**
- Consumes: `useSources()` (Task 4), `appleMusicConnector`/`spotifyConnector` (Task 5).
- Produces: nothing consumed by later tasks (leaf screen, mounted by Task 17's route).

- [ ] **Step 1: Write `src/screens/Sources.module.css`**

```css
.page { padding: 62px 0 60px; }
.title { font: 700 var(--t-large)/1.05 var(--f-round); margin: 0; padding: 8px 22px 20px; color: var(--l1); }
.card { margin: 0 18px 12px; padding: 18px; border-radius: var(--r-lg); background: var(--card); border: 1px solid var(--card-line); }
.row { display: flex; align-items: center; gap: 12px; }
.dot { width: 40px; height: 40px; border-radius: 11px; flex: none; display: flex; align-items: center; justify-content: center; }
.name { font: 590 var(--t-body) var(--f-text); color: var(--l1); }
.status { font: 400 var(--t-foot) var(--f-text); color: var(--l2); margin-top: 3px; }
.btn { padding: 8px 16px; border-radius: 15px; font: 590 var(--t-sub) var(--f-text); }
.spinner { width: 11px; height: 11px; border-radius: 6px; border: 1.5px solid var(--l3); border-top-color: transparent; animation: spin .8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: Write the failing test `src/screens/Sources.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Sources } from './Sources';
import { SourcesProvider } from '../state/SourcesContext';

describe('Sources', () => {
  afterEach(() => vi.useRealTimers());

  it('shows importing then connected status after connecting Apple Music', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <SourcesProvider>
        <Sources />
      </SourcesProvider>,
    );

    await user.click(screen.getAllByRole('button', { name: 'Connect' })[0]);
    expect(screen.getByText('Importing library…')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1600);
    expect(screen.getByText('812 songs · 24 playlists')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- Sources.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Write `src/screens/Sources.tsx`**

```tsx
import { useSources } from '../state/SourcesContext';
import { appleMusicConnector } from '../services/mockAppleMusic';
import { spotifyConnector } from '../services/mockSpotify';
import type { SourceConnector } from '../services/sourceConnector';
import type { StreamingKey } from '../state/sourcesReducer';
import styles from './Sources.module.css';

const SERVICES: { key: StreamingKey; name: string; color: string; connector: SourceConnector }[] = [
  { key: 'apple', name: 'Apple Music', color: 'var(--apple)', connector: appleMusicConnector },
  { key: 'spotify', name: 'Spotify', color: 'var(--spotify)', connector: spotifyConnector },
];

export function Sources() {
  const { state, dispatch } = useSources();

  const connect = async (key: StreamingKey, connector: SourceConnector) => {
    dispatch({ type: 'CONNECT_START', key });
    await connector.connect();
    dispatch({ type: 'CONNECT_DONE', key });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sources</h1>
      {SERVICES.map(({ key, name, color, connector }) => {
        const on = state[key];
        const busy = state.syncing === key;
        return (
          <div className={styles.card} key={key}>
            <div className={styles.row}>
              <div className={styles.dot}><div style={{ width: 9, height: 9, borderRadius: 5, background: color }} /></div>
              <div style={{ flex: 1 }}>
                <div className={styles.name}>{name}</div>
                <div className={styles.status}>
                  {busy && <span className={styles.spinner} />}{' '}
                  {busy ? 'Importing library…' : on ? (key === 'apple' ? '812 songs · 24 playlists' : '1,140 songs · 31 playlists') : 'Not connected'}
                </div>
              </div>
              <button
                className={styles.btn}
                onClick={() => (on ? dispatch({ type: 'DISCONNECT', key }) : connect(key, connector))}
                data-tap
              >
                {busy ? 'Cancel' : on ? 'Unlink' : 'Connect'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- Sources.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Sources.tsx src/screens/Sources.module.css src/screens/Sources.test.tsx
git commit -m "feat: add sources and sync screen"
```

---

### Task 12: Unified Search screen

**Files:**
- Create: `src/screens/Search.tsx`, `src/screens/Search.module.css`, `src/screens/Search.test.tsx`

**Interfaces:**
- Consumes: `useLibrary()`, `useSources()` (Task 4), `TrackRow` (Task 8), mock catalogs via connectors (Task 5).
- Produces: nothing consumed by later tasks (leaf screen, mounted by Task 17's route).

- [ ] **Step 1: Write `src/screens/Search.module.css`**

```css
.page { padding: 58px 0 24px; }
.searchBar { display: flex; align-items: center; gap: 12px; margin: 6px 18px 14px; }
.input { flex: 1; display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-radius: 10px; background: var(--fill); }
.field { flex: 1; border: none; background: none; color: var(--l1); font: 400 var(--t-body) var(--f-text); outline: none; }
.scopes { margin: 0 18px 20px; padding: 2px; display: flex; border-radius: 9px; background: var(--fill); }
.scopeBtn { flex: 1; text-align: center; padding: 6px 2px; border-radius: 7px; font: 590 var(--t-foot) var(--f-text); color: var(--l2); }
.scopeBtnActive { background: rgba(235,235,245,.26); color: #fff; }
.groupHeader { display: flex; align-items: baseline; gap: 8px; padding: 0 22px 6px; }
.groupName { font: 400 var(--t-foot) var(--f-text); color: var(--l2); flex: 1; }
.groupCount { font: 400 var(--t-foot) var(--f-text); color: var(--l3); }
```

- [ ] **Step 2: Write the failing test `src/screens/Search.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Search } from './Search';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';

describe('Search', () => {
  it('filters grouped results by the typed query', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <Search onPlay={() => {}} />
        </LibraryProvider>
      </SourcesProvider>,
    );
    const field = screen.getByPlaceholderText('Search');
    await userEvent.type(field, 'zzz-no-match');
    expect(screen.queryByText('Local')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- Search.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Write `src/screens/Search.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import type { Source, Track } from '../types/track';
import { useLibrary } from '../state/LibraryContext';
import { useSources } from '../state/SourcesContext';
import { appleMusicConnector } from '../services/mockAppleMusic';
import { spotifyConnector } from '../services/mockSpotify';
import { TrackRow } from '../components/TrackRow';
import styles from './Search.module.css';

const SCOPES: (Source | 'All')[] = ['All', 'Local', 'Apple Music', 'Spotify'];

export function Search({ onPlay }: { onPlay: (track: Track, pool: Track[]) => void }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Source | 'All'>('All');
  const { state: library } = useLibrary();
  const { state: sources } = useSources();

  const linked = (s: Source) => s === 'Local' || (s === 'Apple Music' ? sources.apple : sources.spotify);

  const bySource: Record<Source, Track[]> = {
    Local: library.localTracks,
    'Apple Music': sources.apple ? appleMusicConnector.catalog() : [],
    Spotify: sources.spotify ? spotifyConnector.catalog() : [],
  };

  const scopeNames: Source[] = (scope === 'All' ? ['Local', 'Apple Music', 'Spotify'] : [scope]).filter(linked);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopeNames
      .map(name => ({
        name,
        items: bySource[name].filter(t => !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)),
      }))
      .filter(g => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, scope, library.localTracks, sources.apple, sources.spotify]);

  return (
    <div className={styles.page}>
      <div className={styles.searchBar}>
        <div className={styles.input}>
          <SearchIcon size={16} color="var(--l2)" />
          <input
            className={styles.field}
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.scopes}>
        {SCOPES.map(s => {
          const disabled = s !== 'All' && !linked(s);
          return (
            <button
              key={s}
              className={`${styles.scopeBtn} ${scope === s ? styles.scopeBtnActive : ''}`}
              disabled={disabled}
              onClick={() => setScope(s)}
            >
              {s === 'Apple Music' ? 'Apple' : s}
            </button>
          );
        })}
      </div>

      {groups.map(g => (
        <div key={g.name}>
          <div className={styles.groupHeader}>
            <span className={styles.groupName}>{g.name}</span>
            <span className={styles.groupCount}>{g.items.length} results</span>
          </div>
          {g.items.map(t => (
            <TrackRow key={t.id} track={t} sub={t.artist} onClick={() => onPlay(t, g.items)} />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- Search.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Search.tsx src/screens/Search.module.css src/screens/Search.test.tsx
git commit -m "feat: add unified search screen"
```

---

### Task 13: Duplicate resolution sheet + play-request wiring

**Files:**
- Create: `src/state/DuplicateSheetContext.tsx`
- Create: `src/components/DuplicateSheet.tsx`, `src/components/DuplicateSheet.module.css`, `src/components/DuplicateSheet.test.tsx`

**Interfaces:**
- Consumes: `useLibrary()`, `useSources()`, `usePlayback()` (Task 4), `findDuplicates`/`keyOf` (Task 3).
- Produces: `useDuplicateSheet()` → `{ pending, requestPlay(track, pool), resolve(source), cancel() }`, called by Task 17 as the single `onPlay` handler wired into Library/Search/Album/Queue.

- [ ] **Step 1: Write `src/state/DuplicateSheetContext.tsx`**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Source, Track } from '../types/track';
import { keyOf, findDuplicates } from '../lib/duplicates';
import { useLibrary } from './LibraryContext';
import { useSources } from './SourcesContext';
import { usePlayback } from './PlaybackContext';

interface Pending {
  key: string;
  copies: Track[];
  pool: Track[];
}

interface Ctx {
  pending: Pending | null;
  requestPlay: (track: Track, pool: Track[]) => void;
  resolve: (source: Source) => void;
  cancel: () => void;
}

const DuplicateSheetContext = createContext<Ctx | null>(null);

export function DuplicateSheetProvider({ children }: { children: ReactNode }) {
  const { state: library, dispatch: libDispatch } = useLibrary();
  const { state: sources } = useSources();
  const { dispatch: playbackDispatch } = usePlayback();
  const [pending, setPending] = useState<Pending | null>(null);

  const playTrack = (track: Track, pool: Track[]) => {
    const ids = pool.map(t => t.id);
    playbackDispatch({ type: 'PLAY_TRACK', trackIds: ids, index: ids.indexOf(track.id) });
  };

  const requestPlay = (track: Track, pool: Track[]) => {
    const key = keyOf(track);
    const groups = findDuplicates(pool);
    const copies = groups.get(key);

    if (!copies || copies.length < 2) {
      playTrack(track, pool);
      return;
    }

    const remembered = sources.rememberDuplicates ? library.duplicateChoice[key] : undefined;
    if (remembered) {
      const chosen = copies.find(c => c.source === remembered) ?? track;
      playTrack(chosen, pool);
      return;
    }

    setPending({ key, copies, pool });
  };

  const resolve = (source: Source) => {
    if (!pending) return;
    const chosen = pending.copies.find(c => c.source === source);
    if (chosen) {
      playTrack(chosen, pending.pool);
      libDispatch({ type: 'RESOLVE_DUPLICATE', key: pending.key, source });
    }
    setPending(null);
  };

  const cancel = () => setPending(null);

  return (
    <DuplicateSheetContext.Provider value={{ pending, requestPlay, resolve, cancel }}>
      {children}
    </DuplicateSheetContext.Provider>
  );
}

export function useDuplicateSheet() {
  const ctx = useContext(DuplicateSheetContext);
  if (!ctx) throw new Error('useDuplicateSheet must be used within DuplicateSheetProvider');
  return ctx;
}
```

- [ ] **Step 2: Write `src/components/DuplicateSheet.module.css`**

```css
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(2px); z-index: 10; }
.sheet {
  position: fixed; left: 8px; right: 8px; bottom: 8px; z-index: 11;
  border-radius: 26px; background: rgba(30,29,36,.92); border: 1px solid var(--glass-line);
  padding: 10px 0 14px;
}
.grabber { width: 36px; height: 5px; border-radius: 3px; background: rgba(235,235,245,.3); margin: 0 auto 16px; }
.header { padding: 0 22px 4px; }
.title { font: 600 var(--t-body) var(--f-text); color: var(--l1); }
.body { font: 400 var(--t-foot)/1.4 var(--f-text); color: var(--l2); margin-top: 4px; }
.list { margin: 14px 12px 0; padding: 0 12px; border-radius: var(--r-lg); background: rgba(255,255,255,.05); }
.copy { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 13px 0; border-bottom: 1px solid var(--sep); width: 100%; text-align: left; }
.copyLabel { font: 400 var(--t-body) var(--f-text); color: var(--l1); }
.copyMeta { font: 400 var(--t-foot) var(--f-text); color: var(--l2); margin-top: 2px; }
.cancel { margin: 12px 12px 0; padding: 14px 0; text-align: center; border-radius: var(--r-lg); background: rgba(255,255,255,.08); font: 590 var(--t-body) var(--f-text); color: var(--l1); width: calc(100% - 24px); }
```

- [ ] **Step 3: Write the failing test `src/components/DuplicateSheet.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { DuplicateSheet } from './DuplicateSheet';
import { DuplicateSheetProvider, useDuplicateSheet } from '../state/DuplicateSheetContext';
import { SourcesProvider } from '../state/SourcesContext';
import { LibraryProvider } from '../state/LibraryContext';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const local: Track = { id: 'l1', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Local', durationSec: 244, format: 'FLAC 24/96' };
const apple: Track = { id: 'am-4', title: 'Midnight Ferry', artist: 'Rosalind Ver', source: 'Apple Music', durationSec: 278, format: 'Lossless 24/48' };

function Harness() {
  const { requestPlay } = useDuplicateSheet();
  const { state } = usePlayback();
  return (
    <>
      <button onClick={() => requestPlay(local, [local, apple])}>tap</button>
      <div data-testid="current">{state.queue[state.currentIndex]}</div>
      <DuplicateSheet />
    </>
  );
}

describe('DuplicateSheet', () => {
  it('opens on a duplicate hit and plays the chosen copy', async () => {
    render(
      <SourcesProvider>
        <LibraryProvider>
          <PlaybackProvider>
            <DuplicateSheetProvider>
              <Harness />
            </DuplicateSheetProvider>
          </PlaybackProvider>
        </LibraryProvider>
      </SourcesProvider>,
    );

    await userEvent.click(screen.getByText('tap'));
    expect(screen.getByText('Found in 2 places. Choose which copy plays.')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Apple Music'));
    expect(screen.getByTestId('current')).toHaveTextContent('am-4');
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test -- DuplicateSheet.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 5: Write `src/components/DuplicateSheet.tsx`**

```tsx
import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import styles from './DuplicateSheet.module.css';

export function DuplicateSheet() {
  const { pending, resolve, cancel } = useDuplicateSheet();
  if (!pending) return null;

  return (
    <>
      <div className={styles.overlay} onClick={cancel} />
      <div className={styles.sheet}>
        <div className={styles.grabber} />
        <div className={styles.header}>
          <div className={styles.title}>{pending.copies[0].title}</div>
          <div className={styles.body}>Found in {pending.copies.length} places. Choose which copy plays.</div>
        </div>
        <div className={styles.list}>
          {pending.copies.map(c => (
            <button key={c.id} className={styles.copy} onClick={() => resolve(c.source)} data-tap>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.copyLabel}>{c.source === 'Local' ? 'On this iPhone' : c.source}</div>
                <div className={styles.copyMeta}>{c.format ?? c.source}</div>
              </div>
            </button>
          ))}
        </div>
        <button className={styles.cancel} onClick={cancel} data-tap>Cancel</button>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- DuplicateSheet.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/state/DuplicateSheetContext.tsx src/components/DuplicateSheet.tsx src/components/DuplicateSheet.module.css src/components/DuplicateSheet.test.tsx
git commit -m "feat: add duplicate resolution sheet and play-request wiring"
```

---

### Task 14: Queue screen

**Files:**
- Create: `src/screens/Queue.tsx`, `src/screens/Queue.module.css`, `src/screens/Queue.test.tsx`

**Interfaces:**
- Consumes: `usePlayback()` (Task 4). Track lookup for display comes from a `getTrack` prop supplied by Task 17's `App.tsx`, so this screen has no data-layer dependency of its own.

- [ ] **Step 1: Write `src/screens/Queue.module.css`**

```css
.page { padding: 60px 0 40px; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 6px 22px 22px; }
.title { font: 600 var(--t-body) var(--f-text); color: var(--l1); }
.nowPlaying { margin: 0 18px 24px; display: flex; align-items: center; gap: 13px; padding: 12px; border-radius: var(--r-lg); background: var(--glass); border: 1px solid var(--glass-line); }
.sectionRow { display: flex; align-items: baseline; justify-content: space-between; padding: 0 22px 6px; }
.row { display: flex; align-items: center; gap: 13px; padding: 8px 22px; border-bottom: 1px solid var(--sep); }
.moveBtns { display: flex; flex-direction: column; gap: 2px; }
```

- [ ] **Step 2: Write the failing test `src/screens/Queue.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { Queue } from './Queue';
import { PlaybackProvider, usePlayback } from '../state/PlaybackContext';
import type { Track } from '../types/track';

const tracks: Record<string, Track> = {
  a: { id: 'a', title: 'A', artist: 'X', source: 'Local', durationSec: 100 },
  b: { id: 'b', title: 'B', artist: 'X', source: 'Local', durationSec: 100 },
  c: { id: 'c', title: 'C', artist: 'X', source: 'Local', durationSec: 100 },
};

function Harness() {
  const { dispatch } = usePlayback();
  return (
    <>
      <button onClick={() => dispatch({ type: 'PLAY_TRACK', trackIds: ['a', 'b', 'c'], index: 0 })}>start</button>
      <Queue getTrack={id => tracks[id]} />
    </>
  );
}

describe('Queue', () => {
  it('moves a row down and clears everything after now-playing', async () => {
    render(
      <PlaybackProvider>
        <Harness />
      </PlaybackProvider>,
    );
    await userEvent.click(screen.getByText('start'));

    await userEvent.click(screen.getAllByRole('button', { name: 'Move down' })[0]);
    const rows = screen.getAllByTestId('queue-row').map(r => r.textContent);
    expect(rows[0]).toContain('C');

    await userEvent.click(screen.getByText('Clear'));
    expect(screen.queryAllByTestId('queue-row')).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- Queue.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Write `src/screens/Queue.tsx`**

```tsx
import { ArrowUp, ArrowDown, Play, Pause } from 'lucide-react';
import { usePlayback } from '../state/PlaybackContext';
import { formatDuration } from '../lib/format';
import type { Track } from '../types/track';
import styles from './Queue.module.css';

export function Queue({ getTrack }: { getTrack: (id: string) => Track | undefined }) {
  const { state, dispatch } = usePlayback();
  const currentId = state.queue[state.currentIndex];
  const current = currentId ? getTrack(currentId) : undefined;
  const upcoming = state.queue.slice(state.currentIndex + 1);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= state.queue.length) return;
    dispatch({ type: 'REORDER', from, to });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Up Next</span>
      </div>

      {current && (
        <div className={styles.nowPlaying}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '400 var(--t-cap) var(--f-text)', color: 'var(--l2)', textTransform: 'uppercase' }}>Now playing</div>
            <div style={{ font: '590 var(--t-body) var(--f-text)', color: 'var(--l1)' }}>{current.title}</div>
          </div>
          <button onClick={() => dispatch({ type: 'TOGGLE_PLAY' })} aria-label={state.playing ? 'Pause' : 'Play'} data-tap>
            {state.playing ? <Pause size={22} /> : <Play size={22} />}
          </button>
        </div>
      )}

      <div className={styles.sectionRow}>
        <span>Next up</span>
        <button onClick={() => dispatch({ type: 'CLEAR_UPCOMING' })} data-tap>Clear</button>
      </div>

      {upcoming.map((id, i) => {
        const track = getTrack(id);
        if (!track) return null;
        const absoluteIndex = state.currentIndex + 1 + i;
        return (
          <div className={styles.row} key={`${id}-${absoluteIndex}`} data-testid="queue-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>{track.title}</div>
              <div style={{ color: 'var(--l2)', fontSize: 13 }}>{track.artist} · {formatDuration(track.durationSec)}</div>
            </div>
            <div className={styles.moveBtns}>
              <button onClick={() => move(absoluteIndex, absoluteIndex - 1)} aria-label="Move up" data-tap>
                <ArrowUp size={14} />
              </button>
              <button onClick={() => move(absoluteIndex, absoluteIndex + 1)} aria-label="Move down" data-tap>
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- Queue.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Queue.tsx src/screens/Queue.module.css src/screens/Queue.test.tsx
git commit -m "feat: add queue screen with reordering"
```

---

### Task 15: Album screen (local / streaming / mixed)

**Files:**
- Create: `src/screens/Album.tsx`, `src/screens/Album.module.css`, `src/screens/Album.test.tsx`

**Interfaces:**
- Consumes: `Album`, `Track` (Task 2), `albums`/`albumTracks` (Task 2), `formatDuration` (Task 2).
- Produces: nothing consumed by later tasks (leaf screen, mounted by Task 17's route).

- [ ] **Step 1: Write `src/screens/Album.module.css`**

```css
.page { padding: 62px 0 40px; }
.head { padding: 8px 22px 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.art { width: 190px; height: 190px; border-radius: 14px; border: 1px solid var(--card-line); background: var(--art); }
.title { font: 700 23px/1.2 var(--f-text); letter-spacing: -.02em; color: var(--l1); margin-top: 18px; }
.artist { font: 400 var(--t-body)/1.3 var(--f-text); color: var(--l2); margin-top: 4px; }
.meta { font: 400 var(--t-foot)/1.3 var(--f-text); color: var(--l3); margin-top: 6px; }
.actions { display: flex; gap: 10px; padding: 20px 22px 22px; }
.primary { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; border-radius: 13px; background: rgba(255,255,255,.92); color: #111; font: 590 var(--t-body) var(--f-text); }
.secondary { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px; border-radius: 13px; background: rgba(255,255,255,.08); border: 1px solid var(--card-line); color: var(--l1); font: 590 var(--t-body) var(--f-text); }
.disclosure { margin: 0 22px 18px; padding: 11px 14px; border-radius: var(--r-md); background: rgba(255,255,255,.04); border: 1px solid var(--card-line); font: 400 var(--t-foot)/1.4 var(--f-text); color: var(--l2); }
.trackRow { display: flex; align-items: center; gap: 14px; padding: 13px 22px; border-bottom: 1px solid var(--sep); }
.n { width: 18px; flex: none; text-align: right; font: 400 var(--t-foot) var(--f-mono); color: var(--l3); }
```

- [ ] **Step 2: Write the failing test `src/screens/Album.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Album } from './Album';
import { albums } from '../data/mockLibrary';

describe('Album', () => {
  it('shows Play/Shuffle for a local album', () => {
    const local = albums.find(a => a.variant === 'local')!;
    render(<Album album={local} onPlay={() => {}} />);
    expect(screen.getByText('Shuffle')).toBeInTheDocument();
  });

  it('shows Play/Save plus the streaming disclosure for a streaming album', () => {
    const streaming = albums.find(a => a.variant === 'streaming')!;
    render(<Album album={streaming} onPlay={() => {}} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText(/Nothing is stored on this iPhone/)).toBeInTheDocument();
  });

  it('shows Play/Download N for a mixed album, N = stream-only tracks', () => {
    const mixed = albums.find(a => a.variant === 'mixed')!;
    render(<Album album={mixed} onPlay={() => {}} />);
    expect(screen.getByText('Download 3')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- Album.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 4: Write `src/screens/Album.tsx`**

```tsx
import type { Album as AlbumType, Track } from '../types/track';
import { albumTracks } from '../data/mockLibrary';
import { formatDuration } from '../lib/format';
import styles from './Album.module.css';

export function Album({ album, onPlay }: { album: AlbumType; onPlay: (track: Track, pool: Track[]) => void }) {
  const tracks = album.trackIds.map(id => albumTracks[id]).filter(Boolean);
  const streamOnly = tracks.filter(t => t.source !== 'Local').length;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.art} />
        <div className={styles.title}>{album.title}</div>
        <div className={styles.artist}>{album.artist}</div>
        <div className={styles.meta}>
          {album.year} · {tracks.length} tracks
          {album.variant === 'local' && album.sizeLabel && ` · FLAC 24/96 · ${album.sizeLabel}`}
          {album.variant === 'streaming' && ' · Lossless'}
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} onClick={() => tracks[0] && onPlay(tracks[0], tracks)} data-tap>Play</button>
        {album.variant === 'local' && <button className={styles.secondary} data-tap>Shuffle</button>}
        {album.variant === 'streaming' && <button className={styles.secondary} data-tap>Save</button>}
        {album.variant === 'mixed' && <button className={styles.secondary} data-tap>Download {streamOnly}</button>}
      </div>

      {album.variant === 'streaming' && (
        <div className={styles.disclosure}>Streams from {tracks[0]?.source}. Nothing is stored on this iPhone.</div>
      )}

      {tracks.map((t, i) => (
        <div className={styles.trackRow} key={t.id} onClick={() => onPlay(t, tracks)} data-tap>
          <div className={styles.n}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{t.title}</div>
          {album.variant === 'mixed' && t.format && (
            <div style={{ padding: '2px 7px', borderRadius: 5, border: '1px solid var(--card-line)', font: '590 10px var(--f-mono)', color: 'var(--l2)' }}>
              {t.format}
            </div>
          )}
          <div style={{ font: '400 var(--t-foot) var(--f-mono)', color: 'var(--l3)' }}>{formatDuration(t.durationSec)}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- Album.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Album.tsx src/screens/Album.module.css src/screens/Album.test.tsx
git commit -m "feat: add album screen for local, streaming and mixed variants"
```

---

### Task 16: Onboarding flow

**Files:**
- Create: `src/screens/onboarding/ScanStep.tsx`
- Create: `src/screens/onboarding/ConnectStep.tsx`
- Create: `src/screens/onboarding/DuplicatesStep.tsx`
- Create: `src/screens/onboarding/OnboardingFlow.tsx`, `src/screens/onboarding/OnboardingFlow.module.css`, `src/screens/onboarding/OnboardingFlow.test.tsx`

**Interfaces:**
- Consumes: `useSources()`, `useLibrary()` (Task 4), `appleMusicConnector`/`spotifyConnector` (Task 5).
- Produces: `<OnboardingFlow onFinish/>`, gating logic (`localStorage['ferrite:onboarded']`) consumed by Task 17.

- [ ] **Step 1: Write `src/screens/onboarding/OnboardingFlow.module.css`**

```css
.step { display: flex; flex-direction: column; padding: 120px 34px 48px; min-height: 100vh; }
.heading { font: 700 32px/1.15 var(--f-round); letter-spacing: -.025em; color: var(--l1); }
.sub { font: 400 var(--t-body)/1.4 var(--f-text); color: var(--l2); margin-top: 10px; }
.spacer { flex: 1; }
.dots { display: flex; gap: 7px; justify-content: center; padding-bottom: 22px; }
.dot { width: 7px; height: 7px; border-radius: 4px; background: rgba(255,255,255,.22); }
.dotActive { background: var(--l1); }
.primaryBtn { min-height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,255,255,.92); color: #111; font: 590 var(--t-body) var(--f-text); }
.skip { text-align: center; min-height: 44px; display: flex; align-items: center; justify-content: center; font: 400 var(--t-body) var(--f-text); color: var(--l2); }
```

- [ ] **Step 2: Write `src/screens/onboarding/ScanStep.tsx`**

```tsx
import { useRef, useState } from 'react';
import { useLibrary } from '../../state/LibraryContext';
import type { Track } from '../../types/track';
import styles from './OnboardingFlow.module.css';

function trackFromFile(file: File): Track {
  // ponytail: filename-based tagging only ("Artist - Title.ext"); real ID3
  // parsing (e.g. music-metadata-browser) is the upgrade if users need it.
  const base = file.name.replace(/\.[^.]+$/, '');
  const parts = base.split(' - ');
  const [artist, title] = parts.length >= 2 ? [parts[0], parts.slice(1).join(' - ')] : ['Unknown Artist', base];
  return {
    id: crypto.randomUUID(),
    title,
    artist,
    source: 'Local',
    durationSec: 0,
    fileUrl: URL.createObjectURL(file),
  };
}

export function ScanStep({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useLibrary();
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = (files: FileList) => {
    const tracks = Array.from(files).map(trackFromFile);
    dispatch({ type: 'IMPORT_LOCAL_FILES', tracks });
    setProgress(100);
    setTimeout(onNext, 400);
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>Reading your files</div>
      <div className={styles.sub}>Ferrite works before you connect anything.</div>
      <div style={{ marginTop: 44 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{ font: '700 56px/1 var(--f-mono)', color: 'var(--l1)' }}>{state.localTracks.length}</div>
          <div style={{ color: 'var(--l2)' }}>songs</div>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.14)', marginTop: 22, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--l1)' }} />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && onFiles(e.target.files)}
      />
      <button className={styles.primaryBtn} style={{ marginTop: 24 }} onClick={() => inputRef.current?.click()} data-tap>
        Add files
      </button>
      <div className={styles.spacer} />
      <button className={styles.skip} onClick={onNext} data-tap>Skip for now</button>
      <div className={styles.dots}>
        <div className={`${styles.dot} ${styles.dotActive}`} />
        <div className={styles.dot} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/screens/onboarding/ConnectStep.tsx`**

```tsx
import { useSources } from '../../state/SourcesContext';
import { appleMusicConnector } from '../../services/mockAppleMusic';
import { spotifyConnector } from '../../services/mockSpotify';
import type { SourceConnector } from '../../services/sourceConnector';
import type { StreamingKey } from '../../state/sourcesReducer';
import styles from './OnboardingFlow.module.css';

const SERVICES: { key: StreamingKey; name: string; connector: SourceConnector }[] = [
  { key: 'apple', name: 'Apple Music', connector: appleMusicConnector },
  { key: 'spotify', name: 'Spotify', connector: spotifyConnector },
];

export function ConnectStep({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useSources();

  const connect = async (key: StreamingKey, connector: SourceConnector) => {
    dispatch({ type: 'CONNECT_START', key });
    await connector.connect();
    dispatch({ type: 'CONNECT_DONE', key });
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>Add your accounts</div>
      <div className={styles.sub}>Optional. You can do this later.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}>
        {SERVICES.map(({ key, name, connector }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 16, borderRadius: 'var(--r-lg)', background: 'var(--card)', border: '1px solid var(--card-line)' }}>
            <div style={{ flex: 1 }}>{name}</div>
            <button onClick={() => connect(key, connector)} data-tap>
              {state.syncing === key ? 'Connecting…' : state[key] ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
      <div className={styles.spacer} />
      <button className={styles.skip} onClick={onNext} data-tap>Skip</button>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={`${styles.dot} ${styles.dotActive}`} />
        <div className={styles.dot} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/screens/onboarding/DuplicatesStep.tsx`**

```tsx
import { useState } from 'react';
import { useSources } from '../../state/SourcesContext';
import type { Source } from '../../types/track';
import styles from './OnboardingFlow.module.css';

export function DuplicatesStep({ onFinish }: { onFinish: () => void }) {
  const { dispatch } = useSources();
  const [rule, setRule] = useState<Source>('Local');

  const finish = () => {
    dispatch({ type: 'SET_REMEMBER_DUPLICATES', value: true });
    onFinish();
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>When a song is in two places</div>
      <div className={styles.sub}>Change this any time in Sources.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 34 }}>
        <button
          onClick={() => setRule('Local')}
          style={{ textAlign: 'left', padding: 18, borderRadius: 'var(--r-lg)', background: rule === 'Local' ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.03)', border: '1px solid var(--card-line)' }}
          data-tap
        >
          <div style={{ fontWeight: 590, color: 'var(--l1)' }}>Play my file</div>
          <div style={{ color: 'var(--l2)', fontSize: 13, marginTop: 4 }}>Streams only when no file exists.</div>
        </button>
        <button
          onClick={() => setRule('Apple Music')}
          style={{ textAlign: 'left', padding: 18, borderRadius: 'var(--r-lg)', background: rule === 'Apple Music' ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.03)', border: '1px solid var(--card-line)' }}
          data-tap
        >
          <div style={{ fontWeight: 590, color: 'var(--l1)' }}>Play the stream</div>
          <div style={{ color: 'var(--l2)', fontSize: 13, marginTop: 4 }}>Files stay available offline.</div>
        </button>
      </div>
      <div className={styles.spacer} />
      <button className={styles.primaryBtn} onClick={finish} data-tap>Open Library</button>
      <div className={styles.dots}>
        <div className={styles.dot} />
        <div className={styles.dot} />
        <div className={`${styles.dot} ${styles.dotActive}`} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write the failing test `src/screens/onboarding/OnboardingFlow.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';
import { SourcesProvider } from '../../state/SourcesContext';
import { LibraryProvider } from '../../state/LibraryContext';

beforeEach(() => localStorage.clear());

function renderFlow(onFinish: () => void) {
  render(
    <SourcesProvider>
      <LibraryProvider>
        <OnboardingFlow onFinish={onFinish} />
      </LibraryProvider>
    </SourcesProvider>,
  );
}

describe('OnboardingFlow', () => {
  it('skip through scan and connect, then finishing sets the onboarded flag', async () => {
    let finished = false;
    renderFlow(() => { finished = true; });
    await userEvent.click(screen.getByText('Skip for now'));
    await userEvent.click(screen.getByText('Skip'));
    await userEvent.click(screen.getByText('Open Library'));
    expect(localStorage.getItem('ferrite:onboarded')).toBe('true');
    expect(finished).toBe(true);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- OnboardingFlow.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 7: Write `src/screens/onboarding/OnboardingFlow.tsx`**

```tsx
import { useState } from 'react';
import { ScanStep } from './ScanStep';
import { ConnectStep } from './ConnectStep';
import { DuplicatesStep } from './DuplicatesStep';

export function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const finish = () => {
    localStorage.setItem('ferrite:onboarded', 'true');
    onFinish();
  };

  if (step === 0) return <ScanStep onNext={() => setStep(1)} />;
  if (step === 1) return <ConnectStep onNext={() => setStep(2)} />;
  return <DuplicatesStep onFinish={finish} />;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- OnboardingFlow.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/screens/onboarding
git commit -m "feat: add onboarding flow with scan connect and duplicates steps"
```

---

### Task 17: Final integration — routes, audio engine wiring, build green

**Files:**
- Modify: `src/App.tsx` (full route tree, onboarding gate, `DuplicateSheetProvider`, `AudioEngine` wiring)
- Modify: `src/App.test.tsx` (cover onboarding gate + route smoke)
- Modify: `src/app/AppShell.tsx` (render `MiniPlayer` + `DuplicateSheet`, expose `onPlay`/`getTrack` via `Outlet` context)

**Interfaces:**
- Consumes: every module from Tasks 1-16.
- Produces: the running app; nothing downstream.

- [ ] **Step 1: Update `src/app/AppShell.tsx`** to expose `onPlay`/`getTrack` to child routes and render the persistent overlays

```tsx
import { Outlet, useOutletContext, useNavigate } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';
import { MiniPlayer } from '../components/MiniPlayer';
import { DuplicateSheet } from '../components/DuplicateSheet';
import { usePlayback } from '../state/PlaybackContext';
import { useDuplicateSheet } from '../state/DuplicateSheetContext';
import type { Track } from '../types/track';

interface ShellContext {
  onPlay: (track: Track, pool: Track[]) => void;
  getTrack: (id: string) => Track | undefined;
}

export function useShellContext() {
  return useOutletContext<ShellContext>();
}

export function AppShell({ getTrack }: { getTrack: (id: string) => Track | undefined }) {
  const { state } = usePlayback();
  const { requestPlay } = useDuplicateSheet();
  const navigate = useNavigate();
  const currentId = state.queue[state.currentIndex];
  const current = currentId ? getTrack(currentId) : undefined;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: current ? 176 : 88 }}>
      <Outlet context={{ onPlay: requestPlay, getTrack } satisfies ShellContext} />
      {current && <MiniPlayer track={current} onOpen={() => navigate('/now-playing')} />}
      <DuplicateSheet />
      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx`** with the full route tree, onboarding gate, and `AudioEngine` wiring

```tsx
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
    if (track?.fileUrl) engineRef.current!.load(track.fileUrl);
  }, [track?.fileUrl]);

  useEffect(() => {
    if (!track?.fileUrl) return;
    if (state.playing) engineRef.current!.play();
    else engineRef.current!.pause();
  }, [state.playing, track?.fileUrl]);

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
```

- [ ] **Step 3: Replace `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from './App';

beforeEach(() => localStorage.clear());

describe('App', () => {
  it('shows onboarding first, then the library after finishing', async () => {
    render(<App />);
    expect(screen.getByText('Reading your files')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Skip for now'));
    await userEvent.click(screen.getByText('Skip'));
    await userEvent.click(screen.getByText('Open Library'));

    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('skips onboarding on a second run', () => {
    localStorage.setItem('ferrite:onboarded', 'true');
    render(<App />);
    expect(screen.getByText('Library')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the full test suite**

Run: `npm run test`
Expected: every test file passes.

- [ ] **Step 5: Run build and lint**

Run: `npm run build`
Expected: exits 0, `dist/` produced, no TypeScript errors.
Run: `npm run lint`
Expected: exits 0, zero warnings.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, open the printed local URL in a browser.
Walk through: onboarding (skip through, or import a file named
`Rosalind Ver - Midnight Ferry.mp3`) → Library → tap a track → Now
Playing transport works → back → Sources → connect Apple Music → wait
~1.6s → Search → type "midnight" → Queue → reorder a row → go offline
(devtools Network → Offline) → Library shows the offline banner and dims
streaming rows. Compare each screen side-by-side with
`ClaudeDesign/Ferrite.dc.html` and note any visual gaps as fast-follow
polish (not a blocker for this plan).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/app/AppShell.tsx
git commit -m "feat: wire routes onboarding gate and audio engine into app"
```

---

## Self-review notes

- **Spec coverage:** PRD §6.1-6.14 each map to a task (6.1/6.7→Task 9, 6.2→10, 6.3→11, 6.4→12, 6.5→13, 6.6→14, 6.8→Task 7, 6.9-6.11→15, 6.12-6.14→16). §7 (source colors, tap targets, focus rings) lands in Task 1's `tokens.css`/`reset.css` and is reused everywhere. §8 success criteria are exercised by Task 17 Step 6's manual walkthrough plus the automated suite.
- **Type consistency:** `Track`/`Album`/`Source` (Task 2) are the only shapes used across every later task — verified `durationSec`, `fileUrl?`, `format?`, `albumId?` names match between `types/track.ts`, `mockLibrary.ts`, `libraryReducer.ts`, `AudioEngine`, and every screen. `StreamingKey` ('apple' | 'spotify') and `SourceConnector` are defined once (`sourcesReducer.ts`, `sourceConnector.ts`) and imported everywhere else that needs them (Sources screen, ConnectStep) rather than re-declared.
- **No placeholders:** every step has real, complete code. Task 7's `AppShell`/`App.tsx` are an intermediate checkpoint explicitly labeled as such (kept green, not a stub) and fully superseded by Task 17's versions — this is normal incremental build-up, not a placeholder left unresolved.
