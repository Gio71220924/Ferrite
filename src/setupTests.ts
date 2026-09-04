import '@testing-library/jest-dom/vitest';

// jsdom has no real layout engine, so matchMedia never reflects viewport
// size — default every query to "no match" (desktop-off / mobile layout),
// matching the layout every existing test was written against. Individual
// tests that need a desktop match override window.matchMedia themselves.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
