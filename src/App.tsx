import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeScore,
  getLetters,
  findPangram,
  findValidWords,
  validateWord,
} from './wordUtil';
import wordlist, { blocks } from './wordlist';
import classNames from 'classnames';
import './App.css';

function App() {
  const [pangram] = useState(
    findPangram(
      wordlist,
      blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4]
    )
  );
  const [center] = useState(Math.floor(Math.random() * pangram.length));
  const [letters] = useState(getLetters(pangram));
  const [input, setInput] = useState<string[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const validWords = useMemo(
    () => findValidWords({ allWords: wordlist, pangram, center }),
    [pangram, center]
  );
  const totalScore = useMemo(() => computeScore(validWords), [validWords]);

  const [debug] = useState<string>(
    `pangram: ${pangram}\n` +
      `letters: ${letters}\n` +
      `permutedLetters: ${permutedLetters}\n` +
      `number valid words: ${validWords.length}\n` +
      `score: ${totalScore}`
  );

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
            center: pangram[center],
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
      const timer = setTimeout(() => setMessageVisible(false), 2000);
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
        {letters.map((letter, i) => {
          const className = classNames({
            'App-letter': true,
            'App-letter-center': letter === pangram[center],
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
        {debug}
      </pre>
    </div>
  );
}

export default App;
