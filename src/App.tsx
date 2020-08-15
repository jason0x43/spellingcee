import React, { useCallback, useEffect, useState } from 'react';
import { getLetters, findPangram } from './wordUtil';
import wordlist, { blocks } from './wordlist';
import classNames from 'classnames';
import './App.css';

type Check = (word: string) => string | undefined;

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

  console.log(pangram);

  const checks: Check[] = [
    // 1. only uses valid letters
    useCallback(
      (word) => {
        for (const char of word) {
          if (pangram.indexOf(char) === -1) {
            return 'Invalid letter';
          }
        }
      },
      [pangram]
    ),

    // 2. is at least 4 characters long
    useCallback((word) => {
      if (word.length < 4) {
        return 'Too short';
      }
    }, []),

    // 3. contains center letter
    useCallback(
      (word) => {
        if (word.indexOf(pangram[center]) === -1) {
          return 'Missing center letter';
        }
      },
      [pangram, center]
    ),

    // 4. is new word
    useCallback(
      (word) => {
        if (words.includes(word)) {
          return 'Already found';
        }
      },
      [words]
    ),

    // 5. is a valid word
    useCallback((word) => {
      if (!wordlist.includes(word)) {
        return 'Invalid word';
      }
    }, []),
  ];

  const handleKeyPress = useCallback(
    (event) => {
      const { key } = event;
      if (key.length > 1) {
        if (key === 'Backspace') {
          setInput(input.slice(0, input.length - 1));
        } else if (key === 'Enter') {
          const word = input.join('');
          let shouldAdd = true;
          for (const check of checks) {
            const message = check(word);
            if (message) {
              setMessage(message);
              shouldAdd = false;
              break;
            }
          }

          if (shouldAdd) {
            setWords([...words, word]);
          }

          setInput([]);
        }
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [input, words, checks]
  );

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(() => setMessage(undefined), 2000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="App">
      <div className="App-message">{message}</div>

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
    </div>
  );
}

export default App;
