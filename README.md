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
2. On first launch you land in onboarding. At "Reading your files", tap
   **Add files** and pick a file named `Rosalind Ver - Midnight Ferry.mp3`
   (any small audio file renamed to that pattern works — filename parsing
   is `Artist - Title.ext`). Skip the remaining onboarding steps.
3. In Sources, connect Apple Music or Spotify (mocked, ~1.6s).
4. Tap the Midnight Ferry row in Library — the duplicate sheet opens
   showing the local copy alongside the connected service's copy.

There is currently no way to import local files after onboarding finishes
(no import control on the Library screen yet) — to retry this flow, clear
the site's local storage or open the app in a private window.
