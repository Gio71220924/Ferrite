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
