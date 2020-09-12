import random from './random';

export function isPangram(word: string) {
  return new Set(word).size === 7;
}

export function findPangram(words: string[], startIndex: number): string {
  let pangram = words[0];
  for (let i = startIndex; i < words.length; i++) {
    const word = words[i];
    if (isPangram(word)) {
      pangram = word;
      break;
    }
  }
  if (!pangram) {
    for (let i = 0; i < startIndex; i++) {
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

export function permute(
  letters: string[],
  rng = random
): string[] {
  if (letters.length === 1) {
    return letters;
  }
  const index = rng(letters.length);
  const remaining = [...letters.slice(0, index), ...letters.slice(index + 1)];
  return [letters[index], ...permute(remaining, rng)];
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
  pangram: string;
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
      if (pangram.indexOf(char) === -1) {
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
  pangram: string;
  center: string;
}): string | undefined {
  for (const check of checks) {
    const message = check({
      word,
      validWords,
      words,
      pangram,
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
  return allWords.filter(
    (word) =>
      !validateWord({
        validWords: allWords,
        word,
        pangram,
        center,
      })
  );
}

const thresholds = [
  { label: 'beginner', threshold: 0.0 },
  { label: 'good start', threshold: 0.02 },
  { label: 'moving up', threshold: 0.05 },
  { label: 'good', threshold: 0.08 },
  { label: 'solid', threshold: 0.15 },
  { label: 'nice', threshold: 0.25 },
  { label: 'great', threshold: 0.4 },
  { label: 'amazing', threshold: 0.5 },
  { label: 'genius', threshold: 0.7 },
];

export function getProgressLabel(
  score: number,
  maxScore: number
): string | undefined {
  const ratio = score / maxScore;
  let i = 0;
  while (i < thresholds.length && ratio > thresholds[i].threshold) {
    i++;
  }
  return thresholds[Math.max(i - 1, 0)].label;
}

export function getProgressThresholds(maxScore: number) {
  return [
    { label: 'beginner', threshold: 0 },
    { label: 'good start', threshold: Math.ceil(0.02 * maxScore) },
    { label: 'moving up', threshold: Math.ceil(0.05 * maxScore) },
    { label: 'good', threshold: Math.ceil(0.08 * maxScore) },
    { label: 'solid', threshold: Math.ceil(0.15 * maxScore) },
    { label: 'nice', threshold: Math.ceil(0.25 * maxScore) },
    { label: 'great', threshold: Math.ceil(0.4 * maxScore) },
    { label: 'amazing', threshold: Math.ceil(0.5 * maxScore) },
    { label: 'genius', threshold: Math.ceil(0.7 * maxScore) },
    { label: 'queen bee', threshold: maxScore },
  ];
}
