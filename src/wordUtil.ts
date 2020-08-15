export function isPangram(word: string) {
  const chars = new Set(word);
  return chars.size === 7;
}

export function findPangram(words: string[], end: number): string {
  const index = Math.floor(Math.random() * end);
  let pangram = words[0];
  for (let i = index; i < end; i++) {
    const word = words[i];
    if (isPangram(word)) {
      pangram = word;
      break;
    }
  }
  if (!pangram) {
    for (let i = 0; i < index; i++) {
      const word = words[i];
      if (isPangram(word)) {
        pangram = word;
        break;
      }
    }
  }
  return pangram;
}

export function getLetters(word: string | string[]): string[] {
  return Array.from(new Set(word));
}

export type Check = ({
  word,
  words,
  pangram,
  center,
}: {
  word: string;
  words: string[];
  pangram: Set<string>;
  center: string;
}) => string | undefined;

const checks: Check[] = [
  // 1. only uses valid letters
  ({ word, pangram }) => {
    for (const char of word) {
      if (!pangram.has(char)) {
        return 'Invalid letter';
      }
    }
  },

  // 2. is at least 4 characters long
  ({ word }) => {
    if (word.length < 4) {
      return 'Too short';
    }
  },

  // 3. contains center letter
  ({ word, center }) => {
    if (word.indexOf(center) === -1) {
      return 'Missing center letter';
    }
  },

  // 4. is a valid word
  ({ word, words }) => {
    if (!words.includes(word)) {
      return 'Invalid word';
    }
  },
];

export function validateWord({
  word,
  words,
  pangram,
  center,
}: {
  word: string;
  words: string[];
  pangram: string | Set<string>;
  center: string;
}): string | undefined {
  const pangramChars = typeof pangram === 'string' ? new Set(pangram) : pangram;
  for (const check of checks) {
    const message = check({ word, words, pangram: pangramChars, center });
    if (message) {
      return message;
    }
  }
}

export function findValidWords({
  words,
  pangram,
  center,
}: {
  words: string[];
  pangram: string;
  center: number;
}): string[] {
  const pangramChars = new Set(pangram);
  return words.filter(
    (word) =>
      !validateWord({
        words,
        word,
        pangram: pangramChars,
        center: pangram[center],
      })
  );
}

function computeWordScore(word: string): number {
  if (word.length === 4) {
    return 1;
  }
  if (new Set(word).size === 7) {
    return 2 * word.length;
  }
  return word.length;
}

export function computeScore(words: string[]): number {
  let sum = 0;
  for (const word of words) {
    sum += computeWordScore(word);
  }
  return sum;
}
