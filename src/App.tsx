import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
  useState,
} from 'react';
import './App.css';
import AppError from './AppError';
import { getCurrentUser } from './auth';
import {
  loadLocalGames,
  loadUsers,
  loadRemoteGames,
  saveLocalGames,
  saveProfile,
  saveRemoteGame,
  saveRemoteGames,
  subscribeToGame,
  Subscription,
} from './storage';
import GameSelect from './GameSelect';
import useUpdateEffect from './hooks/useUpdateEffect';
import Input from './Input';
import Letters from './Letters';
import { createLogger } from './logging';
import MenuBar from './MenuBar';
import Message from './Message';
import Modal from './Modal';
import Progress from './Progress';
import { init, reducer } from './state';
import { Games } from './types';
import wordlist from './wordlist';
import Words from './Words';
import {
  computeScore,
  findValidWords,
  isPangram,
  validateWord,
} from './wordUtil';

const messageTimeout = 1000;
const inputShakeTimeout = 300;
const renderWindow = 500;
const renderLimit = 20;
const logger = createLogger({prefix: 'App'});
let renderCount = 0;

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const [starting, setStarting] = useState(true);
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [messageGood, setMessageGood] = useState<boolean>(false);
  const [inputDisabled, setInputDisabled] = useState(false);

  const { error, message, input, user } = state;
  const currentGame = state.games[state.currentGame];
  const center = currentGame.key[0];
  const { letters, score, words } = currentGame;

  renderCount++;
  if (renderCount > renderLimit) {
    throw new Error(`Too many renders (${renderCount} in ${renderWindow} ms)`);
  }

  // Start an interval to reset the render count periodically. This will let us
  // see if there are an excessive number of renders happening over a
  // particular time frame.
  useEffect(() => {
    const renderTimer = setInterval(() => {
      renderCount = 0;
    }, renderWindow);
    return () => {
      clearInterval(renderTimer);
    };
  }, []);

  // Check for a logged in user
  useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout>;

    (async () => {
      const user = await getCurrentUser();
      dispatch({ type: 'setUser', payload: user });

      if (user || user === null) {
        startTimer = setTimeout(() => setStarting(false), 1000);
      }
    })();

    return () => {
      clearTimeout(startTimer);
    };
  }, []);

  // Load the remote game state and merge it into the local state. Save the
  // result back to the remote.
  useEffect(() => {
    (async () => {
      const localGames = loadLocalGames(user?.userId);
      if (localGames) {
        dispatch({ type: 'setGames', payload: localGames });
      }

      if (user) {
        logger.log('User is logged in');
        saveProfile(user);

        let remoteGames: Games | undefined;

        loadUsers();

        try {
          remoteGames = await loadRemoteGames(user.userId);
        } catch (error) {
          logger.error('Error loading remote games:', error);
        }

        if (remoteGames) {
          let localGames = state.games;
          for (const id of Object.keys(remoteGames)) {
            const localGame = localGames[id];
            const remoteGame = remoteGames[id];

            if (
              !localGame ||
              (remoteGame.lastUpdated > localGame.lastUpdated &&
                remoteGame.words.length > 0)
            ) {
              localGames = {
                ...localGames,
                [id]: remoteGame,
              };
            }
          }

          saveLocalGames(localGames, user.userId);
          try {
            await saveRemoteGames(user.userId, localGames);
          } catch (error) {
            logger.error('Error saving games to database:', error);
          }
        }
        logger.log('Loaded and merged remote games');
      }
    })();
  }, [user]);

  // Emit an error if the input word is too long
  useEffect(() => {
    if (input.length > 19) {
      dispatch({ type: 'setMessage', payload: 'Word too long' });
    }
  }, [input.length, dispatch]);

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
      }
    }
  }, [message]);

  // Determine the total set of valid words and the maximum possible score
  const validWords = useMemo(() => {
    return findValidWords({
      allWords: wordlist,
      pangram: currentGame.key,
      center,
    });
  }, [center, currentGame.key]);
  const maxScore = useMemo(() => computeScore(validWords), [validWords]);

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
      words,
      validWords,
      word,
      pangram: currentGame.key,
      center,
    });

    if (message) {
      setMessageGood(false);
      dispatch({ type: 'setMessage', payload: message });
      setMessageVisible(true);
      setInputDisabled(true);
    } else {
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
      dispatch({ type: 'clearInput' });
    }
  }, [
    center,
    currentGame.key,
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
        dispatch({ type: 'addInput', payload: event.key });
      }
    },
    [deleteLastInput, inputDisabled, mixLetters, submitWord]
  );

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Update the game state when certain game metadata (maxScore, totalWords,
  // score) change
  useUpdateEffect(() => {
    dispatch({
      type: 'updateGame',
      payload: {
        maxScore,
        totalWords: validWords.length,
      },
    });
  }, [maxScore, validWords.length]);

  // If the current game changes, save it
  useUpdateEffect(() => {
    logger.log('Saving updated game');
    (async () => {
      saveLocalGames(state.games, user?.userId);
      if (user) {
        try {
          await saveRemoteGame(user.userId, currentGame);
          logger.log('Saved updated game to remote');
        } catch (error) {
          logger.error('Error saving game:', error);
        }
      }
    })();
  }, [currentGame, user]);

  // A subscription to a remote game state
  const subscription = useRef<Subscription>();

  // Watch for remote updates to the current game
  useEffect(() => {
    if (user) {
      try {
        subscription.current = subscribeToGame(
          user.userId,
          currentGame.key,
          (remoteGame) => {
            logger.debug(
              'Saw game update:',
              remoteGame?.lastUpdated,
              'vs',
              currentGame?.lastUpdated
            );
            if (
              remoteGame &&
              remoteGame.lastUpdated > currentGame.lastUpdated &&
              remoteGame.words.length > 0
            ) {
              logger.log('Using remote game');
              dispatch({ type: 'setGame', payload: remoteGame });
            }
          }
        );

        return () => {
          if (subscription.current) {
            subscription.current.off();
            subscription.current = undefined;
          }
        };
      } catch (error) {
        logger.error('Error subscribing to game updates:', error);
      }
    } else {
      if (subscription.current) {
        subscription.current.off();
        subscription.current = undefined;
      }
    }
  }, [user, currentGame.key]);

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
          <MenuBar user={user} dispatch={dispatch} />
          <div className="App-letters-wrapper">
            <div className="App-letters">
              <Message isVisible={messageVisible} isGood={messageGood}>
                {message}
              </Message>
              <Input
                input={input}
                pangram={currentGame.key}
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
                currentGame={state.currentGame}
                dispatch={dispatch}
                games={state.games}
              />
            </div>
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default App;
