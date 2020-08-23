import seedrandom, { prng } from 'seedrandom';

let rng: RandomNumberGenerator;

export function initRng(seed?: string | null) {
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

export function newRng(
  seed?: string | null
): RandomNumberGenerator {
  let rng: prng;

  if (typeof seed === 'string') {
    rng = seedrandom(seed, { state: true });
  } else if (seed && typeof seed === 'object') {
    rng = seedrandom('', seed);
  } else {
    rng = seedrandom('', { state: true });
  }

  function random(max?: number): number {
    const r = rng();
    return max != null ? Math.floor(r * max) : r;
  }

  return random;
}
