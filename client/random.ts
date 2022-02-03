import { makeSeededGenerators } from "./deps.ts";

let rng: RandomNumberGenerator;

export function initRng(seed?: string) {
  rng = newRng(seed);
}

export default function random(max: number): number {
  if (!rng) {
    initRng();
  }
  return rng(max);
}

const letters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcedefhijklmnopqrstuvwxyz0123456789";

export function randomString(length: number): string {
  const chars: string[] = [];
  for (let i = 0; i < length; i++) {
    chars.push(letters[random(letters.length)]);
  }
  return chars.join("");
}

export type RandomNumberGenerator = {
  (max: number): number;
};

export function newRng(seed?: string): RandomNumberGenerator {
  const rng = makeSeededGenerators(seed ?? "");

  function random(max: number): number {
    const r = rng.randomInt(0, max);
    return max != null ? Math.floor(r * max) : r;
  }

  return random;
}
