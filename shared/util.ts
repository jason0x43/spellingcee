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
 * Permute the values in an array
 */
export function permute<T>(values: T[]): T[] {
  const newValues: T[] = [];
  const oldValues = values.slice();
  while (oldValues.length > 0) {
    const index = random(oldValues.length);
    newValues.push(oldValues.splice(index, 1)[0]);
  }
  return newValues;
}

/**
 * Compute the score of a set of words
 */
export function computeScore(words: string[]): number {
  return words.reduce(
    (sum, word) =>
      word.length === 4
        ? sum + 1
        : isPangram(word)
        ? sum + 2 * word.length
        : sum +
          word.length,
    0,
  );
}
