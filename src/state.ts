import AppError from './AppError';
import { getDateString } from './util';
import { initRng, newRng } from './random';
import wordlist, { blocks } from './wordlist';
import { getLetters, findPangram, permute } from './wordUtil';

const storage = window.localStorage;
export const appStateKey = 'spelling-cee-game-state-v2';

export interface GameState {
  words: string[];
  letters: string[];
}

export interface AppState {
  games: { [id: string]: GameState };
  currentGame: string;
  error?: string | Error;
}

/**
 * Initialize the app state
 */
export function init(): AppState {
  // Load the game state for the current ID
  const data = storage.getItem(appStateKey);
  const appState = data
    ? (JSON.parse(data) as AppState)
    : { games: {}, currentGame: '' };
  initRng();

  // Load the game ID and initialize the random number generator
  const queryArgs = new URLSearchParams(window?.location?.search);
  let currentGame = appState.currentGame;

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
      };
    }
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
function validateGameId(gameIdOrCenter: string, letters?: string[]) {
  let id: string;
  if (letters) {
    id = [gameIdOrCenter, ...letters].join('').toLowerCase();
  } else {
    id = gameIdOrCenter.toLowerCase();
  }

  if (!/[a-z]{7}/.test(id)) {
    throw new AppError('ID must be a string of 7 alphabetical characters');
  }

  return [id[0], ...id.slice(1).split('').sort()].join('');
}
