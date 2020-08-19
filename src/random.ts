import seedrandom, { State, prng } from 'seedrandom';

let rng: prng;

export interface RngState {
  state: State;
}

export function initRng(seed?: string | RngState | null) {
  if (typeof seed === 'string') {
    rng = seedrandom(seed, { state: true });
  } else if (seed && typeof seed === 'object') {
    rng = seedrandom("", seed);
  } else {
    rng = seedrandom("", { state: true });
  }
}

export function saveRng(): RngState {
  return { state: rng.state() };
}

export default function random(max?: number): number {
  const r = rng();
  return max != null ? Math.floor(r * max) : r;
}
