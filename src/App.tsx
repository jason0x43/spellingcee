import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppError from './AppError';
import {
  computeScore,
  findValidWords,
  isPangram,
  permute,
  validateWord,
} from './wordUtil';
import useAppState from './hooks/useAppState';
import wordlist from './wordlist';
import Input from './Input';
import GameSelect from './GameSelect';
import Message from './Message';
import Letters from './Letters';
import Progress from './Progress';
import Words from './Words';
import './App.css';

const messageTimeout = 1000;

function App() {
  const [appState, , setGameState] = useAppState();
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [messageGood, setMessageGood] = useState<boolean>(false);
  const [input, setInput] = useState<string[]>([]);

  const { currentGame } = appState;
  const gameState = appState.games[currentGame];
  const center = currentGame[0];
  const { letters, words } = gameState;
  const disabled = messageVisible && input.length > 0;

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

  const handleLetterPress = useCallback(
    (letter) => {
      // Ignore keystrokes while a message is visible
      if (disabled) {
        return;
      }

      setInput([...input, letter]);
    },
    [input, disabled, setInput]
  );

  const handleDelete = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (disabled) {
      return;
    }

    setInput(input.slice(0, input.length - 1));
  }, [disabled, setInput, input]);

  const handleScramble = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (disabled) {
      return;
    }

    setGameState({ ...gameState, letters: permute(letters) });
  }, [disabled, setGameState, gameState, letters]);

  const handleEnter = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (disabled) {
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
      setGameState({ ...gameState, words: newWords });
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
  }, [
    center,
    currentGame,
    input,
    disabled,
    setGameState,
    gameState,
    validWords,
    words,
  ]);

  const handleKeyPress = useCallback(
    (event) => {
      // Ignore keystrokes while a message is visible
      if (disabled) {
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
    [handleDelete, handleEnter, handleScramble, input, disabled]
  );

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const timers: number[] = [];
    if (messageVisible) {
      timers.push(
        window.setTimeout(() => {
          setMessageVisible(false);
        }, messageTimeout)
      );
      timers.push(
        window.setTimeout(() => {
          setInput([]);
        }, 300)
      );
    } else {
      timers.push(window.setTimeout(() => setMessageGood(false), 300));
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
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
          <Message isVisible={messageVisible} isGood={messageGood}>
            {message}
          </Message>
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
          <GameSelect />
        </div>
      </div>
    </div>
  );
}

export default App;
