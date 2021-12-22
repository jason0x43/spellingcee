import { words10, words20, words35, words40, words50 } from "./deps.ts";

const longWords = (word: string) => word.length > 4;
const longWords10 = words10.filter(longWords);
const longWords20 = words20.filter(longWords);
const longWords35 = words35.filter(longWords);
const longWords40 = words40.filter(longWords);
const longWords50 = words50.filter(longWords);

export const wordList = [
  ...longWords10,
  ...longWords20,
  ...longWords35,
  ...longWords40,
  ...longWords50,
];

export const blocks = [
  longWords10.length,
  longWords20.length,
  longWords35.length,
  longWords40.length,
  longWords50.length,
];

type Check = ({
  word,
  letters,
  center,
  foundWords,
}: {
  word: string;
  letters: string;
  center: string;
  foundWords?: string[];
}) => string | undefined;

const checks: Check[] = [
  // is at least 4 characters long
  ({ word }) => word.length < 4 ? "Too short" : undefined,

  // only uses valid letters
  ({ word, letters }) => {
    for (const char of word) {
      if (letters.indexOf(char) === -1) {
        return "Bad letter";
      }
    }
  },

  // contains center letter
  ({ word, center }) =>
    word.indexOf(center) === -1 ? "Missing center" : undefined,

  // is a valid word
  ({ word }) => !wordList.includes(word) ? "Not in word list" : undefined,

  // is a found word
  ({ word, foundWords }) =>
    foundWords && foundWords.includes(word) ? "Already found" : undefined,
];

export function validateWord({
  word,
  letters,
  center,
  foundWords,
}: {
  word: string;
  letters: string;
  center: string;
  foundWords?: string[];
}): string | undefined {
  for (const check of checks) {
    const message = check({
      word,
      foundWords,
      letters,
      center,
    });
    if (message) {
      return message;
    }
  }
}

export function findValidWords(key: string) {
  const validWords = wordList.filter(
    (word) =>
      !validateWord({
        word,
        letters: key,
        center: key[0],
      }),
  );

  return validWords;
}
