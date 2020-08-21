import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeScore,
  findValidWords,
  isPangram,
  permuteLetters,
  validateWord,
} from './wordUtil';
import { GameState } from './state';
import wordlist from './wordlist';
import Input from './Input';
import Message from './Message';
import Letters from './Letters';
import Words from './Words';
import './App.css';

const messageTimeout = 1500;

export interface AppProps {
  gameId: string;
  initialState: GameState;
  saveState(state: Partial<GameState>): void;
}

function App(props: AppProps) {
  const { gameId, initialState, saveState } = props;

  const [gameState, setGameState] = useState<GameState>(initialState);
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
    },
    [gameState]
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
            setInput([]);
          }
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
      const timer = setTimeout(() => {
        setMessageVisible(false);
        setInput([]);
      }, messageTimeout);
      return () => clearTimeout(timer);
    }
  }, [messageVisible]);

  useEffect(() => {
    saveState(gameState);
  }, [gameState, saveState]);

  return (
    <div className="App">
      <div className="App-letters">
        <Message isVisible={messageVisible}>{message}</Message>
        <Input input={input} pangram={pangram} isInvalid={messageVisible} />
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
