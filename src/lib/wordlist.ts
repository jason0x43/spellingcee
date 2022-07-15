import words10 from 'wordlist-english/english-words-10.json';
import words20 from 'wordlist-english/english-words-20.json';
import words35 from 'wordlist-english/english-words-35.json';
import words40 from 'wordlist-english/english-words-40.json';
import words50 from 'wordlist-english/english-words-50.json';
import words55 from 'wordlist-english/english-words-55.json';
import words60 from 'wordlist-english/english-words-60.json';
import { random } from './util';
import { isPangram, numUniqueLetters } from './words';

const filterWords = (word: string) =>
  // short words
  word.length >= 4 &&
  // no words with 's'
  !word.includes('s') &&
  // no words with both 'e' and 'r'
  !(word.includes('e') && word.includes('r')) &&
  // no words with more than 7 unique letters
  numUniqueLetters(word) <= 7;

export const wordlist = ([] as string[])
  .concat(words10, words20, words35, words40, words50, words55, words60)
  .filter(filterWords);

/**
 * Linearly search the word list for a pangram, starting from a random position.
 */
export function getRandomPangram(words = wordlist): string {
  const maxIndex = words.length - 1;
  const startIndex = random(maxIndex);
  for (let i = 0; i < words.length; i++) {
    const index = (i + startIndex) % words.length;
    const word = words[index];
    if (isPangram(word)) {
      return word;
    }
  }
  return '';
}
