import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import './App.css';
import AppError from './AppError';
import { createStorage, saveLocalState } from './storage';
import GameSelect from './GameSelect';
import Input from './Input';
import Letters from './Letters';
import { getCurrentUser } from './auth';
import { createGame } from './gameUtils';
import { createLogger } from './logging';
import { Game, Subscription, User, Words as WordsType } from './types';
import MenuBar from './MenuBar';
import Message from './Message';
import Modal from './Modal';
import Progress from './Progress';
import {
  getCenter,
  getGame,
  getGameId,
  getError,
  getGames,
  getInput,
  getLetters,
  getMaxScore,
  getMessage,
  getScore,
  getUser,
  getUsers,
  getUserId,
  getWords,
  init,
  isLoggedIn,
  reducer,
} from './state';
import wordlist from './wordlist';
import Words from './Words';
import { findValidWords, isPangram, validateWord } from './wordUtil';

const messageTimeout = 1000;
const inputShakeTimeout = 300;
const renderWindow = 500;
const renderLimit = 20;
const logger = createLogger({ prefix: 'App' });
let renderCount = 0;
const defaultStorage = createStorage();
const initialState = init();

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [starting, setStarting] = useState(true);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageGood, setMessageGood] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const storageRef = useRef(defaultStorage);
  const wordsSubscription = useRef<Subscription>();

  const center = getCenter(state);
  const error = getError(state);
  const game = getGame(state);
  const input = getInput(state);
  const letters = getLetters(state);
  const maxScore = getMaxScore(state);
  const score = getScore(state);
  const user = getUser(state);
  const userId = getUserId(state);
  const users = getUsers(state);
  const words = getWords(state);

  renderCount++;
  if (renderCount > renderLimit) {
    throw new Error(`Too many renders (${renderCount} in ${renderWindow} ms)`);
  }

  // Set the current user, which resets most of the state
  const setUser = useCallback(async (user: User | undefined) => {
    user ??= { userId: 'local' }

    logger.debug('Setting user to', user);

    const storage = createStorage(user.userId);
    storageRef.current = storage;

    const userMeta = await storage.loadUserMeta();
    let gameId: string | undefined;
    let game: Game | undefined;

    if (userMeta) {
      logger.debug('Loaded user metadata');
      try {
        gameId = userMeta.gameId;
        game = await storage.loadGame(gameId);
      } catch (error) {
        logger.error('Error loading game:', error);
      }
    } else {
      logger.debug('No user metadata, creating new game');
      try {
        game = createGame({ userId });
        gameId = await storage.addGame(game);
      } catch (error) {
        logger.error('Error adding game:', error);
      }
    }

    if (game && gameId) {
      dispatch({
        type: 'setState',
        payload: {
          user,
          gameId,
          game,
          input: [],
          letters: game.key.split(''),
          words: {},
        },
      });
    }
  }, []);

  useEffect(() => {
    logger.debug('Rendering app for the first time');

    // Start an interval to reset the render count periodically. This will let us
    // see if there are an excessive number of renders happening over a
    // particular time frame.
    const renderTimer = setInterval(() => {
      renderCount = 0;
    }, renderWindow);

    // Initialize state
    let startTimer: ReturnType<typeof setTimeout>;
    const startTime = Date.now();
    (async () => {
      const user = await getCurrentUser();
      await setUser(user);
      const delay = Math.max(0, 1000 - (Date.now() - startTime));
      startTimer = setTimeout(() => setStarting(false), delay);
    })();

    return () => {
      clearInterval(renderTimer);
      clearTimeout(startTimer);
    };
  }, []);

  useEffect(() => {
    logger.debug('AppState set to', state);
  }, [state]);

  // Save the state locally whenever relevant properties change
  useEffect(() => {
    saveLocalState(getUserId(state), state);
  }, [game, input, userId]);

  // If we're logged in, load the game state
  useEffect(() => {
    if (!user) {
      return;
    }

    (async () => {
      storageRef.current = createStorage(userId);
    })();
  }, [user]);

  // Emit an error if the input word is too long
  useEffect(() => {
    if (input.length > 19) {
      dispatch({ type: 'setMessage', payload: 'Word too long' });
    }
  }, [input.length, dispatch]);

  const message = getMessage(state);

  // If we have a message, display it
  useEffect(() => {
    if (message) {
      setMessageVisible(true);
      setInputDisabled(true);

      // After a while, hide the message and clear the input
      const timers = [
        setTimeout(() => {
          logger.log('Hiding message');
          setMessageVisible(false);
        }, messageTimeout),

        setTimeout(() => {
          dispatch({ type: 'clearMessage' });
          setMessageGood(false);
        }, messageTimeout + 100),

        setTimeout(() => {
          dispatch({ type: 'clearInput' });
          setInputDisabled(false);
        }, inputShakeTimeout),
      ];

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
      };
    }
  }, [message]);

  // Determine the total set of valid words and the maximum possible score
  const validWords = useMemo(() => {
    return findValidWords({
      allWords: wordlist,
      pangram: game.key,
      center,
    });
  }, [center, game.key]);

  const gameId = getGameId(state);

  // Watch for remote updates to the word list when the game changes
  useEffect(() => {
    try {
      if (wordsSubscription.current) {
        wordsSubscription.current.off();
        wordsSubscription.current = undefined;
      }
    } catch (error) {
      logger.error('Error unsubscribing from updates');
    }

    (async () => {
      logger.debug('Adding subscription to words for', gameId);

      try {
        wordsSubscription.current = storageRef.current.subscribeToWords(
          gameId,
          (words) => {
            logger.debug('Received words');
            if (words) {
              dispatch({ type: 'setWords', payload: words });
            }
          }
        );

        const value = await wordsSubscription.current!.initialValue ?? {};
        logger.debug('Got initial words:', value);
        dispatch({
          type: 'setWords',
          payload: value as WordsType
        });
      } catch (error) {
        logger.error('Error subscribing to game updates:', error);
      }
    })();

    return () => {
      if (wordsSubscription.current) {
        wordsSubscription.current.off();
        wordsSubscription.current = undefined;
      }
    };
  }, [user, gameId]);

  // Handle a letter activation
  const handleLetterPress = useCallback(
    (letter: string) => {
      if (!inputDisabled) {
        dispatch({ type: 'addInput', payload: letter });
      }
    },
    [inputDisabled, dispatch]
  );

  // Delete the last input character
  const deleteLastInput = useCallback(() => {
    if (!inputDisabled) {
      dispatch({ type: 'deleteInput' });
    }
  }, [inputDisabled, dispatch]);

  // Permute the letters
  const mixLetters = useCallback(() => {
    if (!inputDisabled) {
      dispatch({ type: 'mixLetters' });
    }
  }, [inputDisabled, dispatch]);

  // Handle a word submission
  const submitWord = useCallback(() => {
    if (inputDisabled) {
      return;
    }

    const word = input.join('');
    logger.log('validating', word);
    const message = validateWord({
      words: Object.keys(words),
      validWords,
      word,
      pangram: game.key,
      center,
    });

    if (message) {
      setMessageGood(false);
      dispatch({ type: 'setMessage', payload: message });
      setMessageVisible(true);
      setInputDisabled(true);
    } else {
      (async () => {
        logger.debug('Adding word', word);
        try {
          await storageRef.current.addWord(gameId, word);
          dispatch({ type: 'addWord', payload: word });

          if (isPangram(word)) {
            setMessageGood(false);
            dispatch({ type: 'setMessage', payload: 'Pangram!' });
            setMessageVisible(true);
          } else {
            setMessageGood(true);
            dispatch({ type: 'setMessage', payload: 'Great!' });
            setMessageVisible(true);
          }
        } catch (error) {
          logger.error('Error saving word:', error);
        }
      })();
    }
  }, [
    center,
    game.key,
    dispatch,
    input,
    inputDisabled,
    setInputDisabled,
    validWords,
    words,
  ]);

  // Handle a general keypress event
  const handleKeyPress = useCallback(
    (event) => {
      if (inputDisabled) {
        return;
      }

      // Ignore meta/control keys
      if (event.metaKey) {
        return;
      }

      const { key } = event;

      if (key.length > 1) {
        if (key === 'Backspace' || key === 'Delete') {
          deleteLastInput();
        } else if (key === 'Enter') {
          submitWord();
        }
      } else if (key === ' ') {
        mixLetters();
      } else if ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z')) {
        dispatch({ type: 'addInput', payload: event.key });
      }
    },
    [deleteLastInput, inputDisabled, mixLetters, submitWord]
  );

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // If there was an error, display an error message rather than the normal UI
  if (error) {
    logger.error(error);
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

  return (
    <div className="App">
      {starting ? (
        <Modal />
      ) : (
        <Fragment>
          <MenuBar user={user} setUser={setUser} />
          <div className="App-letters-wrapper">
            <div className="App-letters">
              <Message isVisible={messageVisible} isGood={messageGood}>
                {message}
              </Message>
              <Input
                input={input}
                pangram={game.key}
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
              <GameSelect
                dispatch={dispatch}
                game={game}
                gameId={gameId}
                games={getGames(state)}
                isLoggedIn={isLoggedIn(state)}
                userId={userId}
                users={users}
              />
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default App;
