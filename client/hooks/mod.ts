import { React } from "../deps.ts";

const { useEffect, useState } = React;

export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const matcher = globalThis.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    setMatches(matcher.matches);
    matcher.addEventListener("change", listener);

    return () => {
      matcher.removeEventListener("change", listener);
    };
  }, [query, setMatches]);

  return matches;
}

export function useVerticalMediaQuery(): boolean {
  return useMediaQuery("(max-width: 640px)");
}
