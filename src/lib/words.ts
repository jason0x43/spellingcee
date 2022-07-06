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
 * Return the number of unique letters in a word
 */
export function numUniqueLetters(word: string): number {
  return new Set(word).size;
}

/**
 * Indicate whether a word is a pangram (a word containing 7 unique letters).
 */
export function isPangram(word: string): boolean {
  return numUniqueLetters(word) === 7;
}

/**
 * Compute the score of a set of words
 */
export function computeScore(words: string[]): number {
  let score = 0;
  for (const word of words) {
    if (word.length === 4) {
      score += 1;
    } else if (isPangram(word)) {
      score += 2 * word.length;
    } else {
      score += word.length;
    }
  }
  return score;
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
