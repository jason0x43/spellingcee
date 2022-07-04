/**
 * Run a callback when a media query changes
 */
export function onMediaQuery(query: string, cb: (matches: boolean) => void) {
  const matcher = globalThis.matchMedia(query);
  const listener = (event: MediaQueryListEvent) => {
    cb(event.matches);
  };
  matcher.addEventListener('change', listener);
  cb(matcher.matches);

  return () => {
    matcher.removeEventListener('change', listener);
  };
}
