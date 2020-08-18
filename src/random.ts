import seedrandom from 'seedrandom';

let rng: () => number;

export function initRng(seed?: string | null) {
  rng = seed ? seedrandom(seed) : Math.random;
}

export default function random(max?: number): number {
  const r = rng();
  return max != null ? Math.floor(r * max) : r;
}
