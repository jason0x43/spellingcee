import words10 from 'wordlist-english/english-words-10.json';
import words20 from 'wordlist-english/english-words-20.json';
import words35 from 'wordlist-english/english-words-35.json';
import words40 from 'wordlist-english/english-words-40.json';
import words50 from 'wordlist-english/english-words-50.json';
import { random } from './util';
import { isPangram } from './words';

const filterWords = (word: string) =>
  word.length >= 4 &&
  !word.includes('s') &&
  !(word.includes('e') && word.includes('r'));

const filteredWords10 = words10.filter(filterWords);
const filteredWords20 = words20.filter(filterWords);
const filteredWords35 = words35.filter(filterWords);
const filteredWords40 = words40.filter(filterWords);
const filteredWords50 = words50.filter(filterWords);

export const wordlist = [
  ...filteredWords10,
  ...filteredWords20,
  ...filteredWords35,
  ...filteredWords40,
  ...filteredWords50
];

/**
 * Linearly search the word list for a pangram, starting from a random position.
 */
export function getRandomPangram(): string {
  const maxIndex = wordlist.length - 1;
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
