/**
 * Return an integer in [0, max)
 */
export function random(max: number) {
  return Math.floor(Math.random() * max);
}

/**
 * Indicate whether a word is a pangram (a word containing 7 unique letters).
 */
export function isPangram(word: string): boolean {
  return new Set(word).size === 7;
}

/**
 * Permute the letters in a string
 */
export function permute(letters: string[]): string[] {
  const newLetters: string[] = [];
  const oldLetters = letters.slice();
  while (oldLetters.length > 0) {
    const index = random(oldLetters.length);
    newLetters.push(oldLetters.splice(index, 1)[0]);
  }
  return newLetters;
}
