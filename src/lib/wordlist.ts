import words10 from 'wordlist-english/english-words-10.json';
import words20 from 'wordlist-english/english-words-20.json';
import words35 from 'wordlist-english/english-words-35.json';
import words40 from 'wordlist-english/english-words-40.json';
import words50 from 'wordlist-english/english-words-50.json';
import { random } from './util';
import { isPangram } from './words';

const longWords = (word: string) => word.length >= 4;
const longWords10 = words10.filter(longWords);
const longWords20 = words20.filter(longWords);
const longWords35 = words35.filter(longWords);
const longWords40 = words40.filter(longWords);
const longWords50 = words50.filter(longWords);

export const wordlist = [
  ...longWords10,
  ...longWords20,
  ...longWords35,
  ...longWords40,
  ...longWords50
];

const blocks = [
  longWords10.length,
  longWords20.length,
  longWords35.length,
  longWords40.length,
  longWords50.length
];

/**
 * Linearly search the word list for a pangram, starting from a random position.
 */
export function getRandomPangram(): string {
  const maxIndex = blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4];
  const startIndex = random(maxIndex);
  for (let i = 0; i < wordlist.length; i++) {
    const index = (i + startIndex) % wordlist.length;
    const word = wordlist[index];
    if (isPangram(word)) {
      return word;
    }
  }
  return '';
}

/**
 * Get all the valid words for a given key
 */
export function getValidWords(key: string) {
  const center = key[0];
  const keySet = new Set([...key]);
  return wordlist.filter((word) => {
    const wordSet = new Set([...word]);

    // The word must contain the center letter
    if (!wordSet.has(center)) {
      return false;
    }

    // All the characters in the word must be in the game key
    for (const char of wordSet) {
      if (!keySet.has(char)) {
        return false;
      }
    }

    return true;
  });
}
