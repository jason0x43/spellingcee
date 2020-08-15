import wordlist10 from 'wordlist-english/english-words-10.json';
import wordlist20 from 'wordlist-english/english-words-20.json';
import wordlist35 from 'wordlist-english/english-words-35.json';
import wordlist40 from 'wordlist-english/english-words-40.json';
import wordlist50 from 'wordlist-english/english-words-50.json';
import wordlist55 from 'wordlist-english/english-words-55.json';
import wordlist60 from 'wordlist-english/english-words-60.json';
import wordlist70 from 'wordlist-english/english-words-70.json';

const wordlist = [
  ...wordlist10,
  ...wordlist20,
  ...wordlist35,
  ...wordlist40,
  ...wordlist50,
  ...wordlist55,
  ...wordlist60,
  ...wordlist70,
];

export default wordlist;

export const blocks = [
  wordlist10.length,
  wordlist20.length,
  wordlist35.length,
  wordlist40.length,
  wordlist50.length,
  wordlist55.length,
  wordlist60.length,
  wordlist70.length,
]
