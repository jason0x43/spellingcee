import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeScore,
  getLetters,
  findPangram,
  findValidWords,
  permuteLetters,
  validateWord,
} from './wordUtil';
import wordlist, { blocks } from './wordlist';
import Input from './Input';
import Message from './Message';
import Letters from './Letters';
import Words from './Words';
import './App.css';

const messageTimeout = 1000;

function App() {
  const [pangram] = useState(
    findPangram(
      wordlist,
      blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4]
    )
  );
  const [input, setInput] = useState<string[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const uniqueLetters = useMemo(() => getLetters(pangram), [pangram]);
  const center = useMemo(
    () => uniqueLetters[Math.floor(Math.random() * uniqueLetters.length)],
    [uniqueLetters]
  );
  const validWords = useMemo(
    () => findValidWords({ allWords: wordlist, pangram, center }),
    [pangram, center]
  );
  const maxScore = useMemo(() => computeScore(validWords), [validWords]);
  const [letters, setLetters] = useState(permuteLetters(uniqueLetters, center));

  const handleKeyPress = useCallback(
    (event) => {
      const { key } = event;
      if (key.length > 1) {
        if (key === 'Backspace') {
          setInput(input.slice(0, input.length - 1));
        } else if (key === 'Enter') {
          const word = input.join('');
          const message = validateWord({
            words,
            validWords,
            word,
            pangram,
            center,
          });
          if (message) {
            setMessage(message);
            setMessageVisible(true);
          } else {
            setWords([...words, word]);
          }

          setInput([]);
        }
      } else if (key === ' ') {
        setLetters(permuteLetters(uniqueLetters, center));
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [input, words, center, pangram, uniqueLetters, validWords]
  );

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (messageVisible) {
      const timer = setTimeout(() => setMessageVisible(false), messageTimeout);
      return () => clearTimeout(timer);
    }
  }, [messageVisible]);

  return (
    <div className="App">
      <Message isVisible={messageVisible}>{message}</Message>

      <div className="App-letters">
        <Input input={input} pangram={pangram} />
        <Letters letters={letters} center={center} />
      </div>

      <Words words={words} />

      <pre className="App-debug">
        pangram: {pangram}
        {'\n'}
        letters: {uniqueLetters}
        {'\n'}
        center: {center}
        {'\n'}
        permuted letters: {letters}
        {'\n'}
        number of valid words: {validWords.length}
        {'\n'}
        max score: {maxScore}
      </pre>
    </div>
  );
}

export default App;
