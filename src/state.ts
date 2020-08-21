import { getDateString } from './util';
import random, { saveRng, initRng, RngState } from './random';
import wordlist, { blocks } from './wordlist';
import { getLetters, findPangram, permuteLetters } from './wordUtil';

const storage = window.localStorage;

export interface GameState {
  pangram: string;
  words: string[];
  letters: string[];
  center: string;
}

interface SavedGameState extends GameState {
  rng: RngState;
}

interface AppState {
  [id: string]: SavedGameState;
}

let id: string;
let appState: AppState;

/**
 * Initialize the app state
 */
export function init() {
  // Load the game ID and initialize the random number generator
  const queryArgs = new URLSearchParams(window?.location?.search);
  id = queryArgs.get('id') || getDateString();

  // Load the game state for the current ID
  const data = storage.getItem('spelling-cee-game-state');
  appState = data ? (JSON.parse(data) as AppState) : {};

  // Initialize the random number generator
  if (appState[id]?.rng) {
    initRng(appState[id].rng);
  } else {
    initRng(id);
  }

  return id;
}

/**
 * Get the current game's state
 */
export function getState(gameId?: string) {
  if (gameId == null) {
    gameId = id;
  }
  appState[gameId] = initGame(appState[gameId]);
  const { rng, ...state } = appState[gameId];
  return state;
}

/**
 * Save the given state for the curent game
 */
export function saveState(newState: GameState, gameId?: string) {
  appState = {
    ...appState,
    [gameId ?? id]: {
      ...appState[gameId ?? id],
      ...newState,
      rng: saveRng(),
    },
  };
  const data = JSON.stringify(appState);
  storage.setItem('spelling-cee-game-state', data);
}

/**
 * Initialize a new game for the current ID
 */
function initGame(state: Partial<GameState> = {}): SavedGameState {
  const pangram =
    state.pangram ??
    findPangram(
      wordlist,
      blocks[0] + blocks[1] + blocks[2] + blocks[3] + blocks[4]
    );
  const uniqueLetters = getLetters(pangram);
  const center = state.center ?? uniqueLetters[random(uniqueLetters.length)];
  const letters = state.letters ?? permuteLetters(uniqueLetters, center);
  const words = state.words ?? [];
  return { pangram, letters, words, center, rng: saveRng() };
}
