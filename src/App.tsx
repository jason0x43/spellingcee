import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppError from './AppError';
import {
  computeScore,
  findValidWords,
  isPangram,
  permute,
  validateWord,
} from './wordUtil';
import { GameState } from './state';
import { useAppState } from './hooks';
import wordlist from './wordlist';
import Input from './Input';
import Message from './Message';
import Letters from './Letters';
import Progress from './Progress';
import Words from './Words';
import './App.css';

const messageTimeout = 1000;

function App() {
  const [appState, setAppState] = useAppState();
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [messageGood, setMessageGood] = useState<boolean>(false);
  const [input, setInput] = useState<string[]>([]);

  const { currentGame } = appState;
  const gameState = appState.games[currentGame];
  const center = currentGame[0];
  const { letters, words } = gameState;

  useEffect(() => {
    if (input.length > 19) {
      setMessage('Word too long');
      setMessageVisible(true);
    }
  }, [input, setMessage, setMessageVisible]);

  const validWords = useMemo(() => {
    return findValidWords({
      allWords: wordlist,
      pangram: currentGame,
      center,
    });
  }, [currentGame, center]);
  const maxScore = useMemo(() => computeScore(validWords), [validWords]);

  const updateState = useCallback(
    (state: Partial<GameState>) => {
      setAppState({
        ...appState,
        games: {
          ...appState.games,
          [appState.currentGame!]: {
            ...appState.games[appState.currentGame!],
            ...state,
          },
        },
      });
    },
    [appState, setAppState]
  );

  const handleLetterPress = useCallback(
    (letter) => {
      // Ignore keystrokes while a message is visible
      if (messageVisible) {
        return;
      }

      setInput([...input, letter]);
    },
    [input, messageVisible, setInput]
  );

  const handleDelete = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (messageVisible) {
      return;
    }

    setInput(input.slice(0, input.length - 1));
  }, [messageVisible, setInput, input]);

  const handleScramble = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (messageVisible) {
      return;
    }

    updateState({ letters: permute(letters) });
  }, [messageVisible, updateState, letters]);

  const handleEnter = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (messageVisible) {
      return;
    }

    const word = input.join('');
    const message = validateWord({
      words,
      validWords,
      word,
      pangram: currentGame,
      center,
    });

    if (message) {
      setMessage(message);
      setMessageGood(false);
      setMessageVisible(true);
    } else {
      const newWords = [...words, word];
      updateState({ words: newWords });
      if (isPangram(word)) {
        setMessage('Pangram!');
        setMessageGood(false);
        setMessageVisible(true);
      } else {
        setMessage('Great!');
        setMessageGood(true);
        setMessageVisible(true);
      }
      setInput([]);
    }
  }, [center, currentGame, input, messageVisible, updateState, validWords, words]);

  const handleKeyPress = useCallback(
    (event) => {
      // Ignore keystrokes while a message is visible
      if (messageVisible) {
        return;
      }

      const { key } = event;
      if (key.length > 1) {
        if (key === 'Backspace') {
          handleDelete();
        } else if (key === 'Enter') {
          handleEnter();
        }
      } else if (key === ' ') {
        handleScramble();
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [handleDelete, handleEnter, handleScramble, input, messageVisible]
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
        setTimeout(() => setMessageGood(false), 300);
      }, messageTimeout);
      return () => clearTimeout(timer);
    }
  }, [messageVisible]);

  const score = useMemo(() => computeScore(words), [words]);

  if (appState.error) {
    const { error } = appState;
    console.error(error);
    const message =
      typeof error === 'string'
        ? error
        : AppError.isAppError(error)
        ? error.appMessage
        : 'There was an error loading the application';
    return (
      <div className="App">
        <div className="App-error">{message}</div>
      </div>
    );
  }

  if (!appState.games[appState.currentGame]) {
    return (
      <div className="App">
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="App-letters-wrapper">
        <div className="App-letters">
          <Message isVisible={messageVisible} isGood={messageGood}>{message}</Message>
          <Input
            input={input}
            pangram={currentGame}
            isInvalid={messageVisible && !messageGood}
          />
          <Letters
            letters={letters}
            center={center}
            onLetter={handleLetterPress}
            onDelete={handleDelete}
            onScramble={handleScramble}
            onEnter={handleEnter}
          />
        </div>
      </div>

      <div className="App-words-wrapper">
        <div className="App-words">
          <Progress score={score} maxScore={maxScore} />
          <Words words={words} validWords={validWords} />
          <div className="App-gameId">Game ID: {appState.currentGame}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
