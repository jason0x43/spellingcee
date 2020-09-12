import seedrandom from 'seedrandom';

let rng: RandomNumberGenerator;

export function initRng(seed?: string) {
  rng = newRng(seed);
}

export default function random(max?: number): number {
  if (!rng) {
    initRng();
  }
  return rng(max);
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcedefhijklmnopqrstuvwxyz0123456789';

export function randomString(length: number): string {
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(letters[random(letters.length)]);
  }
  return chars.join('');
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
