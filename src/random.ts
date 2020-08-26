import seedrandom from 'seedrandom';

let rng: RandomNumberGenerator;

export function initRng(seed?: string) {
  rng = newRng(seed);
}

export default function random(max?: number): number {
  if (!rng) {
    throw new Error('The random number generator has not been initialized');
  }
  return rng(max);
}

export interface RandomNumberGenerator {
  (max?: number): number;
}

export function newRng(seed?: string): RandomNumberGenerator {
  const rng = seedrandom(seed);

  function random(max?: number): number {
    const r = rng();
    return max != null ? Math.floor(r * max) : r;
  }

  return random;
}
