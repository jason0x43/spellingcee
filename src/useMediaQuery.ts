import { useEffect, useState } from 'react';

export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const matcher = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    matcher.addEventListener('change', listener);

    return () => {
      matcher.removeEventListener('change', listener);
    };
  }, [query, setMatches]);

  return matches;
}
