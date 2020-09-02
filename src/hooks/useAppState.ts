import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { initRng, newRng } from '../random';
import { getDateString } from '../util';
import wordlist, { blocks } from '../wordlist';
import { getLetters, findPangram, permute } from '../wordUtil';
import { getDatabase } from '../firebase';
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

export interface UserState {
  userId: string;
  name: string;
  email: string;
}

export interface AppState {
  games: { [id: string]: GameState };
  currentGame: string;
  lastUpdated: number;
  user?: UserState;
  error?: string | Error;
}

let appState: AppState;
let storeRef: firebase.database.Reference | undefined;

/**
 * A hook to use the persistent app state
 */
export default function useAppState(): [
  AppState,
  Dispatch<AppState>,
  Dispatch<GameState>,
  Dispatch<void>,
  Dispatch<string>
] {
  const [state, setState] = useState<AppState>(init());
  const id = useListenerId();

  // Add this component to the set of app state listeners
  useEffect(() => {
    listeners[id] = setState;
    return () => {
      listeners[id] = undefined;
    };
  }, []);

  // Update the current game state
  const setGameState = useCallback(
    (gameState: GameState) => {
      if (gameState !== state.games[state.currentGame!]) {
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
      }
    },
    [state]
  );

  // Create and use a new game
  const addGame = useCallback(() => {
    const newGameId = getNewGameId();
    setAppState({
      ...state,
      currentGame: newGameId,
      games: {
        ...state.games,
        [newGameId]: createGame(newGameId),
      },
    });
  }, [state]);

  // Remove a game
  const removeGame = useCallback(
    (gameId: string) => {
      const { [gameId]: removed, ...otherGames } = state.games;
      const currentGame =
        state.currentGame === gameId
          ? Object.keys(state.games)[0]
          : state.currentGame;

      setAppState({
        ...state,
        currentGame,
        games: otherGames,
      });
    },
    [state]
  );

  return [state, setAppState, setGameState, addGame, removeGame];
}

/**
 * Return the part of the app state that should be saved to stores
 */
function getSaveableState(state: AppState) {
  const { error, user, ...stateToSave } = state;
  return stateToSave;
}

/**
 * Save the given state to local storage
 */
function saveStateLocally(state: AppState) {
  console.log('saving local state:', state);
  storage.setItem(appStateKey, JSON.stringify(getSaveableState(state)));
}

/**
 * Save the given state to the database
 */
function saveStateRemotely(state: AppState) {
  console.log('saving remote state:', state);
  getDatabase().ref(`users/${state.user!.userId}`).set(getSaveableState(state));
}

/**
 * Perform any cleanup on a newly loaded state object
 */
function normalizeState(state: AppState): AppState {
  let normalized = state;
  let games: AppState['games'] = normalized.games || {};

  for (const gameId in games) {
    if (!games[gameId].words) {
      games = {
        ...games,
        [gameId]: {
          ...games[gameId],
          words: [],
        },
      };
    }
  }

  normalized = {
    ...normalized,
    games,
  };

  if (!normalized.currentGame) {
    normalized = {
      ...normalized,
      currentGame: Object.keys(games)[0] ?? '',
    };
  }

  return normalized;
}

/**
 * Create a new random game ID
 */
function getNewGameId(rngSeed?: string): string {
  const rng = newRng(rngSeed);
  const maxIndex = blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4];
  const start = rng(maxIndex);
  const pangram = findPangram(wordlist, start);
  const uniqueLetters = getLetters(pangram);
  const randomizedLetters = permute(uniqueLetters, rng).join('');
  return [
    randomizedLetters[0],
    ...randomizedLetters.slice(1).split('').sort(),
  ].join('');
}

/**
 * Subscribe to database updates
 */
function subscribe(userId: string): void {
  if (storeRef && storeRef.key !== userId) {
    unsubscribe();
  }

  if (!storeRef && userId) {
    storeRef = getDatabase().ref(`users/${userId}`);
    storeRef.on('value', (snapshot) => {
      const rawState = snapshot.val();
      if (rawState) {
        const remoteState = normalizeState(rawState);
        if (remoteState.lastUpdated > appState.lastUpdated) {
          const mergedState = {
            ...appState,
            ...remoteState,
          };
          setAppState(mergedState, {
            saveRemote: false,
            updateTimestamp: false,
          });
        }
      }
    });
  }
}

/**
 * Unsubscribe from database updates
 */
function unsubscribe() {
  if (storeRef) {
    storeRef.off();
    storeRef = undefined;
  }
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
function setAppState(
  newState: AppState,
  options?: {
    saveRemote?: boolean;
    saveLocal?: boolean;
    updateTimestamp?: boolean;
  }
) {
  options = {
    saveRemote: true,
    saveLocal: true,
    updateTimestamp: true,
    ...options,
  };

  // If the game-related state has changed, update the timestamp. Don't update
  // the timestamp for non-persistent data.
  // TODO: store non-persistent data (e.g., user, error) somewhere else
  if (
    options.updateTimestamp &&
    (newState.currentGame !== appState.currentGame ||
      newState.games !== appState.games)
  ) {
    console.log('updating timestamp');
    newState = {
      ...newState,
      lastUpdated: Date.now(),
    };
  }

  // Handle login/logout
  if (newState.user && !appState?.user) {
    if (appState?.user !== newState.user) {
      subscribe(newState.user.userId);
    }
  } else if (appState?.user && !newState.user) {
    unsubscribe();
  }

  // Notify everyone of the new state value
  for (const id of Object.keys(listeners)) {
    const listener = listeners[id];
    if (listener) {
      listener(newState);
    }
  }

  // Always save the state locally
  if (options.saveLocal) {
    saveStateLocally(newState);
  }

  // If we're logged in, save the state to Firebase
  if (options.saveRemote && newState.user) {
    saveStateRemotely(newState);
  }

  appState = newState;
}

/**
 * Initialize the app state
 *
 * init will be called by any component that uses the useAppStateHook. That
 * means that it only really needs to run the full initialization logic for the
 * first caller. Once the app state has been initialized, init should just
 * return the current app state.
 */
function init(): AppState {
  if (appState) {
    return appState;
  }

  console.log('initializing');

  // Load the game state for the current ID
  const data = storage.getItem(appStateKey);
  const rawAppState = data
    ? (JSON.parse(data) as AppState)
    : { games: {}, currentGame: '', lastUpdated: Date.now() };
  initRng();

  appState = normalizeState(rawAppState);

  if (appState.error) {
    const { error, ...rest } = appState;
    appState = rest;
  }

  if (!appState.games) {
    appState = {
      ...appState,
      games: {}
    }
  }

  for (const gameId of Object.keys(appState.games)) {
    const game = appState.games[gameId];
    if (!game.words) {
      appState.games[gameId] = {
        ...appState.games[gameId],
        words: []
      };
    }
  }

  saveStateLocally(appState);

  // Load the game ID and initialize the random number generator
  const queryArgs = new URLSearchParams(window?.location?.search);
  let currentGame: string | undefined;

  try {
    const idArg = queryArgs.get('id');
    if (idArg) {
      currentGame = validateGameId(idArg);
    }

    if (!currentGame) {
      const dailyGame = getDailyGameId();

      // Create the daily game and start that one if it hasn't been created yet
      // today
      if (!appState.games[dailyGame] || !appState.currentGame) {
        currentGame = dailyGame;
      } else {
        currentGame = appState.currentGame;
      }
    }

    appState.currentGame = currentGame;

    if (!appState.games[currentGame]) {
      appState.games[currentGame] = createGame(currentGame);
    }

    const game = appState.games[currentGame];
    game.totalWords ??= 0;
    game.difficulty ??= 0;
    game.score ??= 0;
    game.maxScore ??= 0;
  } catch (error) {
    appState.error = error;
  }

  return appState;
}

/**
 * Return the first game ID for a day
 */
function getDailyGameId(): string {
  return getNewGameId(getDateString());
}

/**
 * Return a new empty game
 */
function createGame(gameId: string): GameState {
  return {
    letters: permute(gameId.split('')),
    words: [],
    totalWords: 0,
    maxScore: 0,
    score: 0,
    difficulty: 0,
    lastPlayed: Date.now(),
  };
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
