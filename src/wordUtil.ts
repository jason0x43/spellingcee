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

function permute(letters: string[]): string[] {
  if (letters.length === 1) {
    return letters;
  }
  const index = Math.floor(Math.random() * letters.length);
  const remaining = [
    ...letters.slice(0, index),
    ...letters.slice(index + 1),
  ];
  return [ letters[index], ...permute(remaining) ];
}

export function permuteLetters(letters: string[], center: string): string[] {
  const centerIndex = letters.indexOf(center);
  const remaining = [
    ...letters.slice(0, centerIndex),
    ...letters.slice(centerIndex + 1),
  ];
  const permutation = permute(remaining);
  return [
    ...permutation.slice(0, permutation.length / 2),
    center,
    ...permutation.slice(permutation.length / 2),
  ];
}

type Check = ({
  word,
  validWords,
  words,
  pangram,
  center,
}: {
  word: string;
  words?: string[];
  validWords: string[];
  pangram: Set<string>;
  center: string;
}) => string | undefined;

const checks: Check[] = [
  // is at least 4 characters long
  ({ word }) => {
    if (word.length < 4) {
      return 'Too short';
    }
  },

  // only uses valid letters
  ({ word, pangram }) => {
    for (const char of word) {
      if (!pangram.has(char)) {
        return 'Bad letter';
      }
    }
  },

  // contains center letter
  ({ word, center }) => {
    if (word.indexOf(center) === -1) {
      return 'Missing center letter';
    }
  },

  // is a valid word
  ({ word, validWords }) => {
    if (!validWords.includes(word)) {
      return 'Not in word list';
    }
  },

  // is a found word
  ({ word, words }) => {
    if (words && words.includes(word)) {
      return 'Already found';
    }
  },
];

export function validateWord({
  word,
  words,
  validWords,
  pangram,
  center,
}: {
  word: string;
  words?: string[];
  validWords: string[];
  pangram: string | Set<string>;
  center: string;
}): string | undefined {
  const pangramChars = typeof pangram === 'string' ? new Set(pangram) : pangram;
  for (const check of checks) {
    const message = check({
      word,
      validWords,
      words,
      pangram: pangramChars,
      center,
    });
    if (message) {
      return message;
    }
  }
}

export function findValidWords({
  allWords,
  pangram,
  center,
}: {
  allWords: string[];
  pangram: string;
  center: string;
}): string[] {
  const pangramChars = new Set(pangram);
  return allWords.filter(
    (word) =>
      !validateWord({
        validWords: allWords,
        word,
        pangram: pangramChars,
        center,
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
