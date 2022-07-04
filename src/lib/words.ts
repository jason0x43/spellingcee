export const ratings = {
  1: 'easy',
  2: 'medium',
  3: 'hard'
} as const;

export const ratingNames = {
  easy: 1,
  medium: 2,
  hard: 3
} as const;

export type Rating = keyof typeof ratings;

/**
 * Indicate whether a word is a pangram (a word containing 7 unique letters).
 */
export function isPangram(word: string): boolean {
  return new Set(word).size === 7;
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
        : sum + word.length,
    0
  );
}

type DictionaryResult = [
  {
    meta: Record<string, unknown>;
    shortdef: string[];
    fl: string;
    def: Record<string, unknown>;
  }
];

/**
 * Get the definition for a word
 */
export async function getDefinition(word: string): Promise<string[]> {
  const api =
    'https://www.dictionaryapi.com/api/v3/references/collegiate/json/';
  const apiKey = process.env['SC_DICTIONARY_API_KEY'];

  const result = await fetch(`${api}${word}?key=${apiKey}`);
  if (result.status >= 400) {
    throw new Error(`Error getting definition: ${result.statusText}`);
  }

  const data: DictionaryResult = await result.json();
  return data[0].shortdef;
}
