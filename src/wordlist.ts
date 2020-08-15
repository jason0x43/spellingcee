import wordlist10 from 'wordlist-english/english-words-10.json';
import wordlist20 from 'wordlist-english/english-words-20.json';
import wordlist35 from 'wordlist-english/english-words-35.json';
import wordlist40 from 'wordlist-english/english-words-40.json';
import wordlist50 from 'wordlist-english/english-words-50.json';
// import wordlist55 from 'wordlist-english/english-words-55.json';
// import wordlist60 from 'wordlist-english/english-words-60.json';
// import wordlist70 from 'wordlist-english/english-words-70.json';

const getLongWords = (words: string[]) =>
  words.filter((word) => word.length >= 4);

const longWordList10 = getLongWords(wordlist10);
const longWordList20 = getLongWords(wordlist20);
const longWordList35 = getLongWords(wordlist35);
const longWordList40 = getLongWords(wordlist40);
const longWordList50 = getLongWords(wordlist50);
// const longWordList55 = getLongWords(wordlist55);
// const longWordList60 = getLongWords(wordlist60);
// const longWordList70 = getLongWords(wordlist70);

const wordlist = [
  ...longWordList10,
  ...longWordList20,
  ...longWordList35,
  ...longWordList40,
  ...longWordList50,
  // ...longWordList55,
  // ...longWordList60,
  // ...longWordList70,
];

export default wordlist;

export const blocks = [
  longWordList10.length,
  longWordList20.length,
  longWordList35.length,
  longWordList40.length,
  longWordList50.length,
  // longWordList55.length,
  // longWordList60.length,
  // longWordList70.length,
];
