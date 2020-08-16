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
import classNames from 'classnames';
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

  const letters = useMemo(() => getLetters(pangram), [pangram]);
  const center = useMemo(
    () => letters[Math.floor(Math.random() * letters.length)],
    [letters]
  );
  const permutedLetters = useMemo(() => permuteLetters(letters, center), [
    center,
    letters,
  ]);
  const validWords = useMemo(
    () => findValidWords({ allWords: wordlist, pangram, center }),
    [pangram, center]
  );
  const totalScore = useMemo(() => computeScore(validWords), [validWords]);

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
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [input, words, center, pangram, validWords]
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

  const messageClass = classNames({
    'App-message': true,
    'App-message-visible': messageVisible,
  });

  return (
    <div className="App">
      <div className={messageClass}>{message}</div>

      <div className="App-words">
        {words.map((word, i) => {
          return (
            <div key={i} className="App-word">
              {word}
            </div>
          );
        })}
      </div>

      <div className="App-letters">
        {permutedLetters.map((letter, i) => {
          const className = classNames({
            'App-letter': true,
            'App-letter-center': letter === center,
          });
          return (
            <div key={i} className={className}>
              {letter}
            </div>
          );
        })}
      </div>

      <div className="App-input">
        {input.map((letter, i) => {
          const className = classNames({
            'App-input-letter': true,
            'App-input-letter-invalid': !pangram.includes(letter),
          });
          return (
            <div key={i} className={className}>
              {letter}
            </div>
          );
        })}
      </div>

      <pre className="App-debug">
        pangram: {pangram}{'\n'}
        letters: {letters}{'\n'}
        center: {center}{'\n'}
        permutedLetters: {permutedLetters}{'\n'}
        number valid words: {validWords.length}{'\n'}
        score: {totalScore}
      </pre>
    </div>
  );
}

export default App;
