import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { initRng, newRng } from '../random';
import { getDateString } from '../util';
import wordlist, { blocks } from '../wordlist';
import { getLetters, findPangram, permute } from '../wordUtil';
import AppError from '../AppError';

const storage = window.localStorage;
const appStateKey = 'spelling-cee-game-state-v2';
const listeners: { [key: string]: Dispatch<AppState> | undefined } = {};

export interface GameState {
  letters: string[];
  words: string[];
  totalWords: number;
  score: number;
  maxScore: number;
  difficulty: number;
  lastPlayed: number;
}

export interface AppState {
  games: { [id: string]: GameState };
  currentGame: string;
  error?: string | Error;
}

/**
 * A hook to use the persistent app state
 */
export default function useAppState(): [
  AppState,
  Dispatch<AppState>,
  Dispatch<GameState>
] {
  const [state, setState] = useState<AppState>(init());
  const id = useListenerId();

  // Create a state updater that, when called, will update local storage and
  // notify any other registered components
  const setAppState = useCallback((newState: AppState) => {
    updateAppState(newState);

    // Don't store errors in localstorage; they're transient
    const { error, ...storedState } = newState;
    storage.setItem(appStateKey, JSON.stringify(storedState));
  }, []);

  // Update the current game state
  const setGameState = useCallback(
    (gameState: GameState) => {
      setAppState({
        ...state,
        games: {
          ...state.games,
          [state.currentGame!]: {
            ...gameState,
            lastPlayed: Date.now(),
          },
        },
      });
    },
    [state, setAppState]
  );

  // Keep track of this component's real state update method
  useEffect(() => {
    listeners[id] = setState;
    return () => (listeners[id] = undefined);
  }, [id, setState]);

  return [state, setAppState, setGameState];
}

/**
 * Create a new unique ID for the current component
 */
function useListenerId(): string {
  const idRef = useRef<string>();
  if (idRef.current == null) {
    idRef.current = `${Math.random()}`;
  }
  return idRef.current!;
}

/**
 * Update the app state
 *
 * This will call all the state setters for every component that has called
 * useAppState.
 */
function updateAppState(newState: AppState) {
  for (const id of Object.keys(listeners)) {
    const listener = listeners[id];
    if (listener) {
      listener(newState);
    }
  }
}

/**
 * Initialize the app state
 */
function init(): AppState {
  // Load the game state for the current ID
  const data = storage.getItem(appStateKey);
  const appState = data
    ? (JSON.parse(data) as AppState)
    : { games: {}, currentGame: '' };
  initRng();

  if (appState.error) {
    appState.error = undefined;
  }

  // Load the game ID and initialize the random number generator
  const queryArgs = new URLSearchParams(window?.location?.search);
  let currentGame: string | undefined;

  try {
    currentGame = validateGameId(appState.currentGame);
  } catch (error) {
    // ignore
  }

  try {
    const idArg = queryArgs.get('id');
    if (idArg) {
      currentGame = validateGameId(idArg);
    }

    if (!currentGame) {
      currentGame = getDailyGameId();
    }

    appState.currentGame = currentGame;

    if (!appState.games) {
      appState.games = {};
    }

    if (!appState.games[currentGame]) {
      appState.games[currentGame] = {
        letters: currentGame.split(''),
        words: [],
        totalWords: 0,
        maxScore: 0,
        score: 0,
        difficulty: 0,
        lastPlayed: Date.now(),
      };
    }

    const game = appState.games[currentGame];

    game.totalWords = game.totalWords ?? 0;
    game.difficulty = game.difficulty ?? 0;
    game.score = game.score ?? 0;
    game.maxScore = game.score ?? 0;
  } catch (error) {
    appState.error = error;
  }

  return appState;
}

/**
 * Return the first game ID for a day
 */
function getDailyGameId(): string {
  const rng = newRng(getDateString());
  const maxIndex = blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4];
  const start = rng(maxIndex);
  const pangram = findPangram(wordlist, start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters).join('');
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split('').sort(),
  ].join('');
}

/**
 * Validate and normalize a game ID
 *
 * A game ID is a set of 7 letters. The first letter is the "center", and the
 * other 6 letters must appear in alphabetical order.
 */
function validateGameId(gameIdOrCenter: string, letters?: string[]): string {
  let id: string;
  if (letters) {
    id = [gameIdOrCenter, ...letters].join('').toLowerCase();
  } else {
    id = gameIdOrCenter.toLowerCase();
  }

  if (!/^[a-z]{7}$/.test(id)) {
    throw new AppError('ID must be a string of 7 alphabetical characters');
  }

  return [id[0], ...id.slice(1).split('').sort()].join('');
}
