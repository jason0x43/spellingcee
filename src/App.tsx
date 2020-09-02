import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import MenuBar from './MenuBar';
import Message from './Message';
import Letters from './Letters';
import Progress from './Progress';
import Words from './Words';
import Modal from './Modal';
import { getCurrentUser } from './firebase';
import './App.css';

const messageTimeout = 1000;
const inputShakeTimeout = 300;

function App() {
  const [starting, setStarting] = useState(true);
  const [appState, setAppState, setGameState] = useAppState();
  const [message, setMessage] = useState<string>();
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [messageGood, setMessageGood] = useState<boolean>(false);
  const [input, setInput] = useState<string[]>([]);
  const [inputDisabled, setInputDisabled] = useState(false);

  const { currentGame } = appState;
  const gameState = appState.games[currentGame];
  const center = currentGame[0];
  const { letters, words } = gameState;

  // Check the login state of the application
  useEffect(() => {
    (async function () {
      const user = await getCurrentUser();
      if (user) {
        setAppState({
          ...appState,
          user,
        });
      }
      setTimeout(() => setStarting(false), 1000);
    })();
  }, []);

  // Emit an error if the input word is too long
  useEffect(() => {
    if (input.length > 19) {
      setMessage('Word too long');
      setMessageVisible(true);
      setInputDisabled(true);
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

  // Handle a letter activation
  const handleLetterPress = useCallback(
    (letter) => {
      // Ignore keystrokes while a message is visible
      if (inputDisabled) {
        return;
      }

      setInput([...input, letter]);
    },
    [input, inputDisabled, setInput]
  );

  // Delete the last input character
  const deleteLastInput = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (inputDisabled) {
      return;
    }

    setInput(input.slice(0, input.length - 1));
  }, [inputDisabled, setInput, input]);

  // Permute the letters
  const mixLetters = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (inputDisabled) {
      return;
    }

    setGameState({ ...gameState, letters: permute(letters) });
  }, [inputDisabled, setGameState, gameState, letters]);

  // Handle a word submission
  const submitWord = useCallback(() => {
    // Ignore keystrokes while a message is visible
    if (inputDisabled) {
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
      setInputDisabled(true);
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
    inputDisabled,
    setGameState,
    gameState,
    validWords,
    words,
  ]);

  // Handle a general keypress event
  const handleKeyPress = useCallback(
    (event) => {
      // Ignore keystrokes while a message is visible
      if (inputDisabled) {
        return;
      }

      const { key } = event;
      if (key.length > 1) {
        if (key === 'Backspace') {
          deleteLastInput();
        } else if (key === 'Enter') {
          submitWord();
        }
      } else if (key === ' ') {
        mixLetters();
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        setInput([...input, event.key]);
      }
    },
    [deleteLastInput, submitWord, mixLetters, input, inputDisabled]
  );

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  // Hide the message, clear and enable the input area
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
          setInputDisabled(false);
        }, inputShakeTimeout)
      );
    } else {
      timers.push(
        window.setTimeout(() => setMessageGood(false), inputShakeTimeout)
      );
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [messageVisible]);

  const score = useMemo(() => computeScore(words), [words]);

  useEffect(() => {
    // Do a pre-check before calling setGameState since setGameState will cause
    // this effect to run again.
    if (
      gameState.maxScore !== maxScore ||
      gameState.totalWords !== validWords.length ||
      gameState.score !== score
    ) {
      console.log(`difference in (${gameState.maxScore} vs ${maxScore}), (${gameState.totalWords} vs ${validWords.length}), (${gameState.score} vs ${score})`);
      setGameState({
        ...gameState,
        maxScore,
        totalWords: validWords.length,
        score,
      });
    }
  }, [gameState, maxScore, setGameState, validWords, score]);

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
      {starting ? (
        <Modal />
      ) : (
        <Fragment>
          <MenuBar />
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
                onDelete={deleteLastInput}
                onScramble={mixLetters}
                onEnter={submitWord}
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
        </Fragment>
      )}
    </div>
  );
}

export default App;
