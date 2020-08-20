import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeScore,
  getLetters,
  findPangram,
  findValidWords,
  isPangram,
  permuteLetters,
  validateWord,
} from './wordUtil';
import wordlist, { blocks } from './wordlist';
import random from './random';
import Input from './Input';
import Message from './Message';
import Letters from './Letters';
import Words from './Words';
import './App.css';

const messageTimeout = 1500;

export interface GameState {
  pangram: string;
  words: string[];
  letters: string[];
  center: string;
}

export interface AppProps {
  gameId: string;
  savedState?: GameState;
  saveState(state: Partial<GameState>): void;
}

function initializeState(
  saveState: AppProps['saveState']
): GameState {
  const pangram = findPangram(
    wordlist,
    blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4]
  );
  const uniqueLetters = getLetters(pangram);
  const center = uniqueLetters[random(uniqueLetters.length)];
  const letters = permuteLetters(uniqueLetters, center);
  const words: string[] = [];

  const newState = { pangram, center, letters, words };
  saveState(newState);
  return newState;
}

function App(props: AppProps) {
  const { gameId, savedState, saveState } = props;

  const [gameState, setGameState] = useState<GameState>(
    savedState ?? initializeState(saveState)
  );
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [input, setInput] = useState<string[]>([]);

  const { pangram, center, letters, words } = gameState;

  const validWords = useMemo(
    () =>
      findValidWords({
        allWords: wordlist,
        pangram: pangram,
        center: center,
      }),
    [pangram, center]
  );
  const maxScore = useMemo(() => computeScore(validWords), [validWords]);

  const updateState = useCallback(
    (state: Partial<GameState>) => {
      const newState = {
        ...gameState,
        ...state,
      };
      setGameState(newState);
      saveState(newState);
    },
    [gameState, saveState]
  );

  const handleKeyPress = useCallback(
    (event) => {
      const { key } = event;
      if (key.length > 1) {
        if (key === 'Backspace') {
          setInput(input.slice(0, input.length - 1));
        } else if (key === 'Enter') {
          const word = input.join('');
          const { words, pangram, center } = gameState;
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
            const newWords = [...words, word];
            updateState({ words: newWords });
            if (isPangram(word)) {
              setMessage('Pangram!');
              setMessageVisible(true);
            }
          }

          setInput([]);
        }
      } else if (key === ' ') {
        const { letters, center } = gameState;
        updateState({ letters: permuteLetters(letters, center) });
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [input, validWords, gameState, updateState]
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
      <div className="App-letters">
        <Message isVisible={messageVisible}>{message}</Message>
        <Input input={input} pangram={pangram} />
        <Letters letters={letters} center={center} />
      </div>

      <div className="App-words">
        <div className="App-score">
          <div>
            {computeScore(words)} / {maxScore} points
          </div>
          <div>
            {words.length} / {validWords.length} words
          </div>
        </div>
        <Words words={words} />
      </div>

      <pre className="App-debug">
        id: {gameId}
        {'\n'}
        pangram: {pangram}
        {'\n'}
        number of valid words: {validWords.length}
      </pre>
    </div>
  );
}

export default App;
